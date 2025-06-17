import { decodeIdToken, generateCodeVerifier, generateState } from 'arctic';
import bcrypt from 'bcrypt';
import { google } from '../../auth/google.js';
import User from '../../models/userSchema.js';
import jwt from 'jsonwebtoken';
import { generateOtp, hashingPassword } from '../../util/functions.js';
import sendOTPEmail from '../../config/nodemailer.transporter.js';
import { generateToken } from '../../util/jwt.js';
import process from 'process';
import { logger } from '../../util/logger.js';
import { generateReferralCode } from '../../util/generateReferralCode.js';
import Coupon from '../../models/couponSchema.js';

//@route GET /login
export const getLogin = (req, res) => {
  try {
    const msg = req.session.err || null;
    res.render('user/login', { msg });
  } catch (error) {
    logger.error('getLogin:', error.toString());
  }
};

//@route POST /login
export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    //userExist
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
    //userBlocked or not
    if (user.isBlocked) throw new Error('Account is blocked');
    //password comapre
    const checkPassword = bcrypt.compare(password, user.password);
    if (!checkPassword) throw new Error('Invalid credentials');
    const token = generateToken(user._id, '1d');
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.redirect('/');
  } catch (error) {
    logger.error('handleLogin:', error.toString());
    req.session.err = error.toString();
    res.redirect('/login');
  }
};

//@route GET /forgotpassword
export const getForgotPassword = (req, res) => {
  try {
    const msg = req.session.err || null;
    req.session.err = null;
    res.render('user/forgot', { msg, admin: false });
  } catch (error) {
    logger.error('getForgotPassword:', error.toString());
  }
};

//@route POST /forgotpassword
export const handleForgotpassword = async (req, res) => {
  try {
    const { email } = req.body;
    //checking for user
    const user = await User.findOne({ email });
    if (!user) throw "User doesn't exist";
    if (user.provider === 'google')
      throw 'Sorry! the account is created with google';
    //sending otp
    const otp = generateOtp();
    const otpExpiry = Date.now() + 4 * 60 * 1000;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await sendOTPEmail(email, otp, 'Password Change', '4 minutes');
    await user.save();
    //jwt token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '20m',
    });
    res.redirect(`/verify?token=${token}`);
  } catch (error) {
    req.session.err = error.toString();
    res.redirect('/forgot');
  }
};

//@route GET /verify
export const getVerify = (req, res) => {
  try {
    const msg = req.session.err || null;
    const signup = req.session.signup || null;
    req.session.err = null;
    req.session.signup = null;
    const token = req.query.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.redirect('/signup');
    const email = decoded.email;
    req.session.token = token;
    res.render('user/verify', { signup, email, msg, admin: false });
  } catch (error) {
    logger.error('from Get verify', error.toString());
    req.session.err = 'Session Expired Signup Again';
    return res.redirect('/signup');
  }
};

