import express from 'express';
import { getLogin, handleLogin, getHome, handleGoogle, handleGoogleCallback, getSignup,
     handleSignup, getVerify, handleVerify, getForgotPassword, handleForgotpassword, getChangePassword, 
     handleVerifyPassword, handleChangePassword, getProductDetails, handleLogout, getAllProducts, 
     resendOtp, getProfile, getEditProfile, handleEditProfile, handleSendOtpEmail, handleVerifyOtpEmail, 
     handleProfileChangePassword, getAddresses, getAddAddress, 
     handleAddAddress,
     getEditAddress,
     handleEditAddress,
     deleteAddress,
     getCart,
     handleAddToCart,
     handleIncreaseCount,
     handleDecreaseCount,
     deleteCart,
     deleteCartItem,
     getWishlist,
     handleAddToWishlist,
     deleteFromWishlist,
     getSelectAddress,
     getAddNewAddress,
     handleAddNewAddress,
     getEditAddressCheckout,
     handleEditAddressCheckout,
     handleSelectAddress,
     getPayment, 
     handlePlaceOrder,
     getOrders} from '../controllers/userControllers.js';
import { logger, verifyUser } from '../middlewares/userMiddlware.js';
import upload from '../configuration/multer.js';

const router = express.Router();

router.get('/login', getLogin);

router.post('/login', handleLogin);

router.get('/', logger, getHome);

router.get('/allProducts', getAllProducts);

router.get('/product/:id', logger, getProductDetails);

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

router.get('/cart', verifyUser, getCart);

router.post('/add-to-cart', verifyUser, handleAddToCart);

router.patch('/cart/increase', logger, handleIncreaseCount);

router.patch('/cart/decrease', logger, handleDecreaseCount);

router.delete('/cart/delete-item', logger, deleteCartItem);

router.delete('/cart/clear', logger, deleteCart);

router.get('/wishlist', logger, getWishlist);

router.post('/add-to-wishlist', logger, handleAddToWishlist);

router.post('/delete-from-wishlist', logger, deleteFromWishlist);

router.get('/select-address/:id', logger, getSelectAddress);

router.get('/add-new-address/:id', logger, getAddNewAddress);

router.post('/add-new-address', logger, handleAddNewAddress);

router.get('/edit-address-checkout/:id', logger, getEditAddressCheckout);

router.post('/edit-address-checkout/:id', logger, handleEditAddressCheckout);

router.post('/select-address/:id', logger, handleSelectAddress);

router.get('/payment/:id', logger, getPayment);

router.post('/place-order', logger, handlePlaceOrder);

router.get('/orders', logger, getOrders);

router.get('/logout', handleLogout);

export default router;