/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const showLoader = () => {
  document.getElementById('dashboardLoader').classList.remove('hidden');
};

const hideLoader = () => {
  document.getElementById('dashboardLoader').classList.add('hidden');
};

let productChart, categoryChart, brandChart;

const generateColors = (count) => {
  const baseColors = [
    'rgba(59,130,246,0.7)',
    'rgba(245,158,11,0.7)',
    'rgba(16,185,129,0.7)',
    'rgba(239,68,68,0.7)',
    'rgba(139,92,246,0.7)',
    'rgba(20,184,166,0.7)',
    'rgba(251,191,36,0.7)',
  ];
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
};

// Create Chart
const createChart = (ctx, labels, data, color, type = 'bar') => {
  if (Chart.getChart(ctx)) {
    Chart.getChart(ctx).destroy();
  }

  const backgroundColors = Array.isArray(color)
    ? color
    : Array(data.length).fill(color);
  const borderColors = Array.isArray(color)
    ? color.map((c) => c.replace('0.7', '1'))
    : Array(data.length).fill(color.replace('0.7', '1'));

  return new Chart(ctx, {
    type: type,
    data: {
      labels,
      datasets: [
        {
          label: 'Sales',
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 12,
          },
        },

        tooltip: {
          enabled: true,
        },
      },
      scales:
        type === 'bar' || type === 'line'
          ? {
              y: {
                beginAtZero: true,
              },
            }
          : {},
    },
  });
};

const updateTopProductsTable = (products) => {
  const tableBody = document.getElementById('topProductsTableBody');
  tableBody.innerHTML = '';

  products.forEach((product) => {
    const row = `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.category[0]}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.brand}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.unitsSold}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${product.revenue.toFixed(2)}</td>
        </tr>
      `;
    tableBody.insertAdjacentHTML('beforeend', row);
  });
};

const updateDashboard = async (filter) => {
  try {
    showLoader();
    const [prodRes, catRes, brandRes, sellRes] = await Promise.all([
      fetch(`/admin/dashboard/top-products?filter=${filter}`),
      fetch(`/admin/dashboard/top-categories?filter=${filter}`),
      fetch(`/admin/dashboard/top-brands?filter=${filter}`),
      fetch(`/admin/dashboard/top-selling-products?filter=${filter}`),
    ]);

    const [prodData, catData, brandData, sellData] = await Promise.all([
      prodRes.json(),
      catRes.json(),
      brandRes.json(),
      sellRes.json(),
    ]);

    const productLabels = prodData.map((p) => p.name);
    const productSales = prodData.map((p) => p.totalSold);
    const dynamicColors = generateColors(productLabels.length);

    const productsCtx = document
      .getElementById('productsChart')
      .getContext('2d');
    productChart = createChart(
      productsCtx,
      productLabels,
      productSales,
      dynamicColors,
      'bar'
    );

    const categoryLabels = catData.map((c) => c.name);
    const categorySales = catData.map((c) => c.totalSold);
    const dynamicColorsf = generateColors(categoryLabels.length);
    const categoriesCtx = document
      .getElementById('categoriesChart')
      .getContext('2d');
    categoryChart = createChart(
      categoriesCtx,
      categoryLabels,
      categorySales,
      dynamicColorsf,
      'doughnut'
    );

    const brandLabels = brandData.map((b) => b.brand);
    const brandSales = brandData.map((b) => b.totalSold);
    const brandsCtx = document.getElementById('brandsChart').getContext('2d');
    brandChart = createChart(
      brandsCtx,
      brandLabels,
      brandSales,
      'rgba(16,185,129,0.7)'
    );

    updateTopProductsTable(sellData);
  } catch (err) {
    console.error('Error updating dashboard:', err);
  } finally {
    hideLoader();
  }
};
const fileSelect = document.getElementById('filterSelect');
if (fileSelect) {
  fileSelect.addEventListener('change', (e) => {
    const selected = e.target.value;
    updateDashboard(selected);
  });

  updateDashboard('monthly');
}
