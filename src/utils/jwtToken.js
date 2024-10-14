import jwt from 'jsonwebtoken';

export const jwtTokenGenerat = (res, userId, cookieName = 'token', options = {}) => {
  const token = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

  const defaultOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000, // 1 hour,
  };

  const cookieOptions = { ...defaultOptions, ...options };

  res.cookie(cookieName, token, cookieOptions);
  return token
};
