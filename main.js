// Stripe Configuration (Use your test publishable key)
const stripe = Stripe('pk_test_your_publishable_key_here');

document.addEventListener('DOMContentLoaded', function() {
    
    // ... [Keep all your existing DOMContentLoaded code until the form submission handler]

    // Modify your form submission handler to this:
    bookingForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        // Get form values
        const name = document.getElementById("name").value.trim();
        const service = document.getElementById("service").value;
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;

        // Validate inputs
        if (!name || !service || !date || !time) {
            showConfirmation("⚠️ Please fill in all fields!", "error");
            return;
        }

        const bookingDate = new Date(`${date}T${time}`);
        const now = new Date();

        // Prevent past bookings
        if (bookingDate < now) {
            showConfirmation("⚠️ You cannot book a past date/time.", "error");
            return;
        }

        // Get existing bookings or initialize empty array
        let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

        // Check for duplicate bookings
        const isDuplicate = bookings.some(
            b => b.service === service && b.date === date && b.time === time
        );

        if (isDuplicate) {
            showConfirmation("⚠️ This time slot is already booked for that service!", "error");
            return;
        }

        // Create booking object (but don't save yet)
        const booking = { name, service, date, time };

        // Show payment modal
        const modal = document.getElementById("payment-modal");
        modal.style.display = "block";

        // Initialize payment
        initializePayment(booking);
    });

    // Close modal when clicking X
    document.querySelector(".close").addEventListener("click", function() {
        document.getElementById("payment-modal").style.display = "none";
    });

    // Close modal when clicking outside
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("payment-modal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
    
    // ... [Keep all your existing helper functions]
});

// Payment Functions
async function initializePayment(booking) {
    try {
        // Calculate amount based on service (example logic)
        const servicePrices = {
            "Haircut": 3000, // $30.00
            "Massage": 5000, // $50.00
            "Facial Treatment": 4500,
            "Manicure": 2500,
            "Consultation": 1500
        };
        
        const amount = servicePrices[booking.service] || 3000;
        document.getElementById("payment-amount").textContent = (amount/100).toFixed(2);

        // Create Payment Intent on your backend would go here
        // For demo, we'll mock this step
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency: 'usd' })
        });
        
        // Mock response since we don't have a backend
        const mockClientSecret = "pi_mock_client_secret_123456";
        
        const elements = stripe.elements();
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
        
        document.getElementById("submit-payment").addEventListener("click", async () => {
            await handlePayment(mockClientSecret, booking);
        });
    } catch (err) {
        console.error("Payment initialization failed:", err);
        showPaymentMessage("⚠️ Payment initialization failed", "error");
    }
}

async function handlePayment(clientSecret, booking) {
    const submitButton = document.getElementById("submit-payment");
    submitButton.disabled = true;
    showPaymentMessage("Processing payment...", "success");

    try {
        // In a real app, you would use the real clientSecret from your backend
        const { error } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: window.location.href,
                receipt_email: "customer@example.com" // You would collect this in your form
            }
        });

        if (error) {
            showPaymentMessage(`⚠️ ${error.message}`, "error");
            submitButton.disabled = false;
            return;
        }

        // If payment succeeds (in real app, verify on your backend)
        completeBooking(booking);
    } catch (err) {
        console.error("Payment failed:", err);
        showPaymentMessage("⚠️ Payment failed", "error");
        submitButton.disabled = false;
    }
}

function completeBooking(booking) {
    // Save booking to localStorage
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    bookings.push(booking);
    localStorage.setItem("bookings", JSON.stringify(bookings));

    // Close payment modal
    document.getElementById("payment-modal").style.display = "none";

    // Show success message
    showConfirmation(
        `✅ Booking confirmed! ${booking.name}, your ${booking.service} on ${formatDate(booking.date)} at ${formatTime(booking.time)} is secured.`,
        "success"
    );

    // Refresh views
    generateTimeSlots(booking.date);
    showBookings();
    bookingForm.reset();
}

function showPaymentMessage(message, type) {
    const messageContainer = document.getElementById("payment-message");
    messageContainer.textContent = message;
    messageContainer.className = `confirmation-message ${type}`;
}
function addToWaitlist(booking) {
  if (isFullyBooked) {
    if (confirm("Fully booked! Join waitlist?")) {
      // Add to waitlist array in localStorage
    }
  }
}
// Add to DOMContentLoaded function
document.getElementById('toggle-dashboard').addEventListener('click', function() {
  const content = document.querySelector('.dashboard-content');
  const icon = this.querySelector('i');
  
  content.style.display = content.style.display === 'none' ? 'grid' : 'none';
  icon.classList.toggle('fa-chevron-down');
  icon.classList.toggle('fa-chevron-up');
});

