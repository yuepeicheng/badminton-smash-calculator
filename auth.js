// ===== AUTHENTICATION MODULE =====
// All data stored in localStorage — no backend required.

let authMode = 'login'; // 'login' or 'register'

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});

function checkSession() {
  const username = localStorage.getItem('username');
  updateAuthUI(username ? { username } : null);
}

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

  users[username] = { passwordKey: btoa(username + ':' + password) };
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('username', username);

  closeLoginModal();
  updateAuthUI({ username });
}

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
  closeLoginModal();
  updateAuthUI({ username });
}

function logoutUser() {
  localStorage.removeItem('username');
  updateAuthUI(null);
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setAuthMode('login');
  document.getElementById('authUsername').value = '';
  document.getElementById('authPassword').value = '';
  hideAuthError();
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function setAuthMode(mode) {
  authMode = mode;
  const title = document.getElementById('modalTitle');
  const submitBtn = document.getElementById('modalSubmitBtn');
  const switchLink = document.getElementById('modalSwitchLink');
  const switchMsg = document.getElementById('modalSwitchMsg');

  if (mode === 'register') {
    if (title) title.textContent = 'Create Account';
    if (submitBtn) submitBtn.textContent = 'Create Account';
    if (switchMsg) switchMsg.textContent = 'Already have an account?';
    if (switchLink) switchLink.textContent = 'Login';
  } else {
    if (title) title.textContent = 'Login';
    if (submitBtn) submitBtn.textContent = 'Login';
    if (switchMsg) switchMsg.textContent = "Don't have an account?";
    if (switchLink) switchLink.textContent = 'Register';
  }
  hideAuthError();
}

function toggleAuthMode() {
  setAuthMode(authMode === 'login' ? 'register' : 'login');
}

function submitAuthForm() {
  if (authMode === 'register') {
    registerUser();
  } else {
    loginUser();
  }
}

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

function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function hideAuthError() {
  const el = document.getElementById('authError');
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

function saveSmashResult(speedMps) {
  const username = localStorage.getItem('username');
  if (!username) { openLoginModal(); return; }

  const key = 'smashRecords_' + username;
  const records = JSON.parse(localStorage.getItem(key) || '[]');
  records.push({ speedMps, recordedAt: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(records));

  const saveBtn = document.getElementById('btnSaveResult');
  if (saveBtn) {
    const orig = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    saveBtn.style.background = 'var(--success)';
    setTimeout(() => { saveBtn.textContent = orig; saveBtn.style.background = ''; }, 2000);
  }
}
