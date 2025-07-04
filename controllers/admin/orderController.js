import mongoose from 'mongoose';
import Order from '../../models/orderSchema.js';
import Wallet from '../../models/walletSchema.js';
import { logger } from '../../util/logger.js';
import User from '../../models/userSchema.js';

//@router GET /orders
export const getOrders = async (req, res) => {
  try {
    const layout = req.query.req ? 'layout' : false;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' },
      }).select('_id');

      const userIds = users.map((user) => user._id);

      query = {
        $or: [
          { userId: { $in: userIds } },
          { orderId: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId')
      .populate('products.productId')
      .lean();

    if (req.xhr) {
      return res.render('partials/orderRows', { orders }, (err, html) => {
        if (err) return res.status(500).send('Render failed');
        res.send({ html, totalPages, currentPage: page });
      });
    }

    res.render('admin/ordersTable', {
      orders,
      layout: layout,
      currentPage: page,
      totalPages,
      search,
    });
  } catch (error) {
    logger.error('Error loading orders:', error);
    res.status(500).render('admin/error', { message: 'Failed to load orders' });
  }
};

//@route GET /order-details/:id
export const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const layout = req.query.req ? 'layout' : false;

    const order = await Order.findById(orderId)
      .populate('userId')
      .populate('products.productId');

    if (!order) {
      return res.status(404).send('Order not found');
    }

    res.render('admin/orderDetails', { order, layout: layout });
  } catch (error) {
    logger.error('getOrderDetails:', error.toString());
    return res.status(500).send('Internal Server Error');
  }
};

//@route POST /admin/updateProductStatus
export const updateProductStatus = async (req, res) => {
  const { orderId, productId, size, status } = req.body;

  try {
    await Order.updateOne(
      { _id: orderId },
      { $set: { 'products.$[elem].productStatus': status } },
      {
        arrayFilters: [
          {
            'elem.productId': new mongoose.Types.ObjectId(productId),
            'elem.size': size,
          },
        ],
      }
    );

    const order = await Order.findById(orderId);

    const statuses = order.products.map((p) => p.productStatus);

    let newStatus = '';
    const uniqueStatuses = [...new Set(statuses)];

    if (uniqueStatuses.length === 1 && uniqueStatuses[0] === 'cancelled') {
      newStatus = 'cancelled';
    } else if (
      uniqueStatuses.length === 1 &&
      uniqueStatuses[0] === 'refunded'
    ) {
      newStatus = 'refunded';
    } else if (
      uniqueStatuses.every((s) => ['refunded', 'refund-requested'].includes(s))
    ) {
      newStatus = 'refund-requested';
    } else if (statuses.includes('refund-requested')) {
      newStatus = 'refund-requested';
    } else if (
      uniqueStatuses.every((s) => ['cancelled', 'delivered'].includes(s)) &&
      statuses.includes('delivered')
    ) {
      newStatus = 'delivered';
    } else if (statuses.includes('out for delivery')) {
      newStatus = 'out for delivery';
    } else if (statuses.includes('shipped')) {
      newStatus = 'shipped';
    } else if (statuses.includes('pending')) {
      newStatus = 'pending';
    } else if (statuses.includes('placed')) {
      newStatus = 'placed';
    }

    // Adjust total price if cancelled
    if (status === 'cancelled') {
      const cancelledProduct = order.products.find(
        (p) => p.productId.toString() === productId && p.size === size
      );

      if (cancelledProduct) {
        const price = cancelledProduct.priceAtPurchase;
        const quantity = cancelledProduct.quantity;
        order.totalPrice -= price * quantity;
        await order.save();
      }
    }

    // Update orderStatus if changed
    if (order.orderStatus !== newStatus && newStatus !== '') {
      order.orderStatus = newStatus;
      await order.save();
    }

    res.json({
      success: true,
      message: 'Product and order status updated',
      orderStatus: order.orderStatus,
    });
  } catch (err) {
    logger.error('Error updating product status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

//@route POST /orders/handle-request
export const handleReturnRequest = async (req, res) => {
  const { orderId, productId, size, action } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.json({ success: false, message: 'Order not found' });

    const product = order.products.find(
      (p) => p.productId.toString() === productId && p.size === size
    );
    if (!product)
      return res.json({ success: false, message: 'Product not found' });

    if (action === 'approve') {
      if (product.productStatus === 'returned') {
        return res.json({ success: false, message: 'Already Approved' });
      }
      product.productStatus = 'returned';
      product.returnRequest = null;
      product.refundRequest = true;
    } else if (action === 'reject') {
      product.returnRequest = null;
      product.productStatus = 'return-rejected';
    }

    const status = order.products.every(
      (product) => product.productStatus === 'returned'
    );
    status ? (order.orderStatus = 'returned') : '';

    await order.save();
    res.json({ success: true });
  } catch (err) {
    logger.error('handleReturnRequest:', err.toString());
    res.json({ success: false, message: 'Server error' });
  }
};

//@route POST /orders/refund-request
export async function handleRefundRequest(req, res) {
  try {
    const { orderId, productId, size, action } = req.body;

    if (!orderId || !productId || !size || !action) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    const productItem = order.products.find(
      (p) => p.productId.toString() === productId && p.size === size
    );

    if (!productItem) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found in order' });
    }

    if (action === 'approve') {
      if (!productItem.refundRequest) {
        return res
          .status(400)
          .json({ success: false, message: 'Already Approved or not found' });
      }
      productItem.refundRequest = false;
      productItem.productStatus = 'refunded';

      const refundAmount =
        (productItem.priceAtPurchase || 0) * (productItem.quantity || 1);

      // Reduce order totalPrice by refundAmount
      order.totalPrice = Math.max(0, order.totalPrice - refundAmount);

      // Wallet update
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = new Wallet({
          userId: order.userId,
          balance: 0,
          transactions: [],
        });
      }

      wallet.balance += refundAmount;
      wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        reason: 'order_return',
        orderId: order._id,
        timestamp: new Date(),
      });

      const status = order.products.every(
        (product) => product.productStatus === 'refunded'
      );
      status ? (order.orderStatus = 'refunded') : '';

      await wallet.save();
      await order.save();

      return res.json({
        success: true,
        message: 'Refund accepted, wallet credited, and order total updated',
      });
    } else if (action === 'reject') {
      // Mark refund request rejected
      productItem.refundRequest = false;
      productItem.productStatus = 'refund_rejected';
      await order.save();

      return res.json({ success: true, message: 'Refund request rejected' });
    } else {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    logger.error('Refund request error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
}
