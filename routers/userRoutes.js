import express from 'express';
import { getLogin, handleLogin, getHome, handleGoogle, handleGoogleCallback, getSignup, handleSignup, getVerify, handleVerify, getForgotPassword, handleForgotpassword, getChangePassword, handleVerifyPassword, handleChangePassword, getProductDetails, handleLogout, getAllProducts, resendOtp} from '../controllers/userControllers.js';
import {  logger, verifyUser } from '../middlewares/userMiddlware.js';

const router = express.Router();

router.get('/login', getLogin);

router.post('/login',  handleLogin);

router.get('/', logger, getHome);

router.get('/allProducts', getAllProducts);

router.get('/product/:id', verifyUser, getProductDetails);

router.get('/auth/google', handleGoogle);

router.get("/auth/google/callback", handleGoogleCallback);

router.get('/signup',  getSignup);

router.post('/signup', handleSignup);

router.get('/verify', getVerify);

router.post('/verify', handleVerify);

router.post('/verifyPassword',  handleVerifyPassword);

router.get('/forgot', getForgotPassword);

router.post('/forgot', handleForgotpassword);

router.get('/changePassword', getChangePassword);

router.post('/changePassword',  handleChangePassword);

router.get('/logout', handleLogout);

router.post('/resend-otp', resendOtp);

export default router;