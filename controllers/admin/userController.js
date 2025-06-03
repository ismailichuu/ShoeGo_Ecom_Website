
import User from '../../models/userSchema.js';
import Address from '../../models/addressSchema.js';
import Order from '../../models/orderSchema.js';
import Wallet from '../../models/walletSchema.js';

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

    const joinedDate = new Date(customer.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

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

    const wallet = await Wallet.findOne({userId});
    let walletBalance = 0;
    if(wallet) {
        walletBalance = wallet.balance;
    }
    const balanceNote = monthlyOrders > 0 ? 'Growing this month' : 'No recent activity';

    res.render('admin/customerDetails', {
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
    console.error(error);
    res.status(500).send('Server error');
  }
};


//@router GET /orders
export const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;
        const layout = req.query.req ? 'layout' : false;

        let query = {};

        if (search) {
            // Search by user name or order ID (assuming orderId is string)
            const users = await User.find({
                name: { $regex: search, $options: 'i' }
            }).select('_id');

            const userIds = users.map(user => user._id);

            query = {
                $or: [
                    { userId: { $in: userIds } },
                    { orderId: { $regex: search, $options: 'i' } }
                ]
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

        res.render('admin/ordersTable', {
            orders,
            layout: layout,
            pagination: {
                page,
                limit,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages
            },
            search,
            from: req.query.from || null,
            req
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        res.status(500).render('admin/error', { message: 'Failed to load orders' });
    }
};