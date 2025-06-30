
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

//Coupon-table
document.addEventListener('DOMContentLoaded', () => {

    const searchInput = document.getElementById('searchInputCoupon');
    const couponTableBody = document.getElementById('couponTableBody');
    const paginationContainer = document.getElementById(
        'paginationContainerCoupon'
    );

    let currentSearch = '';
    let currentPage = 1;

    function renderPagination(totalPages) {
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="px-3 py-1 ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded pagination-btn" data-page="${i}">${i}</button>`;
        }
        paginationContainer.innerHTML = html;
    }

    function loadCoupons(search = '', page = 1) {
        fetch(`/admin/coupons?search=${encodeURIComponent(search)}&page=${page}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((res) => res.json())
            .then((data) => {
                couponTableBody.innerHTML = data.html;
                currentPage = page;
                renderPagination(data.totalPages);
            })
            .catch((err) => console.error('AJAX error:', err));
    }

    const handleSearch = debounce((e) => {
        currentSearch = e.target.value.trim();
        loadCoupons(currentSearch, 1);
    }, 400);

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                const page = parseInt(e.target.getAttribute('data-page'));
                loadCoupons(currentSearch, page);
            }
        });
    };
});

//customer-table
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInputCustomer');
    const customerTableBody = document.getElementById('customerTableBody');
    const paginationContainer = document.getElementById(
        'paginationContainerCustomer'
    );

    let currentSearch = '';
    let currentPage = 1;

    function renderPagination(totalPages) {
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="px-3 py-1 ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded pagination-btn" data-page="${i}">${i}</button>`;
        }
        paginationContainer.innerHTML = html;
    }

    function loadCustomer(search = '', page = 1) {
        fetch(`/admin/customers?search=${encodeURIComponent(search)}&page=${page}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((res) => res.json())
            .then((data) => {
                customerTableBody.innerHTML = data.html;
                currentPage = page;
                renderPagination(data.totalPages);
            })
            .catch((err) => console.error('AJAX error:', err));
    }

    const handleSearch = debounce((e) => {
        currentSearch = e.target.value.trim();
        loadCustomer(currentSearch, 1);
    }, 400);

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                const page = parseInt(e.target.getAttribute('data-page'));
                loadCustomer(currentSearch, page);
            }
        });
    };
});

//categroy-table
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInputCategory');
    const categoryTableBody = document.getElementById('categoryTableBody');
    const paginationContainer = document.getElementById(
        'paginationContainerCategory'
    );

    let currentSearch = '';
    let currentPage = 1;

    function renderPagination(totalPages) {
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="px-3 py-1 ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded pagination-btn" data-page="${i}">${i}</button>`;
        }
        paginationContainer.innerHTML = html;
    }

    function loadCategory(search = '', page = 1) {
        fetch(`/admin/categories?search=${encodeURIComponent(search)}&page=${page}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((res) => res.json())
            .then((data) => {
                categoryTableBody.innerHTML = data.html;
                currentPage = page;
                renderPagination(data.totalPages);
            })
            .catch((err) => console.error('AJAX error:', err));
    }

    const handleSearch = debounce((e) => {
        currentSearch = e.target.value.trim();
        loadCategory(currentSearch, 1);
    }, 400);

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                const page = parseInt(e.target.getAttribute('data-page'));
                loadCategory(currentSearch, page);
            }
        });
    };
});

//product-table
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInputProduct');
    const productTableBody = document.getElementById('productTableBody');
    const paginationContainer = document.getElementById(
        'paginationContainerProduct'
    );

    let currentSearch = '';
    let currentPage = 1;

    function renderPagination(totalPages) {
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="px-3 py-1 ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded pagination-btn" data-page="${i}">${i}</button>`;
        }
        paginationContainer.innerHTML = html;
    }

    function loadProducts(search = '', page = 1) {
        fetch(`/admin/products?search=${encodeURIComponent(search)}&page=${page}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((res) => res.json())
            .then((data) => {
                productTableBody.innerHTML = data.html;
                currentPage = page;
                renderPagination(data.totalPages);
            })
            .catch((err) => console.error('AJAX error:', err));
    }

    const handleSearch = debounce((e) => {
        currentSearch = e.target.value.trim();
        loadProducts(currentSearch, 1);
    }, 400);

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                const page = parseInt(e.target.getAttribute('data-page'));
                loadProducts(currentSearch, page);
            }
        });
    };
});

//order-table
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInputOrder');
    const orderTableBody = document.getElementById('orderTableBody');
    const paginationContainer = document.getElementById('paginationContainerOrder');

    let currentSearch = '';
    let currentPage = 1;

    function renderPagination(totalPages) {
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="px-3 py-1 ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded pagination-btn" data-page="${i}">${i}</button>`;
        };
        paginationContainer.innerHTML = html;
    };

    function loadOrders(search = '', page = 1) {
        fetch(`/admin/all-orders?search=${encodeURIComponent(search)}&page=${page}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((res) => res.json())
            .then((data) => {
                orderTableBody.innerHTML = data.html;
                currentPage = page;
                renderPagination(data.totalPages);
            })
            .catch((err) => console.error('AJAX order error: ', err));
    }

    const handleSearch = debounce((e) => {
        currentSearch = e.target.value.trim();
        loadOrders(currentSearch, 1);
    }, 400);

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    };

    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                const page = parseInt(e.target.getAttribute('data-page'));
                loadOrders(currentSearch, page);
            }
        });
    };
});