import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { Order } from '../models/Order.model.js';
import stripe from '../config/stripe.js';

// Get All Orders
export const getAllOrders = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    if (!userId) {
        throw new ApiError(400, 'User ID is required');
    }

    const orders = await Order.find({ user: userId })
        .populate({
            path: 'products.productId',
            select: 'name description category price marketPrice discount images brand size flavors',
        })
        .populate({
            path: 'shippingAddress',
            select: 'street city state postalCode country',
        })
        .sort({ createdAt: -1 })
        .populate({
            path: 'user',
            select: 'username address',
        });

    if (!orders.length) {
        throw new ApiError(404, 'No orders found for this user');
    }

    const structuredOrders = orders?.map((order) => {
        const products = order?.products?.map((product) => ({
            _id: product?.productId?._id,
            name: product?.productId?.name,
            description: product?.productId?.description,
            category: product?.productId?.category,
            price: product?.productId?.price,
            marketPrice: product?.productId?.marketPrice,
            discount: product?.productId?.discount,
            images: product?.productId?.images,
            quantity: product?.quantity,
            size: product?.size,
            flavors: product?.flavors,
            color: product?.color,
        }));

        return {
            _id: order?._id,
            createdAt: order?.createdAt,
            updatedAt: order?.updatedAt,
            status: order?.status,
            address: order?.shippingAddress,
            username: order?.user?.username,
            orderId: order?.orderId,
            invoicePdf: order?.invoicePdf,
            totalAmount: order?.totalAmount,
            products,
        };
    });

    res.status(200).json(
        new ApiResponse(200, structuredOrders, 'Orders retrieved successfully.')
    );
});

export const getAllUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find()
        .populate({
            path: 'products.productId',
            select: 'name description category price marketPrice discount images brand',
        })
        .populate({
            path: 'user',
            select: 'username address',
        })
        .populate({
            path: 'shippingAddress',
            select: 'street city state postalCode country landmark',
        })
        .sort({ createdAt: -1 });
    if (!orders.length) {
        return res
            .status(404)
            .json(new ApiResponse(404, null, 'No orders found'));
    }
    const structuredOrders = orders.map((order) => {
        const products = order.products.map((product) => ({
            _id: product?.productId?._id,
            name: product?.productId?.name,
            description: product?.productId?.description,
            category: product?.productId?.category,
            price: product?.productId?.price,
            marketPrice: product?.productId?.marketPrice,
            discount: product?.productId?.discount,
            images: product?.productId?.images,
            quantity: product?.quantity,
            size: product?.size,
            flavors: product?.flavors,
            color: product?.color,
        }));

        return {
            _id: order?._id,
            createdAt: order?.createdAt,
            updatedAt: order?.updatedAt,
            status: order?.status,
            shippingAddress: order?.shippingAddress,
            username: order?.user?.username,
            orderId: order?.orderId,
            invoicePdf: order?.invoicePdf,
            totalAmount: order?.totalAmount,
            products,
        };
    });

    res.status(200).json(
        new ApiResponse(200, structuredOrders, 'Orders retrieved successfully.')
    );
});

// Update Order Status
export const updateOrderStatusAdmin = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status) {
        throw new ApiError(400, 'Order ID and status are required');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    if (!order.orderId) {
        throw new ApiError(400, 'Session ID is required.');
    }

    const session = await stripe.checkout.sessions.retrieve(order.orderId);

    if (!session) {
        throw new ApiError(404, 'Stripe session not found.');
    }

    let updatedOrder;

    switch (session.payment_status) {
        case 'paid':
            if (status === 'pending' || status === 'canceled') {
                throw new ApiError(
                    400,
                    'Your order is paid, so please initiate a refund instead.'
                );
            } else {
                if (order.status == 'refunded') {
                    throw new ApiError(400, 'Your order is aredy refunded');
                }
                order.status = status;

                if (session.invoice) {
                    const invoice = await stripe.invoices.retrieve(
                        session.invoice
                    );
                    order.invoicePdf = invoice.invoice_pdf;
                }

                updatedOrder = await order.save();
                res.status(200).json(
                    new ApiResponse(
                        200,
                        updatedOrder,
                        'Order status and invoice updated successfully.'
                    )
                );
            }
            break;

        case 'unpaid':
            if (status === 'pending' || status === 'canceled') {
                if (order.status == 'refunded') {
                    throw new ApiError(400, 'Your order is aredy refunded');
                }
                if (order.status == 'pending' || order.status == 'canceled') {
                    order.status = status;
                    updatedOrder = await order.save();
                    res.status(200).json(
                        new ApiResponse(
                            200,
                            updatedOrder,
                            'Order was unpaid and marked as ' + status + '.'
                        )
                    );
                }
            }
            break;

        case 'requires_payment_method':
            throw new ApiError(
                400,
                'Payment not completed. Please retry the payment.'
            );

        case 'canceled':
            order.status = 'canceled';
            updatedOrder = await order.save();
            res.status(200).json(
                new ApiResponse(
                    200,
                    updatedOrder,
                    'Payment was canceled. Order status updated.'
                )
            );
            break;

        default:
            throw new ApiError(
                400,
                `Unhandled payment status: ${session.payment_status}`
            );
    }
});
