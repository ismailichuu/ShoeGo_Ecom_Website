
import Product from "../../models/productSchema.js";
import { decodeUserId } from "../../util/jwt.js";
import Cart from "../../models/cartSchema.js";

//@route GET /
export const getHome = async (req, res) => {
    try {
        const userId = decodeUserId(req.cookies?.token);
        const cart = await Cart.findOne({userId});
        let cartCount = 0;
        if(cart){
            cartCount = cart.cartItems.length;
        }
        const products = await Product.find({ isActive: true })
            .limit(8)
            .populate('categoryId')
            .sort({ createdAt: -1 });
        res.render('user/home', { products, cartCount });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
