import express from 'express'

import auth from '../middlewares/auth.js'
import { fetchAllUsers, fetchDailyEarnings, fetchUserOrdersAndProcessRefund, getDashboardSummary, toggleUserStatus } from '../controllers/dashboard.contr.js'

const router = express.Router()

router
    .get('/summary', auth, getDashboardSummary)
    .get('/fetchDailyEarnings', auth, fetchDailyEarnings)

    .get('/users', fetchAllUsers)
    .patch('/users/:userId/toggleStatus', toggleUserStatus)
    .get('/users/:userId/orders/refund', fetchUserOrdersAndProcessRefund)

export default router
