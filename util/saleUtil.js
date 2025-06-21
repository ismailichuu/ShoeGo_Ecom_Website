import Order from '../models/orderSchema.js';

//sales data for pdf and excel
export const buildSalesData = async (startDate, endDate, filterType) => {
  const matchQuery = { orderStatus: 'delivered' };

  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else {
    const now = new Date();
    let from;
    if (filterType === 'day') from = new Date(now.setDate(now.getDate() - 1));
    else if (filterType === 'week')
      from = new Date(now.setDate(now.getDate() - 7));
    else if (filterType === 'month')
      from = new Date(now.setMonth(now.getMonth() - 1));
    if (from) matchQuery.createdAt = { $gte: from };
  }

  const orders = await Order.find(matchQuery)
    .populate('userId')
    .populate('products.productId')
    .populate('couponId');

  const salesData = orders.map((order) => {
    const totalAmount = order.totalPrice;
    const discount = order?.discount || 0;
    const coupon = order.couponId?.discount || 0;
    const customer = order.userId?.name || 'N/A';
    const statuses = order.products.map((p) => p.productStatus).join(', ');

    return {
      orderId: order.orderId,
      date: order.createdAt.toISOString().split('T')[0],
      customer,
      status: statuses,
      totalAmount,
      discount,
      coupon,
    };
  });

  return salesData;
};
