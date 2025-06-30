import jwt from 'jsonwebtoken';
import upload from '../config/multer.js';
import process from 'process';
import dotenv from 'dotenv';
import { logger } from '../util/logger.js';
import path from 'path';

dotenv.config({ path: path.resolve('.env.global') });

//multer
export const validateAddProductImages = (req, res, next) => {
  upload.array('images', 5)(req, res, function (err) {
    if (err) {
      let msg = err.message || err;
      if (msg.includes('File too large')) msg = 'Each image must be under 2MB';
      return res.render('admin/addProduct', { msg, layout: 'layout' });
    }

    if (!req.files || req.files.length === 0) {
      return res.render('admin/addProduct', {
        msg: 'At least one image is required',
        layout: 'layout',
      });
    }

    next();
  });
};

//validate edit product images
export const validateEditProductImages = (req, res, next) => {
  upload.array('images', 5)(req, res, function (err) {
    if (err) {
      let msg = err.message || err;
      if (msg.includes('File too large')) msg = 'Each image must be under 2MB';
      req.session.err = msg;
      return res.redirect(`/admin/editProduct?id=${req.query.id}&req=new`);
    }

    next();
  });
};

//Auth check
export const authAdmin = (req, res, next) => {
  try {
    const token = req.cookies?.tokenA;

    if (!token) throw new Error('token Expired');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.admin) {
      return res.redirect('/admin/login');
    }
    next();
  } catch (error) {
    res.clearCookie('token');
    logger.error('Middlware:', error);
    res.redirect('/admin/login');
  }
};

//preventing login
export const checkAdmin = (req, res, next) => {
  try {
    const token = req.cookies?.tokenA;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded)return res.redirect(`/admin/dashboard`);
    next()
  } catch (error) {
    logger.error('Middlware:', error);
    next();
  }

};