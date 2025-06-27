/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

//products page
document.addEventListener('DOMContentLoaded', () => {
  const contentArea = document.getElementById('mainContent');
  const sidebarLinks = document.querySelectorAll('aside a');
  const loadBtn = document.getElementById('loadProducts');

  loadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sidebarLinks.forEach((link) => link.classList.remove('bg-purple-200'));
    loadBtn.classList.add('bg-purple-200');

    fetch('/admin/products')
      .then((response) => response.text())
      .then((html) => {
        contentArea.innerHTML = html;
      })
      .catch((error) => {
        console.error('Failed to load products:', error);
        contentArea.innerHTML =
          "<p class='text-red-500'>Failed to load products.</p>";
      });
  });
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
          .then((response) => response.text())
          .then((html) => {
            contentArea.innerHTML = html;
            initializeSizeSelection();
            initializeImageCropping();
          })
          .catch((err) => {
            console.error('add product page is not loaded', err);
            contentArea.innerHTML =
              "<p class='text-red-500'>Failed to load add product.</p>";
          });
      }
    });
  }
});

function initializeSizeSelection() {
  const sizeButtons = document.querySelectorAll('.size-btn');
  const selectedSizesInput = document.getElementById('selectedSizes');
  const selectedSizes = new Set();

  sizeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const size = button.getAttribute('data-size');

      if (selectedSizes.has(size)) {
        selectedSizes.delete(size);
        button.classList.remove('bg-purple-600', 'text-white');
        button.classList.add('bg-gray-300', 'text-black');
      } else {
        selectedSizes.add(size);
        button.classList.remove('bg-gray-300', 'text-black');
        button.classList.add('bg-purple-600', 'text-white');
      }

      // Update hidden input value
      selectedSizesInput.value = Array.from(selectedSizes).join(',');
    });
  });
}

// Now handle dynamic content loading and call the function after page load
document.addEventListener('DOMContentLoaded', () => {
  const contentArea = document.getElementById('mainContent');

  if (contentArea) {
    document.addEventListener('click', function (e) {
      const target = e.target.closest('#addProduct');
      if (target) {
        e.preventDefault();

        fetch('/admin/addProduct')
          .then((response) => response.text())
          .then((html) => {
            contentArea.innerHTML = html;
            initializeImageCropping();
            initializeSizeSelection();
          })
          .catch((err) => {
            console.error('Add product page is not loaded', err);
            contentArea.innerHTML =
              "<p class='text-red-500'>Failed to load add product.</p>";
          });
      }
    });
  }
});

// Define initializeImageCropping function first
const initializeImageCropping = () => {
  const imageBoxes = document.querySelectorAll('.image-box');
  const fileInputs = document.querySelectorAll('.hidden-file');
  const cropModal = document.getElementById('cropModal');
  const cropImage = document.getElementById('cropImage');
  const confirmCrop = document.getElementById('confirmCrop');
  const cancelCrop = document.getElementById('cancelCrop');

  let cropper;
  let activeInputIndex;

  imageBoxes.forEach((box) => {
    box.addEventListener('click', () => {
      activeInputIndex = box.getAttribute('data-index');
      fileInputs[activeInputIndex].click();
    });
  });

  fileInputs.forEach((input) => {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const errorMessage = document.getElementById('fileError'); // Select the <p> tag for error message

      // Clear any previous error message
      errorMessage.textContent = '';
      errorMessage.classList.add('hidden'); // Hide the error message initially

      if (!file) return;

      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!validTypes.includes(file.type)) {
        errorMessage.textContent =
          'Only image files (jpg, jpeg, png, webp) are allowed.';
        errorMessage.classList.remove('hidden'); // Show the error message
        e.target.value = ''; // Clear the input field
        return;
      }

      if (file.size > maxSize) {
        errorMessage.textContent = 'Image size must be under 2MB.';
        errorMessage.classList.remove('hidden');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        cropImage.src = reader.result;
        cropModal.classList.remove('hidden');

        if (cropper) cropper.destroy();
        cropper = new Cropper(cropImage, {
          aspectRatio: NaN,
          viewMode: 2,
          movable: true,
          zoomable: true,
          scalable: true,
          rotatable: true,
          guides: true,
          center: true,
        });
      };
      reader.readAsDataURL(file);
    });
  });

  if (cancelCrop) {
    cancelCrop.addEventListener('click', () => {
      cropModal.classList.add('hidden');
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    });
  }

  if (confirmCrop) {
    confirmCrop.addEventListener('click', () => {
      if (!cropper) return;

      const canvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800,
      });

      canvas.toBlob((blob) => {
        const newFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });

        const dt = new DataTransfer();
        dt.items.add(newFile);

        fileInputs[activeInputIndex].files = dt.files;

        imageBoxes[activeInputIndex].innerHTML =
          `<img src="${canvas.toDataURL()}" class="h-32 object-cover rounded" />`;

        cropModal.classList.add('hidden');
        cropper.destroy();
        cropper = null;
      }, 'image/jpeg');
    });
  }
};

