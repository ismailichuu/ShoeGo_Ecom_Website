import mongoose from 'mongoose';
import Category from '../../models/categorySchema.js';
import Product from '../../models/productSchema.js';
import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryPublicId } from '../../util/cloudinary.js';
import { logger } from '../../util/logger.js';

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
    const products = await Product.find(searchFilter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .populate('categoryId');

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
      query: req.query,
    });
  } catch (error) {
    logger.error('getProducts:', error.toString());
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
    logger.error('getAddProducts:', error.toString());
  }
};

//@route POST /addProduct
export const handleAddProduct = async (req, res) => {
  try {
    const { name, description, basePrice, discount, brand, stock, category } =
      req.body;

    if (!req.files || req.files.length === 0) {
      return res.render('admin/addProduct', { msg: 'Image is required' });
    }

    const availableSizes = req.body.sizes
      ? req.body.sizes.split(',').map(Number)
      : [];

    // Save Cloudinary URLs instead of local filenames
    const images = req.files.map((file) => file.path);

    const categoryId = category ? [new mongoose.Types.ObjectId(category)] : [];

    const newProduct = new Product({
      name,
      description,
      availableSizes,
      images,
      basePrice,
      discount,
      brand,
      categoryId,
      stock,
    });

    await newProduct.save();
    res.redirect('/admin/products?req=new');
  } catch (error) {
    logger.error('Error saving product:', error);
    res.status(500).send('Server Error');
  }
};

//@route DELETE /product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    // Delete images from Cloudinary
    for (const imageUrl of product.images) {
      const publicId = getCloudinaryPublicId(imageUrl);
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Delete failed:', error.message);
      }
    }

    await Product.deleteOne({ _id: productId });

    res.json({ success: true });
  } catch (err) {
    logger.error('deleteProduct', err.toString());
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.render('admin/editProduct', {
      product,
      categories,
      msg,
      layout: layout,
    });
  } catch (error) {
    logger.error('editProduct:', error.toString());
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
      discount,
      brand,
      stock,
      status,
      category,
    } = req.body;

    const productId = req.query.id;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).send('Product not found');

    // Parse sizes
    const availableSizes = req.body.sizes
      ? req.body.sizes
          .split(',')
          .map((s) => parseInt(s))
          .filter((n) => !isNaN(n))
      : [];

    // Parse category
    const categoryId = category ? [new mongoose.Types.ObjectId(category)] : [];

    const uploadedFiles = req.files || [];
    let existingImages = req.body.existingImages || [];

    // Make sure existingImages is an array
    if (!Array.isArray(existingImages)) {
      existingImages = [existingImages];
    }

    // Initialize finalImages with existingImages (max 3)
    let finalImages = [...existingImages];

    uploadedFiles.forEach((file, index) => {
      finalImages[index] = file.path;
    });

    finalImages = finalImages.slice(0, 3);

    const isActive = status === 'Active';

    product.name = name;
    product.description = description;
    product.availableSizes = availableSizes;
    product.images = finalImages;
    product.isActive = isActive;
    product.basePrice = basePrice;
    product.discount = discount;
    product.brand = brand;
    product.categoryId = categoryId;
    product.stock = stock;

    await product.save();
    res.redirect('/admin/products?req=new');
  } catch (error) {
    logger.error('Error saving product:', error);
    res.status(500).send('Server Error');
  }
};
