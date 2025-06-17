import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';
import process from 'process';
import { logger } from '../util/logger.js';

export const authUser = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) throw new Error('token Expired');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('token');
    logger.error('Middlware:', error);
    return res.redirect('/login');
  }
};

export const verifyUser = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.isBlocked) {
      res.clearCookie('token');
      return res.render('user/blocked');
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
};

//not back to login
export const loginCheck = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      return res.redirect('/');
    }

    next();
  } catch (err) {
    logger.error('from logincheck Middlware', err.toString());
    res.redirect('/login');
  }
};
