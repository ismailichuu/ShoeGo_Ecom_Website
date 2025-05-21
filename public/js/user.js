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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
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
    } catch (err) {
        messageEl.textContent = 'An error occurred. Please try again.';
        messageEl.className = 'text-sm mt-2 text-red-600';
    }
}

function openModal() {
    document.getElementById('otpModal').classList.remove('hidden');
}

function closeOtpModal(e) {
    document.getElementById('otpModal').classList.add('hidden');
};

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
            body: JSON.stringify({ email, otp })
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

    const form = document.getElementById("changePasswordForm");

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const currentPassword = formData.get("currentPassword");
            const newPassword = formData.get("newPassword");

            const response = await fetch("/profile/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.json();

            if (!response.ok) {
                document.getElementById("errorMessage").textContent = result.error || "Something went wrong.";
                setTimeout(() => {
                    errorMessage.textContent = "";
                }, 4000);
            } else {
                errorMessage.textContent = "";
                successMessage.textContent = result.message || "Password updated successfully!";

                setTimeout(() => {
                    closePasswordModal();
                    successMessage.textContent = "";
                }, 2000);
            }
        })
    }
})

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
                    'Content-Type': 'application/json'
                }
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
    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            sizeButtons.forEach(btn => btn.classList.remove('bg-black', 'text-white'));
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
                    selectedSize
                })
            })
                .then(res => res.json())
                .then(data => {
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
                .catch(err => {
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
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                msgEl.textContent = data.message || 'Cannot increase further';
                msgEl.classList.remove('hidden');

                setTimeout(() => {
                    msgEl.classList.add('hidden');
                }, 3000);
            }
        });
};

//dicrease quantity
function decreaseQuantity(productId, size, btn) {
    fetch('/cart/decrease', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, size }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert(data.message || 'Error decreasing quantity');
            }
        });
};


let deleteAction = null;

function showDeleteModal(action) {
    deleteAction = action;
    document.getElementById("confirmModal").classList.remove("hidden");
}

function hideModal() {
    document.getElementById("confirmModal").classList.add("hidden");
    deleteAction = null;
}
const deleteConfirmationBtn = document.getElementById("confirmDeleteBtn");
if (deleteConfirmationBtn) {

    deleteConfirmationBtn.addEventListener("click", async () => {
        if (deleteAction) {
            await deleteAction();
        }
        hideModal();
    });
}

//delete from cart

async function deleteCartItem(productId, size) {
    try {
        const res = await fetch(`/cart/delete-item?productId=${productId}&size=${size}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            window.location.reload();
        } else {
            alert('Failed to delete item.');
        }
    } catch (err) {
        console.error(err);
        alert('Error occurred while deleting.');
    }
};

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

document.addEventListener('DOMContentLoaded', () => {
    let selectedSize = null;
    const sizeButtons = document.querySelectorAll('.product-size-btn');
    const sizeError = document.getElementById('sizeError');
    const addToCartBtn = document.getElementById('addToWishlistBtn');
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
    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            sizeButtons.forEach(btn => btn.classList.remove('bg-black', 'text-white'));
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

            fetch('/add-to-wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: addToCartBtn.dataset.productId,
                    selectedSize
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showMessage(' Added to Wishlist!', true);
                        const stockDisplay = document.getElementById('stockDisplay');
                        const stockMessage = document.getElementById('stockMessage');

                        if (stockDisplay && data.updatedStock !== undefined) {
                            stockDisplay.textContent = `Stock: ${data.updatedStock}`;

                            if (stockMessage) {
                                if (data.updatedStock === 0) {
                                    stockMessage.innerHTML = `<p class="text-sm font-semibold text-red-500 mb-6">Out of Stock!</p>`;
                                } else if (data.updatedStock < 7) {
                                    stockMessage.innerHTML = `<p class="text-sm font-semibold text-red-500 mb-6">Hurry up! Only ${data.updatedStock} left</p>`;
                                } else {
                                    stockMessage.innerHTML = '';
                                }
                            }
                        }
                    } else {
                        showMessage(data.message || 'Error adding to wishlist.', false);
                    }
                })
                .catch(err => {
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
        body: JSON.stringify({ productId, selectedSize })
    })
    .then(res => res.json())
    .then(data => {
        const errorBox = document.getElementById('error-wishlist');

        if (data.success) {
            location.reload();
        } else {
            errorBox.textContent = data.message || 'Something went wrong';
            errorBox.classList.remove('hidden');

            // Optional: Hide after 5 seconds
            setTimeout(() => {
                errorBox.classList.add('hidden');
            }, 5000);
        }
    })
    .catch(err => {
        const errorBox = document.getElementById('error-message');
        errorBox.textContent = 'Network or server error';
        errorBox.classList.remove('hidden');

        setTimeout(() => {
            errorBox.classList.add('hidden');
        }, 5000);
    });
};

const removeFromWishlist = (productId, selectedSize) => {
    fetch('/delete-from-wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, selectedSize })
    }).then(res => res.json())
    .then(data => {
        if(data.success){
            location.reload();
        }else{
            alert('error delete-whislist');
        }
    })
}
