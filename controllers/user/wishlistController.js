import Product from '../../models/productSchema.js';
import { decodeUserId } from '../../util/jwt.js';
import Cart from '../../models/cartSchema.js';
import Wishlist from '../../models/wishlistSchema.js';
import getFinalPriceWithLabel from '../../util/bestPriceProduct.js';
import { logger } from '../../util/logger.js';

//@route GET /wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = decodeUserId(req.cookies?.token);
    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: 'items.productId',
      populate: { path: 'categoryId' },
    });

    const updatedWishlist = wishlist.items.map((item) => {
      const { finalPrice, discountLabel } = getFinalPriceWithLabel(
        item.productId
      );
      return {
        ...item._doc,
        productId: {
          ...item.productId._doc,
          finalPrice,
          discountLabel,
        },
      };
    });

    const wishlistProductIds =
      wishlist?.items?.map((item) => item.productId?._id).filter(Boolean) || [];
    const firstProduct = wishlist?.items?.[0]?.productId;
    const categoryId = firstProduct?.categoryId;

    let related = [];

    if (categoryId && wishlistProductIds.length > 0) {
      related = await Product.find({
        categoryId,
        isActive: true,
        _id: { $nin: wishlistProductIds },
      })
        .limit(4)
        .populate('categoryId');
    }

    related = related.map((product) => {
      const { finalPrice, discountLabel } = getFinalPriceWithLabel(product);
      return {
        ...product._doc,
        finalPrice,
        discountLabel,
      };
    });

    res.render('user/wishlist', {
      wishlist: updatedWishlist || { items: [] },
      related,
    });
  } catch (error) {
    logger.error('Error getting wishlist:', error);
    res.status(500).render('user/wishlist', {
      wishlist: { items: [] },
      related: [],
      error: 'Something went wrong while loading your wishlist.',
    });
  }
};

//@route POST /add-to-wishlist
export const handleAddToWishlist = async (req, res) => {
  try {
    const { productId, selectedSize } = req.body;
    const token = req.cookies?.token;

    if (!token) {
      req.session.err = 'Session expired. Please login again.';
      return res.redirect('/login');
    }

    const userId = decodeUserId(token);
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'User not authenticated' });
    }

    const cart = await Cart.findOne({
      userId,
      cartItems: {
        $elemMatch: {
          productId,
        },
      },
    });

    if (cart) {
      return res.status(400).json({
        success: false,
        message: 'Product already in the cart',
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found or inactive' });
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      // Create new wishlist with item
      wishlist = new Wishlist({
        userId,
        items: [{ productId, size: selectedSize }],
      });
    } else {
      // Check if product with same size already exists
      const exists = wishlist.items.some(
        (item) =>
          item.productId.toString() === productId && item.size === selectedSize
      );

      if (exists) {
        return res.status(200).json({
          success: false,
          message: 'Item is already exists in wishlist',
        });
      }

      // Push new item
      wishlist.items.push({ productId, size: selectedSize });
    }

    await wishlist.save();
    return res
      .status(200)
      .json({ success: true, message: 'Added to wishlist' });
  } catch (err) {
    logger.error('Add to wishlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//@route POST /delete-from-wishlist
export const deleteFromWishlist = async (req, res) => {
  try {
    const { productId, selectedSize } = req.body;
    const userId = decodeUserId(req.cookies?.token);
    await Wishlist.updateOne(
      { userId },
      { $pull: { items: { productId, size: selectedSize } } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('deleteFromWishlist:', error);
  }
};
