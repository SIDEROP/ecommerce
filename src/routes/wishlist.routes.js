import express from 'express';
import auth from '../middlewares/auth.js';
import {
    addWishlist,
    getWishlist,
    removeWishlist,
} from '../controllers/wishlist.contr.js';

const router = express.Router();

router
    .post('/add', auth, addWishlist)
    .get('/', auth, getWishlist)
    .delete('/remove/:productId', auth, removeWishlist);

export default router;
