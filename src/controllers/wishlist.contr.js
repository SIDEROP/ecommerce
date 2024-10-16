import { Wishlist } from '../models/Wishlist.model.js';
import { Product } from '../models/Product.model.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';


export const toggleWishlist  = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const { userId } = req.user;

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
        wishlist = new Wishlist({ user: userId, products: [] });
    }

    const productIndex = wishlist.products.findIndex((item) =>
        item.product.equals(productId)
    );

    let dataModified = {
        isInWishlist: false,
        wishlist,
    };

    if (productIndex !== -1) {
        wishlist.products.splice(productIndex, 1);
        await wishlist.save();
        dataModified.isInWishlist = false;
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    dataModified,
                    'Product removed from wishlist'
                )
            );
    } else {
        wishlist.products.push({ product: productId });
        await wishlist.save();
        dataModified.isInWishlist = true; 
        return res
            .status(201)
            .json(
                new ApiResponse(201, dataModified, 'Product added to wishlist')
            );
    }
});

export const getWishlist = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const wishlist = await Wishlist.findOne({ user: userId }).populate(
        'products.product'
    );

    if (!wishlist) {
        throw new ApiError(404, 'Wishlist not found');
    }

    wishlist.products.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    res.status(200).json(
        new ApiResponse(200, wishlist, 'Wishlist retrieved successfully')
    );
});

// Remove a product from the wishlist
export const removeWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { userId } = req.user;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
        throw new ApiError(404, 'Wishlist not found');
    }

    const productIndex = wishlist.products.findIndex((item) =>
        item.product.equals(productId)
    );

    if (productIndex === -1) {
        throw new ApiError(404, 'Product not found in wishlist');
    }

    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    res.status(200).json(
        new ApiResponse(200, wishlist, 'Product removed from wishlist')
    );
});