//@route POST /verify
export const handleVerify = async (req, res) => {
  try {
    if (!req.session.token) {
      req.session.err = 'Session expired. Please sign up again.';
      return res.redirect('/signup');
    }
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
    const email = decoded.email;
    const { num1, num2, num3, num4 } = req.body;
    const otp = [num1, num2, num3, num4].join('');

    const user = await User.findOne({ email });
    if (!user) {
      req.session.err = 'User not found. Signup again';
      return res.redirect('/signup');
    }

    if (user.otp !== otp) throw new Error('Invalid OTP');
    if (Date.now() > user.otpExpiry) throw new Error('Otp Expired! Resend it');

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    if (user.referrerId) {
      const referrer = await User.findById(user.referrerId);
      referrer.successfulReferrals += 1;
      if (referrer) {
        const couponCode = `REF-${referrer._id.toString().slice(-5).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const coupon = new Coupon({
          name: 'Referral Bonus' + couponCode,
          code: couponCode,
          discount: 400,
          referrerId: referrer._id,
          minAmount: 1400,
          limit: 1,
          activeFrom: new Date(),
          activeTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        await referrer.save();
        await coupon.save();
      }
    }
    return res.redirect('/');
  } catch (error) {
    logger.error('handleVerify:', error.toString());
    req.session.err = error.toString();
    req.session.signup = true;
    res.redirect(`/verify?token=${req.session.token}`);
  }
};

//@route POST /verifyPassword
export const handleVerifyPassword = async (req, res) => {
  try {
    const { num1, num2, num3, num4 } = req.body;
    const otp = [num1, num2, num3, num4].join('');
    if (!req.session.token) {
      req.session.err = 'Session expired';
      return res.redirect('/forgot');
    }
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
    const email = decoded.email;
    //userExist
    const user = await User.findOne({ email });
    if (!user) {
      req.session.err = 'User not found';
      return res.redirect('/signup');
    }

    if (user.otp !== otp) throw new Error('Invalid OTP');
    if (Date.now() > user.otpExpiry) throw new Error('Otp Expired!');

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.redirect('/changePassword');
  } catch (error) {
    logger.error('verifyPassword:', error.toString());
    req.session.err = error.toString();
    res.redirect(`/verify?token=${req.session.token}`);
  }
};

//@route GET /signup
export const getSignup = async (req, res) => {
  try {
    const signupErr = req.session.err || null;
    const referral = req.query.ref || null;

    req.session.err = null;

    res.render('user/signup', {
      msg: signupErr,
      referralToken: referral,
    });
  } catch (error) {
    logger.error('Signup Error:', error);
    res.status(500).send('Server Error');
  }
};

//@route POST /signup
export const handleSignup = async (req, res) => {
  try {
    const { name, email, password1, password2, referralToken, manualReferral } =
      req.body;

    if (password1 !== password2) throw new Error('Password does not match');
    if (password1.length < 6)
      throw new Error('Password must be at least 6 characters');

    //strong password check
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password1)) {
      throw new Error(
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
      );
    }

    const userExist = await User.findOne({ email });
    if (userExist && !userExist.isVerified) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: '2h',
      });
      req.session.signup = true;

      const otp = generateOtp();
      const otpExpiry = Date.now() + 2 * 60 * 60 * 1000;
      userExist.otp = otp;
      userExist.otpExpiry = otpExpiry;
      await userExist.save();
      await sendOTPEmail(email, otp, 'signup', '2 hour');

      return res.redirect(`/verify?token=${token}`);
    }
    if (userExist) throw new Error('User is already registered');

    const hashPassword = await hashingPassword(password1);
    const otp = generateOtp();
    const otpExpiry = Date.now() + 2 * 60 * 60 * 1000;

    let referrer = null;
    if (referralToken) {
      try {
        const decoded = jwt.verify(referralToken, process.env.JWT_SECRET);
        referrer = await User.findById(decoded.refId);
        if (!referrer) {
          req.session.err = 'Invalid referral link.';
          return res.redirect('/signup');
        }
      } catch (err) {
        req.session.err = 'Invalid or expired referral link.' + err.toString();
        return res.redirect('/signup');
      }
    } else if (!referralToken && manualReferral) {
      referrer = await User.findOne({ referralCode: manualReferral });
      if (!referrer) {
        req.session.err = 'Invalid referral code.';
        return res.redirect('/signup');
      }
    }

    const newReferralCode = generateReferralCode(email).toUpperCase();

    await sendOTPEmail(email, otp, 'signup', '2 hour');

    const newUser = new User({
      name,
      email,
      password: hashPassword,
      otp,
      otpExpiry,
      isVerified: false,
      referralCode: newReferralCode,
      referrerId: referrer ? referrer._id : null,
    });

    const response = await newUser.save();

    if (referrer) {
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { referralsCount: 1 },
      });
    }

    const token = generateToken(response._id, '1d');
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    const tokenEmail = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });
    req.session.signup = true;
    res.redirect(`/verify?token=${tokenEmail}`);
  } catch (error) {
    logger.error('Signup error:', error);
    req.session.err = error.toString();
    res.redirect('/signup');
  }
};

//@route GET /auth/google
export const handleGoogle = (req, res) => {
  try {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const scope = ['openid', 'profile', 'email'];

    req.session.oauth_state = state;
    req.session.code_verifier = codeVerifier;

    const referralCode = req.query.ref || null;
    if (referralCode) {
      req.session.referralCode = referralCode;
    }

    const url = google.createAuthorizationURL(state, codeVerifier, scope);

    res.redirect(url.toString());
  } catch (error) {
    logger.error('Error during Google OAuth redirect:', error);
    res.status(500).send('Error during Google login.');
  }
};

//@route GET /auth/google/callback
export const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedState = req.session.oauth_state;
    const codeVerifier = req.session.code_verifier;
    const referralCode = req.session.referralCode;

    if (!code || state !== storedState || !codeVerifier) {
      return res.status(400).send('Invalid request.');
    }

    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const idToken = tokens.idToken();
    const claims = decodeIdToken(idToken);

    const email = claims.email;
    const name = claims.name;
    const profile = claims.picture;

    let user = await User.findOne({ email });

    if (!user) {
      let referrer = null;

      if (referralCode) {
        const decoded = jwt.verify(referralCode, process.env.JWT_SECRET);
        referrer = await User.findById(decoded.refId);
      }

      user = await User.create({
        name,
        email,
        isVerified: true,
        provider: 'google',
        profile,
        referralCode: generateReferralCode(email),
        referrerId: referrer ? referrer._id : undefined,
      });

      if (referrer) {
        referrer.successfulReferrals = (referrer.successfulReferrals || 0) + 1;
        referrer.referralCount += 1;
        await referrer.save();

        const couponCode = `REF-${referrer._id.toString().slice(-5).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const coupon = new Coupon({
          name: 'Referral Bonus' + couponCode,
          code: couponCode,
          discount: 400,
          referrerId: referrer._id,
          minAmount: 1400,
          limit: 1,
          activeFrom: new Date(),
          activeTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        await coupon.save();
      }
    }

    req.session.referralCode = null;

    const token = generateToken(user._id, '1d');
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.redirect('/');
  } catch (error) {
    logger.error('Error during Google OAuth callback:', error);
    res.status(500).send('Google authentication failed.');
  }
};

//@route POST /resendOtp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      req.session.err = 'User not found Signup again';
      return res.redirect('/signup');
    }

    const otp = generateOtp();
    const otpExpiry = Date.now() + 2 * 60 * 60 * 1000;

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    logger.error('resendOtp:', err);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
};

//@route GET /logout
export const handleLogout = (req, res) => {
  try {
    res.clearCookie('token');
    res.redirect('/login');
  } catch (error) {
    logger.error('logout', error);
  }
};
