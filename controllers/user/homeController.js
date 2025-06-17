import Product from '../../models/productSchema.js';
import { decodeUserId } from '../../util/jwt.js';
import Cart from '../../models/cartSchema.js';
import getFinalPriceWithLabel from '../../util/bestPriceProduct.js';
import { logger } from '../../util/logger.js';

//@route GET /
export const getHome = async (req, res) => {
  try {
    const userId = decodeUserId(req.cookies?.token);
    const cart = await Cart.findOne({ userId });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.cartItems.length;
    }

    const products = await Product.find({ isActive: true })
      .limit(8)
      .populate('categoryId')
      .sort({ createdAt: -1 });

    const updatedProducts = products.map((product) => {
      const { finalPrice, discountLabel } = getFinalPriceWithLabel(product);
      return {
        ...product._doc,
        finalPrice,
        discountLabel,
      };
    });

    res.render('user/home', { products: updatedProducts, cartCount });
  } catch (error) {
    logger.error('getHome:', error);
    res.status(500).send('Internal Server Error');
  }
};
