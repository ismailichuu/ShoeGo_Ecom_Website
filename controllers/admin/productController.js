import mongoose from 'mongoose';
import fs from 'fs';
import Category from '../../models/categorySchema.js';
import Product from '../../models/productSchema.js';
import path from 'path';

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