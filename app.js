/**
 * ============================================================
 * SecureID – app.js  (Frontend Logic)
 * ============================================================
 */

// ---- State ----
let currentUser = null;
let currentPage = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setupForms();
  setupPasswordStrength();
  // Auto-uppercase verify code input
  const ci = document.getElementById('verifyCode');
  if (ci) ci.addEventListener('input', () => { ci.value = ci.value.toUpperCase(); });
});

// ============================================================
// AUTH CHECK
// ============================================================
async function checkAuth() {
  try {
    const res = await fetch('/api/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      setLoggedIn(true);
      navigate('dashboard');
    } else {
      setLoggedIn(false);
      navigate('landing');
    }
  } catch {
    setLoggedIn(false);
    navigate('landing');
  } finally {
    hideLoading();
  }
}

function setLoggedIn(loggedIn) {
  document.querySelectorAll('.auth-only').forEach(el => el.classList.toggle('hidden', !loggedIn));
  document.querySelectorAll('.guest-only').forEach(el => el.classList.toggle('hidden', loggedIn));
}

// ============================================================
// NAVIGATION
// ============================================================
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

  const pageMap = {
    landing: 'pageLanding',
    login: 'pageLogin',
    register: 'pageRegister',
    dashboard: 'pageDashboard',
    share: 'pageShare',
    verify: 'pageVerify'
  };

  const el = document.getElementById(pageMap[page]);
  if (el) el.classList.remove('hidden');
  currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'dashboard' && currentUser) populateDashboard();
}

// ============================================================
// LOADING
// ============================================================
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.style.display = 'none', 500);
  }
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
let toastTimer;
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toastMessage');
  const icon = document.getElementById('toastIcon');

  toast.className = `toast toast--${type} show`;
  msg.textContent = message;

  const icons = { success: 'ph-duotone ph-check-circle', error: 'ph-duotone ph-x-circle', info: 'ph-duotone ph-info' };
  icon.className = icons[type] || icons.info;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => hideToast(), 4000);
}

function hideToast() {
  document.getElementById('toast').classList.remove('show');
}

// ============================================================
// FORMS SETUP
// ============================================================
function setupForms() {
  // Register
  const rf = document.getElementById('registerForm');
  if (rf) rf.addEventListener('submit', handleRegister);

  // Login
  const lf = document.getElementById('loginForm');
  if (lf) lf.addEventListener('submit', handleLogin);

  // Profile
  const pf = document.getElementById('profileForm');
  if (pf) pf.addEventListener('submit', handleProfileUpdate);

  // Verify
  const vf = document.getElementById('verifyForm');
  if (vf) vf.addEventListener('submit', handleVerify);
}

// ============================================================
// REGISTER
// ============================================================
async function handleRegister(e) {
  e.preventDefault();
  clearErrors(['regNameError', 'regEmailError', 'regPasswordError']);

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  // Client-side validation
  let valid = true;
  if (name.length < 2) { setError('regNameError', 'Name must be at least 2 characters.'); valid = false; }
  if (!isValidEmail(email)) { setError('regEmailError', 'Enter a valid email address.'); valid = false; }
  if (password.length < 6) { setError('regPasswordError', 'Password must be at least 6 characters.'); valid = false; }
  if (!valid) return;

  setLoading('registerBtn', true);
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      setLoggedIn(true);
      showToast('Account created! Welcome to SecureID!', 'success');
      navigate('dashboard');
    } else {
      showToast(data.message || 'Registration failed.', 'error');
    }
  } catch {
    showToast('Network error. Please try again.', 'error');
  } finally {
    setLoading('registerBtn', false);
  }
}

// ============================================================
// LOGIN
// ============================================================
async function handleLogin(e) {
  e.preventDefault();
  clearErrors(['loginEmailError', 'loginPasswordError']);

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  let valid = true;
  if (!isValidEmail(email)) { setError('loginEmailError', 'Enter a valid email.'); valid = false; }
  if (!password) { setError('loginPasswordError', 'Password is required.'); valid = false; }
  if (!valid) return;

  setLoading('loginBtn', true);
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      setLoggedIn(true);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      navigate('dashboard');
    } else {
      showToast(data.message || 'Login failed.', 'error');
    }
  } catch {
    showToast('Network error. Please try again.', 'error');
  } finally {
    setLoading('loginBtn', false);
  }
}

// ============================================================
// LOGOUT
// ============================================================
async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch {}
  currentUser = null;
  setLoggedIn(false);
  showToast('Logged out successfully.', 'info');
  navigate('landing');
}

// ============================================================
// DASHBOARD POPULATION
// ============================================================
function populateDashboard() {
  if (!currentUser) return;

  document.getElementById('dashboardGreeting').textContent =
    `Welcome back, ${currentUser.name}! 👋`;

  // ID Card
  document.getElementById('idCardName').textContent = currentUser.name;
  document.getElementById('idCardEmail').textContent = currentUser.email;
  document.getElementById('idCardMockId').textContent = currentUser.mockId;
  document.getElementById('idCardInitial').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('idCardDate').textContent = 'Issued: ' + new Date(currentUser.createdAt || Date.now()).toLocaleDateString();

  // Profile form
  document.getElementById('profileName').value = currentUser.name;
  document.getElementById('profileEmail').value = currentUser.email;
  document.getElementById('profileMockId').value = currentUser.mockId;
}

