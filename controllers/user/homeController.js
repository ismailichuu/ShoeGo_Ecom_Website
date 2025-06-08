
import Product from "../../models/productSchema.js";
import { decodeUserId } from "../../util/jwt.js";
import Cart from "../../models/cartSchema.js";

//@route GET /
export const getHome = async (req, res) => {
    try {
        const userId = decodeUserId(req.cookies?.token);
        const cart = await Cart.findOne({ userId });
        let cartCount = 0;
        if (cart) {
            cartCount = cart.cartItems.length;
        }

        const products = await Product.find({ isActive: true })
            .limit(8)
            .populate('categoryId')
            .sort({ createdAt: -1 });

        const updatedProducts = products.map(product => {
            const basePrice = product.basePrice;
            const prodDiscountPrice = product.discountPrice;

            let categoryDiscount = 0;
            if (product.categoryId?.[0]?.discount) {
                categoryDiscount = parseFloat(product.categoryId[0].discount.replace('%', '')) || 0;
            }

            const categoryDiscountPrice = Math.round(basePrice - (basePrice * categoryDiscount / 100));

            let finalPrice, discountLabel;

            if (prodDiscountPrice && prodDiscountPrice < categoryDiscountPrice) {
                finalPrice = prodDiscountPrice;
                const discountValue = basePrice - prodDiscountPrice;
                discountLabel = `₹${discountValue} off`;
            } else if (categoryDiscount > 0) {
                finalPrice = categoryDiscountPrice;
                discountLabel = product.categoryId?.[0]?.discount;
            } else {
                finalPrice = basePrice;
                discountLabel = 'No discount';
            }

            return {
                ...product._doc,
                finalPrice,
                discountLabel
            };
        });

        res.render('user/home', { products: updatedProducts, cartCount });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

