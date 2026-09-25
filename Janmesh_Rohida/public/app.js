const API_BASE = '/api';
let currentUser = null;
let authToken = localStorage.getItem('jwt_token') || null;

document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    fetchProfile();
  } else {
    updateUI();
  }

  fetchEvents();

  // Attach Form Submit Handlers
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('createEventForm').addEventListener('submit', handleCreateEvent);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

// Switch Tab between Login and Register
function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
  }
}

// Show Tab for Main Content (Events vs My Tickets)
function showTab(tabName) {
  const btnBrowse = document.getElementById('btnBrowseEvents');
  const btnTickets = document.getElementById('btnMyTickets');
  const eventsSec = document.getElementById('eventsSection');
  const ticketsSec = document.getElementById('ticketsSection');

  if (tabName === 'events') {
    eventsSec.style.display = 'block';
    ticketsSec.style.display = 'none';
    btnBrowse.classList.add('active');
    btnTickets.classList.remove('active');
    fetchEvents();
  } else {
    eventsSec.style.display = 'none';
    ticketsSec.style.display = 'block';
    btnTickets.classList.add('active');
    btnBrowse.classList.remove('active');
    fetchMyTickets();
  }
}

// Alert Helper
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alertBox');
  alertBox.className = `alert alert-${type}`;
  alertBox.innerText = message;
  alertBox.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 6000);
}

// Update UI according to login status and user role
function updateUI() {
  const userInfo = document.getElementById('userInfo');
  const logoutBtn = document.getElementById('logoutBtn');
  const authSection = document.getElementById('authSection');
  const createEventSection = document.getElementById('createEventSection');
  const btnMyTickets = document.getElementById('btnMyTickets');

  if (currentUser) {
    authSection.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    userInfo.innerHTML = `👤 <strong>${currentUser.name}</strong> (${currentUser.role})`;

    if (currentUser.role === 'Organizer') {
      createEventSection.style.display = 'block';
      btnMyTickets.style.display = 'none';
    } else {
      createEventSection.style.display = 'none';
      btnMyTickets.style.display = 'inline-block';
    }
  } else {
    authSection.style.display = 'block';
    logoutBtn.style.display = 'none';
    userInfo.innerText = 'Not logged in';
    createEventSection.style.display = 'none';
    btnMyTickets.style.display = 'none';
  }

  fetchEvents();
}

// Fetch Logged In Profile
async function fetchProfile() {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      currentUser = data.data;
      updateUI();
    } else {
      handleLogout();
    }
  } catch (err) {
    handleLogout();
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      authToken = data.token;
      localStorage.setItem('jwt_token', authToken);
      currentUser = data.data;
      showAlert('Login successful!', 'success');
      updateUI();
    } else {
      showAlert(data.message || 'Login failed');
    }
  } catch (err) {
    showAlert('Server connection error');
  }
}

// Handle Register
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      authToken = data.token;
      localStorage.setItem('jwt_token', authToken);
      currentUser = data.data;
      showAlert('Registration successful!', 'success');
      updateUI();
    } else {
      showAlert(data.message || 'Registration failed');
    }
  } catch (err) {
    showAlert('Server connection error');
  }
}

// Handle Logout
function handleLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('jwt_token');
  updateUI();
  showAlert('Logged out successfully', 'success');
}

// Fetch Events List
async function fetchEvents() {
  const category = document.getElementById('categoryFilter').value;
  const city = document.getElementById('citySearch').value;

  let url = `${API_BASE}/events?`;
  if (category) url += `category=${encodeURIComponent(category)}&`;
  if (city) url += `city=${encodeURIComponent(city)}&`;

  const grid = document.getElementById('eventsGrid');

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (res.ok && data.success) {
      if (data.data.length === 0) {
        grid.innerHTML = '<p class="empty-state">No events found matching your criteria.</p>';
        return;
      }

      grid.innerHTML = data.data.map(event => renderEventCard(event)).join('');
    } else {
      grid.innerHTML = `<p class="empty-state">Failed to load events: ${data.message}</p>`;
    }
  } catch (err) {
    grid.innerHTML = '<p class="empty-state">Failed to connect to backend server.</p>';
  }
}

