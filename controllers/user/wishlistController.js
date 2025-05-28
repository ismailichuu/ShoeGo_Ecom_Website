import Product from "../../models/productSchema.js";
import { decodeUserId } from "../../util/jwt.js";
import Cart from "../../models/cartSchema.js";
import Wishlist from "../../models/wishlistSchema.js";

//@route GET /wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = decodeUserId(req.cookies?.token);
        const wishlist = await Wishlist.findOne({ userId }).populate('items.productId');
        const firstProduct = wishlist?.items?.[0]?.productId;
        const categoryId = firstProduct?.categoryId;
        let related = [];

        if (categoryId && firstProduct?._id) {
            related = await Product.find({
                categoryId,
                isActive: true,
                _id: { $ne: firstProduct._id }
            }).limit(4).populate('categoryId');
        }
        res.render('user/wishlist', { wishlist: wishlist || { wishlist: [] }, related });
    } catch (error) {
        console.log('getting wishlist:' + error);
    }
};

//@route POST /add-to-wishlist
export const handleAddToWishlist = async (req, res) => {
    try {
        const { productId, selectedSize } = req.body;
        const token = req.cookies?.token;

        if (!token) {
            req.session.err = 'Session expired. Please login again.';
            return res.redirect('/login');
        }


        const userId = decodeUserId(token);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const cart = await Cart.findOne({
            userId,
            cartItems: {
                $elemMatch: {
                    productId,
                    size: selectedSize
                }
            }
        });

        if (cart) {
            return res.status(400).json({
                success: false,
                message: 'Product already in cart with the selected size'
            });
        }

        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({ success: false, message: 'Product not found or inactive' });
        }

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            // Create new wishlist with item
            wishlist = new Wishlist({
                userId,
                items: [{ productId, size: selectedSize }]
            });
        } else {
            // Check if product with same size already exists
            const exists = wishlist.items.some(
                (item) =>
                    item.productId.toString() === productId &&
                    item.size === selectedSize
            );

            if (exists) {
                return res.status(200).json({
                    success: false,
                    message: 'Item with selected size already exists in wishlist'
                });
            }

            // Push new item
            wishlist.items.push({ productId, size: selectedSize });
        }

        await wishlist.save();
        return res.status(200).json({ success: true, message: 'Added to wishlist' });

    } catch (err) {
        console.error('Add to wishlist error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//@route POST /delete-from-wishlist
export const deleteFromWishlist = async (req, res) => {
    try {
        const { productId, selectedSize } = req.body;
        const userId = decodeUserId(req.cookies?.token);
        await Wishlist.updateOne(
            { userId },
            { $pull: { items: { productId, size: selectedSize } } }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
    }
};