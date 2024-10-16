import { RatingComment } from '../models/Rating.model.js';
import asyncHandler from '../utils/asyncHandler.js';

// Create a new rating and comment
export const createRatingComment = async (req, res) => {
    const { productId, rating, comment } = req.body;
    const { userId } = req.user;

    try {
        const ratingComment = new RatingComment({
            user: userId,
            product: productId,
            rating,
            comment,
        });

        await ratingComment.save();
        res.status(201).json({
            message: 'Rating and comment created successfully',
            ratingComment,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error creating rating and comment',
            error,
        });
    }
};

// Get all ratings and comments for a product
export const getProductRatingsComments = async (req, res) => {
    const { productId } = req.params;

    try {
        const ratingsComments = await RatingComment.find({ product: productId })
            .populate('user', 'username img') 
            .exec();

        res.status(200).json(ratingsComments);
    } catch (error) {
        res.status(400).json({
            message: 'Error fetching ratings and comments',
            error,
        });
    }
};

// Update a rating and comment
export const updateRatingComment = async (req, res) => {
    const { rating, comment } = req.body;
    const { id } = req.params;

    try {
        const updatedRatingComment = await RatingComment.findByIdAndUpdate(
            id,
            { rating, comment },
            { new: true, runValidators: true }
        );

        if (!updatedRatingComment) {
            return res
                .status(404)
                .json({ message: 'Rating and comment not found' });
        }

        res.status(200).json({
            message: 'Rating and comment updated successfully',
            updatedRatingComment,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error updating rating and comment',
            error,
        });
    }
};

// Delete a rating and comment
export const deleteRatingComment = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedRatingComment = await RatingComment.findByIdAndDelete(id);

        if (!deletedRatingComment) {
            return res
                .status(404)
                .json({ message: 'Rating and comment not found' });
        }

        res.status(200).json({
            message: 'Rating and comment deleted successfully',
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error deleting rating and comment',
            error,
        });
    }
};

// Get best rated products
export const getBestRatedProducts = asyncHandler(async (req, res) => {
    const bestRatedProducts = await RatingComment.aggregate([
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                count: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails',
            },
        },
        {
            $unwind: '$productDetails',
        },
        {
            $sort: { averageRating: -1 },
        },
        {
            $limit: 10,
        },
        {
            $project: {
                _id: 0,
                productId: '$_id',
                productName: '$productDetails.name',
                averageRating: 1,
                count: 1,
            },
        },
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            bestRatedProducts,
            'Best rated products retrieved successfully'
        )
    );
});
