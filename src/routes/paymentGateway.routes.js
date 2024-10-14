import { Router } from 'express'
import auth from '../middlewares/auth.js'
import express from 'express'
import {
    cancelOrderStatus,
    createOrder,
    handleStripeWebhook,
    refundOrder,
    updateOrderStatus,
} from '../controllers/paymentGateway.contr.js'

const routes = Router()

routes
    .post('/createOrder', auth, createOrder)
    .post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook)
    .put('/updateOrderStatus', auth, updateOrderStatus)
    .put('/cancelOrderStatus/:orderId', auth, cancelOrderStatus)
    .post('/refundOrder/:orderId', auth, refundOrder)

export default routes
