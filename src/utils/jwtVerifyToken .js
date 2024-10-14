import jwt from 'jsonwebtoken';
import ApiError from './apiError.js';

export const jwtVerifyToken = (token) => {
  if (!token) {
    throw new ApiError(401, 'No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decoded;
  } catch (error) {
    throw new ApiError(401, 'Invalid token');
  }
};
