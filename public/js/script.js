
//otp input auto changing
const inputs = document.querySelectorAll('.otp');
inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && inputs[index + 1]) {
            inputs[index + 1].focus();
        }
    });
});


// const resendBtn = document.getElementById('resend-btn');
// const timerDisplay = document.getElementById('timer');
// const resendMessage = document.getElementById('resend-message');
// const emailElement = document.getElementById('email');
// const email = emailElement ? emailElement.textContent.trim() : null

// let countdown = 10; // 2 minutes in seconds

// function startTimer() {
//   resendBtn.classList.add('hidden');
//   resendMessage.classList.add('hidden');

//   const interval = setInterval(() => {
//     const minutes = Math.floor(countdown / 60);
//     const seconds = countdown % 60;
//     timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} left`;

//     if (countdown <= 0) {
//       clearInterval(interval);
//       timerDisplay.textContent = "Didn't receive the code?";
//       resendBtn.classList.remove('hidden');
//     }

//     countdown--;
//   }, 1000);
// }

// resendBtn.addEventListener('click', async (e) => {
//   e.preventDefault();
//   resendBtn.classList.add('hidden');
//   resendMessage.classList.add('hidden');
//   try {
//     const response = await fetch('/resend-otp', {
//       method: 'POST',
//       credentials: 'include',
//       body: JSON.stringify({ email}),
//       headers: {
//         'Content-Type': 'application/json',
//       }
//     });

//     const data = await response.json();
//     if (data.success) {
//       resendMessage.classList.remove('hidden');
//       countdown = 120;
//       startTimer();
//     } else {
//       alert(data.message || 'Something went wrong');
//     }
//   } catch (err) {
//     console.error(err);
//     alert('Server error. Try again later.');
//   } 
// });

// // Start timer when page loads
// window.onload = startTimer;
