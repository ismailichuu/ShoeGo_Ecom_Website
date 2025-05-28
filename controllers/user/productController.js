
import Product from "../../models/productSchema.js";
import Category from "../../models/categorySchema.js";

//@route GET /allProducts
export const getAllProducts = async (req, res) => {
    try {
        const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search || '';
        const sort = Array.isArray(req.query.sort) ? req.query.sort[0] : req.query.sort || '';
        const page = parseInt(Array.isArray(req.query.page) ? req.query.page[0] : req.query.page || '1', 10);

        const minPrice = parseInt(req.query.minPrice || '0', 10);
        const maxPrice = parseInt(req.query.maxPrice || '0', 10); // 0 = no max limit

        const limit = 8;
        const skip = (page - 1) * limit;

        let query = { isActive: true };

        // Search filter
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Category filter (dropdown)
        let categoryFilter = req.query.category;
        let selectedCategory = '';

        if (categoryFilter) {
            selectedCategory = Array.isArray(categoryFilter) ? categoryFilter[0] : categoryFilter;
            query.categoryId = selectedCategory;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.discountPrice = {};
            if (minPrice) query.discountPrice.$gte = minPrice;
            if (maxPrice) query.discountPrice.$lte = maxPrice;
        }

        // Sorting
        let sortQuery = {};
        if (sort === 'discountPrice-asc') sortQuery.discountPrice = 1;
        else if (sort === 'discountPrice-desc') sortQuery.discountPrice = -1;
        else if (sort === 'az') sortQuery.name = 1;
        else if (sort === 'za') sortQuery.name = -1;

        // Count and retrieve products
        const totalProducts = await Product.countDocuments(query);

        const products = await Product.find(query)
            .populate('categoryId')
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        // Get all categories
        const categories = await Category.find();

        res.render('user/shop', {
            products,
            search,
            sort,
            category: selectedCategory,
            categories,
            minPrice,
            maxPrice,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
            },
        });
    } catch (error) {
        console.error('Error in getAllProducts:', error);
        res.status(500).send('Internal Server Error');
    }
};



//@route GET /product:id
export const getProductDetails = async (req, res) => {
    try {
        const reviews = {
            username: "John Doe",
            rating: 4,
            comment: "Very comfortable shoes!",
            date: "2025-05-12"
        }
        const id = req.params.id;
        const product = await Product.findById(id).populate('categoryId');
        const categoryId = product.categoryId;
        const related = await Product.find({
            categoryId, isActive: true,
            _id: { $ne: product._id }
        })
            .limit(4)
            .populate('categoryId');
        if (!product.isActive) return res.redirect('/');
        res.render('user/productDetails', { product, reviews, related });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error during Google login.');
    }
}
