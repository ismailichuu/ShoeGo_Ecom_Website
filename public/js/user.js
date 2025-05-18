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


