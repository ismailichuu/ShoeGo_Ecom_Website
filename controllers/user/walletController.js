import { decodeUserId } from '../../util/jwt.js';
import Wallet from '../../models/walletSchema.js';
import Order from '../../models/orderSchema.js';
import Cart from '../../models/cartSchema.js';
import Product from '../../models/productSchema.js';
import Coupon from '../../models/couponSchema.js';
import Transaction from '../../models/transactionSchema.js';
import { logger } from '../../util/logger.js';

//@route GET /wallet
export const getWallet = async (req, res) => {
  try {
    const userId = decodeUserId(req.cookies?.token);

    // Fetch wallet by user ID
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.render('user/wallet', {
        totalBalance: 0,
        walletBalance: 0,
        giftCardBalance: 0,
        layout: 'profile-layout',
      });
    }

    const giftCardBalance = wallet.transactions
      .filter((tx) => tx.reason === 'gift_card' && tx.type === 'credit')
      .reduce((acc, tx) => acc + tx.amount, 0);

    res.render('user/wallet', {
      totalBalance: wallet.balance,
      walletBalance: wallet.balance - giftCardBalance,
      giftCardBalance,
      layout: 'profile-layout',
    });
  } catch (error) {
    logger.error('Error loading wallet:', error);
    res.status(500).send('Internal server error');
  }
};

//@route POST /place-wallet-order
export const placeOrderByWallet = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = decodeUserId(req.cookies?.token);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.redirect('/cart');
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < order.totalPrice) {
      return res
        .status(400)
        .json({ success: false, message: 'Insufficient wallet balance' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.cartItems.length < 1) {
      return res.status(404).json({ success: false, message: 'Cart is empty' });
    }

    for (const item of order.products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      product.stock -= item.quantity;
      await product.save();
    }

    const orderDate = new Date();
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(orderDate.getDate() + 7);

    if (order.couponApplied) {
      const couponId = order.couponId;
      await Coupon.updateOne(
        { _id: couponId },
        {
          $push: { usedUsers: userId },
          $inc: { used: 1 },
        }
      );
    }

    order.orderStatus = 'placed';
    order.paymentStatus = 'completed';
    order.paymentMethod = 'wallet';
    order.orderDate = orderDate;
    order.deliveryDate = deliveryDate;

    order.products = order.products.map((item) => ({
      ...(item.toObject?.() || item),
      productStatus: 'placed',
    }));

    wallet.balance -= order.totalPrice;
    wallet.transactions.push({
      type: 'debit',
      amount: order.totalPrice,
      reason: 'purchase',
      orderId: order._id,
    });

    await order.save();
    await wallet.save();

    await Cart.deleteOne({ userId });

    await Transaction.create({
      userId,
      type: 'order',
      orderId: orderId,
      status: 'success',
      amount: order.totalPrice,
      paymentMethod: 'wallet',
    });

    res.status(200).json({ success: true, deliveryDate });
  } catch (error) {
    logger.error('error from walletPayment', error.toString());
  }
};

//@route GET /wallet/history
export const getWalletTransactions = async (req, res) => {
  try {
    const userId = decodeUserId(req.cookies?.token);
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.json({
        transactions: [],
        currentPage: page,
        totalPages: 0,
      });
    }

    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);

    const sortedTransactions = wallet.transactions.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    const paginated = sortedTransactions.slice(skip, skip + limit);

    res.json({
      transactions: paginated,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    logger.error('getWalletTransactions:', err);
    res.status(500).json({ message: 'Failed to load wallet transactions' });
  }
};
