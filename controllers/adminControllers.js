import mongoose from 'mongoose';
import upload from '../configuration/multer.js';
import fs from 'fs';
import bcrypt from 'bcrypt';
import User from '../models/userSchema.js';
import Category from '../models/categorySchema.js';
import Product from '../models/productSchema.js';
import path from 'path';
import { generateToken } from '../util/jwt.js';
import Address from '../models/addressSchema.js';

//@route GET /admin/login
export const getLogin = (req, res) => {
    const msg = req.session.err || null;
    req.session.err = null;
    res.render('admin/login', { msg });
};

//@route POST /admin/login
export const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        // checking the admin
        const admin = await User.findOne({ email });
        if (!admin?.admin) throw new Error('Admin not found');
        //password comapre
        const checkPassword = await bcrypt.compare(password, admin.password);
        if (!checkPassword) throw new Error('Invalid credentials');
        const token = generateToken(admin._id, '1d');
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })
        res.redirect('/admin/dashboard');
    } catch (error) {
        req.session.err = error.toString();
        res.redirect('/admin/login');
    }
};

//@route GET /dashboard
export const getDashboard = (req, res) => {
    res.render('admin/dashboard', { layout: 'layout' });
}

//@route GET /products
export const getProducts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const searchTerm = req.query.search || '';

        const searchFilter = searchTerm
            ? { name: { $regex: searchTerm, $options: 'i' } }
            : {};

        const totalDocs = await Product.countDocuments(searchFilter);
        const products = await Product
            .find(searchFilter)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ updatedAt: -1 });

        const totalPages = Math.ceil(totalDocs / limit);
        const layout = req.query.req ? 'layout' : false;

        res.render('admin/products-table', {
            layout,
            products,
            pagination: {
                page,
                limit,
                totalDocs,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages,
            },
            search: searchTerm,
            req: req,
            from: req.query.from || null,
            query: req.query
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

//@route GET /addProduct
export const getAddProduct = async (req, res) => {
    try {
        const layout = req.query.req ? 'layout' : false;
        const categories = await Category.find();
        res.render('admin/addProduct', { categories, layout: layout, msg: null });
    } catch (error) {
        console.log(error);
    }
};

//@route POST /addProduct
export const handleAddProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            basePrice,
            discountPrice,
            stock,
            category
        } = req.body;


        if (!req.files || req.files.length === 0) {
            return res.render('admin/addProduct', { msg: 'Image is required' });
        }
        const availableSizes = req.body.sizes ? req.body.sizes.split(',').map(Number) : [];
        const images = req.files ? req.files.map(file => file.filename) : [];
        const categoryId = category ? [new mongoose.Types.ObjectId(category)] : [];

        const newProduct = new Product({
            name,
            description,
            availableSizes,
            images,
            basePrice,
            discountPrice,
            categoryId,
            stock
        });

        await newProduct.save();
        res.redirect('/admin/products?req=new');
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).send('Server Error');
    }
};

//@route DELETE /product
export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Loop through and delete each image
        for (const image of product.images) {
            const imagePath = path.join(process.cwd(), 'public', 'uploads', 'products', image);

            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error(`Failed to delete image ${image}:`, err.message);
                }
            });
        }

        await Product.deleteOne({ _id: productId });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

//@route GET /editProduct
export const getEditProduct = async (req, res) => {
    try {
        const msg = req.session.err || null;
        const layout = req.query.req ? 'layout' : false;
        const productId = req.query.id;
        const product = await Product.findById(productId);
        const categories = await Category.find();
        res.render('admin/editProduct', { product, categories, msg, layout: layout });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

//@route POST /editProduct
export const handleEditProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            basePrice,
            discountPrice,
            stock,
            status,
            category
        } = req.body;

        const productId = req.query.id;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).send('Product not found');

        // Parse available sizes
        const availableSizes = req.body.sizes
            ? req.body.sizes.split(',').map(s => parseInt(s)).filter(n => !isNaN(n))
            : [];

        // Handle category
        const categoryId = category ? [new mongoose.Types.ObjectId(category)] : [];
        // Ensure both are arrays
        const uploadedFiles = req.files || [];
        let existingImages = req.body.existingImages || [];

        // Force existingImages to be array even if it's single string
        if (!Array.isArray(existingImages)) {
            existingImages = [existingImages];
        }

        const finalImages = [];
        // Combine existing images and new uploads into exactly 3 entries
        for (let i = 0; i < 3; i++) {
            if (uploadedFiles[i]) {
                finalImages.push(uploadedFiles[i].filename);
            } if (existingImages[i]) {
                finalImages.push(existingImages[i]);
            }
        }
        //status
        console.log(status)
        const isActive = status === 'Active' ? true : false;


        // Assign values
        product.name = name;
        product.description = description;
        product.availableSizes = availableSizes;
        product.images = finalImages;
        product.isActive = isActive;
        product.basePrice = basePrice;
        product.discountPrice = discountPrice;
        product.categoryId = categoryId;
        product.stock = stock;

        await product.save();
        res.redirect('/admin/products?req=new');

    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).send('Server Error');
    }
};




