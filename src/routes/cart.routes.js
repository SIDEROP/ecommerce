import express from 'express'
import auth from '../middlewares/auth.js'
import {
    createCart,
    getCart,
    removeFromCart,
} from '../controllers/cart.contr.js'

const router = express.Router()

router
    .post('/createCart', auth, createCart)
    .get('/getCart', auth, getCart)
    .delete('/removeFromCart/:productId', auth, removeFromCart)

export default router
