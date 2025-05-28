
import { decodeUserId } from "../../util/jwt.js";
import Cart from "../../models/cartSchema.js";
import { calculateCart } from "../../util/priceCalc.js";
import Order from "../../models/orderSchema.js";

//@route GET /payment/:id
export const getPayment = async (req, res) => {
    try {
        const userId = decodeUserId(req.cookies?.token);
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');
        if (!cart) res.redirect('/cart');
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) {
            res.redirect('/cart');
        }
        const orderDate = new Date();
        const deliveryDate = new Date();
        deliveryDate.setDate(orderDate.getDate() + 7);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', options);
        const { cartItems, grandTotal, deliveryCharge, total, totalWithoutTax, totalTax } = calculateCart(cart.cartItems);
        res.render('user/payment', {
            layout: 'checkOutLayout', cart, deliveryDate: formattedDeliveryDate,
            grandTotal, deliveryCharge, total, totalWithoutTax, totalTax, orderId
        });
    } catch (error) {
        console.error("Order creation failed:", error);
        res.status(500).send("Server error");
    }
};