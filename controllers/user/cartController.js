
import Product from "../../models/productSchema.js";
import { decodeUserId } from "../../util/jwt.js";
import Cart from "../../models/cartSchema.js";
import { calculateCart } from "../../util/priceCalc.js";
import Wishlist from "../../models/wishlistSchema.js";
import mongoose from "mongoose";

//@route GET /cart
export const getCart = async (req, res) => {
    try {
        const token = req.cookies?.token;
        const userId = decodeUserId(token);

        if (!userId) {
            req.session.err = 'Please login to view your cart.';
            return res.redirect('/login');
        }


        // Find cart and populate product details
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');

        if (cart) {
            const activeItems = cart.cartItems.filter(item => item.productId && item.productId.isActive && item.productId?.stock > 0);

            if (activeItems.length !== cart.cartItems.length) {
                await Cart.updateOne(
                    { userId },
                    { $set: { cartItems: activeItems } }
                );
                cart.cartItems = activeItems;
            }
        }

        const firstProduct = cart?.cartItems?.[0]?.productId;
        const categoryId = firstProduct?.categoryId;
        let related = [];

        if (categoryId && firstProduct?._id) {
            related = await Product.find({
                categoryId,
                isActive: true,
                _id: { $ne: firstProduct._id }
            }).limit(4).populate('categoryId');
        }

        const items = cart?.cartItems || [];
        const {
            cartItems,
            grandTotal,
            deliveryCharge,
            total,
            totalWithoutTax,
            totalTax,
            totalDiscount
        } = calculateCart(items);

        res.render('user/cart', {
            cart: cart || { cartItems },
            related,
            cartItems,
            grandTotal,
            deliveryCharge,
            total,
            totalTax,
            totalWithoutTax,
            totalDiscount,
            layout: 'checkOutLayout',
            couponApplied: false
        });

    } catch (error) {
        console.log('Get Cart Error:', error);
        res.status(500).send('Failed to load cart.');
    }
};


//@route POST /add-to-cart
export const handleAddToCart = async (req, res) => {
    try {
        const { productId, selectedSize } = req.body;
        const token = req.cookies?.token;

        if (!token) {
            req.session.err = 'Session out';
            return res.redirect('/login');
        }

        const userId = decodeUserId(token);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (!product.isActive) {
            return res.status(404).json({ success: false, message: 'Product is Blocked' });
        }

        if (product.stock <= 0) {
            return res.status(400).json({ success: false, message: 'Out of stock' });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Create new cart
            cart = new Cart({
                userId,
                cartItems: [{ productId, size: selectedSize, quantity: 1 }]
            });

        } else {
            const existingItem = cart.cartItems.find(
                item => item.productId.toString() === productId && item.size === selectedSize
            );

            if (existingItem) {
                if (existingItem.quantity >= 5) {
                    return res.status(400).json({
                        success: false,
                        message: 'Maximum quantity reached for this item'
                    });
                }

                if (product.stock < 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'Not enough stock available'
                    });
                }

                existingItem.quantity += 1;
            } else {
                cart.cartItems.push({ productId, size: selectedSize, quantity: 1 });
            }
        }
        await Wishlist.updateOne(
            { userId },
            { $pull: { items: { productId } } }
        );

        await product.save();
        await cart.save();

        res.status(200).json({ success: true, updatedStock: product.stock });

    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//@route PATCH /cart/increase
export const handleIncreaseCount = async (req, res) => {
    try {
        const { productId, size } = req.body;
        const userId = decodeUserId(req.cookies?.token);

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = cart.cartItems.find(
            (item) =>
                item.productId.toString() === productId &&
                item.size === size
        );

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const totalProductQuantityInCart = cart.cartItems.reduce((total, cartItem) => {
            return cartItem.productId.toString() === productId
                ? total + cartItem.quantity
                : total;
        }, 0);

        if (totalProductQuantityInCart >= product.stock) {
            return res.status(400).json({ success: false, message: 'Maximum quantity reached' });
        }

        if (item.quantity >= 5) {
            return res.status(400).json({ success: false, message: 'Maximum quantity reached (5)' });
        }

        item.quantity += 1;
        await cart.save();

        return res.status(200).json({ success: true, quantity: item.quantity });

    } catch (error) {
        console.error('Increase count error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//@route GET /cart/order-summary

export const getOrderSummary = async (req, res) => {
    try {
        const token = req.cookies?.token;
        const userId = decodeUserId(token);

        if (!userId) {
            return res.status(401).send('Unauthorized');
        }

        const cart = await Cart.findOne({ userId }).populate('cartItems.productId');

        const items = cart?.cartItems || [];
        const { cartItems, grandTotal, deliveryCharge, total, totalWithoutTax, totalTax, totalDiscount } = calculateCart(items);

        // Render the partial view and return only the HTML of the summary
        res.render('partials/orderSummary', {
            cart: cart || { cartItems },
            grandTotal,
            deliveryCharge,
            total,
            totalTax,
            totalWithoutTax,
            totalDiscount,
            layout: false,
            couponApplied: false,
        }, (err, html) => {
            if (err) {
                console.error('Render error:', err);
                return res.status(500).send('Error rendering order summary');
            }
            res.send(html);
        });
    } catch (err) {
        console.error('Order Summary Error:', err);
        res.status(500).send('Internal Server Error');
    }
};



//@route PATCH /cart/dicrease
export const handleDecreaseCount = async (req, res) => {
    try {
        const { productId, size } = req.body;
        const userId = decodeUserId(req.cookies?.token);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const objectId = new mongoose.Types.ObjectId(productId);

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.cartItems.findIndex(
            (item) => item.productId.equals(objectId) && item.size === size
        );

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        if (cart.cartItems[itemIndex].quantity > 1) {
            cart.cartItems[itemIndex].quantity -= 1;
        } else {
            cart.cartItems.splice(itemIndex, 1);
        }

        await cart.save();

        const updatedQuantity = itemIndex === -1 ? 0 : cart.cartItems[itemIndex]?.quantity || 0;
        return res.json({ success: true, quantity: updatedQuantity });
    } catch (error) {
        console.error('Decrease quantity error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//@route DELETE /cart/delete-item
export const deleteCartItem = async (req, res) => {
    const userId = decodeUserId(req.cookies?.token);
    const { productId, size } = req.query;

    try {
        await Cart.updateOne(
            { userId },
            { $pull: { cartItems: { productId, size } } }
        );
        res.status(200).json({ message: 'Item deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

//@route DELETE /cart/clear
export const deleteCart = async (req, res) => {
    try {
        const userId = decodeUserId(req.cookies?.token);
        await Cart.deleteOne({ userId });
        res.status(200).json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};