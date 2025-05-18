import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (userId, expiry) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: expiry });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const decodeUserId = (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded.userId;
}