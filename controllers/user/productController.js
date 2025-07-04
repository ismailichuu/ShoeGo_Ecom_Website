import Product from '../../models/productSchema.js';
import Category from '../../models/categorySchema.js';
import getFinalPriceWithLabel from '../../util/bestPriceProduct.js';
import { logger } from '../../util/logger.js';

//@route GET /allProducts
export const getAllProducts = async (req, res) => {
  try {
    const search = Array.isArray(req.query.search)
      ? req.query.search[0]
      : req.query.search || '';
    const sort = Array.isArray(req.query.sort)
      ? req.query.sort[0]
      : req.query.sort || '';
    const page = parseInt(
      Array.isArray(req.query.page) ? req.query.page[0] : req.query.page || '1',
      10
    );

    const minPrice = parseInt(req.query.minPrice || '0', 10);
    const maxPrice = parseInt(req.query.maxPrice || '0', 10);

    const limit = 6;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let categoryFilter = req.query.category;
    let selectedCategory = '';

    if (categoryFilter) {
      selectedCategory = Array.isArray(categoryFilter)
        ? categoryFilter[0]
        : categoryFilter;
      query.categoryId = selectedCategory;
    }

    // Fetch products with base filters (no price filtering here)
    const allProducts = await Product.find(query).populate('categoryId').lean();

    // Calculate finalPrice and discountLabel for each product
    const enrichedProducts = allProducts.map((product) => {
      const { finalPrice, discountLabel } = getFinalPriceWithLabel(product);
      return {
        ...product,
        finalPrice,
        discountLabel,
      };
    });

    // Filter by finalPrice range
    const filteredByPrice = enrichedProducts.filter((p) => {
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

    if (req.xhr) {
      return res.render('partials/productGrid', {
        products: paginated,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filteredByPrice.length / limit),
        },
        layout: false,
      });
    }

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
    logger.error('Error in getAllProducts:', error);
    res.status(500).send('Internal Server Error');
  }
};

//@route GET /product:id
export const getProductDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate('categoryId');

    if (!product || !product.isActive) return res.redirect('/');

    const { finalPrice, discountLabel } = getFinalPriceWithLabel(product);

    const related = await Product.find({
      categoryId: product.categoryId,
      isActive: true,
      _id: { $ne: product._id },
    })
      .limit(4)
      .populate('categoryId');

    const updatedRelated = related.map((p) => {
      const { finalPrice, discountLabel } = getFinalPriceWithLabel(p);

      return {
        ...p._doc,
        finalPrice,
        discountLabel,
      };
    });

    const date = new Date();
    date.setDate(date.getDate() + 7);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    res.render('user/productDetails', {
      product: {
        ...product._doc,
        finalPrice,
        discountLabel,
      },
      related: updatedRelated,
      deliveryDate: formattedDate,
    });
  } catch (error) {
    logger.error('getProductDetails:', error);
    res.status(500).send('Internal Server Error');
  }
};
