import { Order } from '../models/Order.model.js'
import { User } from '../models/User.model.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/apiResponse.js'
import ApiError from '../utils/apiError.js'

// Get Dashboard Summary
export const getDashboardSummary = asyncHandler(async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } })
        const activeUsers = await User.countDocuments({
            status: 'active',
            role: { $ne: 'admin' },
        })
        const inactiveUsers = await User.countDocuments({
            status: 'inactive',
            role: { $ne: 'admin' },
        })
        const blockedUsers = await User.countDocuments({ status: 'blocked' })

        const userEngagement = await User.aggregate([
            {
                $group: {
                    _id: null,
                    averageSessions: { $avg: '$sessionCount' },
                    totalLogins: { $sum: '$loginCount' },
                },
            },
        ])

        const newUsers = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(
                            new Date().setDate(new Date().getDate() - 30)
                        ),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ])

        const totalOrders = await Order.countDocuments()
        const pendingOrders = await Order.countDocuments({ status: 'pending' })
        const completedOrders = await Order.countDocuments({
            status: 'completed',
        })
        const canceledOrders = await Order.countDocuments({
            status: 'canceled',
        })

        const orderTrends = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(
                            new Date().setDate(new Date().getDate() - 30)
                        ),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ])

        const totalSales = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ])

        const monthlyEarnings = await Order.aggregate([
            {
                $match: { status: 'completed' },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m', date: '$createdAt' },
                    },
                    total: { $sum: '$totalAmount' },
                },
            },
            { $sort: { _id: 1 } },
        ])

        const totalCompletedOrders = await Order.countDocuments({
            status: 'completed',
        })

        // Response
        res.status(200).json(
            new ApiResponse(
                200,
                {
                    userStats: {
                        totalUsers,
                        activeUsers,
                        inactiveUsers,
                        blockedUsers,
                        newUsers,
                    },
                    orderStats: {
                        totalOrders,
                        pendingOrders,
                        completedOrders,
                        canceledOrders,
                        totalCompletedOrders,
                        orderTrends,
                    },
                    totalSales: {
                        totalSales: totalSales[0]?.total || 0,
                    },
                    userEngagement: {
                        averageSessions:
                            userEngagement[0]?.averageSessions || 0,
                        totalLogins: userEngagement[0]?.totalLogins || 0,
                    },
                    monthlyEarnings,
                },
                'Dashboard summary retrieved successfully'
            )
        )
    } catch (error) {
        throw new ApiError(500, 'Error retrieving dashboard summary')
    }
})

/// Function to validate the date format
const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/ // Regex to match YYYY-MM-DD format
    return regex.test(dateString) && !isNaN(new Date(dateString).getTime())
}


// Fetch All Users
export const fetchAllUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } })

        res.status(200).json(
            new ApiResponse(200, users, 'Users retrieved successfully')
        )
    } catch (error) {
        throw new ApiError(500, 'Error fetching users')
    }
})

// Block/Unblock User
export const toggleUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { action } = req.body

    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, 'User not found')
        }

        if (action === 'block') {
            user.status = 'blocked'
        } else if (action === 'unblock') {
            user.status = 'active'
        } else {
            throw new ApiError(400, 'Invalid action. Use "block" or "unblock".')
        }

        await user.save()
        res.status(200).json(
            new ApiResponse(200, user, `User ${action}ed successfully`)
        )
    } catch (error) {
        throw new ApiError(500, error.message || 'Error changing user status')
    }
})

// Refund Product
export const fetchUserOrdersAndProcessRefund = asyncHandler(
    async (req, res) => {
        const { userId } = req.params 

        try {

            const orders = await Order.find({ user: userId }) 
            
            if (!orders.length) {
                throw new ApiError(404, 'No orders found for this user')
            }


            const refundedOrdersCount = orders.filter(
                (order) => order.status === 'refunded'
            ).length

            const user = await User.findById(userId)
            if (!user) {
                throw new ApiError(404, 'User not found')
            }

            if (refundedOrdersCount >= 10) {
                user.status = 'blocked' 
                await user.save()
                throw new ApiError(
                    403,
                    'User has exceeded the refund limit and has been blocked'
                )
            }
            
            res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        orders,
                        refundedOrdersCount,
                        message: `User has ${refundedOrdersCount} refunded orders.`,
                    },
                    'User orders retrieved successfully'
                )
            )
        } catch (error) {
            throw new ApiError(
                500,
                error.message ||
                    'Error fetching user orders and processing refund'
            )
        }
    }
)



export const fetchDailyEarnings = asyncHandler(async (req, res) => {
    try {
        let { startDate, endDate } = req.query;
        const completedMatchCondition = { status: 'completed' };
        const lostMatchCondition = {
            status: { $in: ['cancelled', 'abandoned'] },
        };

        if (!startDate && !endDate) {
            const today = new Date();
            endDate = today.toISOString().split('T')[0]; // Current date
            const lastWeek = new Date(today.setDate(today.getDate() - 7));
            startDate = lastWeek.toISOString().split('T')[0]; // 7 days ago
        } else {
            if (!isValidDate(startDate) || !isValidDate(endDate)) {
                throw new ApiError(400, 'Invalid date format. Use YYYY-MM-DD.');
            }
        }

        completedMatchCondition.createdAt = {};
        lostMatchCondition.createdAt = {};
        if (startDate) {
            completedMatchCondition.createdAt.$gte = new Date(startDate);
            lostMatchCondition.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            completedMatchCondition.createdAt.$lte = new Date(endDate);
            lostMatchCondition.createdAt.$lte = new Date(endDate);
        }

        const dailyEarnings = await Order.aggregate([
            { $match: completedMatchCondition },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    total: { $sum: '$totalAmount' },
                    transactionCount: { $sum: 1 }, // Count transactions
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const lostSales = await Order.aggregate([
            { $match: lostMatchCondition },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    totalLost: { $sum: '$totalAmount' },
                    lostOrderCount: { $sum: 1 }, // Count lost orders
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const revenueByCategory = await Order.aggregate([
            { $match: completedMatchCondition },
            {
                $group: {
                    _id: '$category',
                    totalCategoryEarnings: { $sum: '$totalAmount' },
                    categoryOrderCount: { $sum: 1 }, 
                },
            },
            { $sort: { totalCategoryEarnings: -1 } }, 
        ]);

        const totalEarnings = dailyEarnings.reduce((acc, curr) => acc + curr.total, 0);
        const totalTransactions = dailyEarnings.reduce((acc, curr) => acc + curr.transactionCount, 0);
        const averageDailyEarnings = totalEarnings / dailyEarnings.length || 0;
        const topEarningDay = dailyEarnings.reduce((max, curr) => (curr.total > max.total ? curr : max), dailyEarnings[0]);
        const topTransactionDay = dailyEarnings.reduce((max, curr) => (curr.transactionCount > max.transactionCount ? curr : max), dailyEarnings[0]);
        const totalLostSales = lostSales.reduce((acc, curr) => acc + curr.totalLost, 0);
        const totalLostOrders = lostSales.reduce((acc, curr) => acc + curr.lostOrderCount, 0);
        const averageTransactionValue = totalEarnings / totalTransactions || 0;

        res.status(200).json(new ApiResponse(200, {
            summary: {
                startDate,
                endDate,
                totalEarnings,
                totalTransactions,
                averageDailyEarnings,
                averageTransactionValue,
                totalLostSales,
                totalLostOrders,
            },
            topDays: {
                topEarningDay,
                topTransactionDay,
            },
            dailyEarnings,
            revenueByCategory,
        }, 'Sales data retrieved successfully'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Error retrieving sales data');
    }
});
