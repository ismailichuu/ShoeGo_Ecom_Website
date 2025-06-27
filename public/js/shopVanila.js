document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('input[name="search"]');
    const productContainer = document.getElementById('productContainer');

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchProducts(1);
        }, 400);
    });

    // Handle pagination clicks
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('page-link')) {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            fetchProducts(page);
        }
    });

    function fetchProducts(page = 1) {
        const query = new URLSearchParams({
            search: searchInput.value,
            page,
        });

        fetch(`/allProducts?${query.toString()}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(res => res.text())
            .then(html => {
                productContainer.innerHTML = html;
            })
            .catch(err => console.error('Error fetching products:', err));
    }
});

document.addEventListener('DOMContentLoaded', () => {

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Filter sidebar toggle for mobile
    const filterToggle = document.getElementById('filter-toggle');
    const filtersSidebar = document.getElementById('filters-sidebar');

    filterToggle.addEventListener('click', () => {
        filtersSidebar.classList.toggle('hidden');
        const isHidden = filtersSidebar.classList.contains('hidden');
        filterToggle.innerHTML = isHidden ?
            '<i class="fas fa-filter"></i> Show Filters' :
            '<i class="fas fa-times"></i> Hide Filters';
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
            mobileMenu.classList.add('hidden');
        }
    });

})