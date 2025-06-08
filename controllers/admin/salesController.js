import Order from "../../models/orderSchema";

export const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, filterType } = req.query;

        let matchQuery = { 'orderStatus': 'delivered' };

        // Date filtering logic
        if (startDate && endDate) {
            matchQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else {
            // Handle 1 day/week/month options
            const now = new Date();
            let from;
            if (filterType === 'day') from = new Date(now.setDate(now.getDate() - 1));
            else if (filterType === 'week') from = new Date(now.setDate(now.getDate() - 7));
            else if (filterType === 'month') from = new Date(now.setMonth(now.getMonth() - 1));
            if (from) matchQuery.createdAt = { $gte: from };
        }

        const orders = await Order.find(matchQuery);

        // Aggregating totals
        let totalSales = 0;
        let totalDiscount = 0;
        let couponDeduction = 0;
        let totalOrders = orders.length;

        for (let order of orders) {
            totalSales += order.totalAmount;
            totalDiscount += order.totalDiscount || 0;
            couponDeduction += order.couponDiscount || 0;
        }

        res.render('admin/salesReport', {
            orders,
            totalOrders,
            totalSales,
            totalDiscount,
            couponDeduction,
            startDate,
            endDate,
            filterType
        });
    } catch (err) {
        console.error('Sales Report Error:', err);
        res.status(500).send('Failed to generate report.');
    }
};