//@route GET /categories
export const getCategory = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const searchTerm = req.query.search || '';

        const searchFilter = searchTerm
            ? { name: { $regex: searchTerm, $options: 'i' } }
            : {};

        const totalDocs = await Category.countDocuments(searchFilter);
        const categories = await Category
            .find(searchFilter)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ updatedAt: -1 });

        const totalPages = Math.ceil(totalDocs / limit);
        const layout = req.query.req ? 'layout' : false;

        res.render('admin/category', {
            layout,
            categories,
            pagination: {
                page,
                limit,
                totalDocs,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages,
            },
            search: searchTerm,
            req: req,
            from: req.query.from || null,
            query: req.query
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

//@route GET /Category
export const getAddCategory = async (req, res) => {
    try {

        res.render('admin/addCategory', { admin: false, msg: null });
    } catch (error) {
        console.log(error);
    }
}

//@route POST /addCategory
export const handleAddCategory = async (req, res) => {
    try {
        const { name, description, visibility, discount } = req.body;

        const trimmedName = name.trim();

        // Check if category with same name exists (case-insensitive)
        const category = await Category.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
        if (category) throw new Error('Category already exists');

        const newCategory = new Category({
            name: trimmedName,
            description: description?.trim() || '',
            visibility: visibility === 'Active',
            discount: parseFloat(discount) || 0,
        });

        await newCategory.save();

        res.redirect('/admin/categories?req=new');
    } catch (error) {
        console.log(error);
        res.render('admin/addCategory', { layout: 'layout', msg: error.message || 'Something went wrong' });
    }
};

//@route DELETE /category
export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
        await Category.deleteOne({ _id: categoryId })
        res.json({ success: true });
    } catch (error) {
        console.error(err);
    }
}

//@route GET /editCategory
export const getEditCategory = async (req, res) => {
    try {
        const msg = req.session.err || null;
        const layout = req.query.req ? 'layout' : false;
        const categoryId = req.query.id;
        const category = await Category.findById(categoryId);
        res.render('admin/editCategory', { category, msg, layout: layout });
    } catch (error) {
        console.error(err);
    }
}

//@route PUT /editCategory
export const handleEditCategory = async (req, res) => {
    const { name, _id, description, visibility, discount } = req.body;
    try {
        //checking for category
        const category = await Category.findById(_id);
        if (!category) throw new Error('Category Not found');
        //checking for the name
        if (name !== category.name) {
            const category = await Category.findOne({ name });
            if (category) throw new Error('Category name already exist');
        }
        category.name = name;
        category.description = description;
        category.visibility = (visibility === 'true');
        category.discount = discount;
        await category.save();
        res.redirect('/admin/categories?req=new');
    } catch (error) {
        console.log(error);
        req.session.err = error.toString();
        res.redirect(`/admin/editCategory?id=${_id}&req=new`);
    }
}

//@route GET /customers
export const getCustomers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const searchTerm = req.query.search || '';

        const searchFilter = searchTerm
            ? { name: { $regex: searchTerm, $options: 'i' } }
            : {};

        const totalDocs = await User.countDocuments(searchFilter);
        const customers = await User
            .find(searchFilter)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalPages = Math.ceil(totalDocs / limit);
        const layout = req.query.req ? 'layout' : false;

        res.render('admin/customer', {
            layout,
            customers,
            pagination: {
                page,
                limit,
                totalDocs,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages,
            },
            search: searchTerm,
            req: req,
            from: req.query.from || null,
            query: req.query
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

//@route POST /blockUser 
export const handleBlockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) res.status(404).json({ success: false, message: 'User not found' });

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ success: true, id: userId });
    } catch (error) {
        console.log(error);
    }
}

//@router GET /customerDetails
export const getCustomerDetails = async (req, res) => {
    try {
        const layout = req.query.req ? 'layout' : false;
        const userId = req.query.id;
        const customer = await User.findById(userId);
        const joinedDate = new Date(customer.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const address = await Address.findOne({ userId, isDefault: true });
        res.render('admin/customerDetails', { customer, joinedDate, layout: layout, address });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
}

//@route POST /signout
export const handleSignout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
};

