import express from 'express';
import {
  authUser,
  loginCheck,
  verifyUser,
} from '../middlewares/userMiddlware.js';
import upload from '../config/multer.js';
import {
  getForgotPassword,
  getLogin,
  getSignup,
  getVerify,
  handleForgotpassword,
  handleGoogle,
  handleGoogleCallback,
  handleLogin,
  handleLogout,
  handleSignup,
  handleVerify,
  handleVerifyPassword,
  resendOtp,
} from '../controllers/user/authController.js';
import { getHome } from '../controllers/user/homeController.js';
import {
  getAllProducts,
  getProductDetails,
} from '../controllers/user/productController.js';
import {
  getChangePassword,
  getEditProfile,
  getProfile,
  handleChangePassword,
  handleEditProfile,
  handleProfileChangePassword,
  handleSendOtpEmail,
  handleVerifyOtpEmail,
} from '../controllers/user/profileController.js';
import {
  deleteAddress,
  getAddAddress,
  getAddNewAddress,
  getAddresses,
  getEditAddress,
  getEditAddressCheckout,
  getSelectAddress,
  handleAddAddress,
  handleAddNewAddress,
  handleEditAddress,
  handleEditAddressCheckout,
  handleSelectAddress,
} from '../controllers/user/addressController.js';
import {
  deleteCart,
  deleteCartItem,
  getCart,
  getOrderSummary,
  handleAddToCart,
  handleDecreaseCount,
  handleIncreaseCount,
} from '../controllers/user/cartController.js';
import {
  deleteFromWishlist,
  getWishlist,
  handleAddToWishlist,
} from '../controllers/user/wishlistController.js';
import {
  createRazorpayOrder,
  getPayment,
  handleRetryPayment,
  verifyPayment,
} from '../controllers/user/paymentController.js';
import {
  downloadInvoice,
  getOrderDetails,
  getOrders,
  handleCancelAll,
  handleCancelProduct,
  handlePlaceOrder,
  handleReturnAll,
  returnProduct,
} from '../controllers/user/orderController.js';
import {
  getWallet,
  getWalletTransactions,
  placeOrderByWallet,
} from '../controllers/user/walletController.js';
import {
  handleApplyCoupon,
  handleRemoveCoupon,
} from '../controllers/user/couponController.js';

const router = express.Router();

router.get('/login', loginCheck, getLogin);

router.post('/login', handleLogin);

router.get('/', authUser, getHome);

router.get('/allProducts', getAllProducts);

router.get('/product/:id', authUser, getProductDetails);

router.get('/auth/google', handleGoogle);

router.get('/auth/google/callback', handleGoogleCallback);

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

router.get('/profile', authUser, getProfile);

router.get('/profile/edit', authUser, getEditProfile);

router.post('/profile/edit', upload.single('profile'), handleEditProfile);

router.post('/send-email-otp', authUser, handleSendOtpEmail);

router.post('/verify-email-otp', authUser, handleVerifyOtpEmail);

router.post('/profile/change-password', authUser, handleProfileChangePassword);

router.get('/addresses', authUser, getAddresses);

router.get('/add-address', authUser, getAddAddress);

router.post('/add-address', authUser, handleAddAddress);

router.get('/edit-address/:id', authUser, getEditAddress);

router.post('/edit-address/:id', authUser, handleEditAddress);

router.delete('/delete-address/:id', authUser, deleteAddress);

router.get('/cart', verifyUser, getCart);

router.post('/add-to-cart', verifyUser, handleAddToCart);

router.patch('/cart/increase', authUser, handleIncreaseCount);

router.get('/cart/order-summary', getOrderSummary);

router.patch('/cart/decrease', authUser, handleDecreaseCount);

router.delete('/cart/delete-item', authUser, deleteCartItem);

router.delete('/cart/clear', authUser, deleteCart);

router.get('/wishlist', authUser, getWishlist);

router.post('/add-to-wishlist', authUser, handleAddToWishlist);

router.post('/delete-from-wishlist', authUser, deleteFromWishlist);

router.get('/select-address/:id', verifyUser, getSelectAddress);

router.get('/add-new-address/:id', authUser, getAddNewAddress);

router.post('/add-new-address', authUser, handleAddNewAddress);

router.get('/edit-address-checkout/:id', authUser, getEditAddressCheckout);

router.post('/edit-address-checkout/:id', authUser, handleEditAddressCheckout);

router.post('/select-address/:id', verifyUser, handleSelectAddress);

router.get('/payment/:id', authUser, getPayment);

router.post('/place-razorpay', verifyUser, createRazorpayOrder);

router.post('/verify-payment', authUser, verifyPayment);

router.get('/retry-payment/:id', authUser, handleRetryPayment);

router.post('/payment/apply-coupon', authUser, handleApplyCoupon);

router.patch('/coupon/remove', authUser, handleRemoveCoupon);

router.post('/place-order', verifyUser, handlePlaceOrder);

router.post('/place-wallet-order', verifyUser, placeOrderByWallet);

router.get('/orders', authUser, getOrders);

router.get('/order-details/:id', authUser, getOrderDetails);

router.post('/orders/cancel-product', authUser, handleCancelProduct);

router.get('/download-invoice/:orderId', authUser, downloadInvoice);

router.post('/orders/return-product', authUser, returnProduct);

router.post('/order/return-all', authUser, handleReturnAll);

router.post('/orders/cancel-all', authUser, handleCancelAll);

router.get('/wallet', authUser, getWallet);

router.get('/wallet/history', authUser, getWalletTransactions);

router.get('/logout', handleLogout);

export default router;
