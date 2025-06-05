import express from 'express';
import { checkAdmin, logger, validateAddProductImages, validateEditProductImages } from '../middlewares/adminMiddelware.js';
import { getLogin, handleLogin, handleSignout } from '../controllers/admin/authController.js';
import { getDashboard } from '../controllers/admin/dashboardController.js';
import { deleteProduct, getAddProduct, getEditProduct, getProducts, handleAddProduct, handleEditProduct } from '../controllers/admin/productController.js';
import { getCustomerDetails, getCustomers, getOrders, handleBlockUser } from '../controllers/admin/userController.js';
import { deleteCategory, getAddCategory, getCategory, getEditCategory, handleAddCategory, handleEditCategory } from '../controllers/admin/categoryController.js';
import { getOrderDetails, handleRefundRequest, handleReturnRequest, updateProductStatus } from '../controllers/admin/orderController.js';
import { deleteCoupon, getAddCoupons, getCoupons, getEditCoupon, handleAddCoupons, handleEditCoupon } from '../controllers/admin/couponController.js';

const router = express.Router();

router.get('/login', checkAdmin, getLogin);

router.post('/login', handleLogin);

router.get('/dashboard', logger, getDashboard);

router.get('/products',logger, getProducts);

router.get('/addProduct', logger, getAddProduct);

router.post('/addProduct',logger, validateAddProductImages, handleAddProduct);

router.delete('/product', logger, deleteProduct);

router.get('/editProduct', logger, getEditProduct);

router.post('/editProduct', logger, validateEditProductImages, handleEditProduct);

router.get('/customers', logger, getCustomers);

router.get('/customerDetails', logger, getCustomerDetails);

router.patch('/blockUser', logger, handleBlockUser);

router.get('/categories', logger, getCategory);

router.get('/addCategory', logger, getAddCategory);

router.post('/addCategory', logger, handleAddCategory);

router.delete('/category', logger, deleteCategory);

router.get('/editCategory',logger, getEditCategory);

router.post('/editCategory', logger, handleEditCategory);

router.get('/all-orders', logger, getOrders);

router.get('/order-details/:id', logger, getOrderDetails);

router.post('/updateProductStatus', logger, updateProductStatus);

router.post('/orders/handle-request', logger, handleReturnRequest);

router.post('/orders/refund-request', logger, handleRefundRequest);

router.get('/coupons', logger, getCoupons);

router.get('/coupons/add', logger, getAddCoupons);

router.post('/coupons/add', logger, handleAddCoupons);

router.get('/coupons/edit/:id', logger, getEditCoupon);

router.post('/coupons/edit/:id', logger, handleEditCoupon);

router.delete('/coupons', logger, deleteCoupon);

router.get('/signout', handleSignout);

export default router;