//deleteProduct
function deleteProduct(id) {
  showModal(() => {
    fetch('/admin/product', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          location.reload();
        } else {
          alert('Failed to delete');
        }
      });
  }, 'Are you sure want to delete this Product?');
}

//editProduct
function editProduct(id) {
  const contentArea = document.getElementById('mainContent');

  fetch(`/admin/editProduct?id=${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
    .then((response) => response.text())
    .then((html) => {
      contentArea.innerHTML = html;
      editImageCropping();
      editSizeSelection();
    })
    .catch((err) => {
      console.error('edit category page is not loaded', err);
      contentArea.innerHTML =
        "<p class='text-red-500'>Failed to load edit Category.</p>";
    });
}

function editSizeSelection() {
  const sizeButtons = document.querySelectorAll('.size-btn');
  const selectedSizesInput = document.getElementById('selectedSizes');
  const selectedSizes = new Set(
    selectedSizesInput.value.split(',').filter(Boolean)
  );

  sizeButtons.forEach((button) => {
    const size = button.getAttribute('data-size');

    // Initialize button style for existing selected sizes
    if (selectedSizes.has(size)) {
      button.classList.remove('bg-gray-300', 'text-black');
      button.classList.add('bg-purple-600', 'text-white');
    }

    button.addEventListener('click', () => {
      if (selectedSizes.has(size)) {
        selectedSizes.delete(size);
        button.classList.remove('bg-purple-600', 'text-white');
        button.classList.add('bg-gray-300', 'text-black');
      } else {
        selectedSizes.add(size);
        button.classList.remove('bg-gray-300', 'text-black');
        button.classList.add('bg-purple-600', 'text-white');
      }

      selectedSizesInput.value = Array.from(selectedSizes).join(',');
    });
  });
}

const editImageCropping = () => {
  const imageBoxes = document.querySelectorAll('.image-box');
  const fileInputs = document.querySelectorAll('.hidden-file');
  const cropModal = document.getElementById('cropModal');
  const cropImage = document.getElementById('cropImage');
  const confirmCrop = document.getElementById('confirmCrop');
  const cancelCrop = document.getElementById('cancelCrop');
  const errorMessages = document.querySelectorAll('.error-message');

  let cropper;
  let activeInputIndex;

  imageBoxes.forEach((box, index) => {
    box.addEventListener('click', () => {
      activeInputIndex = index;
      fileInputs[activeInputIndex].click();
    });
  });

  fileInputs.forEach((input, index) => {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const errorMessage = document.getElementById('fileError');

      // Clear previous error
      errorMessage.textContent = '';
      errorMessage.classList.add('hidden');

      if (!file) return;

      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      const maxSize = 2 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        errorMessage.textContent =
          'Only image files (jpg, jpeg, png, webp) are allowed.';
        errorMessage.classList.remove('hidden');
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        errorMessage.textContent = 'Image size must be under 2MB.';
        errorMessage.classList.remove('hidden');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        cropImage.src = reader.result;
        cropModal.classList.remove('hidden');

        if (cropper) cropper.destroy();
        cropper = new Cropper(cropImage, {
          aspectRatio: NaN,
          viewMode: 2,
          movable: true,
          zoomable: true,
          scalable: true,
          rotatable: true,
          guides: true,
          center: true,
        });
      };
      reader.readAsDataURL(file);
    });
  });

  if (cancelCrop) {
    cancelCrop.addEventListener('click', () => {
      cropModal.classList.add('hidden');
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    });
  }

  if (confirmCrop) {
    confirmCrop.addEventListener('click', () => {
      if (!cropper) return;

      const canvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800,
      });

      canvas.toBlob((blob) => {
        const newFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });

        const dt = new DataTransfer();
        dt.items.add(newFile);

        fileInputs[activeInputIndex].files = dt.files;

        imageBoxes[activeInputIndex].innerHTML =
          `<img src="${canvas.toDataURL()}" class="h-32 object-cover rounded" />`;

        cropModal.classList.add('hidden');
        cropper.destroy();
        cropper = null;
      }, 'image/jpeg');
    });
  }
};

//deleteCategory
function deleteCategory(id) {
  showModal(() => {
    fetch('/admin/category', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          location.reload();
        } else {
          alert('Failed to delete');
        }
      });
  }, 'Are you sure want to delete this Category ?');
}

//edit category
function editCategory(id) {
  const contentArea = document.getElementById('mainContent');

  fetch(`/admin/editCategory?id=${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
    .then((response) => response.text())
    .then((html) => {
      contentArea.innerHTML = html;
    })
    .catch((err) => {
      console.error('edit category page is not loaded', err);
      contentArea.innerHTML =
        "<p class='text-red-500'>Failed to load edit Category.</p>";
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
          .then((response) => response.text())
          .then((html) => {
            contentArea.innerHTML = html;
          })
          .catch((err) => {
            console.error('add category page is not loaded', err);
            contentArea.innerHTML =
              "<p class='text-red-500'>Failed to load add Category.</p>";
          });
      }
    });
  }
});

