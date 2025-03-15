// Add button ripple effect
document.querySelector('.btn').addEventListener('mousedown', function(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.className = 'btn-wave';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });

  // Phone number formatting and validation
  const phoneInput = document.getElementById('phone');
  phoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    // Convert to the appropriate format if necessary
    if (value.startsWith('07')) {
      // Convert to international format
      if (value.length >= 3) {
        value = '254' + value.substring(1);
      }
    }
    
    e.target.value = value;
  });

  // Form submission
  document.getElementById("mpesa-form").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const phoneNumber = document.getElementById("phone").value.trim();
    const amount = document.getElementById("amount").value.trim();
    const message = document.getElementById("message");
    const submitBtn = document.getElementById("submit-btn");
    const spinnerEl = submitBtn.querySelector(".spinner");
    const btnTextEl = submitBtn.querySelector(".btn-text");
    
    // Reset message
    message.className = "message info";
    message.textContent = "Processing payment...";
    
    // Show loading state
    submitBtn.disabled = true;
    spinnerEl.style.display = "inline-block";
    btnTextEl.textContent = "Processing...";
    
    // Show message with animation
    setTimeout(() => {
      message.classList.add("show");
    }, 10);
    
    try {
      const response = await fetch("http://localhost:5000/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, amount })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        message.className = "message success show";
        message.textContent = data.CustomerMessage || "Payment initiated successfully! Check your phone.";
        
        // Success animation
        submitBtn.style.backgroundColor = "var(--success-color)";
        setTimeout(() => {
          document.getElementById("mpesa-form").reset();
        }, 2000);
      } else {
        message.className = "message error show";
        message.textContent = "Error: " + (data.message || "Something went wrong");
      }
    } catch (error) {
      message.className = "message error show";
      message.textContent = "Payment failed. Please try again.";
    } finally {
      // Reset button state
      setTimeout(() => {
        submitBtn.disabled = false;
        spinnerEl.style.display = "none";
        btnTextEl.textContent = "Pay Now";
        submitBtn.style.backgroundColor = "";
      }, 1000);
    }
  });