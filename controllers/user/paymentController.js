
import { decodeUserId } from "../../util/jwt.js";
import Cart from "../../models/cartSchema.js";
import { calculateCart } from "../../util/priceCalc.js";
import Order from "../../models/orderSchema.js";
import razorpayInstance from "../../util/razorpayInstance.js";
import process from 'process';
import Product from "../../models/productSchema.js";
import Transaction from "../../models/transactionSchema.js";
import crypto from 'crypto';
import Coupon from "../../models/couponSchema.js";
import Wallet from "../../models/walletSchema.js";
import { logger } from "../../util/logger.js";

//@route GET /payment/:id
export const getPayment = async (req, res) => {
    try {
        let couponApplied = false;
        const userId = decodeUserId(req.cookies?.token);
        const wallet = await Wallet.findOne({ userId });
        const walletBalance = wallet?.balance || 0;
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        if (!cart || cart.cartItems.length < 1) {
            return res.redirect('/cart');
        }
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('couponId');
        if (!order) {
            return res.redirect('/cart');
        }

        const coupons = await Coupon.find({
            $or: [
                { referrerId: userId },
                { referrerId: null }
            ],
            activeFrom: { $lte: new Date() },
            activeTo: { $gte: new Date() },
            limit: { $gt: 0 }
        });

        const orderDate = new Date();
        const deliveryDate = new Date();
        deliveryDate.setDate(orderDate.getDate() + 7);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', options);
        let { grandTotal, deliveryCharge, total, totalWithoutTax, totalTax, totalDiscount } = calculateCart(cart.cartItems);
        if (order.couponApplied) {
            couponApplied = true;
            total -= order.couponId.discount;
        }
        res.render('user/payment', {
            layout: 'checkOutLayout', cart, deliveryDate: formattedDeliveryDate, order, totalDiscount,
            grandTotal, deliveryCharge, total, totalWithoutTax, totalTax, orderId, coupons, couponApplied,
            walletBalance,
        });
    } catch (error) {
        console.error("Order creation failed:", error);
        res.status(500).send("Server error");
    }
};

//@route POST /place-razorpay
export const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId).populate('userId');

        const options = {
            amount: order.totalPrice * 100,
            currency: "INR",
            receipt: `order_rcptid_${order.orderId}`,
        };

        const razorpayId = process.env.RAZORPAY_KEY_ID;

        const razorpayOrder = await razorpayInstance.orders.create(options);
        await Order.updateOne({ _id: orderId }, { paymentMethod: 'razorpay', paymentStatus: 'failed' });
        res.json({ success: true, razorpayOrder, razorpayId, order });
    } catch (err) {
        console.error("Razorpay order creation error:", err);
        res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
    }
};

export const verifyPayment = async (req, res) => {
    try {

        const {
            originalOrderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const userId = decodeUserId(req.cookies?.token);

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            const orderDate = new Date();
            const deliveryDate = new Date(orderDate);
            deliveryDate.setDate(orderDate.getDate() + 7);

            const cart = await Cart.findOne({ userId });
            if (!cart || cart.cartItems.length < 1) {
                return res.status(404).json({ success: false, message: 'Cart is empty' });
            }

            const order = await Order.findById(originalOrderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            for (const item of order.products) {
                const product = await Product.findById(item.productId);
                if (!product) {
                    return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
                }

                if (product.stock < item.quantity) {
                    return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
                }

                product.stock -= item.quantity;
                await product.save();
            }

            if (order.couponApplied) {
                const couponId = order.couponId;
                await Coupon.updateOne(
                    { _id: couponId },
                    {
                        $push: { usedUsers: userId },
                        $inc: { used: 1 }
                    }
                );

            }


            order.orderStatus = 'placed';
            order.paymentStatus = 'completed';
            order.orderDate = orderDate;
            order.deliveryDate = deliveryDate;

            order.products = order.products.map((item) => ({
                ...item.toObject?.() || item,
                productStatus: 'placed',
            }));

            await order.save();

            await Cart.deleteOne({ userId });

            await Transaction.create({
                userId,
                type: 'order',
                orderId: originalOrderId,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'success',
                amount: order.totalPrice,
                paymentMethod: 'razorpay'
            });


            res.status(200).json({ success: true, deliveryDate });
        } else {

            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error("razorpay payment error:", error);
        res.status(500).json({ success: false, message: "payment failed" });
    }
};

//@route GET /retry-payment
export const handleRetryPayment = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = decodeUserId(req.cookies?.token);

        const order = await Order.findById(orderId).populate('products.productId');
        if (!order || order.userId.toString() !== userId.toString()) {
            req.session.err = 'Invalid order or unauthorized access.';
            return res.redirect('/orders');
        }

        await Cart.findOneAndUpdate(
            { userId },
            { $set: { cartItems: [] } }
        );

        const newCartItems = order.products.map(product => ({
            productId: product.productId._id,
            quantity: product.quantity,
            size: product.size,
        }));

        await Cart.findOneAndUpdate(
            { userId },
            { $push: { cartItems: { $each: newCartItems } } },
            { upsert: true, new: true }
        );

        res.status(200).json({success: true});

    } catch (error) {
        logger.error('Retry payment:', error.toString());
    }
};  