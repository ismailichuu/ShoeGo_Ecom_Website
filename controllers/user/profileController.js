import bcrypt from 'bcrypt';
import User from '../../models/userSchema.js';
import jwt from 'jsonwebtoken';
import { generateOtp, hashingPassword } from '../../util/functions.js';
import sendOTPEmail from '../../config/nodemailer.transporter.js';
import { generateToken, verifyToken } from '../../util/jwt.js';
import Address from '../../models/addressSchema.js';
import process from 'process';
import dotenv from 'dotenv';
import { logger } from '../../util/logger.js';
import Wallet from '../../models/walletSchema.js';

dotenv.config();

//@route GET /changePassword
export const getChangePassword = (req, res) => {
  try {
    const msg = req.session.err || null;
    req.session.err = null;
    res.render('user/changePassword', { msg, admin: false });
  } catch (error) {
    logger.error('Change Password', error);
  }
};

//@route POST /changePassword
export const handleChangePassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) throw 'Password is not match';
    if (!req.session.token) {
      req.session.err = 'Session Expired! Enter email again';
      return res.redirect('/forgot');
    }
    //jwt verify
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
    const email = decoded.email;
    //fetching from database
    const user = await User.findOne({ email });
    user.password = await hashingPassword(password);
    await user.save();
    const token = generateToken(user._id, '1d');
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.redirect('/');
  } catch (error) {
    req.session.err = error.toString();
    res.redirect('/changePassword');
  }
};

//@route GET /profile
export const getProfile = async (req, res) => {
  try {
    // Token check
    const token = req.cookies?.token;
    if (!token) return res.redirect('/login');

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Fetch user
    const user = await User.findById(userId);
    const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const wallet = await Wallet.findOne({ userId });
    const walletBalance = wallet && wallet.balance ? wallet.balance : 0;

    const address = await Address.findOne({ userId, isDefault: true });

    const referralPayload = {
      refCode: user.referralCode,
      refId: user._id,
    };

    const referralToken = jwt.sign(referralPayload, process.env.JWT_SECRET);

    const referralLink = `${req.protocol}://${req.get('host')}/signup?ref=${referralToken}`;

    res.render('user/profile', {
      layout: 'profile-layout',
      user,
      joinedDate,
      address,
      referralLink,
      walletBalance,
    });
  } catch (error) {
    logger.error('getProfile:', error);
    res.status(500).send('Server Error');
  }
};

//@route GET /profile/edit
export const getEditProfile = async (req, res) => {
  try {
    const msg = req.session.err || null;
    req.session.err = null;
    const token = req.cookies?.token;
    if (!token) return res.redirect('/');
    const decoded = verifyToken(token);
    const userId = decoded.userId;
    const user = await User.findById(userId);
    res.render('user/editProfile', { layout: 'profile-layout', user, msg });
  } catch (error) {
    logger.error('getEditProfile:', error);
    res.status(500).send('Server Error');
  }
};

//@route POST /profile/edit
export const handleEditProfile = async (req, res) => {
  try {
    const { name, mobileNumber, gender, newsLetter } = req.body;

    const token = req.cookies?.token;
    if (!token) {
      req.session.err = 'session expired';
      return res.redirect('/login');
    }
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      req.session.err = 'User not found';
      return res.redirect('/login');
    }

    const updateData = {
      name,
      mobileNumber,
      gender,
      newsLetter: newsLetter === 'on',
    };

    if (req.file) {
      updateData.profile = req.file.path;
    }

    const isDataSame =
      user.name === updateData.name &&
      user.mobileNumber === updateData.mobileNumber &&
      user.gender === updateData.gender &&
      user.newsLetter === updateData.newsLetter &&
      !req.file;

    if (isDataSame) {
      req.session.err = "Can't save without any change";
      return res.redirect('/profile/edit');
    }

    await User.updateOne({ _id: userId }, updateData);
    res.redirect('/profile');
  } catch (err) {
    logger.error('handleEditProfile:', err);
    res.status(500).send('Error updating profile.');
  }
};

//@route POST /send-otp-email
export const handleSendOtpEmail = async (req, res) => {
  try {
    //fetching user details
    const token = req.cookies?.token;
    if (!token) {
      req.session.err = 'Session out!! Please login again';
      return res.redirect('/login');
    }
    const { email } = req.body;
    //checking for email
    const decoded = verifyToken(token);
    const userId = decoded.userId;
    const user = await User.findById(userId);

    if (user.email === email) {
      return res
        .status(400)
        .json({ message: 'This email is already verified by this account.' });
    }
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'This email is already registered with another account.',
      });
    }

    // Proceed to generate and send OTP
    const otp = generateOtp();
    // Send the OTP to newEmail
    await sendOTPEmail(email, otp, 'Change Email', '10 min');
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 5 minutes
    await user.save();

    res
      .status(200)
      .json({ message: 'OTP sent successfully to your new email.' });
  } catch (error) {
    logger.error('handleSendOtpMail:', error);
    res.status(500).send('Internal Server Error');
  }
};

//@route POST /verify-otp-email
export const handleVerifyOtpEmail = async (req, res) => {
  const { otp } = req.body;

  try {
    const token = req.cookies?.token;
    if (!token) {
      req.session.err = 'Session out!! Please login again';
      return res.redirect('/login');
    }
    const { email } = req.body;
    //checking for email
    const decoded = verifyToken(token);
    const userId = decoded.userId;
    const user = await User.findById(userId);

    if (!user || !user.otp || !user.otpExpiry) {
      return res
        .status(400)
        .json({ message: 'OTP not found. Please request again.' });
    }

    // Check if OTP is correct
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Check if OTP is expired
    if (Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    // If valid
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.email = email;
    await user.save();

    return res.status(200).json({ message: 'OTP verified successfully!' });
  } catch (err) {
    logger.error('handleVerifyPassword', err.toString());
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

//@router POST /profile/change-password
export const handleProfileChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json({ error: 'Session expired. Please log in again.' });
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.provider === 'google')
      return res
        .status(400)
        .json({ error: 'Sorry! Your account is created by Google' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = await hashingPassword(newPassword);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Password change error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
