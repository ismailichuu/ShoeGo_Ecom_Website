
//@route GET /dashboard
export const getDashboard = (req, res) => {
    try {
        res.render('admin/dashboard', { layout: 'layout' });
    } catch (error) {
        console.log(error);
    }
};