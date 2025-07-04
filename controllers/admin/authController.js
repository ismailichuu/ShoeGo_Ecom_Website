import bcrypt from 'bcrypt';
import User from '../../models/userSchema.js';
import { generateToken } from '../../util/jwt.js';
import process from 'process';
import dotenv from 'dotenv';
import { logger } from '../../util/logger.js';
import path from 'path';

dotenv.config({ path: path.resolve('.env.local') });

//@route GET /admin/login
export const getLogin = (req, res) => {
  try {
    const msg = req.session.err || null;
    req.session.err = null;
    res.render('admin/login', { msg });
  } catch (error) {
    logger.error('getLogin', error);
  }
};

//@route POST /admin/login
export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // checking the admin
    const admin = await User.findOne({ email });
    if (!admin?.admin) throw new Error('Admin not found');
    //password comapre
    const checkPassword = await bcrypt.compare(password, admin.password);
    if (!checkPassword) throw new Error('Invalid credentials');
    //password strong check

    const token = generateToken(admin._id, '1d', true);
    res.cookie('tokenA', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.redirect('/admin/dashboard');
  } catch (error) {
    req.session.err = error.toString();
    res.redirect('/admin/login');
  }
};

//@route POST /signout
export const handleSignout = (req, res) => {
  try {
    res.clearCookie('tokenA');
    res.redirect('/admin/login');
  } catch (error) {
    logger.error('logout', error);
  }
};