// New function to update dashboard
function updateDashboard() {
  const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  const now = new Date();
  
  // Separate upcoming and past bookings
  const upcoming = bookings.filter(b => new Date(`${b.date}T${b.time}`) > now)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  
  const past = bookings.filter(b => new Date(`${b.date}T${b.time}`) <= now)
    .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
  
  // Render upcoming bookings
  const upcomingList = document.getElementById('upcoming-bookings');
  upcomingList.innerHTML = upcoming.length ? upcoming.slice(0, 3).map(booking => `
    <li>
      <div>
        <strong>${booking.service}</strong>
        <small>${formatDate(booking.date)} at ${formatTime(booking.time)}</small>
      </div>
      <button class="cancel-btn" data-id="${booking.date}-${booking.time}">
        <i class="fas fa-times"></i>
      </button>
    </li>
  `).join('') : '<li>No upcoming appointments</li>';
  
  // Render past bookings
  const pastList = document.getElementById('past-bookings');
  pastList.innerHTML = past.length ? past.slice(0, 3).map(booking => `
    <li>
      <div>
        <strong>${booking.service}</strong>
        <small>${formatDate(booking.date)} at ${formatTime(booking.time)}</small>
      </div>
    </li>
  `).join('') : '<li>No past appointments</li>';
  
  // Update stats
  document.getElementById('total-bookings').textContent = bookings.length;
  
  // Calculate favorite service
  if (bookings.length) {
    const serviceCount = {};
    bookings.forEach(b => {
      serviceCount[b.service] = (serviceCount[b.service] || 0) + 1;
    });
    const favorite = Object.entries(serviceCount).reduce((a, b) => 
      a[1] > b[1] ? a : b, ['', 0])[0];
    document.getElementById('favorite-service').textContent = favorite;
  }
  
  // Add cancel button handlers
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const [date, time] = this.dataset.id.split('-');
      cancelBooking(date, time);
    });
  });
}

// New cancel booking function
function cancelBooking(date, time) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    bookings = bookings.filter(b => !(b.date === date && b.time === time));
    localStorage.setItem("bookings", JSON.stringify(bookings));
    
    showConfirmation('Appointment cancelled successfully', 'success');
    updateDashboard();
    showBookings(); // Update main bookings list
  }
}

// Call this after any booking changes
updateDashboard();
// ... [Keep all your existing functions like showBookings, formatDate, etc.]
// Auth System - Add to your existing JavaScript
let currentUser = null;

// Initialize auth system
function initAuth() {
  // Load users from localStorage
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
  }
  
  // Check if user is already logged in
  const loggedInUser = localStorage.getItem('currentUser');
  if (loggedInUser) {
    currentUser = JSON.parse(loggedInUser);
    showUserProfile();
  }
  
  // Setup event listeners
  setupAuthUI();
}

// Show user profile when logged in
function showUserProfile() {
  document.getElementById('auth-btn').style.display = 'none';
  const profile = document.getElementById('user-profile');
  profile.style.display = 'flex';
  document.getElementById('username-display').textContent = currentUser.name;
}

// Setup auth UI interactions
function setupAuthUI() {
  const authBtn = document.getElementById('auth-btn');
  const authDropdown = document.getElementById('auth-dropdown');
  
  // Toggle auth dropdown
  authBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    authDropdown.classList.toggle('active');
  });
  
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = tab.dataset.tab;
      
      // Update tabs
      document.querySelectorAll('.auth-tab').forEach(t => 
        t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update forms
      document.querySelectorAll('.auth-form').forEach(form => 
        form.classList.remove('active'));
      document.getElementById(`${tabName}-form`).classList.add('active');
    });
  });
  
  // Login form
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    loginUser(email, password);
  });
  
  // Signup form
  document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    
    if (password !== confirm) {
      showConfirmation('Passwords do not match', 'error');
      return;
    }
    
    registerUser(name, email, password);
  });
  
  // Logout
  document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    logoutUser();
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    authDropdown.classList.remove('active');
  });
}

// User registration
function registerUser(name, email, password) {
  const users = JSON.parse(localStorage.getItem('users'));
  
  // Check if user exists
  if (users.some(user => user.email === email)) {
    showConfirmation('Email already registered', 'error');
    return;
  }
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password, // Note: In real app, hash passwords!
    joinDate: new Date().toISOString()
  };
  
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  // Auto-login
  currentUser = newUser;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  showUserProfile();
  document.getElementById('auth-dropdown').classList.remove('active');
  showConfirmation('Account created successfully!', 'success');
  
  // Clear form
  document.getElementById('signup-form').reset();
}

// User login
function loginUser(email, password) {
  const users = JSON.parse(localStorage.getItem('users'));
  const user = users.find(user => user.email === email && user.password === password);
  
  if (!user) {
    showConfirmation('Invalid email or password', 'error');
    return;
  }
  
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  showUserProfile();
  document.getElementById('auth-dropdown').classList.remove('active');
  showConfirmation(`Welcome back, ${user.name}!`, 'success');
  
  // Clear form
  document.getElementById('login-form').reset();
}

// User logout
function logoutUser() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  document.getElementById('user-profile').style.display = 'none';
  document.getElementById('auth-btn').style.display = 'flex';
  showConfirmation('You have been logged out', 'success');
}

// Initialize auth system when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  
  // Modify your existing booking form to check for logged in user
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
      if (!currentUser) {
        e.preventDefault();
        showConfirmation('Please login to book appointments', 'error');
        document.getElementById('auth-dropdown').classList.add('active');
        document.querySelector('.auth-tab[data-tab="login"]').click();
      }
    });
  }
});
