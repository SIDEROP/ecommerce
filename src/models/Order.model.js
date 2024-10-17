import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        shippingAddress:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1,
                },
                color: {
                    type: String,
                },
                flavors: {
                    type: String,
                },
                size: {
                    type: String,
                    enum: ['S', 'M', 'L', 'XL', 'XXL'],
                },
            },
        ],
        orderId: {
            type: String,
            required: true,
        },
        refundId: {
            type: String,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: [
                'pending',
                'paid',
                'refunded',
                'dispatched',
                'delivered',
                'completed',
                'canceled',
            ],
            default: 'pending',
        },
        invoicePdf: {
            type: String,
        },
    },
    { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
