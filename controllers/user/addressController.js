
import { decodeUserId } from "../../util/jwt.js";
import Address from "../../models/addressSchema.js";
import Cart from "../../models/cartSchema.js";
import { calculateCart } from "../../util/priceCalc.js";
import Order from "../../models/orderSchema.js";
import { logger } from "../../util/logger.js";

//@route GET /addresses
export const getAddresses = async (req, res) => {
    try {     
        const userId = decodeUserId(req.cookies?.token);
        const addresses = await Address.find({ userId });
        res.render('user/addresses', { layout: 'profile-layout', addresses });
    } catch (error) {
        console.log('Address', error);
    }
}

//@route GET /add-address
export const getAddAddress = (req, res) => {
    try {
        const msg = req.session.err || null;
        res.render('user/addAddress', { layout: 'profile-layout', msg });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
}

//@route POST /add-address
export const handleAddAddress = async (req, res) => {
    try {
        const {
            phone,
            pincode,
            locality,
            houseNo,
            city,
            state,
            landmark,
            alternatePhone,
            type,
            isDefault,
            name
        } = req.body;
        if (!phone || !pincode || !locality || !houseNo || !city || !state || !type) {
            req.session.err = 'Please fill all required fields.';
            return res.redirect('/add-address');
        }
        const token = req.cookies?.token;
        const userId = decodeUserId(token);
        if (isDefault) {
            await Address.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );
        }

        const newAddress = new Address({
            userId,
            name,
            mobileNumber: phone,
            pincode,
            locality,
            houseNo,
            city,
            state,
            landmark,
            alternatePhone,
            addressType: type,
            isDefault: isDefault || false
        });

        await newAddress.save();

        res.redirect('/addresses');
    } catch (error) {
        console.error('Error adding address:', error);
        req.session.err = error.toString();
        res.redirect('/add-address');
    }
};

//@route GET /edit-address/:id
export const getEditAddress = async (req, res) => {
    try {
        const msg = req.session.err || null;
        const addressId = req.params.id;
        const address = await Address.findById(addressId);
        res.render('user/editAddress', { layout: 'profile-layout', msg, address })
    } catch (error) {
        console.log(error);
    }
};

//@route POST /edit-address/:id
export const handleEditAddress = async (req, res) => {
    const addressId = req.params.id;
    try {
        const {
            phone,
            pincode,
            locality,
            houseNo,
            city,
            state,
            landmark,
            alternatePhone,
            type,
            isDefault,
            name,
        } = req.body;
        if (!phone || !pincode || !locality || !houseNo || !city || !state || !type) {
            req.session.err = 'Please fill all required fields.';
            return res.redirect(`/edit-address/${addressId}`);
        }
        const token = req.cookies?.token;
        const userId = decodeUserId(token);
        if (isDefault) {
            await Address.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );
        }

        const address = await Address.findById(addressId);

        address.name = name;
        address.mobileNumber = phone;
        address.pincode = pincode;
        address.locality = locality;
        address.houseNo = houseNo;
        address.city = city;
        address.state = state;
        address.landmark = landmark;
        address.alternatePhone = alternatePhone;
        address.addressType = type;
        address.isDefault = isDefault || false;

        await address.save();
        res.redirect('/addresses');
    } catch (error) {
        console.error('Error adding address:', error);
        req.session.err = error.toString();
        res.redirect(`/edit-address/${addressId}`);
    }
};

