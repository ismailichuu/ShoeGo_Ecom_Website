
import Coupon from "../../models/couponSchema.js";
import Order from "../../models/orderSchema.js";
import { logger } from "../../util/logger.js";

//@route POST /payment/apply-coupon
export const handleApplyCoupon = async (req, res) => {
  try {
    const { couponId, orderId } = req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (coupon.used >= coupon.limit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit exceeded' });
    }

    const now = new Date();
    if (now < new Date(coupon.activeFrom) || now > new Date(coupon.activeTo)) {
      return res.status(400).json({ success: false, message: 'Coupon is not active' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Coupon is currently inactive' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.totalPrice < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount ₹${coupon.minAmount} required for this coupon.`,
      });
    }

    const discount = coupon.discount;
    const totalAmount = order.totalPrice;

    order.products = order.products.map(product => {
      const itemTotal = product.priceAtPurchase * product.quantity;
      const share = itemTotal / totalAmount;
      const itemDiscount = Math.round(discount * share);

      const totalAfterDiscount = itemTotal - itemDiscount;
      const newPricePerItem = Math.round(totalAfterDiscount / product.quantity);

      return {
        ...product.toObject(),
        priceAtPurchase: newPricePerItem,
        couponApplied: true,
        couponId: coupon._id,
      };
    });

    order.couponApplied = true;
    order.couponId = coupon._id;
    order.discount = discount;
    order.grandTotal = totalAmount - discount;
    order.totalPrice -= discount;

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Coupon applied and prices adjusted successfully',
      discount,
      grandTotal: order.grandTotal,
    });

  } catch (error) {
    logger.error('Error in handleApplyCoupon:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


//@route PATCH /coupon/remove
export const handleRemoveCoupon = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.couponApplied || !order.couponId || !order.discount) {
      return res.status(400).json({ success: false, message: 'No coupon to remove' });
    }

    const coupon = await Coupon.findById(order.couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    const totalAfterDiscount = order.totalPrice;
    const discount = Number(order.discount);

    const adjustedTotal = totalAfterDiscount + discount;

    order.products = order.products.map(product => {
      const itemTotal = product.priceAtPurchase * product.quantity;
      const share = itemTotal / totalAfterDiscount;
      const itemRefund = Math.round(discount * share);

      const fullItemTotal = itemTotal + itemRefund;
      const originalPrice = Math.round(fullItemTotal / product.quantity);

      return {
        ...product.toObject(),
        priceAtPurchase: originalPrice,
        couponApplied: false,
        couponId: undefined,
      };
    });

    order.totalPrice = adjustedTotal;
    order.grandTotal = adjustedTotal;
    order.discount -= coupon.discount;
    order.couponApplied = false;
    order.couponId = undefined;

    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Coupon removed and order updated successfully',
      grandTotal: order.grandTotal
    });

  } catch (error) {
    logger.error('Error in handleRemoveCoupon:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
