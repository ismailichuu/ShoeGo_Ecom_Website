import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';
import process from 'process';

export const logger = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) throw new Error('token Expired');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('token');
    console.log(error);
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