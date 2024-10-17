import jwt from 'jsonwebtoken'
import ApiError from '../utils/apiError.js'
import { User } from '../models/User.model.js'

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader ? authHeader.split(' ')[1] : req.cookies.token
        if (!token) {
            throw new ApiError(
                401,
                'Token is missing from Authorization header or cookies'
            )
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const foundUser = await User.findById(decoded.userId).populate('address')
        if (!foundUser) {
            throw new ApiError(404, 'User not found')
        }
        
        if (req.body && req.body.password) {
            const isMatch = await foundUser.comparePassword(req.body.password)
            if (!isMatch) {
                throw new ApiError(401, 'Incorrect password')
            }
        }
        req.user = {
            userId:foundUser._id,
            username:foundUser.username,
            email:foundUser.email,
            role:foundUser.role,
            address:foundUser.address
        }

        next()
    } catch (error) {
        next(error)
    }
}



export default auth
