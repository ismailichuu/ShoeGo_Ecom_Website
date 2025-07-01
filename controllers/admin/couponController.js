import Coupon from '../../models/couponSchema.js';
import { logger } from '../../util/logger.js';

//@route GET /coupons
export const getCoupons = async (req, res) => {
  try {
    const layout = req.query.req ? 'layout' : false;

    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 3;

    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const totalCoupons = await Coupon.countDocuments(query);
    const totalPages = Math.ceil(totalCoupons / limit);

    const coupons = await Coupon.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (req.xhr) {
      return res.render('partials/couponRows', { coupons }, (err, html) => {
        if (err) return res.status(500).send('Render failed');
        res.send({ html, totalPages, currentPage: page });
      });
    }

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
    const msg = req.session.err || null;
    req.session.err = null;
    res.render('admin/addCoupon', { layout: 'layout', msg });
  } catch (error) {
    logger.error('from getAddCoupons', error.toString());
  }
};

//@route POST /coupons/add
export const handleAddCoupons = async (req, res) => {
  try {
    const { name, code, discount, activeFrom, activeTo, limit, minAmount } =
      req.body;
    const couponExist = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExist) {
      req.session.err = 'Coupon Already Exist';
      return res.redirect('/admin/coupons/add');
    }
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const numericLimit = Number(limit);
    const numericMinAmount = Number(minAmount);
    const numericDiscount = Number(discount);
    const formattedActiveFrom = new Date(activeFrom).toISOString();
    const formattedActiveTo = new Date(activeTo).toISOString();

    if (
      !trimmedCode ||
      !trimmedName ||
      !numericLimit ||
      !numericDiscount ||
      !numericMinAmount ||
      !formattedActiveFrom ||
      !formattedActiveTo
    ) {
      req.session.err = 'fill the required fields!';
      return res.redirect(`/admin/coupons/add`);
    }

    await Coupon.create({
      name,
      code: trimmedCode,
      discount: numericDiscount,
      activeFrom: formattedActiveFrom,
      activeTo: formattedActiveTo,
      limit: numericLimit,
      minAmount: numericMinAmount,
    });

    res.redirect('/admin/coupons?req=new');
  } catch (err) {
    logger.error('from handleAddCoupon', err.toString());
  }
};

//@route GET /coupons/edit/:id
export const getEditCoupon = async (req, res) => {
  try {
    const msg = req.session.err || null;
    req.session.err = null;
    const couponId = req.params.id;
    const coupon = await Coupon.findById(couponId);

    res.render('admin/editCoupon', { layout: 'layout', coupon, msg });
  } catch (error) {
    logger.error('from getEditCoupons', error.toString());
  }
};

//@route POST /coupons/edit/:id
export const handleEditCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const {
      name,
      code,
      discount,
      activeFrom,
      activeTo,
      limit,
      minAmount,
      status,
    } = req.body;
    const coupon = await Coupon.findById(couponId);
    if (coupon.code !== code.toUpperCase()) {
      const couponExist = await Coupon.findOne({ code });
      if (couponExist) {
        req.session.err = 'Coupon Already Exist';
        return res.redirect(`/admin/coupons/edit/${couponId}`);
      }
    }
    const isActive = status === 'Active';

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const numericLimit = Number(limit);
    const numericMinAmount = Number(minAmount);
    const numericDiscount = Number(discount);
    const formattedActiveFrom = new Date(activeFrom).toISOString();
    const formattedActiveTo = new Date(activeTo).toISOString();

    const isChanged =
      trimmedCode !== coupon.code ||
      trimmedName !== coupon.name ||
      numericLimit !== coupon.limit ||
      numericMinAmount !== coupon.minAmount ||
      numericDiscount !== coupon.discount ||
      formattedActiveFrom !== new Date(coupon.activeFrom).toISOString() ||
      formattedActiveTo !== new Date(coupon.activeTo).toISOString() ||
      isActive !== coupon.isActive;
    if (
      !trimmedCode ||
      !trimmedName ||
      !numericLimit ||
      !numericDiscount ||
      !numericMinAmount ||
      !formattedActiveFrom ||
      !formattedActiveTo
    ) {
      req.session.err = 'fill the required fields!';
      return res.redirect(`/admin/coupons/edit/${couponId}`);
    }

    if (!isChanged) {
      req.session.err = 'No changes in the coupon';
      return res.redirect(`/admin/coupons/edit/${couponId}`);
    }

    coupon.name = trimmedName;
    coupon.code = trimmedCode;
    coupon.discount = numericDiscount;
    coupon.activeFrom = new Date(activeFrom);
    coupon.activeTo = new Date(activeTo);
    coupon.limit = numericLimit;
    coupon.minAmount = numericMinAmount;
    coupon.isActive = isActive;

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
    await Coupon.deleteOne({ _id: couponId });
    res.json({ success: true });
  } catch (error) {
    logger.error('from deleteCoupons', error.toString());
  }
};
