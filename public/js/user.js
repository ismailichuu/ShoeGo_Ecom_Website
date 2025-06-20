/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const profile = document.getElementById('profile');
if (profile) {
  profile.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const imgPreview = document.querySelector('img[alt="Profile Preview"]');
      imgPreview.src = URL.createObjectURL(file);
    }
  });
}

function togglePasswordFields() {
  const fields = document.getElementById('passwordFields');
  fields.classList.toggle('hidden');
}

//send otp from edit profile
async function sendEmailOTP() {
  const email = document.getElementById('email').value;
  const messageEl = document.getElementById('otpMessage');
  messageEl.textContent = '';

  try {
    const res = await fetch('/send-email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      messageEl.textContent = data.message || 'OTP sent successfully!';
      messageEl.className = 'text-sm mt-2 text-green-600';

      openModal();
    } else {
      messageEl.textContent = data.message || 'Failed to send OTP.';
      messageEl.className = 'text-sm mt-2 text-red-600';
    }
  } catch (error) {
    messageEl.textContent = 'An error occurred. Please try again.';
    messageEl.className = 'text-sm mt-2 text-red-600';
  }
}

function openModal() {
  document.getElementById('otpModal').classList.remove('hidden');
}

function closeOtpModal(e) {
  document.getElementById('otpModal').classList.add('hidden');
}

//verify otp from editprofile page
async function verifyOtp() {
  const email = document.getElementById('email').value;
  const otp = document.getElementById('otpInput').value;
  const messageEl = document.getElementById('otpVerifyMessage');

  try {
    const res = await fetch('/verify-email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (res.ok) {
      messageEl.textContent = data.message;
      messageEl.className = 'text-green-600';
      setTimeout(() => {
        location.href = '/profile/edit';
      }, 3000);
    } else {
      messageEl.textContent = data.message;
      messageEl.className = 'text-red-600';
    }
  } catch (err) {
    messageEl.textContent = 'Error verifying OTP.';
    messageEl.className = 'text-red-600';
  }
}

function openPasswordModal() {
  document.getElementById('changePasswordModal').classList.remove('hidden');
}

function closePasswordModal() {
  document.getElementById('changePasswordModal').classList.add('hidden');
}

//change password from profile
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('changePasswordForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Get actual input elements
      const currentPasswordInput = document.getElementById('currentPassword');
      const newPasswordInput = document.getElementById('newPassword');
      const confirmPasswordInput = document.getElementById('confirmPassword');

      const formData = new FormData(this);
      const currentPassword = formData.get('currentPassword')?.trim();
      const newPassword = formData.get('newPassword')?.trim();
      const confirmPassword = formData.get('confirmPassword')?.trim();

      // Clear previous error styles
      [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(
        (input) => {
          input.classList.remove('border-red-500');
        }
      );

      // Frontend validation for strong password
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPasswordRegex.test(newPassword)) {
        errorMessage.textContent =
          'New password must include uppercase, lowercase, number, and symbol (min 8 characters).';
        successMessage.textContent = '';
        newPasswordInput.classList.add('border-red-500');
        setTimeout(() => (errorMessage.textContent = ''), 4000);
        return;
      }

      if (confirmPassword !== newPassword) {
        errorMessage.textContent =
          'Confirm password does not match the new password.';
        successMessage.textContent = '';
        confirmPasswordInput.classList.add('border-red-500');
        setTimeout(() => (errorMessage.textContent = ''), 4000);
        return;
      }

      if (currentPassword === newPassword) {
        errorMessage.textContent =
          'New password and current password cannot be the same.';
        successMessage.textContent = '';
        newPasswordInput.classList.add('border-red-500');
        setTimeout(() => (errorMessage.textContent = ''), 4000);
        return;
      }

      // Send request to server
      const response = await fetch('/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        errorMessage.textContent = result.error || 'Something went wrong.';
        successMessage.textContent = '';
        setTimeout(() => (errorMessage.textContent = ''), 4000);
      } else {
        errorMessage.textContent = '';
        successMessage.textContent =
          result.message || 'Password updated successfully!';

        setTimeout(() => {
          closePasswordModal();
          successMessage.textContent = '';
        }, 2000);
      }
    });
  }
});

