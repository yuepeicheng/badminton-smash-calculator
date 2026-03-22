// ===== AUTHENTICATION MODULE =====
// All API calls go to the Spring Boot backend.

const API_BASE = 'http://localhost:8080';

let authMode = 'login'; // 'login' or 'register'

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});

async function checkSession() {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    updateAuthUI(null);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'X-Session-Id': sessionId }
    });
    const data = await res.json();
    if (data.success) {
      updateAuthUI({ username: data.username });
    } else {
      localStorage.removeItem('sessionId');
      localStorage.removeItem('username');
      updateAuthUI(null);
    }
  } catch {
    // Backend not reachable — use stored username for UI only
    const username = localStorage.getItem('username');
    updateAuthUI(username ? { username } : null);
  }
}

async function registerUser() {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!username || !password) {
    showAuthError('Please enter both username and password');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName: username })
    });
    const data = await res.json();

    if (!data.success) {
      showAuthError(data.error || 'Registration failed');
      return;
    }

    localStorage.setItem('sessionId', data.sessionId);
    localStorage.setItem('username', data.username);
    closeLoginModal();
    updateAuthUI({ username: data.username });
  } catch {
    showAuthError('Cannot connect to server. Make sure the backend is running.');
  }
}

async function loginUser() {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!username || !password) {
    showAuthError('Please enter both username and password');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!data.success) {
      showAuthError(data.error || 'Invalid username or password');
      return;
    }

    localStorage.setItem('sessionId', data.sessionId);
    localStorage.setItem('username', data.username);
    closeLoginModal();
    updateAuthUI({ username: data.username });
  } catch {
    showAuthError('Cannot connect to server. Make sure the backend is running.');
  }
}

async function logoutUser() {
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'X-Session-Id': sessionId }
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  localStorage.removeItem('sessionId');
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

async function saveSmashResult(speedMps) {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) { openLoginModal(); return; }

  const saveBtn = document.getElementById('btnSaveResult');
  const origText = saveBtn ? saveBtn.textContent : 'Save Result';

  try {
    const res = await fetch(`${API_BASE}/api/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId
      },
      body: JSON.stringify({ speedMps })
    });
    const data = await res.json();

    if (saveBtn) {
      if (data.success) {
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = 'var(--success)';
      } else {
        saveBtn.textContent = 'Error saving';
        saveBtn.style.background = '#ef4444';
      }
      setTimeout(() => {
        saveBtn.textContent = origText;
        saveBtn.style.background = '';
      }, 2000);
    }
  } catch {
    if (saveBtn) {
      saveBtn.textContent = 'Server offline';
      setTimeout(() => { saveBtn.textContent = origText; }, 2000);
    }
  }
}
