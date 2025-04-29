
//otp input auto changing
const inputs = document.querySelectorAll('.otp');
inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && inputs[index + 1]) {
            inputs[index + 1].focus();
        }
    });
});


  // countdown for resend otp
  let timeLeft = 2 * 60; 
  
  function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    document.getElementById("timer").textContent = `${minutes}:${seconds.toString().padStart(2, '0')} left`;

    if (timeLeft === 0) {
      document.getElementById("resend-btn").classList.remove('hidden');
    }

    if (timeLeft > 0) {
      timeLeft--;
    } else {
      clearInterval(timerInterval);
    }
  }

  const timerInterval = setInterval(updateTimer, 1000);

  updateTimer();
