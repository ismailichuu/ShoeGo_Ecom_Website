
//products page
document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('mainContent');
    const sidebarLinks = document.querySelectorAll('aside a');
    const loadBtn = document.getElementById('loadProducts');

    loadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebarLinks.forEach(link => link.classList.remove('bg-purple-200'));
        loadBtn.classList.add('bg-purple-200');

        fetch('/admin/products').then(response => response.text())
            .then(html => {
                contentArea.innerHTML = html;
            }).catch(error => {
                console.error('Failed to load products:', error);
                contentArea.innerHTML = "<p class='text-red-500'>Failed to load products.</p>";
            })
    })
});

// AddProduct Page
document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('mainContent');

    if (contentArea) {
        document.addEventListener('click', function (e) {
            const target = e.target.closest('#addProduct');
            if (target) {
                e.preventDefault();

                fetch('/admin/addProduct')
                    .then(response => response.text())
                    .then(html => {
                        contentArea.innerHTML = html;
                        initializeImageCropping(); // initialize logic after content is injected
                        initializeSizeSelection();
                    })
                    .catch(err => {
                        console.error('add product page is not loaded', err);
                        contentArea.innerHTML = "<p class='text-red-500'>Failed to load add product.</p>";
                    });
            }
        });
    }
});

//deleteProduct
function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    fetch('/admin/product', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Product deleted');
                location.href = '/admin/products?req=new';
            } else {
                alert('Failed to delete');
            }
        });
}

//editProduct
function editProduct(id) {
    const contentArea = document.getElementById('mainContent');

    fetch(`/admin/editProduct?id=${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },

    }).then(response => response.text())
        .then(html => {
            contentArea.innerHTML = html;
            editImageCropping();
            editSizeSelection();
        })
        .catch(err => {
            console.error('edit category page is not loaded', err);
            contentArea.innerHTML = "<p class='text-red-500'>Failed to load edit Category.</p>";
        });
}


//categoryManagment
document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('mainContent');
    const sidebarLinks = document.querySelectorAll('aside a');
    const loadBtn = document.querySelectorAll('.loadCategories');

    loadBtn.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebarLinks.forEach(link => link.classList.remove('bg-purple-200'));
        btn.classList.add('bg-purple-200');

        fetch('/admin/categories').then(response => response.text())
            .then(html => {
                contentArea.innerHTML = html;
            }).catch(error => {
                console.error('Failed to load categories:', error);
                contentArea.innerHTML = "<p class='text-red-500'>Failed to load categories.</p>";
            })
    }))
});

//deleteCategory
function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    fetch('/admin/category', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: id }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Category deleted');
                location.href = '/admin/categories?req=new';
            } else {
                alert('Failed to delete');
            }
        });
}

//edit category
function editCategory(id) {
    const contentArea = document.getElementById('mainContent');

    fetch(`/admin/editCategory?id=${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },

    }).then(response => response.text())
        .then(html => {
            contentArea.innerHTML = html;
        })
        .catch(err => {
            console.error('edit category page is not loaded', err);
            contentArea.innerHTML = "<p class='text-red-500'>Failed to load edit Category.</p>";
        });
}

// AddCategory Page
document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('mainContent');

    if (contentArea) {
        document.addEventListener('click', function (e) {
            const target = e.target.closest('#addCategory');
            if (target) {
                e.preventDefault();

                fetch('/admin/addCategory')
                    .then(response => response.text())
                    .then(html => {
                        contentArea.innerHTML = html;
                    })
                    .catch(err => {
                        console.error('add category page is not loaded', err);
                        contentArea.innerHTML = "<p class='text-red-500'>Failed to load add Category.</p>";
                    });
            }
        });
    }
});

//customers
document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('mainContent');
    const sidebarLinks = document.querySelectorAll('aside a');
    const loadBtn = document.getElementById('loadCustomers');

    loadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebarLinks.forEach(link => link.classList.remove('bg-purple-200'));
        loadBtn.classList.add('bg-purple-200');

        fetch('/admin/customers').then(response => response.text())
            .then(html => {
                contentArea.innerHTML = html;
            }).catch(error => {
                console.error('Failed to load customers:', error);
                contentArea.innerHTML = "<p class='text-red-500'>Failed to load customers.</p>";
            })
    })
});

//customer Block & unblock
document.addEventListener('DOMContentLoaded', () => {

    document.addEventListener('click', function (e) {
        // If the clicked element has the class 'userBlock'
        if (e.target.classList.contains('userBlock')) {
            const userId = e.target.getAttribute('data-id');
            if (!userId) return console.error('User ID not found');

            fetch('/admin/blockUser', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        location.href = `/admin/customerDetails?req=new&id=${data.id}`
                    } else {
                        console.error('Server error:', data.message);
                    }
                })
                .catch(err => {
                    console.error('Fetch error:', err);
                });
        }
    });
});

//User Details Page
function getUserDetails(id) {
    const contentArea = document.getElementById('mainContent');

    fetch(`/admin/customerDetails?id=${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },

    }).then(response => response.text())
        .then(html => {
            contentArea.innerHTML = html;
        })
        .catch(err => {
            console.error('Customer page is not loaded', err);
            contentArea.innerHTML = "<p class='text-red-500'>Failed to load Customer.</p>";
        });
};

//loadOrders
document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('mainContent');
    const sidebarLinks = document.querySelectorAll('aside a');
    const loadBtn = document.getElementById('loadOrders');

    loadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebarLinks.forEach(link => link.classList.remove('bg-purple-200'));
        loadBtn.classList.add('bg-purple-200');

        fetch('/admin/all-orders').then(response => response.text())
            .then(html => {
                contentArea.innerHTML = html;
            }).catch(error => {
                console.error('Failed to load orders:', error);
                contentArea.innerHTML = "<p class='text-red-500'>Failed to load orders.</p>";
            })
    })
});

function getOrderDetails(id) {
    const contentArea = document.getElementById('mainContent');

    fetch(`/admin/order-details/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },

    }).then(response => response.text())
        .then(html => {
            contentArea.innerHTML = html;
        })
        .catch(err => {
            console.error('Customer page is not loaded', err);
            contentArea.innerHTML = "<p class='text-red-500'>Failed to load Customer.</p>";
        });
};
