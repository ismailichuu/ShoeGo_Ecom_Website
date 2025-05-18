import express from 'express';
import { getLogin, handleLogin, getHome, handleGoogle, handleGoogleCallback, getSignup,
     handleSignup, getVerify, handleVerify, getForgotPassword, handleForgotpassword, getChangePassword, 
     handleVerifyPassword, handleChangePassword, getProductDetails, handleLogout, getAllProducts, 
     resendOtp, getProfile, getEditProfile, handleEditProfile, handleSendOtpEmail, handleVerifyOtpEmail, 
     handleProfileChangePassword, getAddresses, getAddAddress, 
     handleAddAddress,
     getEditAddress,
     handleEditAddress,
     deleteAddress} from '../controllers/userControllers.js';
import { logger, verifyUser } from '../middlewares/userMiddlware.js';
import upload from '../configuration/multer.js';

const router = express.Router();

router.get('/login', getLogin);

router.post('/login', handleLogin);

router.get('/', logger, getHome);

router.get('/allProducts', getAllProducts);

router.get('/product/:id', verifyUser, getProductDetails);

router.get('/auth/google', handleGoogle);

router.get("/auth/google/callback", handleGoogleCallback);

router.get('/signup', getSignup);

router.post('/signup', handleSignup);

router.get('/verify', getVerify);

router.post('/verify', handleVerify);

router.post('/resend-otp', resendOtp);

router.post('/verifyPassword', handleVerifyPassword);

router.get('/forgot', getForgotPassword);

router.post('/forgot', handleForgotpassword);

router.get('/changePassword', getChangePassword);

router.post('/changePassword', handleChangePassword);

router.get('/profile', logger, getProfile);

router.get('/profile/edit', logger, getEditProfile);

router.post('/profile/edit', upload.single('profile'), handleEditProfile);

router.post('/send-email-otp', logger, handleSendOtpEmail);

router.post('/verify-email-otp', logger, handleVerifyOtpEmail);

router.post('/profile/change-password', logger, handleProfileChangePassword);

router.get('/addresses', logger, getAddresses);

router.get('/add-address', logger, getAddAddress);

router.post('/add-address', logger, handleAddAddress);

router.get('/edit-address/:id', logger, getEditAddress);

router.post('/edit-address/:id', logger, handleEditAddress);

router.delete('/delete-address/:id', logger, deleteAddress);

router.get('/logout', handleLogout);

export default router;