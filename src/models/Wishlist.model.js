import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                addedAt: {
                    type: Date, 
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

export const Wishlist = mongoose.model('Whislist', wishlistSchema);