//customer Block & unblock
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('userBlock')) {
      const button = e.target;
      const userId = button.getAttribute('data-id');
      if (!userId) return console.error('User ID not found');

      fetch('/admin/blockUser', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            button.textContent = data.isBlocked ? 'Unblock' : 'Block';

            button.classList.remove('bg-red-500', 'bg-green-500');
            if (data.isBlocked) {
              button.classList.add('bg-green-500');
            } else {
              button.classList.add('bg-red-500');
            }

            const statusSpan = document.getElementById('user-status');
            if (statusSpan) {
              statusSpan.textContent = data.isBlocked ? 'Blocked' : 'Active';
              statusSpan.className = data.isBlocked
                ? 'bg-red-300 text-red-500 text-sm px-3 py-1 rounded-full mt-1'
                : 'bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full mt-1';
            }
          } else {
            console.error('Server error:', data.message);
          }
        })
        .catch((err) => {
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
  })
    .then((response) => response.text())
    .then((html) => {
      contentArea.innerHTML = html;
    })
    .catch((err) => {
      console.error('Customer page is not loaded', err);
      contentArea.innerHTML =
        "<p class='text-red-500'>Failed to load Customer.</p>";
    });
};

function getOrderDetails(id) {
  const contentArea = document.getElementById('mainContent');

  fetch(`/admin/order-details/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
    .then((response) => response.text())
    .then((html) => {
      contentArea.innerHTML = html;
    })
    .catch((err) => {
      console.error('Customer page is not loaded', err);
      contentArea.innerHTML =
        "<p class='text-red-500'>Failed to load Customer.</p>";
    });
}

async function updateProductStatus(orderId, productId, size, newStatus) {
  try {
    const response = await fetch('/admin/updateProductStatus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, productId, size, status: newStatus }),
    });

    const result = await response.json();

    if (result.success) {
      const statusEl = document.getElementById(
        `product-status-${productId}-${size}`
      );
      if (statusEl) {
        statusEl.textContent = `Current Status: ${newStatus}`;
      }

      const orderStatusEl = document.getElementById(`order-status-${orderId}`);
      if (orderStatusEl) {
        orderStatusEl.textContent = result.orderStatus;
      }

      const dropdown = document.querySelector(
        `select[onchange*="${orderId}"][onchange*="${productId}"][onchange*="${size}"]`
      );

      if (dropdown) {
        const statusOptionsMap = {
          placed: ['shipped', 'cancelled'],
          pending: ['shipped', 'cancelled'],
          shipped: ['out for delivery'],
          'out for delivery': ['delivered'],
        };

        const nextOptions = statusOptionsMap[newStatus] || [];

        dropdown.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.textContent =
          newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        defaultOption.selected = true;
        defaultOption.disabled = true;
        dropdown.appendChild(defaultOption);

        nextOptions.forEach((status) => {
          const option = document.createElement('option');
          option.value = status;
          option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
          dropdown.appendChild(option);
        });
      }

      const messageEl = document.getElementById(`message-${productId}-${size}`);
      if (messageEl) {
        messageEl.textContent = 'Status updated successfully.';
        messageEl.style.color = 'green';
      }
    } else {
      alert('Update failed');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

function handleRequestDecision(orderId, productId, size, action) {
  const messageDiv = document.getElementById(`message-${productId}-${size}`);
  messageDiv.textContent = '';
  messageDiv.className = 'text-sm mt-2';

  fetch(`/admin/orders/handle-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, productId, size, action }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        messageDiv.textContent = `${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`;
        messageDiv.classList.add('text-green-600');
        location.href = `/admin/order-details/${orderId}?req=new`;
      } else {
        messageDiv.textContent = data.message || 'Something went wrong';
        messageDiv.classList.add('text-red-600');
      }
    })
    .catch((err) => {
      messageDiv.textContent = 'Request failed';
      messageDiv.classList.add('text-red-600');
    });
}

