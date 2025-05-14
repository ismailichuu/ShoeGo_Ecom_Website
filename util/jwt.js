import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (userId, expiry) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: expiry });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};