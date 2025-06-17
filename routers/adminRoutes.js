import express from 'express';
import {
  checkAdmin,
  authAdmin,
  validateAddProductImages,
  validateEditProductImages,
} from '../middlewares/adminMiddelware.js';
import {
  getLogin,
  handleLogin,
  handleSignout,
} from '../controllers/admin/authController.js';
import {
  getDashboard,
  getTopBrands,
  getTopCategories,
  getTopProducts,
  getTopSellingProducts,
} from '../controllers/admin/dashboardController.js';
import {
  deleteProduct,
  getAddProduct,
  getEditProduct,
  getProducts,
  handleAddProduct,
  handleEditProduct,
} from '../controllers/admin/productController.js';
import {
  getCustomerDetails,
  getCustomers,
  getOrders,
  handleBlockUser,
} from '../controllers/admin/userController.js';
import {
  deleteCategory,
  getAddCategory,
  getCategory,
  getEditCategory,
  handleAddCategory,
  handleEditCategory,
} from '../controllers/admin/categoryController.js';
import {
  getOrderDetails,
  handleRefundRequest,
  handleReturnRequest,
  updateProductStatus,
} from '../controllers/admin/orderController.js';
import {
  deleteCoupon,
  getAddCoupons,
  getCoupons,
  getEditCoupon,
  handleAddCoupons,
  handleEditCoupon,
} from '../controllers/admin/couponController.js';
import {
  generateSalesExcel,
  generateSalesPDF,
  getSalesReport,
} from '../controllers/admin/salesController.js';

const router = express.Router();

router.get('/login', checkAdmin, getLogin);

router.post('/login', handleLogin);

router.get('/dashboard', authAdmin, getDashboard);

router.get('/dashboard/top-products', authAdmin, getTopProducts);

router.get('/dashboard/top-categories', authAdmin, getTopCategories);

router.get('/dashboard/top-brands', authAdmin, getTopBrands);

router.get('/dashboard/top-selling-products', authAdmin, getTopSellingProducts);

router.get('/products', authAdmin, getProducts);

router.get('/addProduct', authAdmin, getAddProduct);

router.post(
  '/addProduct',
  authAdmin,
  validateAddProductImages,
  handleAddProduct
);

router.delete('/product', authAdmin, deleteProduct);

router.get('/editProduct', authAdmin, getEditProduct);

router.post(
  '/editProduct',
  authAdmin,
  validateEditProductImages,
  handleEditProduct
);

router.get('/customers', authAdmin, getCustomers);

router.get('/customerDetails', authAdmin, getCustomerDetails);

router.patch('/blockUser', authAdmin, handleBlockUser);

router.get('/categories', authAdmin, getCategory);

router.get('/addCategory', authAdmin, getAddCategory);

router.post('/addCategory', authAdmin, handleAddCategory);

router.delete('/category', authAdmin, deleteCategory);

router.get('/editCategory', authAdmin, getEditCategory);

router.post('/editCategory', authAdmin, handleEditCategory);

router.get('/all-orders', authAdmin, getOrders);

router.get('/order-details/:id', authAdmin, getOrderDetails);

router.post('/updateProductStatus', authAdmin, updateProductStatus);

router.post('/orders/handle-request', authAdmin, handleReturnRequest);

router.post('/orders/refund-request', authAdmin, handleRefundRequest);

router.get('/coupons', authAdmin, getCoupons);

router.get('/coupons/add', authAdmin, getAddCoupons);

router.post('/coupons/add', authAdmin, handleAddCoupons);

router.get('/coupons/edit/:id', authAdmin, getEditCoupon);

router.post('/coupons/edit/:id', authAdmin, handleEditCoupon);

router.delete('/coupons', authAdmin, deleteCoupon);

router.get('/sales-report', authAdmin, getSalesReport);

router.get('/sales-report/download/pdf', authAdmin, generateSalesPDF);

router.get('/sales-report/download/excel', authAdmin, generateSalesExcel);

router.get('/signout', handleSignout);

export default router;
