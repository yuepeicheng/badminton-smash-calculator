// ===== AUTHENTICATION MODULE =====
// Handles login, register, logout, and session management.

const API_BASE = 'http://localhost:8080/api';

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});

/**
 * Check if there's an active session and update the UI.
 */
async function checkSession() {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    updateAuthUI(null);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'X-Session-Id': sessionId }
    });
    const data = await res.json();

    if (data.success) {
      updateAuthUI(data);
    } else {
      // Session expired or invalid
      localStorage.removeItem('sessionId');
      localStorage.removeItem('username');
      updateAuthUI(null);
    }
  } catch (err) {
    console.log('Backend not running — auth features disabled');
    updateAuthUI(null);
  }
}

/**
 * Register a new user.
 */
async function registerUser() {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const displayName = username; // Keep it simple

  if (!username || !password) {
    showAuthError('Please enter both username and password');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('sessionId', data.sessionId);
      localStorage.setItem('username', data.username);
      hideAuthError();
      updateAuthUI({ username: data.username });
    } else {
      showAuthError(data.error || 'Registration failed');
    }
  } catch (err) {
    showAuthError('Cannot connect to server. Is the backend running?');
  }
}

/**
 * Login with username and password.
 */
async function loginUser() {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!username || !password) {
    showAuthError('Please enter both username and password');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('sessionId', data.sessionId);
      localStorage.setItem('username', data.username);
      hideAuthError();
      updateAuthUI({ username: data.username, displayName: data.displayName });
    } else {
      showAuthError(data.error || 'Login failed');
    }
  } catch (err) {
    showAuthError('Cannot connect to server. Is the backend running?');
  }
}

/**
 * Logout the current user.
 */
async function logoutUser() {
  const sessionId = localStorage.getItem('sessionId');

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId }
    });
  } catch (err) {
    // Logout locally even if server call fails
  }

  localStorage.removeItem('sessionId');
  localStorage.removeItem('username');
  updateAuthUI(null);
}

/**
 * Update the UI based on login state.
 */
function updateAuthUI(userData) {
  const loginSection = document.getElementById('loginSection');
  const userInfo = document.getElementById('userInfo');
  const navLogin = document.getElementById('navLogin');
  const saveBtn = document.getElementById('btnSaveResult');

  if (userData) {
    // User is logged in
    if (loginSection) loginSection.classList.add('hidden');
    if (userInfo) {
      userInfo.classList.remove('hidden');
      const nameSpan = document.getElementById('loggedInName');
      if (nameSpan) nameSpan.textContent = userData.username || userData.displayName;
    }
    if (navLogin) navLogin.textContent = userData.username;
    if (saveBtn) saveBtn.classList.remove('hidden');
  } else {
    // User is not logged in
    if (loginSection) loginSection.classList.remove('hidden');
    if (userInfo) userInfo.classList.add('hidden');
    if (navLogin) navLogin.textContent = 'Login';
    if (saveBtn) saveBtn.classList.add('hidden');
  }
}

/**
 * Show an auth error message.
 */
function showAuthError(msg) {
  const errorEl = document.getElementById('authError');
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }
}

/**
 * Hide the auth error message.
 */
function hideAuthError() {
  const errorEl = document.getElementById('authError');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }
}

/**
 * Save the current calculation result to the backend.
 * Called from app.js after a successful calculation.
 */
async function saveSmashResult(speedMps) {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    alert('Please log in to save results');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId
      },
      body: JSON.stringify({ speedMps })
    });
    const data = await res.json();

    if (data.success) {
      // Show brief success feedback
      const saveBtn = document.getElementById('btnSaveResult');
      if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = 'var(--success)';
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '';
        }, 2000);
      }
    } else {
      alert('Failed to save: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Cannot connect to server. Is the backend running?');
  }
}