// ============================================================
// PROFILE UPDATE
// ============================================================
async function handleProfileUpdate(e) {
  e.preventDefault();
  const name = document.getElementById('profileName').value.trim();
  const mockId = document.getElementById('profileMockId').value.trim();

  if (name.length < 2) { showToast('Name must be at least 2 characters.', 'error'); return; }

  setLoading('profileSaveBtn', true);
  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mockId })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      populateDashboard();
      showToast('Profile updated successfully!', 'success');
    } else {
      showToast(data.message || 'Update failed.', 'error');
    }
  } catch {
    showToast('Network error. Please try again.', 'error');
  } finally {
    setLoading('profileSaveBtn', false);
  }
}

// ============================================================
// GENERATE SHARE CODE
// ============================================================
async function generateShareCode() {
  setLoading('generateCodeBtn', true);
  try {
    const res = await fetch('/api/share', { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      document.getElementById('shareCodeValue').textContent = data.code;
      document.getElementById('shareCodeExpiry').textContent = data.expiresIn;
      document.getElementById('codeDisplay').classList.remove('hidden');
      showToast('Share code generated! Valid for 15 minutes.', 'success');
    } else {
      showToast(data.message || 'Could not generate code.', 'error');
    }
  } catch {
    showToast('Network error. Please try again.', 'error');
  } finally {
    setLoading('generateCodeBtn', false);
  }
}

function copyCode() {
  const code = document.getElementById('shareCodeValue').textContent;
  navigator.clipboard.writeText(code).then(() => showToast('Code copied to clipboard!', 'success'));
}

function shareViaLink() {
  const code = document.getElementById('shareCodeValue').textContent;
  const url = `${window.location.origin}?verify=${code}`;
  navigator.clipboard.writeText(url).then(() => showToast('Verify link copied to clipboard!', 'success'));
}

// ============================================================
// VERIFY IDENTITY
// ============================================================
async function handleVerify(e) {
  e.preventDefault();
  clearErrors(['verifyCodeError']);

  const code = document.getElementById('verifyCode').value.trim().toUpperCase();
  if (code.length !== 8) { setError('verifyCodeError', 'Please enter a valid 8-character code.'); return; }

  // Hide previous results
  document.getElementById('verifySuccess').classList.add('hidden');
  document.getElementById('verifyError').classList.add('hidden');

  setLoading('verifyBtn', true);
  try {
    const res = await fetch(`/api/verify/${code}`);
    const data = await res.json();

    if (data.success) {
      const id = data.identity;
      document.getElementById('verifiedName').textContent = id.name;
      document.getElementById('verifiedEmail').textContent = id.email;
      document.getElementById('verifiedMockId').textContent = id.mockId;
      document.getElementById('verifiedExpiry').textContent = id.codeExpiresIn;
      document.getElementById('verifiedAt').textContent = new Date(id.verifiedAt).toLocaleString();
      document.getElementById('verifySuccess').classList.remove('hidden');
      showToast('Identity verified successfully!', 'success');
    } else {
      document.getElementById('verifyErrorMessage').textContent = data.message || 'Verification failed.';
      document.getElementById('verifyError').classList.remove('hidden');
      showToast(data.message || 'Verification failed.', 'error');
    }
  } catch {
    showToast('Network error. Please try again.', 'error');
  } finally {
    setLoading('verifyBtn', false);
  }
}

function resetVerify() {
  document.getElementById('verifyCode').value = '';
  document.getElementById('verifySuccess').classList.add('hidden');
  document.getElementById('verifyError').classList.add('hidden');
  clearErrors(['verifyCodeError']);
}

// ============================================================
// PASSWORD VISIBILITY
// ============================================================
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'ph ph-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'ph ph-eye';
  }
}

// ============================================================
// PASSWORD STRENGTH METER
// ============================================================
function setupPasswordStrength() {
  const pw = document.getElementById('regPassword');
  if (!pw) return;
  pw.addEventListener('input', () => {
    const val = pw.value;
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill) return;

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = [
      { width: '0%', color: 'transparent', text: '' },
      { width: '20%', color: '#ef4444', text: 'Very Weak' },
      { width: '40%', color: '#f59e0b', text: 'Weak' },
      { width: '60%', color: '#eab308', text: 'Fair' },
      { width: '80%', color: '#22c55e', text: 'Strong' },
      { width: '100%', color: '#10b981', text: 'Very Strong' }
    ];
    const lvl = levels[Math.min(score, 5)];
    fill.style.width = lvl.width;
    fill.style.background = lvl.color;
    label.textContent = val ? lvl.text : '';
    label.style.color = lvl.color;
  });
}

// ============================================================
// UTILITY HELPERS
// ============================================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors(ids) {
  ids.forEach(id => setError(id, ''));
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

// ============================================================
// URL PARAM: auto-fill verify code from share link
// ============================================================
(function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('verify');
  if (code) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        navigate('verify');
        const input = document.getElementById('verifyCode');
        if (input) input.value = code.toUpperCase();
      }, 600);
    });
  }
})();
