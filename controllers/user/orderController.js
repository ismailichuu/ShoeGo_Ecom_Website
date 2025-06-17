import Product from '../../models/productSchema.js';
import { decodeUserId } from '../../util/jwt.js';
import Cart from '../../models/cartSchema.js';
import Order from '../../models/orderSchema.js';
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import { logger } from '../../util/logger.js';
import Wallet from '../../models/walletSchema.js';
import Coupon from '../../models/couponSchema.js';

//@route POST /place-order
export const handlePlaceOrder = async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  try {
    const userId = decodeUserId(req.cookies?.token);
    const orderDate = new Date();
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(orderDate.getDate() + 7);

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.cartItems.length < 1) {
      return res.status(404).json({ success: false, message: 'Cart is empty' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'placed') {
      return res
        .status(400)
        .json({ success: false, message: 'Order has already been placed.' });
    }

    if (order.totalPrice > 1000 && paymentMethod === 'cod') {
      return res.status(400).json({
        success: false,
        message:
          'Orders above ₹1000 are not eligible for Cash on Delivery. Please choose another payment method.',
      });
    }

    if (order.couponApplied && order.couponId) {
      await Coupon.updateOne(
        { _id: order.couponId },
        {
          $push: { usedUsers: userId },
          $inc: { used: 1 },
        }
      );
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

    order.orderStatus = 'placed';
    order.paymentStatus = 'completed';
    order.paymentMethod = paymentMethod;
    order.orderDate = orderDate;
    order.deliveryDate = deliveryDate;

    order.products = order.products.map((item) => ({
      ...(item.toObject?.() || item),
      productStatus: 'placed',
    }));

    await order.save();
    await Cart.deleteOne({ userId });

    res.status(200).json({ success: true, deliveryDate });
  } catch (error) {
    logger.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//@route GET /orders
export const getOrders = async (req, res) => {
  try {
    const userId = decodeUserId(req.cookies?.token);
    const orders = await Order.find({ userId }).sort({ orderDate: -1 });
    res.render('user/orders', {
      layout: 'profile-layout',
      orders,
      user: userId,
    });
  } catch (err) {
    logger.error('Failed to load orders:', err);
    res.status(500).send('Something went wrong. Please try again later.');
  }
};

//@route GET /order-details/:id
export const getOrderDetails = async (req, res) => {
  try {
    const msg = req.session.err || null;
    const orderId = req.params.id;
    req.session.err = null;

    const order = await Order.findById(orderId)
      .populate('userId')
      .populate('products.productId')
      .populate('couponId');

    if (!order) {
      return res.status(404).send('Order not found');
    }

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

    if (order.orderStatus !== newStatus && newStatus !== '') {
      order.orderStatus = newStatus;
      await order.save();
    }

    res.render('user/orderDetails', { order, layout: 'profile-layout', msg });
  } catch (error) {
    logger.error('from orderDetails', error.toString());
    res.status(500).send('Internal Server Error');
  }
};

//@route POST /orders/cancel-product
export const handleCancelProduct = async (req, res) => {
  const { orderId, productId, cancelReason, size } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Find the product in the order
    const product = order.products.find(
      (p) => p.productId.toString() === productId && p.size === size
    );
    const quantity = product.quantity;

    if (!product) {
      return res
        .status(404)
        .send('Product with specified size not found in order');
    }

    // Check if already canceled
    if (product.productStatus === 'cancelled' && product.size === size) {
      return res.status(400).send('Product already cancelled');
    }

    if (
      order.paymentMethod === 'razorpay' ||
      order.paymentMethod === 'wallet'
    ) {
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = new Wallet({
          userId: order.userId,
          balance: 0,
          transactions: [],
        });
      }

      wallet.balance += product.priceAtPurchase;
      wallet.transactions.push({
        type: 'credit',
        amount: product.priceAtPurchase,
        reason: 'order_return',
        orderId: order._id,
      });

      await wallet.save();
    }

    // Update product status and reason
    product.productStatus = 'cancelled';
    product.cancelReason = cancelReason;

    const price = product.priceAtPurchase;
    order.totalPrice -= price * quantity;

    // Save updated order
    await order.save();

    // Increment product stock for the specific size
    await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });

    res.redirect(`/order-details/${orderId}`);
  } catch (error) {
    logger.error('from cancelProcuct', error.toString());
    res.status(500).send('Something went wrong');
  }
};