// Render Single Event Card
function renderEventCard(event) {
  const available = event.availableTickets;
  const total = event.totalCapacity;
  const percentage = Math.round((available / total) * 100);
  const isSoldOut = available <= 0;

  const dateFormatted = new Date(event.eventDate).toLocaleString();

  let actionsHTML = '';
  if (currentUser && currentUser.role === 'Attendee') {
    actionsHTML = `
      <form class="booking-form" onsubmit="handleBookTicket(event, '${event.id}')">
        <input type="number" id="qty-${event.id}" min="1" max="${Math.max(1, available)}" value="1" ${isSoldOut ? 'disabled' : ''} required>
        <button type="submit" class="btn btn-primary btn-sm" ${isSoldOut ? 'disabled' : ''}>
          ${isSoldOut ? 'Sold Out' : 'Book Tickets'}
        </button>
      </form>
    `;
  } else if (currentUser && currentUser.role === 'Organizer' && event.organizerId === currentUser.id) {
    actionsHTML = `
      <div style="display: flex; gap: 8px; margin-top: 10px;">
        <button class="btn btn-secondary btn-sm" onclick="viewAttendees('${event.id}', '${event.title.replace(/'/g, "\\'")}')">View Attendees</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEvent('${event.id}')">Delete Event</button>
      </div>
    `;
  } else if (!currentUser) {
    actionsHTML = `<p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 10px;">Log in as Attendee to book tickets</p>`;
  }

  return `
    <div class="event-card">
      <div>
        <div class="event-header">
          <h4 class="event-title">${escapeHTML(event.title)}</h4>
          <span class="category-tag">${escapeHTML(event.category)}</span>
        </div>
        <div class="event-meta">
          <div>📅 ${dateFormatted}</div>
          <div>📍 ${escapeHTML(event.venue)}</div>
        </div>
        <p class="event-description">${escapeHTML(event.description)}</p>
      </div>

      <div>
        <div class="price-tag">₹${event.ticketPrice}</div>
        <div class="capacity-container">
          <div class="capacity-label">
            <span>Availability</span>
            <span><strong>${available}</strong> / ${total} tickets left</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${isSoldOut ? 'sold-out' : ''}" style="width: ${percentage}%"></div>
          </div>
        </div>
        ${actionsHTML}
      </div>
    </div>
  `;
}

