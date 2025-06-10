import Coupon from "../../models/couponSchema.js";
import { logger } from "../../util/logger.js";

//@route GET /coupons
export const getCoupons = async (req, res) => {
  try {
    const layout = req.query.req ? 'layout' : false;

    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const totalCoupons = await Coupon.countDocuments(query);
    const totalPages = Math.ceil(totalCoupons / limit);

    const coupons = await Coupon.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.render('admin/coupon-table', {
      coupons,
      currentPage: page,
      totalPages,
      search,
      layout,
    });
  } catch (error) {
    logger.error('from getCoupons', error.toString());
    res.status(500).send('Server error');
  }
};


//@route GET /coupons/add
export const getAddCoupons = async (req, res) => {
    try {
        res.render('admin/addCoupon', { layout: 'layout' });
    } catch (error) {
        logger.error('from getAddCoupons', error.toString());
    }
};

//@route POST /coupons/add
export const handleAddCoupons = async (req, res) => {
    try {
        const { name, code, discount, activeFrom, activeTo, limit, minAmount } = req.body;

        await Coupon.create({
            name,
            code: code.toUpperCase(),
            discount,
            activeFrom,
            activeTo,
            limit,
            minAmount,
        });

        res.redirect('/admin/coupons?req=new');
    } catch (err) {
        logger.error('from handleAddCoupon', err.toString());
    }
};

//@route GET /coupons/edit
export const getEditCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);

        res.render('admin/editCoupon', { layout: 'layout', coupon });
    } catch (error) {
        logger.error('from getEditCoupons', error.toString());
    }
};

//@route POST /coupons/edit
export const handleEditCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const { name, code, discount, activeFrom, activeTo, limit, minAmount, status } = req.body;
        const coupon = await Coupon.findById(couponId);
        const isActive = status === 'Active';

        coupon.name = name;
        coupon.code = code.toUpperCase();
        coupon.discount = discount;
        coupon.activeFrom = activeFrom;
        coupon.activeTo = activeTo;
        coupon.limit = limit;
        coupon.minAmount = minAmount;
        coupon.isActive = isActive;

        await coupon.save();

        res.redirect('/admin/coupons?req=new');
    } catch (error) {
        logger.error('from handleEditCoupons', error.toString());
    }
};

//@route DELETE /coupon
export const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.body;
        console.log(couponId)
        await Coupon.deleteOne({_id: couponId});
        res.json({success: true});
    } catch (error) {
        logger.error('from deleteCoupons', error.toString());
    }
};