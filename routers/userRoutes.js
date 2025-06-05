import express from 'express';
import { logger, verifyUser } from '../middlewares/userMiddlware.js';
import upload from '../config/multer.js';
import { getForgotPassword, getLogin, getSignup, getVerify, handleForgotpassword,
     handleGoogle, handleGoogleCallback, handleLogin, handleLogout, handleSignup,
     handleVerify, handleVerifyPassword, resendOtp } from '../controllers/user/authController.js';
import { getHome } from '../controllers/user/homeController.js';
import { getAllProducts, getProductDetails } from '../controllers/user/productController.js';
import { getChangePassword, getEditProfile, getProfile, handleChangePassword, handleEditProfile, 
     handleProfileChangePassword, handleSendOtpEmail, handleVerifyOtpEmail } from '../controllers/user/profileController.js';
import { deleteAddress, getAddAddress, getAddNewAddress, getAddresses, getEditAddress, getEditAddressCheckout, getSelectAddress,
     handleAddAddress, handleAddNewAddress, handleEditAddress, handleEditAddressCheckout, handleSelectAddress } from '../controllers/user/addressController.js';
import { deleteCart, deleteCartItem, getCart, getOrderSummary, handleAddToCart, handleDecreaseCount, handleIncreaseCount } from '../controllers/user/cartController.js';
import { deleteFromWishlist, getWishlist, handleAddToWishlist } from '../controllers/user/wishlistController.js';
import { createRazorpayOrder, getPayment, verifyPayment } from '../controllers/user/paymentController.js';
import { downloadInvoice, getOrderDetails, getOrders, handleCancelAll, handleCancelProduct, handlePlaceOrder, handleReturnAll, returnProduct } from '../controllers/user/orderController.js';
import { getWallet } from '../controllers/user/walletController.js';
import { handleApplyCoupon, handleRemoveCoupon } from '../controllers/user/couponController.js';

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

router.get('/cart/order-summary', getOrderSummary);

router.patch('/cart/decrease', logger, handleDecreaseCount);

router.delete('/cart/delete-item', logger, deleteCartItem);

router.delete('/cart/clear', logger, deleteCart);

router.get('/wishlist', logger, getWishlist);

router.post('/add-to-wishlist', logger, handleAddToWishlist);

router.post('/delete-from-wishlist', logger, deleteFromWishlist);

router.get('/select-address/:id', verifyUser, getSelectAddress);

router.get('/add-new-address/:id', logger, getAddNewAddress);

router.post('/add-new-address', logger, handleAddNewAddress);

router.get('/edit-address-checkout/:id', logger, getEditAddressCheckout);

router.post('/edit-address-checkout/:id', logger, handleEditAddressCheckout);

router.post('/select-address/:id', verifyUser, handleSelectAddress);

router.get('/payment/:id', logger, getPayment);

router.post('/place-razorpay', verifyUser, createRazorpayOrder);

router.post('/verify-payment', logger, verifyPayment);

router.post('/payment/apply-coupon', logger, handleApplyCoupon);

router.patch('/coupon/remove', logger, handleRemoveCoupon);

router.post('/place-order', verifyUser, handlePlaceOrder);

router.get('/orders', logger, getOrders);

router.get('/order-details/:id', logger, getOrderDetails);

router.post('/orders/cancel-product', logger, handleCancelProduct);

router.get('/download-invoice/:orderId', logger, downloadInvoice);

router.post('/orders/return-product', logger, returnProduct);

router.post('/order/return-all', logger, handleReturnAll);

router.post('/orders/cancel-all', logger, handleCancelAll);

router.get('/wallet', logger, getWallet);

router.get('/logout', handleLogout);

export default router;