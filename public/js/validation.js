
//Strong Password Validation for Signup
document.addEventListener('DOMContentLoaded', () => {

  const form = document.querySelector('form');
  const password1 = document.getElementById('password1');
  const password2 = document.getElementById('password2');
  const password1Error = document.getElementById('password1-error');
  const password2Error = document.getElementById('password2-error');

  if (form) {

    form.addEventListener('submit', function (e) {
      let isValid = true;
      const password = password1.value;
      const confirmPassword = password2.value;

      // Reset previous messages
      password1Error.textContent = '';
      password2Error.textContent = '';
      password1Error.classList.add('hidden');
      password2Error.classList.add('hidden');

      // Strong password regex
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

      if (!strongPasswordRegex.test(password)) {
        password1Error.textContent = 'Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.';
        password1Error.classList.remove('hidden');
        isValid = false;
      }

      if (password !== confirmPassword) {
        password2Error.textContent = 'Passwords do not match.';
        password2Error.classList.remove('hidden');
        isValid = false;
      }
      setTimeout(() => {
        password1Error.classList.add('hidden');
        password2Error.classList.add('hidden');
      }, 6000);
      if (!isValid) e.preventDefault();
    });
  }
})

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-coupon');
  const fromInput = document.getElementById('activeFrom');
  const toInput = document.getElementById('activeTo');
  const errorMsg = document.getElementById('dateError');

  if (form) {

    form.addEventListener('submit', function (e) {
      const fromDate = new Date(fromInput.value);
      const toDate = new Date(toInput.value);

      if (fromDate >= toDate) {
        e.preventDefault();
        errorMsg.classList.remove('hidden');
        errorMsg.classList.add('block');
      } else {
        errorMsg.classList.add('hidden');
      }
    });
  }
  if (fromInput) {

    fromInput.addEventListener('input', () => errorMsg.classList.add('hidden'));
  }
  if (toInput) {
    toInput.addEventListener('input', () => errorMsg.classList.add('hidden'));
  }
});