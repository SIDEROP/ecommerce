import express from 'express';

import auth from '../middlewares/auth.js';
import {
    createRatingComment,
    deleteRatingComment,
    getBestRatedProducts,
    getProductRatingsComments,
    updateRatingComment,
} from '../controllers/rating.contr.js';

const router = express.Router();

router
    .post('/', auth, createRatingComment)
    .get('/:productId', getProductRatingsComments)
    .put('/:id', auth, updateRatingComment)
    .delete('/:id', auth, deleteRatingComment)
    .get('/getBestRatedProducts', auth, getBestRatedProducts);

export default router;
