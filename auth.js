// ===== AUTHENTICATION MODULE =====
// All data stored in localStorage — no backend required.

let authMode = 'login'; // 'login' or 'register'

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
 * Open the login modal, optionally on a specific tab.
 */
function openLoginModal(tab) {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchTab(tab || 'login');
    hideAuthError();
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
  }
}

/**
 * Close the login modal.
 */
function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

/**
 * Switch between Login and Register tabs.
 */
function switchTab(tab) {
  authMode = tab;
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const submitBtn = document.getElementById('modalSubmitBtn');
  const switchText = document.querySelector('.modal-switch-text');

  hideAuthError();

  if (tab === 'register') {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    if (submitBtn) submitBtn.textContent = 'Create Account';
    if (switchText) switchText.innerHTML = 'Already have an account? <a href="#" onclick="switchTab(\'login\'); return false;">Login here</a>';
  } else {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    if (submitBtn) submitBtn.textContent = 'Login';
    if (switchText) switchText.innerHTML = 'Don\'t have an account? <a href="#" onclick="switchTab(\'register\'); return false;">Register here</a>';
  }
}

/**
 * Submit the auth form based on current tab mode.
 */
function submitAuthForm() {
  if (authMode === 'register') {
    registerUser();
  } else {
    loginUser();
  }
}

/**
 * Update the UI based on login state.
 */
function updateAuthUI(userData) {
  const navLogin = document.getElementById('navLogin');
  const navUserInfo = document.getElementById('navUserInfo');
  const navUsername = document.getElementById('navUsername');
  const saveBtn = document.getElementById('btnSaveResult');

  if (userData) {
    if (navLogin) navLogin.classList.add('hidden');
    if (navUserInfo) navUserInfo.classList.remove('hidden');
    if (navUsername) navUsername.textContent = userData.username;
    if (saveBtn) saveBtn.classList.remove('hidden');
  } else {
    if (navLogin) navLogin.classList.remove('hidden');
    if (navUserInfo) navUserInfo.classList.add('hidden');
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
