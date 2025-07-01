import jwt from 'jsonwebtoken';
import process from 'process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.global') });

const JWT_SECRET = process.env.JWT_SECRET;

//generate user token
export const generateToken = (userId, expiry = null, admin = false) => {
  const payload = { userId, admin };
  const options = expiry ? { expiresIn: expiry } : {};
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const decodeUserId = (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded.userId;
};
