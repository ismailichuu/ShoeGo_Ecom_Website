/* eslint-disable no-unused-vars */

let currentPage = 1;

async function loadTransactions(page = 1) {
  try {
    const res = await fetch(`/wallet/history?page=${page}`);
    const data = await res.json();

    const container = document.getElementById('walletTransactions');
    container.innerHTML = '';

    if (data.transactions.length === 0) {
      container.innerHTML =
        '<p class="text-gray-400 text-center">No transactions found.</p>';
      return;
    }
    data.transactions.forEach((tx) => {
      const isCredit = tx.type === 'credit';
      const color = isCredit ? 'text-green-600' : 'text-red-500';
      const type = isCredit ? 'Credit' : 'Debit';

      const row = `
          <div class="border-b pb-2">
            <div class="flex justify-between">
              <span>${type} - ₹${tx.amount.toFixed(2)} </span>
              <span class="${color} font-semibold">${isCredit ? '+' : '-'}₹${tx.amount.toFixed(2)}</span>
            </div>
            <div class="text-gray-500 text-xs">${tx.reason.toUpperCase()}</div>
          </div>
        `;
      container.insertAdjacentHTML('beforeend', row);
    });

    renderPagination(data.currentPage, data.totalPages);
  } catch (error) {
    console.error(error);
    document.getElementById('walletTransactions').innerHTML =
      '<p class="text-red-500">Failed to load transactions.</p>';
  }
}

function renderPagination(current, total) {
  const container = document.getElementById('paginationControls');
  container.innerHTML = '';

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    btn.className = `px-3 py-1 rounded ${i === current ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`;
    btn.onclick = () => loadTransactions(i);
    container.appendChild(btn);
  }
}

// Initial load
loadTransactions();