// Handle Book Ticket
async function handleBookTicket(e, eventId) {
  e.preventDefault();
  if (!authToken) {
    showAlert('Please log in as an Attendee to book tickets');
    return;
  }

  const qtyInput = document.getElementById(`qty-${eventId}`);
  const quantity = parseInt(qtyInput.value, 10);

  try {
    const res = await fetch(`${API_BASE}/tickets/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        eventId,
        quantity,
        attendeeName: currentUser.name,
        attendeeEmail: currentUser.email
      })
    });

    const data = await res.json();

    if (res.status === 429) {
      showAlert('⚠️ Rate limit reached: Too many booking attempts. Please try again in a minute.', 'error');
    } else if (res.ok && data.success) {
      showAlert(`🎉 Success! Booked ${quantity} ticket(s). Booking Ref: ${data.data.bookingRef}`, 'success');
      fetchEvents();
    } else {
      showAlert(`Booking Failed: ${data.message}`, 'error');
    }
  } catch (err) {
    showAlert('Error submitting ticket booking request');
  }
}

// Handle Create Event (Organizer)
async function handleCreateEvent(e) {
  e.preventDefault();
  if (!authToken || currentUser?.role !== 'Organizer') {
    showAlert('Unauthorized: Organizer role required');
    return;
  }

  const payload = {
    title: document.getElementById('eventTitle').value,
    category: document.getElementById('eventCategory').value,
    eventDate: document.getElementById('eventDate').value,
    venue: document.getElementById('eventVenue').value,
    ticketPrice: document.getElementById('ticketPrice').value,
    totalCapacity: document.getElementById('totalCapacity').value,
    description: document.getElementById('eventDescription').value
  };

  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showAlert('Event published successfully!', 'success');
      document.getElementById('createEventForm').reset();
      fetchEvents();
    } else {
      showAlert(`Failed to create event: ${data.message}`);
    }
  } catch (err) {
    showAlert('Error publishing event');
  }
}

// Delete Event (Organizer)
async function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showAlert('Event deleted successfully', 'success');
      fetchEvents();
    } else {
      showAlert(`Delete failed: ${data.message}`);
    }
  } catch (err) {
    showAlert('Error deleting event');
  }
}

// Fetch My Tickets (Attendee)
async function fetchMyTickets() {
  const container = document.getElementById('ticketsList');

  try {
    const res = await fetch(`${API_BASE}/tickets/my-tickets`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    if (res.ok && data.success) {
      if (data.data.length === 0) {
        container.innerHTML = '<p class="empty-state">You have not booked any tickets yet.</p>';
        return;
      }

      container.innerHTML = data.data.map(ticket => `
        <div class="ticket-card ${ticket.status}">
          <div>
            <div class="ticket-ref">${escapeHTML(ticket.bookingRef)}</div>
            <h4 style="margin: 4px 0;">${escapeHTML(ticket.eventTitle)}</h4>
            <div style="font-size: 0.88rem; color: var(--color-text-muted);">
              Quantity: <strong>${ticket.quantity}</strong> | Total Paid: <strong>₹${ticket.totalPaid}</strong> | Booked: ${new Date(ticket.bookedAt).toLocaleString()}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="ticket-status ${ticket.status}">${ticket.status}</span>
            ${ticket.status === 'confirmed' ? `
              <button class="btn btn-danger btn-sm" onclick="cancelTicket('${ticket.id}')">Cancel Ticket</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<p class="empty-state">Failed to load tickets: ${data.message}</p>`;
    }
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Error connecting to server.</p>';
  }
}

// Cancel Ticket (Attendee)
async function cancelTicket(ticketId) {
  if (!confirm('Are you sure you want to cancel this ticket booking? Inventory will be restored.')) return;

  try {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showAlert('Ticket cancelled successfully and inventory restored', 'success');
      fetchMyTickets();
      fetchEvents();
    } else {
      showAlert(`Cancellation failed: ${data.message}`);
    }
  } catch (err) {
    showAlert('Error processing cancellation');
  }
}

// View Attendees for Event (Organizer)
async function viewAttendees(eventId, eventTitle) {
  const modal = document.getElementById('attendeesModal');
  const modalTitle = document.getElementById('attendeesModalTitle');
  const container = document.getElementById('attendeesListContainer');

  modalTitle.innerText = `Attendees for ${eventTitle}`;
  modal.style.display = 'flex';
  container.innerHTML = '<p>Loading attendees...</p>';

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendees`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    if (res.ok && data.success) {
      if (data.data.length === 0) {
        container.innerHTML = '<p class="empty-state">No attendees registered for this event yet.</p>';
        return;
      }

      container.innerHTML = `
        <table class="attendee-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Attendee Name</th>
              <th>Email</th>
              <th>Qty</th>
              <th>Total Paid</th>
            </tr>
          </thead>
          <tbody>
            ${data.data.map(a => `
              <tr>
                <td><strong>${escapeHTML(a.bookingRef)}</strong></td>
                <td>${escapeHTML(a.attendeeName)}</td>
                <td>${escapeHTML(a.attendeeEmail)}</td>
                <td>${a.quantity}</td>
                <td>₹${a.totalPaid}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = `<p class="empty-state">Failed to load attendees: ${data.message}</p>`;
    }
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Error fetching attendees list.</p>';
  }
}

function closeAttendeesModal() {
  document.getElementById('attendeesModal').style.display = 'none';
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