function handleRefundRequest(orderId, productId, size, action) {
  const messageDiv = document.getElementById(`message-${productId}-${size}`);
  messageDiv.textContent = '';
  messageDiv.className = 'text-sm mt-2';

  fetch(`/admin/orders/refund-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, productId, size, action }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        messageDiv.textContent = `Refund accepted successfully`;
        messageDiv.classList.add('text-green-600');
        location.href = `/admin/order-details/${orderId}?req=new`;
      } else {
        messageDiv.textContent = data.message || 'Something went wrong';
        messageDiv.classList.add('text-red-600');
      }
    })
    .catch((err) => {
      messageDiv.textContent = 'Request failed';
      messageDiv.classList.add('text-red-600');
    });
}

//deleteCoupon
function deleteCoupon(id) {
  showModal(() => {
    fetch('/admin/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponId: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          location.reload();
        } else {
          alert('Failed to delete');
        }
      });
  }, 'Are sure want to delete this Coupon ?');
}

//laodSalesReport
document.addEventListener('DOMContentLoaded', () => {
  const contentArea = document.getElementById('mainContent');
  const sidebarLinks = document.querySelectorAll('aside a');
  const loadBtn = document.getElementById('loadSalesReport');

  loadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sidebarLinks.forEach((link) => link.classList.remove('bg-purple-200'));
    loadBtn.classList.add('bg-purple-200');

    fetch('/admin/sales-report')
      .then((response) => response.text())
      .then((html) => {
        contentArea.innerHTML = html;
      })
      .catch((error) => {
        console.error('Failed to load sale report:', error);
        contentArea.innerHTML =
          "<p class='text-red-500'>Failed to load sales report.</p>";
      });
  });
});