//@route GET /download-invoice/:orderId
export const downloadInvoice = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate('products.productId')
      .populate('userId');

    if (!order || order.orderStatus !== 'delivered') {
      return res
        .status(400)
        .send('Invoice only available for delivered orders');
    }

    const deliveredProducts = order.products.filter(
      (p) => p.productStatus === 'delivered'
    );
    if (!deliveredProducts.length) {
      req.session.err = 'No delivered products found';
      return res.redirect(`/order-details/${orderId}`);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=invoice-${order._id}.pdf`
      );
      res.send(pdfData);
    });

    // --- HEADER (left)
    doc.fontSize(26).font('Helvetica-Bold').text('SHOEGO', 50, 50);
    doc.fontSize(12).font('Helvetica').text('Shoego Pvt. Ltd.', 50, 80);
    doc.text('New Delhi, India', 50, 95);

    // Ensure right side starts at a separate vertical position
    const rightStartY = 50;

    // --- INVOICE INFO (right)
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, rightStartY);

    let headerY = rightStartY + 25;
    doc.fontSize(12).font('Helvetica');
    const shortInvoiceId = order._id.toString().slice(0, 8);
    doc.text(`Invoice #: ${shortInvoiceId}`, 400, headerY);
    headerY += 18;

    const formattedDate = new Date(order.createdAt).toLocaleDateString();
    doc.text(`Date: ${formattedDate}`, 400, headerY);
    headerY += 18;

    doc.text(`Customer: ${order.userId.name}`, 400, headerY);

    // --- PRODUCT TABLE HEADERS
    doc.fontSize(14).font('Helvetica-Bold').text('Products', 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold');
    headerY = doc.y;
    doc.text('Name', 50, headerY);
    doc.text('Qty', 250, headerY);
    doc.text('Size', 300, headerY);
    doc.text('Price', 370, headerY, { width: 80, align: 'right' });
    doc.text('Total', 460, headerY, { width: 80, align: 'right' });

    doc.moveDown(0.5);

    // --- TABLE ROWS
    doc.font('Helvetica');
    let totalAmount = 0;
    deliveredProducts.forEach((item) => {
      const total = item.quantity * item.priceAtPurchase;
      totalAmount += total;

      const y = doc.y;
      doc.text(item.productId.name, 50, y);
      doc.text(item.quantity.toString(), 250, y);
      doc.text(item.size.toString(), 300, y);
      doc.text(`₹${item.priceAtPurchase.toFixed(2)}`, 370, y, {
        width: 80,
        align: 'right',
      });
      doc.text(`₹${total.toFixed(2)}`, 460, y, { width: 80, align: 'right' });

      doc.moveDown(0.5);
    });

    // --- TOTALS
    const tax = totalAmount * 0.05;
    const grandTotal = totalAmount + tax;

    doc.moveDown();
    doc.font('Helvetica-Bold');
    doc.text(`Subtotal: ₹${totalAmount.toFixed(2)}`, 400, doc.y, {
      align: 'right',
    });
    doc.text(`Tax (5%): ₹${tax.toFixed(2)}`, 400, doc.y, { align: 'right' });
    doc.text(`Grand Total: ₹${grandTotal.toFixed(2)}`, 400, doc.y, {
      align: 'right',
    });

    // --- FOOTER
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(10);
    doc.text('Payment Terms: 30 Days', 50, doc.y);
    doc.moveDown(0.2);
    doc.text('Notes: Thank you for shopping with Shoego!', 50, doc.y);
    doc.moveDown(0.2);
    doc.text('Address: Shoego Pvt. Ltd., New Delhi, India', 50, doc.y);

    doc.end();
  } catch (error) {
    logger.error('from invoice', error.toString());
    res.status(500).send('Failed to generate invoice');
  }
};

//@route POST /order/return-product
export const returnProduct = async (req, res) => {
  const { orderId, productId, returnReason, size } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).send('Order not found');

    const product = order.products.find(
      (p) =>
        p.productId.toString() === productId &&
        p.productStatus === 'delivered' &&
        p.size === size
    );

    if (!product) {
      return res
        .status(400)
        .send('Product not found or not eligible for return');
    }

    // Update product status and add return reason
    product.productStatus = 'return-requested';
    product.returnRequest = 'pending';
    product.returnReason = returnReason;

    await order.save();

    res.redirect(`/order-details/${orderId}`);
  } catch (error) {
    logger.error('from return product', error.toString());
    res.status(500).send('Failed to process return request');
  }
};

//@route POST /return-all
export const handleReturnAll = async (req, res) => {
  try {
    const { orderId, returnReason } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.redirect(`/order-details/${orderId}`);

    for (let product of order.products) {
      if (product.productStatus === 'delivered') {
        product.productStatus = 'return-requested';
        product.returnRequest = 'pending';
        product.returnReason = returnReason;
      }
    }
    await order.save();
    res.redirect(`/order-details/${orderId}`);
  } catch (error) {
    logger.error('from return All', error.toString());
  }
};

//@route POST /orders/cancel-all
export const handleCancelAll = async (req, res) => {
  try {
    const { orderId, cancelReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.redirect(`/order-details/${orderId}`);

    for (let product of order.products) {
      product.productStatus = 'cancelled';
      product.cancelReason = cancelReason;

      await Product.updateOne(
        { _id: product.productId },
        { $inc: { stock: product.quantity } }
      );
    }

    if (
      order.paymentMethod === 'razorpay' ||
      order.paymentMethod === 'wallet'
    ) {
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = new Wallet({
          userId: order.userId,
          balance: 0,
          transactions: [],
        });
      }

      wallet.balance += order.totalPrice;
      wallet.transactions.push({
        type: 'credit',
        amount: order.totalPrice,
        reason: 'order_return',
        orderId: order._id,
      });

      await wallet.save();
    }

    order.totalPrice = 0;
    await order.save();

    res.redirect(`/order-details/${orderId}`);
  } catch (error) {
    logger.error('from handleCancelAll', error.toString());
    res.redirect(`/order-details/${req.body.orderId}`);
  }
};
