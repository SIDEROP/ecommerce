import express from 'express';
import auth from '../middlewares/auth.js';
import {
    toggleWishlist,
    getWishlist,
    removeWishlist,
} from '../controllers/wishlist.contr.js';

const router = express.Router();

router
    .post('/add', auth, toggleWishlist )
    .get('/', auth, getWishlist)
    .delete('/remove/:productId', auth, removeWishlist);

export default router;