//delete user address
document.addEventListener('DOMContentLoaded', () => {
  let currentDeleteId = null;

  function openDeleteModal(addressId) {
    currentDeleteId = addressId;
    document.getElementById('deleteModal').classList.remove('hidden');
  }

  function closeDeleteModal() {
    currentDeleteId = null;
    document.getElementById('deleteModal').classList.add('hidden');
  }

  async function confirmDelete() {
    try {
      const res = await fetch(`/delete-address/${currentDeleteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        closeDeleteModal();
        showToast('Address deleted successfully', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        closeDeleteModal();
        showToast(data.message || 'Failed to delete address', 'error');
      }
    } catch (err) {
      closeDeleteModal();
      showToast('Something went wrong', 'error');
      console.error(err);
    }
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white text-sm z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  window.openDeleteModal = openDeleteModal;
  window.closeDeleteModal = closeDeleteModal;
  window.confirmDelete = confirmDelete;
});

//add to cart
document.addEventListener('DOMContentLoaded', () => {
  let selectedSize = null;
  const sizeButtons = document.querySelectorAll('.product-size-btn');
  const sizeError = document.getElementById('sizeError');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const cartMessage = document.getElementById('cartMessage');

  // Utility function to show message
  function showMessage(message, isSuccess = true) {
    if (!cartMessage) return;

    cartMessage.textContent = message;
    cartMessage.classList.remove('hidden', 'text-green-500', 'text-red-500');
    cartMessage.classList.add(isSuccess ? 'text-green-500' : 'text-red-500');

    // Optional auto-hide after 3 seconds
    setTimeout(() => {
      cartMessage.classList.add('hidden');
    }, 3000);
  }

  // Handle size selection
  sizeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      sizeButtons.forEach((btn) =>
        btn.classList.remove('bg-black', 'text-white')
      );
      button.classList.add('bg-black', 'text-white');
      selectedSize = button.dataset.size;

      if (sizeError) sizeError.classList.add('hidden');
    });
  });

  // Handle Add to Cart
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (!selectedSize) {
        if (sizeError) sizeError.classList.remove('hidden');
        showMessage('Please select a size.', false);
        return;
      }

      fetch('/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: addToCartBtn.dataset.productId,
          selectedSize,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            showMessage(' Added to cart!', true);
            const stockMessage = document.getElementById('stockMessage');

            if (stockMessage) {
              if (data.updatedStock === 0) {
                stockMessage.innerHTML = `<p class="text-sm font-semibold text-red-500 mb-6">Out of Stock!</p>`;
              } else if (data.updatedStock < 7) {
                stockMessage.innerHTML = `<p class="text-sm font-semibold text-red-500 mb-6">Hurry up! Only ${data.updatedStock} left</p>`;
              } else {
                stockMessage.innerHTML = '';
              }
            }
          } else {
            showMessage(data.message || 'Error adding to cart.', false);
          }
        })
        .catch((err) => {
          console.error(err);
          showMessage('Something went wrong.', false);
        });
    });
  }
});

//increase quantity
function increaseQuantity(productId, size, btn) {
  const msgEl = btn.closest('div').querySelector('.limitMessage');
  fetch('/cart/increase', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, size }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        btn.parentElement.querySelector('.quantity-count').textContent =
          data.quantity;

        updateOrderSummary();

        if (
          data.updatedProductTotal &&
          btn.closest('.cart-item').querySelector('.product-total')
        ) {
          btn
            .closest('.cart-item')
            .querySelector('.product-total').textContent = `₹${data.quantity}`;
        }
      } else {
        msgEl.textContent = data.message || 'Cannot increase further';
        msgEl.classList.remove('hidden');

        setTimeout(() => {
          msgEl.classList.add('hidden');
        }, 3000);
      }
    })
    .catch((error) => {
      console.error('Error increasing quantity:', error);
      msgEl.textContent = 'Something went wrong';
      msgEl.classList.remove('hidden');
      setTimeout(() => msgEl.classList.add('hidden'), 3000);
    })
    .finally(() => {
      btn.disabled = false;
    });
}

//dicrease quantity
function decreaseQuantity(productId, size, btn) {
  const msgEl = btn.closest('div').querySelector('.limitMessage');
  btn.disabled = true;
  fetch('/cart/decrease', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, size }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        if (data.quantity < 1) {
          location.reload();
        } else {
          btn.parentElement.querySelector('.quantity-count').textContent =
            data.quantity;

          updateOrderSummary();

          if (
            data.updatedProductTotal &&
            btn.closest('.cart-item').querySelector('.product-total')
          ) {
            btn
              .closest('.cart-item')
              .querySelector('.product-total').textContent =
              `₹${data.quantity}`;
          }
        }
      } else {
        alert(data.message || 'Error decreasing quantity');
      }
    })
    .catch((error) => {
      console.error('Error increasing quantity:', error);
      msgEl.textContent = 'Something went wrong';
      msgEl.classList.remove('hidden');
      setTimeout(() => msgEl.classList.add('hidden'), 3000);
    })
    .finally(() => {
      btn.disabled = false;
    });
}

function updateOrderSummary() {
  fetch('/cart/order-summary')
    .then((res) => res.text())
    .then((html) => {
      document.getElementById('order-summary').innerHTML = html;
    })
    .catch((err) => console.error('Failed to update order summary:', err));
}

let deleteAction = null;

function showDeleteModal(action) {
  deleteAction = action;
  document.getElementById('confirmModal').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('confirmModal').classList.add('hidden');
  deleteAction = null;
}
const deleteConfirmationBtn = document.getElementById('confirmDeleteBtn');
if (deleteConfirmationBtn) {
  deleteConfirmationBtn.addEventListener('click', async () => {
    if (deleteAction) {
      await deleteAction();
    }
    hideModal();
  });
}

//delete from cart
async function deleteCartItem(productId, size) {
  try {
    const res = await fetch(
      `/cart/delete-item?productId=${productId}&size=${size}`,
      {
        method: 'DELETE',
      }
    );
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Failed to delete item.');
    }
  } catch (err) {
    console.error(err);
    alert('Error occurred while deleting.');
  }
}

async function clearCart() {
  try {
    const res = await fetch('/cart/clear', {
      method: 'DELETE',
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Failed to clear cart.');
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
    alert('Something went wrong.');
  }
}

//add to wishlist function
function addToWishlist(productId) {
  fetch('/add-to-wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const addToWishlistBtn = document.getElementById('addToWishlistBtn');
  const cartMessage = document.getElementById('cartMessage');

  // Show success or error messages
  function showMessage(message, isSuccess = true) {
    if (!cartMessage) return;

    cartMessage.textContent = message;
    cartMessage.classList.remove('hidden', 'text-green-500', 'text-red-500');
    cartMessage.classList.add(isSuccess ? 'text-green-500' : 'text-red-500');

    setTimeout(() => {
      cartMessage.classList.add('hidden');
    }, 3000);
  }

  // Add to Wishlist (no size)
  if (addToWishlistBtn) {
    addToWishlistBtn.addEventListener('click', () => {
      fetch('/add-to-wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: addToWishlistBtn.dataset.productId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            showMessage('Added to Wishlist!', true);
          } else {
            showMessage(data.message || 'Failed to add to Wishlist.', false);
          }
        })
        .catch((err) => {
          console.error(err);
          showMessage('Something went wrong.', false);
        });
    });
  }
});

//add to cart from wishlist

const addToCart = (productId, selectedSize) => {
  fetch('/add-to-cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, selectedSize }),
  })
    .then((res) => res.json())
    .then((data) => {
      const errorBox = document.getElementById('error-wishlist');

      if (data.success) {
        location.reload();
      } else {
        errorBox.textContent = data.message || 'Something went wrong';
        errorBox.classList.remove('hidden');

        setTimeout(() => {
          errorBox.classList.add('hidden');
        }, 5000);
      }
    })
    .catch((err) => {
      const errorBox = document.getElementById('error-message');
      errorBox.textContent = 'Network or server error';
      errorBox.classList.remove('hidden');

      setTimeout(() => {
        errorBox.classList.add('hidden');
      }, 5000);
    });
};

document.addEventListener('DOMContentLoaded', () => {
  let selectedProductId = null;
  let selectedSize = null;

  window.openSizeModal = function (productId, sizes) {
    selectedProductId = productId;
    selectedSize = null;

    const sizeOptionsContainer = document.getElementById('sizeOptions');
    sizeOptionsContainer.innerHTML = '';
    document.getElementById('size-err').textContent = '';

    sizes.forEach((size) => {
      const btn = document.createElement('button');
      btn.textContent = size;
      btn.className =
        'border border-gray-300 rounded-lg px-3 py-2 hover:bg-indigo-100';
      btn.onclick = () => {
        selectedSize = size;
        document
          .querySelectorAll('#sizeOptions button')
          .forEach((b) => b.classList.remove('bg-indigo-600', 'text-white'));
        btn.classList.add('bg-indigo-600', 'text-white');
      };
      sizeOptionsContainer.appendChild(btn);
    });

    document.getElementById('sizeModal').classList.remove('hidden');
  };

  window.closeSizeModal = function () {
    document.getElementById('sizeModal').classList.add('hidden');
  };

  window.confirmSize = function () {
    const errorBox = document.getElementById('size-err');

    if (!selectedSize) {
      errorBox.textContent = 'Please select a size';
      return;
    }

    errorBox.textContent = '';
    window.closeSizeModal();
    addToCart(selectedProductId, selectedSize);
  };
});

const removeFromWishlist = (productId, selectedSize) => {
  fetch('/delete-from-wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, selectedSize }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        location.reload();
      } else {
        alert('error delete-whislist');
      }
    });
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('placeOrderForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const orderId = document.querySelector('input[name="orderId"]').value;
      const paymentMethod = document.querySelector(
        'input[name="paymentMethod"]:checked'
      )?.value;

      if (paymentMethod === 'razorpay') {
        try {
          const response = await fetch('/place-razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          });

          const result = await response.json();

          if (result && result.razorpayOrder) {
            openRazorpayCheckout(
              result.razorpayOrder,
              result.razorpayId,
              result.order
            );
          } else {
            alert('Failed to initiate Razorpay payment');
            location.href = '/cart';
          }
        } catch (err) {
          console.error('Error creating Razorpay order:', err);
          location.href = '/cart';
        }
      } else if (paymentMethod === 'wallet') {
        const errorMsg = document.getElementById('wallet-error');

        try {
          const response = await fetch('/place-wallet-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          });

          const result = await response.json();

          if (result && result.success) {
            setTimeout(() => showSuccessModal(), 2000);
          } else {
            errorMsg.textContent = result.message;
            errorMsg.classList.remove('hidden');
            setTimeout(() => {
              errorMsg.classList.add('hidden');
            }, 4000);
          }
        } catch (err) {
          console.error('Error creating Razorpay order:', err);
          errorMsg.textContent = 'Something went wrong with wallet payment';
          errorMsg.classList.remove('hidden');
          setTimeout(() => {
            location.href = '/cart';
          }, 2000);
        }
      } else {
        const payload = { orderId, paymentMethod };
        const errorMsg = document.getElementById('cod-error');

        try {
          const response = await fetch('/place-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          if (result.success) {
            setTimeout(() => showSuccessModal(), 2000);
          } else {
            errorMsg.textContent = result.message;
            errorMsg.classList.remove('hidden');
            setTimeout(() => {
              errorMsg.classList.add('hidden');
            }, 5000);
          }
        } catch (err) {
          console.error('Error placing order:', err);
          location.href = '/cart';
        }
      }
    });
  }
});

function openRazorpayCheckout(order, id, orderDetails) {
  const options = {
    key: id,
    amount: order.amount,
    currency: order.currency,
    name: 'ShoeGo Private Limited',
    description: 'Order Payment',
    order_id: order.id,
    handler: async function (response) {
      try {
        const payload = {
          ...response,
          originalOrderId: orderDetails._id,
        };
        const verifyResponse = await fetch('/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const verifyResult = await verifyResponse.json();
        if (verifyResult.success) {
          showSuccessModal();
        } else {
          document
            .getElementById('paymentFailedModal')
            .classList.remove('hidden');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        location.href = '/cart';
      }
    },
    modal: {
      ondismiss: function () {
        document
          .getElementById('paymentFailedModal')
          .classList.remove('hidden');
      },
    },
    prefill: {
      name: orderDetails.userId?.name,
      email: orderDetails.userId?.email,
      contact:
        orderDetails.userId?.mobileNumber ||
        order.shippingAddress?.mobileNumber,
    },
    theme: {
      color: '#3399cc',
    },
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

function closeFailModal() {
  document.getElementById('paymentFailedModal').classList.add('hidden');
}

function showSuccessModal() {
  document.getElementById('paymentSuccessModal').classList.remove('hidden');
}

function openCancelModal(productId) {
  document
    .getElementById(`cancelModal-${productId}`)
    .classList.remove('hidden');
}

function cancelAllModal() {
  document.getElementById(`cancelAllModal`).classList.remove('hidden');
}

function closeCancelModal(productId) {
  document.getElementById(`cancelModal-${productId}`).classList.add('hidden');
}

function closeCancelAllModal() {
  document.getElementById(`cancelAllModal`).classList.add('hidden');
}

function returnAllModal() {
  document.getElementById(`returnAllModal`).classList.remove('hidden');
}

function openReturnModal(productId) {
  document
    .getElementById(`returnModal-${productId}`)
    .classList.remove('hidden');
}

function closeReturnModal(productId) {
  document.getElementById(`returnModal-${productId}`).classList.add('hidden');
}

function closeReturnAllModal() {
  document.getElementById(`returnAllModal`).classList.add('hidden');
}

// Enhanced interactivity with modern animations
document.addEventListener('DOMContentLoaded', function () {
  // Stagger animation for cards
  const cards = document.querySelectorAll('.card-hover');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });

  // Interactive buttons
  document.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', function (e) {
      // Add ripple effect
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.height, rect.width);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');

      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);

      const cancelbutton = document.getElementById('confirm-cancel-btn');
      if (cancelbutton) {
        cancelbutton.addEventListener('click', function () {
          const form = this.closest('form');
          const reasonInput = form.querySelector(
            'textarea[name="cancelReason"]'
          );

          if (!reasonInput || reasonInput.value.trim() === '') {
            e.preventDefault();
            showNotification('Please provide a cancel reason', 'error');
            return;
          }

          form.submit();
          showNotification('Item Cancelled', 'success');
        });
      }
      const confirmReturn = document.getElementById('confirm-return-btn');

      if (confirmReturn) {
        confirmReturn.addEventListener('click', function (e) {
          const form = this.closest('form');
          const reasonInput = form.querySelector(
            'textarea[name="returnReason"]'
          );

          if (!reasonInput || reasonInput.value.trim() === '') {
            e.preventDefault();
            showNotification('Please provide a return reason', 'error');
            return;
          }

          form.submit();
          showNotification('Return request submitted', 'success');
        });
      }

      // Handle different actions
      if (this.textContent.includes('Track')) {
        showNotification('Opening tracking details...', 'info');
      } else if (this.textContent.includes('Buy Again')) {
        showNotification('Items added to cart!', 'success');
      }
    });
  });

  // Notification system
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-2xl text-white font-semibold z-50 animate-slide-in-right ${
      type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Smooth scroll animations on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, observerOptions);

  document
    .querySelectorAll('.animate-fade-in-up, .animate-slide-in-right')
    .forEach((el) => {
      el.style.animationPlayState = 'paused';
      observer.observe(el);
    });
});

// Add ripple effect styles
const style = document.createElement('style');
style.textContent = `
      .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
      }
      
      @keyframes ripple-animation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
document.head.appendChild(style);

function openCouponsModal() {
  document.getElementById('couponsModal').classList.remove('hidden');
}

function closeCouponsModal() {
  document.getElementById('couponsModal').classList.add('hidden');
}

function applyCoupon(couponId, orderId) {
  fetch('/payment/apply-coupon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ couponId, orderId }),
  })
    .then((res) => res.json())
    .then((data) => {
      const messageEl = document.getElementById('couponMessage');

      if (data.success) {
        messageEl.textContent = 'Coupon applied successfully!';
        messageEl.classList.remove('hidden', 'text-red-600');
        messageEl.classList.add('text-green-600');

        closeCouponsModal();
        location.reload();
      } else {
        messageEl.textContent = data.message || 'Coupon could not be applied.';
        messageEl.classList.remove('hidden', 'text-green-600');
        messageEl.classList.add('text-red-600');
      }

      setTimeout(() => {
        messageEl.classList.add('hidden');
      }, 3000);
    })
    .catch((err) => {
      console.error('Error applying coupon:', err);
      const messageEl = document.getElementById('couponMessage');
      messageEl.textContent = 'Something went wrong.';
      messageEl.classList.remove('hidden', 'text-green-600');
      messageEl.classList.add('text-red-600');

      setTimeout(() => {
        messageEl.classList.add('hidden');
      }, 3000);
    });
}

//remove coupon checkout
function removeCoupon(orderId) {
  fetch('/coupon/remove', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.message);
      }
    });
}

//generate link
function copyReferralLink() {
  const input = document.getElementById('refLink');
  input.select();
  input.setSelectionRange(0, 99999);
  document.execCommand('copy');

  const msg = document.getElementById('copyMessage');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 2000);
}

//retry razorpay payment
function retryPayment(id) {
  const orderId = id;
  fetch(`/retry-payment/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        location.href = `/payment/${orderId}`;
      } else {
        alert(data.message);
      }
    });
}
