/* eslint-disable no-unused-vars */

//otp input auto changing
const inputs = document.querySelectorAll('.otp');
inputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && inputs[index + 1]) {
      inputs[index + 1].focus();
    }
  });
});

//toggle button of admin
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');

  toggleButton.addEventListener('click', () => {
    const isHidden = sidebar.classList.contains('-translate-x-full');

    // Toggle sidebar
    sidebar.classList.toggle('-translate-x-full');

    // Adjust main content margin
    if (isHidden) {
      mainContent.classList.remove('ml-0');
      mainContent.classList.add('ml-64');
    } else {
      mainContent.classList.remove('ml-64');
      mainContent.classList.add('ml-0');
    }
  });
});

// size selection logic
document.querySelectorAll('.size-btn').forEach((button) => {
  button.addEventListener('click', () => {
    button.classList.toggle('bg-gray-800');
    button.classList.toggle('text-white');
    button.classList.toggle('bg-gray-300');
    button.classList.toggle('text-black');

    const selected = Array.from(
      document.querySelectorAll('.size-btn.bg-gray-800')
    ).map((btn) => btn.dataset.size);

    document.getElementById('selectedSizes').value = selected.join(',');
  });
});

//image of Product details page
document.addEventListener('DOMContentLoaded', function () {
  const mainImage = document.getElementById('mainImage');
  const thumbnails = document.querySelectorAll('.thumbnail-image');
  const wrappers = document.querySelectorAll('.thumbnail-wrapper');

  if (!mainImage || thumbnails.length === 0) return;

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
      const newSrc = thumb.getAttribute('data-src');
      mainImage.setAttribute('src', newSrc);

      wrappers.forEach((wrapper) => {
        wrapper.classList.remove('border-primary');
        wrapper.classList.add('border-transparent');
      });
      wrappers[index].classList.add('border-primary');
      wrappers[index].classList.remove('border-transparent');
    });
  });
});

//image zoom
const thumbnails = document.querySelectorAll('.thumbnail-image');
const mainImage = document.getElementById('mainImage');
const zoomModal = document.getElementById('zoomModal');
const zoomedImage = document.getElementById('zoomedImage');
const closeModal = document.getElementById('closeModal');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetZoomBtn = document.getElementById('resetZoomBtn');

let scale = 1;

// Thumbnail click updates main image
thumbnails.forEach((thumbnail) => {
  thumbnail.addEventListener('click', () => {
    const newSrc = thumbnail.getAttribute('data-src');
    mainImage.src = newSrc;
  });
});

// Open zoom modal
function openZoomModal(src) {
  zoomedImage.src = src;
  scale = 1;
  zoomedImage.style.transform = `scale(${scale})`;
  zoomModal.classList.remove('hidden');
}

// Close modal
if (closeModal) {
  closeModal.addEventListener('click', () => {
    zoomModal.classList.add('hidden');
    zoomedImage.src = '';
  });
}

// Close modal on background click
if (zoomModal) {
  zoomModal.addEventListener('click', (e) => {
    if (e.target === zoomModal) {
      zoomModal.classList.add('hidden');
      zoomedImage.src = '';
    }
  });
}

// Zoom in
if (zoomInBtn) {
  zoomInBtn.addEventListener('click', () => {
    scale += 0.2;
    zoomedImage.style.transform = `scale(${scale})`;
  });
  // Zoom out
  zoomOutBtn.addEventListener('click', () => {
    if (scale > 0.4) {
      scale -= 0.2;
      zoomedImage.style.transform = `scale(${scale})`;
    }
  });
}

// Reset zoom
if (resetZoomBtn) {
  resetZoomBtn.addEventListener('click', () => {
    scale = 1;
    zoomedImage.style.transform = `scale(1)`;
  });
}
// Expose function to global scope
window.openZoomModal = openZoomModal;

document.addEventListener('DOMContentLoaded', () => {
  const resendBtn = document.getElementById('resend-btn');
  const timerDisplay = document.getElementById('timer');
  const resendMessage = document.getElementById('resend-message');
  const emailElement = document.getElementById('email');
  const email = emailElement ? emailElement.textContent.trim() : null;

  let countdown = 10; // 2 minutes in seconds
  function startTimer() {
    if (resendBtn && resendMessage) {
      resendBtn.classList.add('hidden');
      resendMessage.classList.add('hidden');
    }

    const interval = setInterval(() => {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      if (timerDisplay) {
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} left`;
      }

      if (countdown <= 0) {
        clearInterval(interval);
        if (timerDisplay && resendBtn) {
          timerDisplay.textContent = "Didn't receive the code?";
          resendBtn.classList.remove('hidden');
        }
      }

      countdown--;
    }, 1000);
  }
  if (resendBtn) {
    resendBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      resendBtn.classList.add('hidden');
      resendMessage.classList.add('hidden');

      try {
        const response = await fetch('/resend-otp', {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ email }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (data.success) {
          resendMessage.classList.remove('hidden');

          // Show message for 3 seconds before starting timer
          setTimeout(() => {
            resendMessage.classList.add('hidden');
            countdown = 120;
            startTimer();
          }, 3000);
        } else {
          alert(data.message || 'Something went wrong');
        }
      } catch (err) {
        console.error(err);
        alert('Server error. Try again later.');
      }
    });
  }

  // Start timer when page loads
  window.onload = startTimer;
});

document.addEventListener('DOMContentLoaded', () => {
  let confirmAction = null;

  window.showModal = function (action, message = 'Are sure want to delete ?') {
    confirmAction = action;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('confirmModal').classList.remove('hidden');
  }

  window.hideModal = function () {
    confirmAction = null;
    document.getElementById('confirmModal').classList.add('hidden');
  }

  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (typeof confirmAction === 'function') {
      confirmAction();
    }

    hideModal();
  });
});
