import Order from "../../models/orderSchema.js";
import PDFDocument from 'pdfkit';
import { buildSalesData } from "../../util/saleUtil.js";
import ExcelJS from 'exceljs';

//@route GET /sales-report
export const getSalesReport = async (req, res) => {
  try {
    const layout = req.query.req ? 'layout' : false;
    const { startDate, endDate, filterType, page = 1 } = req.query;
    const pageSize = 10;
    const currentPage = parseInt(page);

    let matchQuery = { orderStatus: "delivered" };

    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      const now = new Date();
      let from;
      if (filterType === "day") from = new Date(now.setDate(now.getDate() - 1));
      else if (filterType === "week") from = new Date(now.setDate(now.getDate() - 7));
      else if (filterType === "month") from = new Date(now.setMonth(now.getMonth() - 1));

      if (from) matchQuery.createdAt = { $gte: from };
    }

    const totalOrders = await Order.countDocuments(matchQuery);

    const orders = await Order.find(matchQuery)
      .sort({ createdAt: -1 })
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize)
      .populate('userId')
      .populate('couponId')

    const allOrders = await Order.find(matchQuery).populate('couponId');
    let totalSales = 0;
    let totalDiscount = 0;
    let couponDeduction = 0;

    for (const order of allOrders) {
      totalSales += order.totalPrice || 0;
      totalDiscount += order.discount || 0;
      couponDeduction += order.couponId?.discount || 0;
    }

    const totalPages = Math.ceil(totalOrders / pageSize);

    res.render("admin/salesReport", {
      orders,
      totalOrders,
      totalSales,
      totalDiscount,
      couponDeduction,
      startDate,
      endDate,
      filterType,
      currentPage,
      totalPages,
      layout: layout,
    });
  } catch (err) {
    console.error("Sales Report Error:", err);
    res.status(500).send("Failed to generate report.");
  }
};

//@route GET /sales-report/download/pdf
export const generateSalesPDF = async (req, res) => {
  try {
    const { startDate, endDate, filterType } = req.query;
    const salesData = await buildSalesData(startDate, endDate, filterType);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

    doc.pipe(res);
    doc.fontSize(20).text('Sales Report', { align: 'center' }).moveDown();
    doc.fontSize(12);

    salesData.forEach(order => {
      doc.text(`Order ID: ${order.orderId}`);
      doc.text(`Date: ${order.date}`);
      doc.text(`Customer: ${order.customer}`);
      doc.text(`Status: ${order.status}`);
      doc.text(`Amount: ₹${order.totalAmount}`);
      doc.text(`Discount: ₹${order.discount}`);
      doc.text(`Coupon: ₹${order.coupon}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('PDF generation failed:', error);
    res.status(500).send('PDF generation failed');
  }
};

//@route GET /sales-report/download/excel
export const generateSalesExcel = async (req, res) => {
  try {
    const { startDate, endDate, filterType } = req.query;
    const salesData = await buildSalesData(startDate, endDate, filterType);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');

    sheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Discount', key: 'discount', width: 15 },
      { header: 'Coupon', key: 'coupon', width: 15 },
    ];

    salesData.forEach(order => sheet.addRow(order));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel generation failed:', error);
    res.status(500).send('Excel generation failed');
  }
};
