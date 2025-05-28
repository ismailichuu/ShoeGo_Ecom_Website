
import Product from "../../models/productSchema.js";

//@route GET /
export const getHome = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .limit(8)
            .populate('categoryId')
            .sort({ createdAt: -1 });
        res.render('user/home', { products });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
