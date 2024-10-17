import jwt from 'jsonwebtoken'
import ApiError from '../utils/apiError.js'
import { User } from '../models/User.model.js'

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader ? authHeader.split(' ')[1] : req.cookies.token;

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const foundUser = await User.findById(decoded.userId);
        if (!foundUser) {
            throw new ApiError(404, 'User not found');
        }

        req.user = {
            userId: foundUser._id,
            username: foundUser.username,
            email: foundUser.email,
            role: foundUser.role,
            address: foundUser.addresses
        };

        next();
    } catch (error) {

        next(); 
    }
};

export default optionalAuth