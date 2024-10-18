import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { Order } from '../models/Order.model.js';
import { Product } from '../models/Product.model.js';
import stripe from '../config/stripe.js';

export const createOrder = asyncHandler(async (req, res) => {
    const { products } = req.body;
    const { userId, username, email, address } = req.user;

    if (!products || products.length === 0) {
        throw new ApiError(400, 'Products are required to create an order.');
    }

    if (!address || !address._id) {
        throw new ApiError(400, 'Address is required to create an order.');
    }

    const productDetails = await Promise.all(
        products.map(async (p) => {
            const product = await Product.findById(p.productId);
            if (!product)
                throw new ApiError(404, `Product with ID  not found.`);
            return { product, quantity: p.quantity };
        })
    );

    const totalAmount = productDetails?.reduce(
        (total, { product, quantity }) => {
            return total + product.price * quantity;
        },
        0
    );

    const lineItems = productDetails?.map(({ product, quantity }) => ({
        price_data: {
            currency: 'inr',
            product_data: {
                name: product?.name,
                description: `${product.color} - ${product.brand}`,
            },
            unit_amount: product?.price * 100,
        },
        quantity,
    }));

    const newOrder = new Order({
        user: userId,
        shippingAddress: address?._id,
        products: products?.map((p) => {
            const productDetail = productDetails?.find(
                (detail) => detail?.product?._id?.toString() === p?.productId
            );
            return {
                productId: p.productId,
                quantity: p.quantity,

                ...(p?.selectedColor && { color: p?.selectedColor }),
                ...(p?.selectedFlavor && {
                    flavors: p?.selectedFlavor,
                }),
                ...(p?.selectedSize && {
                    size: p?.selectedSize,
                }),
            };
        }),
        orderId: '',
        totalAmount,
        status: 'pending',
        invoicePdf: null,
    });

    await newOrder.save({ validateBeforeSave: false });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_PATH}/success/${newOrder._id}`,
        cancel_url: `${process.env.FRONTEND_PATH}/cancel/${newOrder._id}`,
        customer_email: email,
        billing_address_collection: 'required',
        shipping_address_collection: {
            allowed_countries: ['IN', 'US'],
        },
        invoice_creation: {
            enabled: true,
            invoice_data: {
                description: 'Product purchase invoice',
                custom_fields: [{ name: 'Customer Name', value: username }],
                footer: 'Thank you for your purchase!',
            },
        },
        metadata: {
            order_id: newOrder?._id.toString(),
        },
    });

    newOrder.orderId = session.id;
    await newOrder.save();

    res.status(201).json(
        new ApiResponse(
            201,
            { order: newOrder, sessionId: session.id, url: session.url },
            'Order created successfully'
        )
    );
});

// Webhook
export const handleStripeWebhook = asyncHandler(async (req, res) => {
    let singInSecret =
        'whsec_89a5aea11d5a4cb7622024406ec370d2f8357dd995f256938b9f47f882e641f1';
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, singInSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        throw new ApiError(400, 'Webhook Error: Signature verification failed');
    }

    // Handle the event type
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const orderId = session.metadata.order_id;

            const order = await Order.findById(orderId);
            if (!order) {
                throw new ApiError(404, 'Order not found.');
            }

            let invoiceUrl = null;
            if (session.invoice) {
                const invoice = await stripe.invoices.retrieve(session.invoice);
                invoiceUrl = invoice.hosted_invoice_url;
            }

            order.status = 'completed';
            if (invoiceUrl) {
                order.invoicePdf = invoiceUrl;
            }
            await order.save();

            break;

        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            console.log(
                `Invoice ${invoice.id} payment succeeded. Total: ${invoice.amount_paid / 100} ${invoice.currency}`
            );

            break;

        default:
    }

    res.status(200).send({ received: true });
});

// Update Order Status (Webhook Handling)
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { ProductOrderId } = req.body;
    const order = await Order.findById(ProductOrderId);

    if (!order) {
        throw new ApiError(404, 'Order not found.');
    }

    if (!order.orderId) {
        throw new ApiError(400, 'Session ID is required.');
    }

    const session = await stripe.checkout.sessions.retrieve(order.orderId);

    if (!session) {
        throw new ApiError(404, 'Stripe session not found.');
    }
    switch (session.payment_status) {
        case 'paid':
            order.status = 'paid';

            if (session.invoice) {
                const invoice = await stripe.invoices.retrieve(session.invoice);
                order.invoicePdf = invoice.invoice_pdf;
            }

            await order.save();
            res.status(200).json(
                new ApiResponse(
                    200,
                    order,
                    'Order status and invoice updated successfully.'
                )
            );
            break;

        case 'unpaid':
            order.status = 'canceled';

            await order.save();
            res.status(200).json(
                new ApiResponse(
                    200,
                    order,
                    'Order status and invoice updated successfully.'
                )
            );
        case 'requires_payment_method':
            throw new ApiError(
                400,
                'Payment not completed. Please retry the payment.'
            );

        case 'canceled':
            throw new ApiError(
                400,
                'Payment was canceled. Unable to process the order.'
            );

        default:
            throw new ApiError(
                400,
                `Unhandled payment status: ${session.payment_status}`
            );
    }
});

// Refund an Order
export const refundOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    if (!orderId) {
        throw new ApiError(400, 'Order ID is required.');
    }
    const order = await Order.findOne({ orderId });

    if (!order) {
        throw new ApiError(404, 'Order not found.');
    }

    if (order.status === 'pending' || order.status === 'canceled') {
        throw new ApiError(
            400,
            `Cannot refund an order with status '${order.status}'.`
        );
    }

    if (order.status === 'refunded') {
        throw new ApiError(400, 'Order has already been refunded.');
    }

    const session = await stripe.checkout.sessions.retrieve(orderId);

    if (!session || !session.payment_intent) {
        throw new ApiError(400, 'No payment intent found for the order.');
    }

    const refund = await stripe.refunds.create({
        payment_intent: session.payment_intent,
        amount: order.totalAmount * 100,
    });

    order.status = 'refunded';
    order.refundId = refund.id;
    await order.save();

    res.status(200).json(
        new ApiResponse(200, order, 'Order refunded successfully.')
    );
});

// Update Order Status to Canceled
export const cancelOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.prames;

    if (!orderId) {
        throw new ApiError(400, 'Order ID is required.');
    }

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new ApiError(404, 'Order not found.');
        }

        order.status = 'canceled';
        await order.save();

        res.status(200).json(
            new ApiResponse(
                200,
                order,
                'Order status updated to canceled successfully.'
            )
        );
    } catch (error) {
        throw new ApiError(500, 'Failed to update order status.');
    }
});
