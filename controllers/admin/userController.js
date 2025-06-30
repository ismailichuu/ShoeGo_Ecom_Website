import User from '../../models/userSchema.js';
import Address from '../../models/addressSchema.js';
import Order from '../../models/orderSchema.js';
import Wallet from '../../models/walletSchema.js';
import { logger } from '../../util/logger.js';

//@route GET /customers
export const getCustomers = async (req, res) => {
  try {
    const layout = req.query.req ? 'layout' : false;
    const searchTerm = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 7;

    const searchFilter = searchTerm
      ? { name: { $regex: searchTerm, $options: 'i' } }
      : {};

    const totalDocs = await User.countDocuments(searchFilter);
    const customers = await User.find(searchFilter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalDocs / limit);
    if (req.xhr) {
      return res.render('partials/customerRows', { customers }, (err, html) => {
        if (err) return res.status(500).send('Render failed');
        res.send({ html, totalPages, currentPage: page });
      });
    }

    res.render('admin/customer', {
      layout,
      customers,
      currentPage: page,
      totalPages,
      search: searchTerm,
    });
  } catch (error) {
    logger.error('getCustomers', error.toString());
    res.status(500).send('Server error');
  }
};

//@route POST /blockUser
export const handleBlockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user)
      res.status(404).json({ success: false, message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ success: true, isBlocked: user.isBlocked });
  } catch (error) {
    logger.error('handleBlockUser:', error.toString());
  }
};

//@router GET /customerDetails
export const getCustomerDetails = async (req, res) => {
  try {
    const layout = req.query.req ? 'layout' : false;
    const userId = req.query.id;
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 5;

    const customer = await User.findById(userId);
    if (!customer) return res.status(404).send('Customer not found');

    const joinedDate = new Date(customer.createdAt).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    const address = await Address.findOne({ userId, isDefault: true });

    // Fetch all orders (latest first)
    const totalOrders = await Order.countDocuments({ userId });
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find({ userId })
      .populate('products.productId')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    // Optionally calculate amount spent or monthly orders
    const totalAmount = orders.reduce((sum, order) => {
      return sum + order.products.reduce((s, p) => s + p.totalPrice, 0);
    }, 0);

    const monthlyOrders = await Order.countDocuments({
      userId,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    const wallet = await Wallet.findOne({ userId });
    let walletBalance = 0;
    if (wallet) {
      walletBalance = wallet.balance;
    }
    const balanceNote =
      monthlyOrders > 0 ? 'Growing this month' : 'No recent activity';

    res.render('admin/customerDetails', {
      userId,
      customer,
      joinedDate,
      address,
      orders,
      totalOrders,
      totalAmount,
      monthlyOrders,
      balanceNote,
      layout,
      currentPage,
      totalPages,
      walletBalance,
    });
  } catch (error) {
    logger.error('getCustomerDetails:', error.toString());
    res.status(500).send('Server error');
  }
};
