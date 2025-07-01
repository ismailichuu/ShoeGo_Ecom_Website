import mongoose from 'mongoose';
import Category from '../../models/categorySchema.js';
import Product from '../../models/productSchema.js';
import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryPublicId } from '../../util/cloudinary.js';
import { logger } from '../../util/logger.js';

//@route GET /products
export const getProducts = async (req, res) => {
  try {
    const layout = req.query.req ? 'layout' : false;

    const searchTerm = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

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

    if (req.xhr) {
      return res.render('partials/productRows', { products }, (err, html) => {
        if (err) return res.status(500).send('Render failed');
        res.send({ html, totalPages, currentPage: page });
      });
    }

    res.render('admin/products-table', {
      layout,
      products,
      currentPage: page,
      totalPages,
      search: searchTerm,
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
    const msg = req.session.err || null;
    req.session.err = null;
    const categories = await Category.find();
    res.render('admin/addProduct', { categories, layout: layout, msg });
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
      req.session.err = 'Image is required';
      return res.redirect('/admin/addProduct?req=new');
    }

    if (
      !name.trim() ||
      !description.trim() ||
      !basePrice.trim() ||
      !discount.trim() ||
      !brand.trim() ||
      !stock.trim()
    ) {
      req.session.err = 'Some fields are empty';
      return res.redirect('/admin/addProduct?req=new');
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
    delete req.session.err;
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

    const availableSizes = req.body.sizes
      ? req.body.sizes
        .split(',')
        .map((s) => parseInt(s))
        .filter((n) => !isNaN(n))
      : product.availableSizes;

    const categoryId = category
      ? new mongoose.Types.ObjectId(category)
      : product.categoryId;

    const uploadedFiles = req.files || [];
    let existingImages = req.body.existingImages || [];
    if (!Array.isArray(existingImages)) existingImages = [existingImages];

    let finalImages = [...existingImages];
    uploadedFiles.forEach((file, index) => {
      finalImages[index] = file.path;
    });
    finalImages = finalImages.slice(0, 3);

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const trimmedBrand = brand.trim();
    const trimmedDiscount = discount.trim();
    const isActive = status === 'Active';
    const numericBasePrice = Number(basePrice);
    const numericStock = Number(stock);

    if (
      !trimmedName ||
      !trimmedDesc ||
      !trimmedBrand ||
      !trimmedDiscount ||
      !numericBasePrice ||
      !numericStock
    ) {
      req.session.err = 'fill all the fields';
      return res.redirect(`/admin/editProduct?id=${productId}&req=new`);
    }

    const isChanged =
      trimmedName !== product.name ||
      trimmedDesc !== product.description ||
      trimmedBrand !== product.brand ||
      trimmedDiscount !== product.discount ||
      numericBasePrice !== product.basePrice ||
      numericStock !== product.stock ||
      categoryId.toString() !== product.categoryId.toString() ||
      isActive !== product.isActive ||
      JSON.stringify(availableSizes) !==
      JSON.stringify(product.availableSizes) ||
      JSON.stringify(finalImages) !== JSON.stringify(product.images);

    if (!isChanged) {
      req.session.err = 'No changes were made to the product.';
      return res.redirect(`/admin/editProduct?id=${productId}&req=new`);
    }

    product.name = trimmedName;
    product.description = trimmedDesc;
    product.availableSizes = availableSizes;
    product.images = finalImages;
    product.isActive = isActive;
    product.basePrice = numericBasePrice;
    product.discount = trimmedDiscount;
    product.brand = trimmedBrand;
    product.categoryId = categoryId;
    product.stock = numericStock;

    await product.save();
    res.redirect('/admin/products?req=new');
  } catch (error) {
    logger.error('Error saving product:', error);
    res.status(500).send('Server Error');
  }
};

