import Category from "../../models/categorySchema.js";

//@route GET /categories
export const getCategory = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const searchTerm = req.query.search || '';

        const searchFilter = searchTerm
            ? { name: { $regex: searchTerm, $options: 'i' } }
            : {};

        const totalDocs = await Category.countDocuments(searchFilter);
        const categories = await Category
            .find(searchFilter)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ updatedAt: -1 });

        const totalPages = Math.ceil(totalDocs / limit);
        const layout = req.query.req ? 'layout' : false;

        res.render('admin/category', {
            layout,
            categories,
            pagination: {
                page,
                limit,
                totalDocs,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages,
            },
            search: searchTerm,
            req: req,
            from: req.query.from || null,
            query: req.query
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

//@route GET /Category
export const getAddCategory = async (req, res) => {
    try {

        res.render('admin/addCategory', { admin: false, msg: null });
    } catch (error) {
        console.log(error);
    }
}

//@route POST /addCategory
export const handleAddCategory = async (req, res) => {
    try {
        const { name, description, visibility, discount } = req.body;

        const trimmedName = name.trim();

        // Check if category with same name exists (case-insensitive)
        const category = await Category.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
        if (category) throw new Error('Category already exists');

        const newCategory = new Category({
            name: trimmedName,
            description: description?.trim() || '',
            visibility: visibility === 'Active',
            discount: parseFloat(discount) || 0,
        });

        await newCategory.save();

        res.redirect('/admin/categories?req=new');
    } catch (error) {
        console.log(error);
        res.render('admin/addCategory', { layout: 'layout', msg: error.message || 'Something went wrong' });
    }
};

//@route DELETE /category
export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
        await Category.deleteOne({ _id: categoryId })
        res.json({ success: true });
    } catch (error) {
        console.error(error);
    }
}

//@route GET /editCategory
export const getEditCategory = async (req, res) => {
    try {
        const msg = req.session.err || null;
        const layout = req.query.req ? 'layout' : false;
        const categoryId = req.query.id;
        const category = await Category.findById(categoryId);
        res.render('admin/editCategory', { category, msg, layout: layout });
    } catch (err) {
        console.error(err);
    }
}

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
        category.name = name;
        category.description = description;
        category.visibility = (visibility === 'true');
        category.discount = discount;
        await category.save();
        res.redirect('/admin/categories?req=new');
    } catch (error) {
        console.log(error);
        req.session.err = error.toString();
        res.redirect(`/admin/editCategory?id=${_id}&req=new`);
    }
};
