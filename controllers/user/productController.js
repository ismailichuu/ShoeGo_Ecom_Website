
import Product from "../../models/productSchema.js";
import Category from "../../models/categorySchema.js";

//@route GET /allProducts
export const getAllProducts = async (req, res) => {
    try {
        const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search || '';
        const sort = Array.isArray(req.query.sort) ? req.query.sort[0] : req.query.sort || '';
        const page = parseInt(Array.isArray(req.query.page) ? req.query.page[0] : req.query.page || '1', 10);

        const minPrice = parseInt(req.query.minPrice || '0', 10);
        const maxPrice = parseInt(req.query.maxPrice || '0', 10); // 0 means no max limit

        const limit = 8;
        const skip = (page - 1) * limit;

        let query = { isActive: true };

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        let categoryFilter = req.query.category;
        let selectedCategory = '';

        if (categoryFilter) {
            selectedCategory = Array.isArray(categoryFilter) ? categoryFilter[0] : categoryFilter;
            query.categoryId = selectedCategory;
        }

        // Fetch products with base filters (no price filtering here)
        const allProducts = await Product.find(query)
            .populate('categoryId')
            .lean();

        // Calculate finalPrice and discountLabel for each product
        const enrichedProducts = allProducts.map(product => {
            const basePrice = product.basePrice;
            const productDiscountPrice = product.discountPrice;
            let categoryDiscount = 0;

            if (product.categoryId?.[0]?.discount) {
                categoryDiscount = parseFloat(product.categoryId[0].discount.replace('%', '')) || 0;
            }

            const categoryDiscountPrice = Math.round(basePrice - (basePrice * categoryDiscount / 100));

            let finalPrice, discountLabel;

            if (productDiscountPrice && productDiscountPrice < categoryDiscountPrice) {
                finalPrice = productDiscountPrice;
                discountLabel = `₹${basePrice - productDiscountPrice} off`;
            } else if (categoryDiscount > 0) {
                finalPrice = categoryDiscountPrice;
                discountLabel = product.categoryId[0].discount; // e.g., "10%"
            } else {
                finalPrice = basePrice;
                discountLabel = 'No discount';
            }

            return {
                ...product,
                finalPrice,
                discountLabel
            };
        });

        // Filter by finalPrice range
        const filteredByPrice = enrichedProducts.filter(p => {
            if (maxPrice > 0) {
                return p.finalPrice >= minPrice && p.finalPrice <= maxPrice;
            } else {
                return p.finalPrice >= minPrice;
            }
        });

        // Sort products
        let sortedProducts = [...filteredByPrice];
        if (sort === 'discountPrice-asc') {
            sortedProducts.sort((a, b) => a.finalPrice - b.finalPrice);
        } else if (sort === 'discountPrice-desc') {
            sortedProducts.sort((a, b) => b.finalPrice - a.finalPrice);
        } else if (sort === 'az') {
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'za') {
            sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
        }

        // Pagination
        const paginated = sortedProducts.slice(skip, skip + limit);

        const categories = await Category.find();

        res.render('user/shop', {
            products: paginated,
            search,
            sort,
            category: selectedCategory,
            categories,
            minPrice,
            maxPrice,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(filteredByPrice.length / limit),
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
        };

        const id = req.params.id;
        const product = await Product.findById(id).populate('categoryId');

        if (!product || !product.isActive) return res.redirect('/');

        let categoryDiscount = 0;
        if (product.categoryId?.[0]?.discount) {
            categoryDiscount = parseFloat(product.categoryId[0].discount.replace('%', '')) || 0;
        }

        const basePrice = product.basePrice;
        const productDiscountedPrice = product.discountPrice;
        const categoryDiscountPrice = Math.round(basePrice - (basePrice * categoryDiscount / 100));

        let finalPrice, discountLabel;

        if (productDiscountedPrice && productDiscountedPrice < categoryDiscountPrice) {
            finalPrice = productDiscountedPrice;
            discountLabel = `₹${basePrice - productDiscountedPrice} off`;
        } else if (categoryDiscount > 0) {
            finalPrice = categoryDiscountPrice;
            discountLabel = product.categoryId[0].discount; 
        } else {
            finalPrice = basePrice;
            discountLabel = "No discount";
        }

        const related = await Product.find({
            categoryId: product.categoryId,
            isActive: true,
            _id: { $ne: product._id }
        })
        .limit(4)
        .populate('categoryId');

        const updatedRelated = related.map(p => {
            const base = p.basePrice;
            const prodDisc = p.discountedPrice;
            let catDisc = 0;
            if (p.categoryId?.[0]?.discount) {
                catDisc = parseFloat(p.categoryId[0].discount.replace('%', '')) || 0;
            }
            const catDiscPrice = Math.round(base - (base * catDisc / 100));

            let final, label;
            if (prodDisc && prodDisc < catDiscPrice) {
                final = prodDisc;
                label = `₹${base - prodDisc} off`;
            } else if (catDisc > 0) {
                final = catDiscPrice;
                label = p.categoryId[0].discount;
            } else {
                final = base;
                label = 'No discount';
            }

            return {
                ...p._doc,
                finalPrice: final,
                discountLabel: label
            };
        });

        res.render('user/productDetails', {
            product: {
                ...product._doc,
                finalPrice,
                discountLabel
            },
            reviews,
            related: updatedRelated
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