//@route DELETE /edit-address/:id
export const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        const deleted = await Address.deleteOne({ _id: addressId });

        if (deleted.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        res.json({ success: true, message: 'Address deleted successfully' });

    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



//@route GET /select-address/:id
export const getSelectAddress = async (req, res) => {
  try {
    const userId = decodeUserId(req.cookies?.token);
    const cartId = req.params.id;
    const cart = await Cart.findById(cartId)
            .populate({
                path: 'cartItems.productId',
                populate: {
                    path: 'categoryId'
                }
            });

    if (!cart || cart.cartItems.length < 1) {
      return res.redirect('/cart');
    }

    const activeItems = cart.cartItems.filter(item => item.productId && item.productId.isActive);

    if (activeItems.length !== cart.cartItems.length) {
      await Cart.updateOne(
        { userId },
        { $set: { cartItems: activeItems } }
      );
      cart.cartItems = activeItems;
    }

    
    let addresses = await Address.find({ userId }).sort({ isDefault: -1 });

    const items = cart.cartItems;
    const { grandTotal, deliveryCharge, total, totalWithoutTax, totalTax, totalDiscount } = calculateCart(items);

    res.render('user/selectAddress', {
      layout: 'checkOutLayout',
      grandTotal,
      deliveryCharge,
      total,
      totalTax,
      totalWithoutTax,
      totalDiscount,
      addresses,
      cart,
      couponApplied: false,
    });

  } catch (error) {
    console.error(error);
    return res.redirect('/cart');
  }
};


//@route GET /add-new-address
export const getAddNewAddress = (req, res) => {
    try {
        const cartId = req.params.id;
        const msg = req.session.err || null;
        res.render('user/addAddressPage', { layout: 'checkOutLayout', msg, cartId });
    } catch (error) {
        console.log(error);
    }
};

//@route POST /add-new-address
export const handleAddNewAddress = async (req, res) => {
    try {
        const {
            phone,
            pincode,
            locality,
            houseNo,
            city,
            state,
            landmark,
            alternatePhone,
            type,
            isDefault,
            name,
        } = req.body;
        if (!phone || !pincode || !locality || !houseNo || !city || !state || !type) {
            req.session.err = 'Please fill all required fields.';
            return res.redirect('/add-address');
        }
        const token = req.cookies?.token;
        const userId = decodeUserId(token);
        if (isDefault) {
            await Address.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );
        }
        const cart = await Cart.findOne({ userId });
        if (!cart || cart.cartItems.length < 1) {
            res.redirect('/cart');
        }
        const newAddress = new Address({
            userId,
            mobileNumber: phone,
            pincode,
            locality,
            houseNo,
            city,
            state,
            landmark,
            alternatePhone,
            addressType: type,
            isDefault: isDefault || false,
            name,
        });

        await newAddress.save();

        res.redirect(`/select-address/${cart._id}`);
    } catch (error) {
        console.error('Error adding address:', error);
        req.session.err = error.toString();
        res.redirect('/add-new-address');
    }
};

//@route GET /edit-address-checkout
export const getEditAddressCheckout = async (req, res) => {
    try {
        const userId = decodeUserId(req.cookies?.token);
        const addressId = req.params.id;
        const cart = await Cart.findOne({ userId });
        const address = await Address.findById(addressId);
        const msg = req.session.err || null;
        res.render('user/editAddressPage', { layout: 'checkOutLayout', msg, cartId: cart._id, address });
    } catch (error) {
        console.log(error);
    }
};

//@route POST /edit-address-checkout
export const handleEditAddressCheckout = async (req, res) => {
    const addressId = req.params.id;
    try {
        const {
            phone,
            pincode,
            locality,
            houseNo,
            city,
            state,
            landmark,
            alternatePhone,
            type,
            isDefault,
            name,
        } = req.body;
        if (!phone || !pincode || !locality || !houseNo || !city || !state || !type) {
            req.session.err = 'Please fill all required fields.';
            return res.redirect(`/edit-address/${addressId}`);
        }
        const token = req.cookies?.token;
        const userId = decodeUserId(token);
        if (isDefault) {
            await Address.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );
        }

        const address = await Address.findById(addressId);

        address.mobileNumber = phone,
        address.pincode = pincode;
        address.locality = locality;
        address.houseNo = houseNo;
        address.city = city;
        address.state = state;
        address.landmark = landmark;
        address.alternatePhone = alternatePhone;
        address.addressType = type;
        address.isDefault = isDefault || false;
        address.name = name;

        const cart = await Cart.findOne({ userId });

        await address.save();
        res.redirect(`/select-address/${cart._id}`);
    } catch (error) {
        console.error('Error adding address:', error);
        req.session.err = error.toString();
        res.redirect(`/edit-address-checkout/${addressId}`);
    }
};

//@route POST /select-address/:id
export const handleSelectAddress = async (req, res) => {
    try {
        const userId = decodeUserId(req.cookies?.token);
        const addressId = req.body.addressId;
        const cartId = req.params.id;

        const address = await Address.findOne({ _id: addressId, userId });
        if (!address) return res.status(400).send("Invalid address");

        const cart = await Cart.findById(cartId)
            .populate({
                path: 'cartItems.productId',
                populate: {
                    path: 'categoryId'
                }
            });

        if (!cart || cart.cartItems.length < 1) {
            return res.redirect('/cart');
        }
        const cartItems = cart?.cartItems || [];
        const { total, grandTotal, totalDiscount } = calculateCart(cartItems);

        const shippingAddress = {
            houseNo: address.houseNo,
            street: address.locality,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            landmark: address.landmark,
            mobileNumber: address.mobileNumber,
            alternatePhone: address.alternatePhone,
            addressType: address.addressType,
        };

        const products = cartItems.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            priceAtPurchase: item.productId.basePrice,
            image: item.productId.images[0],
            size: item.size,
        }));

        // Create order
        const order = await Order.create({
            userId,
            products,
            shippingAddress,
            totalPrice: total,
            discount: totalDiscount,
            grandTotal,
        });

        // Redirect to payment page
        res.redirect(`/payment/${order._id}`);
    } catch (err) {
        logger.error("Order creation failed:", err.toString());
        res.status(500).send("Server error");
    }
};