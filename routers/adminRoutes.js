import express from 'express';
import { deleteCategory, deleteProduct, getAddCategory, getAddProduct, 
    getCategory, getCustomers, getDashboard, getEditCategory, getEditProduct, 
    getLogin, getProducts, handleAddCategory, handleAddProduct, handleBlockUser,
     handleEditCategory, handleEditProduct, handleLogin, handleSignout, getCustomerDetails, 
     getOrders,
     getOrderDetails} from '../controllers/adminControllers.js';
import { checkAdmin, logger, validateAddProductImages, validateEditProductImages } from '../middlewares/adminMiddelware.js';

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

router.get('/customers', getCustomers);

router.get('/customerDetails', getCustomerDetails);

router.patch('/blockUser', handleBlockUser);

router.get('/categories', logger, getCategory);

router.get('/addCategory', logger, getAddCategory);

router.post('/addCategory', logger, handleAddCategory);

router.delete('/category', logger, deleteCategory);

router.get('/editCategory',logger, getEditCategory);

router.post('/editCategory', logger, handleEditCategory);

router.get('/all-orders', logger, getOrders);

router.get('/order-details/:id', logger, getOrderDetails);

router.get('/signout', handleSignout);

export default router;