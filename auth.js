// ===== AUTHENTICATION MODULE =====
// All data stored in localStorage — no backend required.

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});

/**
 * Check if there's an active session and update the UI.
 */
function checkSession() {
  const username = localStorage.getItem('username');
  if (username) {
    updateAuthUI({ username });
  } else {
    updateAuthUI(null);
  }
}

/**
 * Register a new user (stores hashed-ish credentials in localStorage).
 */
function registerUser() {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!username || !password) {
    showAuthError('Please enter both username and password');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users') || '{}');

  if (users[username]) {
    showAuthError('Username already taken');
    return;
  }

  // Simple hash: btoa for basic obfuscation (not cryptographically secure,
  // but fine for a client-side-only app with no sensitive data).
  const passwordKey = btoa(username + ':' + password);
  users[username] = { passwordKey };
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('username', username);

  hideAuthError();
  closeLoginModal();
  updateAuthUI({ username });
}

/**
 * Login with username and password.
 */
function loginUser() {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!username || !password) {
    showAuthError('Please enter both username and password');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users') || '{}');
  const user = users[username];

  if (!user || user.passwordKey !== btoa(username + ':' + password)) {
    showAuthError('Invalid username or password');
    return;
  }

  localStorage.setItem('username', username);
  hideAuthError();
  closeLoginModal();
  updateAuthUI({ username });
}

/**
 * Logout the current user.
 */
function logoutUser() {
  localStorage.removeItem('username');
  updateAuthUI(null);
}

/**
 * Open the login modal.
 */
function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close the login modal.
 */
function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Update the UI based on login state.
 */
function updateAuthUI(userData) {
  const navLogin = document.getElementById('navLogin');
  const saveBtn = document.getElementById('btnSaveResult');

  if (userData) {
    if (navLogin) {
      navLogin.textContent = userData.username;
      navLogin.onclick = logoutUser;
      navLogin.title = 'Click to logout';
    }
    if (saveBtn) saveBtn.classList.remove('hidden');
  } else {
    if (navLogin) {
      navLogin.textContent = 'Login';
      navLogin.onclick = openLoginModal;
      navLogin.title = '';
    }
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
 * Save the current calculation result to localStorage.
 */
function saveSmashResult(speedMps) {
  const username = localStorage.getItem('username');
  if (!username) {
    openLoginModal();
    return;
  }

  const key = 'smashRecords_' + username;
  const records = JSON.parse(localStorage.getItem(key) || '[]');
  records.push({ speedMps, recordedAt: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(records));

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
}
