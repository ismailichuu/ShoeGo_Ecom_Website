import Category from '../../models/categorySchema.js';
import { logger } from '../../util/logger.js';

//@route GET /categories
export const getCategory = async (req, res) => {
  try {
    const layout = req.query.req ? 'layout' : false;

    const searchTerm = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 7;

    const searchFilter = searchTerm
      ? { name: { $regex: searchTerm, $options: 'i' } }
      : {};

    const totalDocs = await Category.countDocuments(searchFilter);
    const categories = await Category.find(searchFilter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ updatedAt: -1 });

    const totalPages = Math.ceil(totalDocs / limit);

    if (req.xhr) {
      return res.render(
        'partials/categoryRows',
        { categories },
        (err, html) => {
          if (err) return res.status(500).send('Render failed');
          res.send({ html, totalPages, currentPage: page });
        }
      );
    }

    res.render('admin/category', {
      layout,
      categories,
      currentPage: page,
      totalPages,
      search: searchTerm,
    });
  } catch (error) {
    logger.error('get Category:', error.toString());
    res.status(500).send('Server error');
  }
};

//@route GET /Category
export const getAddCategory = async (req, res) => {
  try {
    const layout = req.query.req ? 'layout' : false;
    const msg = req.session.err || null;
    delete req.session.err;
    res.render('admin/addCategory', { admin: false, msg, layout });
  } catch (error) {
    logger.error('getAddCAtegory:', error.toString());
  }
};

//@route POST /addCategory
export const handleAddCategory = async (req, res) => {
  try {
    const { name, description, visibility, discount } = req.body;

    const trimmedName = name.trim();
    const trimmedDiscount = discount.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName || !trimmedDescription || !trimmedDiscount) {
      throw new Error('fill all the fields!');
    }

    // Check if category with same name exists (case-insensitive)
    const category = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (category) throw new Error('Category already exists');

    const newCategory = new Category({
      name: trimmedName,
      description: trimmedDescription || '',
      visibility: visibility === 'Active',
      discount: parseFloat(discount) || 0,
    });

    await newCategory.save();

    res.redirect('/admin/categories?req=new');
  } catch (error) {
    logger.error('handleAddCategory:', error.toString());
    req.session.err = error.toString();
    res.redirect('/admin/addCategory?req=new');
  }
};

//@route DELETE /category
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    await Category.deleteOne({ _id: categoryId });
    res.json({ success: true });
  } catch (error) {
    logger.error('deleteCateory', error.toString());
  }
};

//@route GET /editCategory
export const getEditCategory = async (req, res) => {
  try {
    const msg = req.session.err || null;
    const layout = req.query.req ? 'layout' : false;
    const categoryId = req.query.id;
    const category = await Category.findById(categoryId);
    res.render('admin/editCategory', { category, msg, layout: layout });
  } catch (err) {
    logger.error('getEditCategory', err.toString());
  }
};

//@route PUT /editCategory
export const handleEditCategory = async (req, res) => {
  const { name, _id, description, visibility, discount } = req.body;
  try {
    //checking for category
    const category = await Category.findById(_id);
    if (!category) throw new Error('Category Not found');
    //checking for the name
    if (name !== category.name) {
      const category = await Category.findOne({ name });
      if (category) throw new Error('Category name already exist');
    }
    const status = visibility === 'true';

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedDiscount = discount.trim();

    if (!trimmedName || !trimmedDescription || !trimmedDiscount) {
      throw new Error('fill all fields!');
    }

    const isChanged =
      trimmedName !== category.name ||
      trimmedDiscount !== category.discount ||
      trimmedDescription !== category.description ||
      status !== category.visibility;

    if (!isChanged) {
      throw new Error('There is no changes in the Category');
    }

    category.name = trimmedName;
    category.description = trimmedDescription;
    category.visibility = status;
    category.discount = trimmedDiscount;
    await category.save();
    res.redirect('/admin/categories?req=new');
  } catch (error) {
    logger.error('handleEditCategory', error.toString());
    req.session.err = error.toString();
    res.redirect(`/admin/editCategory?id=${_id}&req=new`);
  }
};
