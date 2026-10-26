// Quiz Demo - Phase 1 Foundation & Auth Client Application

let currentUser = null;

// DOM Elements
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const userHeaderWidget = document.getElementById('userHeaderWidget');
const dbStatusBadge = document.getElementById('dbStatusBadge');
const notificationArea = document.getElementById('notificationArea');

const loginForm = document.getElementById('loginForm');
const loginIdentifier = document.getElementById('loginIdentifier');
const loginPassword = document.getElementById('loginPassword');

const registerForm = document.getElementById('registerForm');
const regUsername = document.getElementById('regUsername');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const regRole = document.getElementById('regRole');

const quickFillPlayerBtn = document.getElementById('quickFillPlayerBtn');
const quickFillAdminBtn = document.getElementById('quickFillAdminBtn');

const bannerAvatar = document.getElementById('bannerAvatar');
const bannerUsername = document.getElementById('bannerUsername');
const bannerRoleBadge = document.getElementById('bannerRoleBadge');
const bannerEmail = document.getElementById('bannerEmail');
const logoutBtn = document.getElementById('logoutBtn');

const testPlayerEndpointBtn = document.getElementById('testPlayerEndpointBtn');
const testAdminEndpointBtn = document.getElementById('testAdminEndpointBtn');
const testResultBox = document.getElementById('testResultBox');
const resultStatusTag = document.getElementById('resultStatusTag');
const resultEndpoint = document.getElementById('resultEndpoint');
const resultBody = document.getElementById('resultBody');

const adminZone = document.getElementById('adminZone');
const adminUsersTableBody = document.getElementById('adminUsersTableBody');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const runAdminActionBtn = document.getElementById('runAdminActionBtn');

// Notification helper
function showNotification(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `<span>${message}</span>`;
  notificationArea.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 250);
  }, 4500);
}

// Check system health & database state
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    const data = await res.json();
    dbStatusBadge.className = 'status-pill status-connected';
    dbStatusBadge.innerHTML = `<span class="status-dot"></span><span>${data.database}</span>`;
  } catch (err) {
    dbStatusBadge.className = 'status-pill status-loading';
    dbStatusBadge.innerHTML = `<span class="status-dot"></span><span>DB Offline</span>`;
  }
}

// Update UI based on session state
function updateAuthUI(user) {
  currentUser = user;

  if (user) {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');

    bannerAvatar.textContent = user.username.charAt(0).toUpperCase();
    bannerUsername.textContent = user.username;
    bannerEmail.textContent = user.email || 'No email attached';

    bannerRoleBadge.textContent = user.role.toUpperCase();
    bannerRoleBadge.className = `badge badge-${user.role}`;

    userHeaderWidget.innerHTML = `
      <span>Signed in as <strong>${escapeHtml(user.username)}</strong></span>
      <span class="badge badge-${user.role}">${user.role}</span>
    `;

    if (user.role === 'admin') {
      adminZone.classList.remove('hidden');
      loadAdminUsers();
    } else {
      adminZone.classList.add('hidden');
    }
  } else {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    userHeaderWidget.innerHTML = '<span class="guest-text">Not logged in</span>';
    testResultBox.classList.add('hidden');
  }
}

// Escape HTML for XSS prevention
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fetch current user session
async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      updateAuthUI(data.user);
    } else {
      updateAuthUI(null);
    }
  } catch (err) {
    updateAuthUI(null);
  }
}

// Handle Registration
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = regUsername.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value;
  const role = regRole.value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.error || 'Registration failed.', 'error');
      return;
    }

    showNotification(`Registered successfully as ${data.user.role}!`, 'success');
    registerForm.reset();
    updateAuthUI(data.user);
  } catch (err) {
    showNotification('Network error during registration.', 'error');
  }
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const identifier = loginIdentifier.value.trim();
  const password = loginPassword.value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.error || 'Invalid login.', 'error');
      return;
    }

    showNotification(`Welcome back, ${data.user.username}!`, 'success');
    loginForm.reset();
    updateAuthUI(data.user);
  } catch (err) {
    showNotification('Network error during login.', 'error');
  }
});

// Handle Logout
logoutBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      showNotification('Logged out successfully.', 'info');
      updateAuthUI(null);
    }
  } catch (err) {
    showNotification('Failed to log out.', 'error');
  }
});

// QA Quick Fill Helpers
quickFillPlayerBtn.addEventListener('click', () => {
  loginIdentifier.value = 'player_qa';
  loginPassword.value = 'Password123!';
  showNotification('Filled QA Player test credentials.', 'info');
});

quickFillAdminBtn.addEventListener('click', () => {
  loginIdentifier.value = 'admin_qa';
  loginPassword.value = 'AdminPass123!';
  showNotification('Filled QA Admin test credentials.', 'info');
});

// Test Player Endpoint
testPlayerEndpointBtn.addEventListener('click', async () => {
  await executeEndpointTest('/api/player/dashboard');
});

// Test Admin Endpoint (verifies role restriction!)
testAdminEndpointBtn.addEventListener('click', async () => {
  await executeEndpointTest('/api/admin/overview');
});

// Helper for testing endpoints live
async function executeEndpointTest(endpoint) {
  testResultBox.classList.remove('hidden');
  resultEndpoint.textContent = endpoint;
  resultStatusTag.textContent = 'Calling...';
  resultStatusTag.className = 'status-tag';

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    resultStatusTag.textContent = `HTTP ${res.status} ${res.statusText || (res.status === 200 ? 'OK' : res.status === 403 ? 'Forbidden' : 'Error')}`;
    resultStatusTag.className = `status-tag ${res.status === 200 ? 'status-tag-200' : 'status-tag-403'}`;
    resultBody.textContent = JSON.stringify(data, null, 2);

    if (res.status === 200) {
      showNotification(`Endpoint ${endpoint} succeeded (HTTP 200).`, 'success');
    } else if (res.status === 403) {
      showNotification(`Access restriction confirmed: HTTP 403 Forbidden.`, 'error');
    }
  } catch (err) {
    resultStatusTag.textContent = 'Network Error';
    resultStatusTag.className = 'status-tag status-tag-403';
    resultBody.textContent = String(err);
  }
}

// Load users into Admin table
async function loadAdminUsers() {
  if (!currentUser || currentUser.role !== 'admin') return;

  adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="table-loading">Refreshing...</td></tr>';

  try {
    const res = await fetch('/api/admin/overview');
    if (!res.ok) {
      adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="table-error">Failed to load users.</td></tr>';
      return;
    }

    const data = await res.json();
    const users = data.users || [];

    if (users.length === 0) {
      adminUsersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No users registered yet.</td></tr>';
      return;
    }

    adminUsersTableBody.innerHTML = users.map((u) => `
      <tr>
        <td>#${u.id}</td>
        <td><strong>${escapeHtml(u.username)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge badge-${u.role}">${u.role}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString()} ${new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      </tr>
    `).join('');
  } catch (err) {
    adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="table-error">Error connecting to database.</td></tr>';
  }
}

refreshUsersBtn.addEventListener('click', loadAdminUsers);

// Admin Action Runner
runAdminActionBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/admin/system-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionName: 'database_integrity_ping' }),
    });

    const data = await res.json();
    if (res.ok) {
      showNotification(data.message, 'success');
    } else {
      showNotification(data.error || 'Action failed.', 'error');
    }
  } catch (err) {
    showNotification('Network error executing admin action.', 'error');
  }
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  checkSession();
});
