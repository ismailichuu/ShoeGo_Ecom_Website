
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
// document.addEventListener('DOMContentLoaded', () => {
//     const toggleButton = document.getElementById('sidebarToggle');
//     const sidebar = document.getElementById('sidebar');
//     const mainContent = document.getElementById('mainContent');

//     toggleButton.addEventListener('click', () => {
//       const isHidden = sidebar.classList.contains('-translate-x-full');

//       // Toggle sidebar
//       sidebar.classList.toggle('-translate-x-full');

//       // Adjust main content margin
//       if (isHidden) {
//         mainContent.classList.remove('ml-0');
//         mainContent.classList.add('ml-64');
//       } else {
//         mainContent.classList.remove('ml-64');
//         mainContent.classList.add('ml-0');
//       }
//     });
//   });

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

  imageBoxes.forEach(box => {
    box.addEventListener('click', () => {
      activeInputIndex = box.getAttribute('data-index');
      fileInputs[activeInputIndex].click();
    });
  });

  fileInputs.forEach(input => {
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      const errorMessage = document.getElementById('fileError'); // Select the <p> tag for error message

      // Clear any previous error message
      errorMessage.textContent = '';
      errorMessage.classList.add('hidden'); // Hide the error message initially

      if (!file) return;

      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!validTypes.includes(file.type)) {
        errorMessage.textContent = 'Only image files (jpg, jpeg, png, webp) are allowed.';
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

      canvas.toBlob(blob => {
        const newFile = new File([blob], "cropped.jpg", { type: "image/jpeg" });

        const dt = new DataTransfer();
        dt.items.add(newFile);

        fileInputs[activeInputIndex].files = dt.files;

        imageBoxes[activeInputIndex].innerHTML = `<img src="${canvas.toDataURL()}" class="h-32 object-cover rounded" />`;

        cropModal.classList.add('hidden');
        cropper.destroy();
        cropper = null;
      }, 'image/jpeg');
    });
  }
};

// Now handle dynamic content loading and call the function after page load
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
            initializeImageCropping(); // Call this after the content is injected
          })
          .catch(err => {
            console.error('Add product page is not loaded', err);
            contentArea.innerHTML = "<p class='text-red-500'>Failed to load add product.</p>";
          });
      }
    });
  }
});

function initializeSizeSelection() {
  const sizeButtons = document.querySelectorAll('.size-btn');
  const selectedSizesInput = document.getElementById('selectedSizes');
  const selectedSizes = new Set();

  sizeButtons.forEach(button => {
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

// size selection logic
document.querySelectorAll('.size-btn').forEach(button => {
  button.addEventListener('click', () => {
    button.classList.toggle('bg-gray-800');
    button.classList.toggle('text-white');
    button.classList.toggle('bg-gray-300');
    button.classList.toggle('text-black');

    const selected = Array.from(document.querySelectorAll('.size-btn.bg-gray-800'))
      .map(btn => btn.dataset.size);

    document.getElementById('selectedSizes').value = selected.join(',');
  });
});

//image of Product details page
document.addEventListener("DOMContentLoaded", function () {
  const mainImage = document.getElementById("mainImage");
  const thumbnails = document.querySelectorAll(".thumbnail-image");
  const wrappers = document.querySelectorAll(".thumbnail-wrapper");

  if (!mainImage || thumbnails.length === 0) return;

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      const newSrc = thumb.getAttribute("data-src");
      mainImage.setAttribute("src", newSrc);

      wrappers.forEach(wrapper => {
        wrapper.classList.remove("border-primary");
        wrapper.classList.add("border-transparent");
      });
      wrappers[index].classList.add("border-primary");
      wrappers[index].classList.remove("border-transparent");
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
thumbnails.forEach(thumbnail => {
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
    zoomedImage.src = "";
  });
}

// Close modal on background click
if (zoomModal) {

  zoomModal.addEventListener('click', (e) => {
    if (e.target === zoomModal) {
      zoomModal.classList.add('hidden');
      zoomedImage.src = "";
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

function editSizeSelection() {
  const sizeButtons = document.querySelectorAll('.size-btn');
  const selectedSizesInput = document.getElementById('selectedSizes');
  const selectedSizes = new Set(selectedSizesInput.value.split(',').filter(Boolean));

  sizeButtons.forEach(button => {
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
        errorMessage.textContent = 'Only image files (jpg, jpeg, png, webp) are allowed.';
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
        const newFile = new File([blob], "cropped.jpg", { type: "image/jpeg" });

        const dt = new DataTransfer();
        dt.items.add(newFile);

        fileInputs[activeInputIndex].files = dt.files;

        imageBoxes[activeInputIndex].innerHTML = `<img src="${canvas.toDataURL()}" class="h-32 object-cover rounded" />`;

        cropModal.classList.add('hidden');
        cropper.destroy();
        cropper = null;
      }, 'image/jpeg');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {

  const resendBtn = document.getElementById('resend-btn');
  const timerDisplay = document.getElementById('timer');
  const resendMessage = document.getElementById('resend-message');
  const emailElement = document.getElementById('email');
  const email = emailElement ? emailElement.textContent.trim() : null

  let countdown = 10; // 2 minutes in seconds
  function startTimer() {
    resendBtn.classList.add('hidden');
    resendMessage.classList.add('hidden');

    const interval = setInterval(() => {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} left`;

      if (countdown <= 0) {
        clearInterval(interval);
        timerDisplay.textContent = "Didn't receive the code?";
        resendBtn.classList.remove('hidden');
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
          }
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
})


  document.getElementById('profile').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const imgPreview = document.querySelector('img[alt="Profile Preview"]');
      imgPreview.src = URL.createObjectURL(file);
    }
  });

  function togglePasswordFields() {
    const fields = document.getElementById('passwordFields');
    fields.classList.toggle('hidden');
  }