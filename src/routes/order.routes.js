import { Router } from 'express'
import auth from '../middlewares/auth.js'
import { getAllOrders, getAllUserOrders, updateOrderStatusAdmin } from '../controllers/order.contr.js'

const routes = Router()

routes
.get('/getAllOrders', auth, getAllOrders)
.get('/getAllUserOrders', auth, getAllUserOrders)
.put('/updateOrderStatusAdmin/:orderId/status',auth, updateOrderStatusAdmin)

export default routes