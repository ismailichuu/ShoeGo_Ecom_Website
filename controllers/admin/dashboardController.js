import Order from "../../models/orderSchema.js";
import getDateRange from "../../util/getRangeDashboard.js";
import User from '../../models/userSchema.js';

//@route GET /dashboard
export const getDashboard = async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const date = new Date();
    const newDate = date.setDate(date.getDate() - 7);
    const newOrders = await Order.countDocuments({ createdAt: { $gte: newDate } });
    const newCustomers = await User.countDocuments({ createdAt: { $gte: newDate } });
    const totalReturned = await Order.countDocuments({ 'products.productStatus': 'refunded' });

    res.render('admin/dashboard', {
      layout: 'layout',
      summary: {
        totalSales: totalSales[0]?.total || 0,
        newOrders,
        newCustomers,
        totalReturned
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
};

//@route GET /dashboard/top-categories
export const getTopCategories = async (req, res) => {
  const { filter, startDate, endDate } = req.query;
  const { start, end } = getDateRange(filter, startDate, endDate);
  try {
    const result = await Order.aggregate([
      { $match: { orderDate: { $gte: start, $lte: end } } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.categoryId",
          totalSold: { $sum: "$products.quantity" }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $project: {
          name: "$category.name",
          totalSold: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching top categories' });
  }
};

//@route GET /dashboard/top-products
export const getTopProducts = async (req, res) => {
  const { filter, startDate, endDate } = req.query;
  const { start, end } = getDateRange(filter, startDate, endDate);

  try {
    const result = await Order.aggregate([
      { $match: { orderDate: { $gte: start, $lte: end } } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: "$products.quantity" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          totalSold: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching top products' });
  }
};

//@route GET /dashboard/top-brands
export const getTopBrands = async (req, res) => {
  const { filter, startDate, endDate } = req.query;
  const { start, end } = getDateRange(filter, startDate, endDate);

  try {
    const result = await Order.aggregate([
      { $match: { orderDate: { $gte: start, $lte: end } } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.brand",
          totalSold: { $sum: "$products.quantity" }
        }
      },
      {
        $project: {
          brand: "$_id",
          totalSold: 1,
          _id: 0
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching top brands' });
  }
};

//@route GET /dashboard/top-selling-products
export const getTopSellingProducts = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate);

    const matchStage = {};
    if (start && end) {
      matchStage.orderDate = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          unitsSold: { $sum: "$products.quantity" },
          revenue: {
            $sum: { $multiply: ["$products.quantity", "$products.priceAtPurchase"] }
          }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      {
        $project: {
          name: "$productDetails.name",
          brand: "$productDetails.brand",
          category: {
            $map: {
              input: "$categoryDetails",
              as: "cat",
              in: "$$cat.name"
            }
          },
          unitsSold: 1,
          revenue: 1
        }
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 }
    ]);
    res.json(topProducts);
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
