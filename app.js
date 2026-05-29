/* ============================
   DẠ ÊM – APP LOGIC v2
   Real product images
   ============================*/

// ---- PRODUCTS DATA ----
// Images: product-dautam.jpg, product-mo.jpg, product-man.jpg, product-brandkit.jpg
const PRODUCTS = [
  {
    id: 1, name: "Dâu Tằm", nameEn: "Mulberry Wine",
    category: "red", price: 320000,
    vol: "650ml · 7–10% ABV",
    desc: "Vị ngọt thanh tự nhiên của dâu tằm chín mọng, kết hợp sắc đỏ thẫm quyến rũ. Phù hợp thưởng thức sau bữa tối.",
    badge: "Bán Chạy",
    img: "product-dautam.jpg"
  },
  {
    id: 2, name: "Rượu Mơ", nameEn: "Apricot Wine",
    category: "gold", price: 290000,
    vol: "650ml · 7–10% ABV",
    desc: "Hương mơ vàng rực rỡ, vị chua ngọt hài hòa, nhẹ nhàng và thơm ngát. Lý tưởng cho buổi họp mặt bạn bè.",
    badge: "Mới",
    img: "product-mo.jpg"
  },
  {
    id: 3, name: "Rượu Mận", nameEn: "Plum Wine",
    category: "red", price: 310000,
    vol: "650ml · 7–10% ABV",
    desc: "Mận chín mọng lên men tự nhiên, mang hương thơm phức tạp đậm đà. Màu tím sâu sang trọng và quý phái.",
    badge: null,
    img: "product-man.jpg"
  },
  {
    id: 4, name: "Hộp Quà Cao Cấp", nameEn: "Premium Gift Set",
    category: "red", price: 680000,
    vol: "1 chai + 2 ly · Certified Organic",
    desc: "Bộ quà tặng đặc biệt gồm 1 chai rượu hữu cơ Dạ Êm + 2 ly thuỷ tinh khắc logo. Kèm thiệp và phong bì sáp sang trọng.",
    badge: "Premium",
    img: "product-brandkit.jpg"
  }
];

// ---- CART ----
let cart = [];
try { cart = JSON.parse(localStorage.getItem('daem-cart') || '[]'); } catch(e) { cart = []; }

function saveCart() {
  try { localStorage.setItem('daem-cart', JSON.stringify(cart)); } catch(e) {}
  updateCartUI();
}

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  showToast(`🍷 Đã thêm "${product.name}" vào giỏ hàng`);
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else saveCart();
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  document.getElementById('cart-count').textContent = count;
  document.getElementById('cart-total').textContent = fmt(total);

  const el = document.getElementById('cart-items');
  if (cart.length === 0) {
    el.innerHTML = `<div class="cart-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.3">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      <p>Giỏ hàng trống</p>
    </div>`;
    return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.img}" alt="${item.name}" loading="lazy">
      </div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-flavor">${item.nameEn}</div>
        <div class="cart-item-price">${fmt(item.price)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
          <button class="remove-item" onclick="removeFromCart(${item.id})">✕ Xóa</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ---- CHECKOUT ----
function checkout() {
  if (cart.length === 0) { showToast('Giỏ hàng trống!'); return; }
  closeCart();
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('checkout-total').textContent = fmt(total);
  document.getElementById('checkout-items').innerHTML = cart.map(item => `
    <div class="checkout-item">
      <span>${item.name} × ${item.qty}</span>
      <span>${fmt(item.price * item.qty)}</span>
    </div>
  `).join('');
  openModal('checkout-modal');
}

function placeOrder() {
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cod';
  const msgs = {
    cod: '🎉 Đặt hàng thành công! Vui lòng chuẩn bị tiền mặt khi nhận hàng.',
    qr: '🎉 Đặt hàng thành công! Vui lòng hoàn tất thanh toán QR.',
    visa: '🎉 Đặt hàng thành công! Thẻ của bạn đã được xử lý.'
  };
  cart = []; saveCart();
  closeModal('checkout-modal');
  showToast(msgs[payment]);
}

// ---- RENDER PRODUCTS ----
function renderProducts(filter = 'all') {
  const grid = document.getElementById('products-grid');
  const list = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
  grid.innerHTML = list.map(p => `
    <div class="product-card" data-category="${p.category}">
      <div class="product-img">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <img src="${p.img}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-flavor">${p.nameEn}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-footer">
          <div class="product-price">
            ${fmt(p.price)}
            <span>${p.vol}</span>
          </div>
          <button class="add-to-cart" onclick="addToCart(${p.id})" title="Thêm vào giỏ">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ---- FILTER ----
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(btn.dataset.filter);
  });
});

// ---- SEARCH ----
document.getElementById('search-toggle').addEventListener('click', e => {
  e.stopPropagation();
  const bar = document.getElementById('search-bar');
  bar.classList.toggle('open');
  if (bar.classList.contains('open')) document.getElementById('search-input').focus();
});

document.getElementById('search-input').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  const res = document.getElementById('search-results');
  if (!q) { res.innerHTML = ''; return; }
  const matches = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
  );
  if (!matches.length) {
    res.innerHTML = `<div class="search-result-item" style="color:#a08060">Không tìm thấy sản phẩm</div>`;
    return;
  }
  res.innerHTML = matches.map(p => `
    <div class="search-result-item" onclick="goToProduct(${p.id})">
      <img src="${p.img}" style="width:36px;height:36px;object-fit:cover;border-radius:4px">
      <div>
        <div style="font-weight:700;color:#2d0a0a;font-size:0.85rem">${p.name}</div>
        <div style="font-size:0.73rem;color:#a08060">${fmt(p.price)}</div>
      </div>
    </div>
  `).join('');
});

function goToProduct(id) {
  document.getElementById('search-bar').classList.remove('open');
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-filter="all"]').classList.add('active');
  renderProducts('all');
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('click', e => {
  const bar = document.getElementById('search-bar');
  if (bar && !bar.contains(e.target) && e.target.id !== 'search-toggle') {
    bar.classList.remove('open');
  }
});

// ---- HEADER SCROLL ----
window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 60);
});

// ---- MOBILE NAV ----
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobile-nav').classList.toggle('open');
});
function closeMobileNav() {
  document.getElementById('mobile-nav').classList.remove('open');
}

// ── AUTH & USER SYSTEM ──────────────────────────

/* ---- User Store (localStorage) ---- */
const UserStore = {
  key: 'daem-users',
  sessionKey: 'daem-session',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; }
  },
  save(users) {
    localStorage.setItem(this.key, JSON.stringify(users));
  },
  find(email) {
    return this.getAll().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  add(user) {
    const users = this.getAll();
    users.push(user);
    this.save(users);
  },
  getSession() {
    try { return JSON.parse(sessionStorage.getItem(this.sessionKey) || 'null'); } catch { return null; }
  },
  setSession(user) {
    sessionStorage.setItem(this.sessionKey, JSON.stringify(user));
  },
  clearSession() {
    sessionStorage.removeItem(this.sessionKey);
  }
};

/* ---- Current User State ---- */
let currentUser = UserStore.getSession();

function initAuth() {
  currentUser = UserStore.getSession();
  renderHeaderUser();
}

function renderHeaderUser() {
  const toggle = document.getElementById('login-toggle');
  const dropdown = document.getElementById('user-dropdown');

  if (currentUser) {
    // Swap icon button → avatar button
    const initials = currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    toggle.outerHTML = `<button class="user-avatar-btn" id="login-toggle" onclick="toggleUserDropdown()" title="${currentUser.name}">${initials}</button>`;

    // Fill dropdown
    document.getElementById('user-info-panel').innerHTML = `
      <div class="u-avatar">${initials}</div>
      <div class="u-name">${currentUser.name}</div>
      <div class="u-email">${currentUser.email}</div>
      <span class="u-member">🌙 Thành Viên</span>
    `;
    document.getElementById('user-menu-items').innerHTML = `
      <button class="user-menu-item" onclick="showOrders()">🛍️ Đơn hàng của tôi</button>
      <button class="user-menu-item" onclick="showProfile()">👤 Hồ sơ cá nhân</button>
      <button class="user-menu-item" onclick="showWishlist()">❤️ Yêu thích</button>
      <div class="user-menu-divider"></div>
      <button class="user-menu-item danger" onclick="logout()">↩️ Đăng xuất</button>
    `;
    // Re-bind toggle
    document.getElementById('login-toggle').addEventListener('click', toggleUserDropdown);
  } else {
    // Ensure it shows icon
    const existing = document.getElementById('login-toggle');
    if (existing && existing.classList.contains('user-avatar-btn')) {
      existing.outerHTML = `<button class="icon-btn" id="login-toggle" aria-label="Login">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </button>`;
    }
    document.getElementById('user-info-panel').innerHTML = '';
    document.getElementById('user-menu-items').innerHTML = '';
    document.getElementById('login-toggle').addEventListener('click', () => openModal('login-modal'));
  }
}

function toggleUserDropdown() {
  document.getElementById('user-dropdown').classList.toggle('open');
}

// Close dropdown on outside click
document.addEventListener('click', e => {
  const wrap = document.querySelector('.user-menu-wrap');
  if (wrap && !wrap.contains(e.target)) {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.classList.remove('open');
  }
});

function logout() {
  UserStore.clearSession();
  currentUser = null;
  renderHeaderUser();
  document.getElementById('user-dropdown').classList.remove('open');
  showToast('👋 Đã đăng xuất. Hẹn gặp lại!');
}

function showOrders() {
  document.getElementById('user-dropdown').classList.remove('open');
  showToast('🛍️ Chức năng đang phát triển. Sẽ sớm ra mắt!');
}
function showProfile() {
  document.getElementById('user-dropdown').classList.remove('open');
  showToast('👤 Chức năng đang phát triển. Sẽ sớm ra mắt!');
}
function showWishlist() {
  document.getElementById('user-dropdown').classList.remove('open');
  showToast('❤️ Chức năng đang phát triển. Sẽ sớm ra mắt!');
}

/* ---- Init login toggle ---- */
document.getElementById('login-toggle').addEventListener('click', function() {
  if (currentUser) toggleUserDropdown();
  else openModal('login-modal');
});

/* ---- Helpers ---- */
function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  document.querySelectorAll('.error-msg').forEach(el => el.remove());
}
function showFieldError(inputEl, msg) {
  inputEl.classList.add('field-error');
  const span = document.createElement('span');
  span.className = 'error-msg';
  span.textContent = msg;
  inputEl.after(span);
}
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isValidPhone(p) { return /^[0-9]{9,11}$/.test(p.replace(/\s/g,'')); }

/* ---- LOGIN ---- */
function loginDemo() {
  clearFieldErrors();
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  const email = emailEl.value.trim();
  const pass = passEl.value;
  let ok = true;

  if (!email) { showFieldError(emailEl, 'Vui lòng nhập email'); ok = false; }
  else if (!isValidEmail(email)) { showFieldError(emailEl, 'Email không hợp lệ'); ok = false; }
  if (!pass) { showFieldError(passEl, 'Vui lòng nhập mật khẩu'); ok = false; }
  if (!ok) return;

  const user = UserStore.find(email);
  if (!user) { showFieldError(emailEl, 'Email chưa được đăng ký'); return; }
  if (user.password !== btoa(pass)) { showFieldError(passEl, 'Mật khẩu không đúng'); return; }

  UserStore.setSession(user);
  currentUser = user;
  closeModal('login-modal');
  renderHeaderUser();
  showToast(`✅ Chào mừng trở lại, ${user.name.split(' ').pop()}! 🌙`);
}

/* ---- SOCIAL LOGIN (mock) ---- */
function socialLogin(provider) {
  // In production: integrate OAuth. Here we create/find a mock social user.
  const mockName = provider === 'Google' ? 'Người dùng Google' : 'Người dùng Facebook';
  const mockEmail = provider === 'Google' ? 'user.google@gmail.com' : 'user.facebook@fb.com';
  let user = UserStore.find(mockEmail);
  if (!user) {
    user = { name: mockName, email: mockEmail, phone: '', password: '', provider, joined: new Date().toISOString() };
    UserStore.add(user);
  }
  UserStore.setSession(user);
  currentUser = user;
  closeModal('login-modal');
  renderHeaderUser();
  showToast(`✅ Đăng nhập với ${provider} thành công! Chào ${user.name} 🌙`);
}

/* ---- TAB SWITCH ---- */
function switchTab(tab) {
  clearFieldErrors();
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i===0 && tab==='login') || (i===1 && tab==='register'));
  });
  document.getElementById('login-tab').classList.toggle('active', tab==='login');
  document.getElementById('register-tab').classList.toggle('active', tab==='register');
  document.getElementById('forgot-tab').classList.remove('active');
  if (tab === 'register') {
    document.getElementById('reg-step-1').classList.remove('hidden');
    document.getElementById('reg-step-2').classList.add('hidden');
  }
}

/* ---- OTP flow ---- */
let otpTimer = null;
let otpSeconds = 120;
let generatedOTP = '';
let pendingUser = null;

function sendOTP() {
  clearFieldErrors();
  const nameEl = document.getElementById('reg-name');
  const emailEl = document.getElementById('reg-email');
  const phoneEl = document.getElementById('reg-phone');
  const passEl = document.getElementById('reg-password');
  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const phone = phoneEl.value.trim();
  const pass = passEl.value;
  let ok = true;

  if (!name || name.length < 2) { showFieldError(nameEl, 'Vui lòng nhập họ và tên'); ok = false; }
  if (!email) { showFieldError(emailEl, 'Vui lòng nhập email'); ok = false; }
  else if (!isValidEmail(email)) { showFieldError(emailEl, 'Email không hợp lệ'); ok = false; }
  else if (UserStore.find(email)) { showFieldError(emailEl, 'Email này đã được đăng ký'); ok = false; }
  if (!phone) { showFieldError(phoneEl, 'Vui lòng nhập số điện thoại'); ok = false; }
  else if (!isValidPhone(phone)) { showFieldError(phoneEl, 'Số điện thoại không hợp lệ (9-11 số)'); ok = false; }
  if (!pass || pass.length < 6) { showFieldError(passEl, 'Mật khẩu tối thiểu 6 ký tự'); ok = false; }
  if (!ok) return;

  // Save pending user
  pendingUser = { name, email, phone, password: btoa(pass), provider: 'email', joined: new Date().toISOString() };
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

  document.getElementById('reg-step-1').classList.add('hidden');
  document.getElementById('reg-step-2').classList.remove('hidden');
  document.getElementById('otp-phone-display').textContent = phone;

  document.querySelectorAll('.otp-input').forEach(i => { i.value = ''; i.classList.remove('filled'); });
  setTimeout(() => document.querySelectorAll('.otp-input')[0].focus(), 100);
  startOTPCountdown();

  // Demo: show OTP in toast. Production: call SMS API (VNPT, Twilio, etc.)
  showToast(`📱 OTP (demo): ${generatedOTP}`);
}

function startOTPCountdown() {
  if (otpTimer) clearInterval(otpTimer);
  otpSeconds = 120;
  const update = () => {
    otpSeconds--;
    const m = String(Math.floor(otpSeconds/60)).padStart(2,'0');
    const s = String(otpSeconds%60).padStart(2,'0');
    const cd = document.getElementById('otp-countdown');
    const rcd = document.getElementById('resend-countdown');
    if (cd) cd.textContent = m+':'+s;
    if (rcd) rcd.textContent = otpSeconds;
    if (otpSeconds <= 0) {
      clearInterval(otpTimer);
      if (cd) cd.textContent = '00:00';
      const rl = document.getElementById('resend-link');
      if (rl) { rl.innerHTML = 'Gửi lại mã OTP'; rl.classList.remove('disabled-link'); rl.classList.add('active-link'); }
    }
  };
  otpTimer = setInterval(update, 1000);
}

function resendOTP() {
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  document.querySelectorAll('.otp-input').forEach(i => { i.value=''; i.classList.remove('filled'); });
  document.querySelectorAll('.otp-input')[0].focus();
  const rl = document.getElementById('resend-link');
  if (rl) { rl.innerHTML = 'Gửi lại (chờ <span id="resend-countdown">120</span>s)'; rl.classList.add('disabled-link'); rl.classList.remove('active-link'); }
  startOTPCountdown();
  showToast(`📱 OTP mới (demo): ${generatedOTP}`);
}

function otpInput(el, idx) {
  el.value = el.value.replace(/[^0-9]/g,'');
  if (el.value) {
    el.classList.add('filled');
    const boxes = document.querySelectorAll('.otp-input');
    if (idx < 5) boxes[idx+1].focus();
    else verifyOTPAuto();
  } else el.classList.remove('filled');
}

function otpKeydown(el, idx) {
  if (event.key === 'Backspace' && !el.value && idx > 0) {
    const prev = document.querySelectorAll('.otp-input')[idx-1];
    prev.value=''; prev.classList.remove('filled'); prev.focus();
  }
}

function getEnteredOTP() {
  return Array.from(document.querySelectorAll('.otp-input')).map(i=>i.value).join('');
}
function verifyOTPAuto() {
  if (getEnteredOTP().length === 6) setTimeout(verifyOTP, 300);
}

function verifyOTP() {
  const entered = getEnteredOTP();
  if (entered.length < 6) { showToast('⚠️ Vui lòng nhập đủ 6 số OTP'); return; }

  if (entered === generatedOTP) {
    if (otpTimer) clearInterval(otpTimer);
    UserStore.add(pendingUser);
    UserStore.setSession(pendingUser);
    currentUser = pendingUser;

    // Show success state
    document.getElementById('reg-step-2').innerHTML = `
      <div class="success-state">
        <div class="success-icon">🎉</div>
        <h3>Đăng Ký Thành Công!</h3>
        <p>Chào mừng <strong>${currentUser.name}</strong> đến với Dạ Êm 🌙<br>Tài khoản của bạn đã được tạo.</p>
      </div>
    `;
    setTimeout(() => {
      closeModal('login-modal');
      renderHeaderUser();
      showToast(`🌙 Chào mừng ${currentUser.name.split(' ').pop()} gia nhập Dạ Êm!`);
    }, 1800);
  } else {
    document.querySelectorAll('.otp-input').forEach(i => {
      i.style.borderColor='#e53e3e';
      setTimeout(() => i.style.borderColor='', 1500);
    });
    showToast('❌ Mã OTP không đúng. Vui lòng thử lại!');
  }
}

function backToStep1() {
  if (otpTimer) clearInterval(otpTimer);
  document.getElementById('reg-step-2').classList.add('hidden');
  document.getElementById('reg-step-1').classList.remove('hidden');
}

function showForgotPassword() {
  clearFieldErrors();
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('forgot-tab').classList.add('active');
}
function backToLogin() {
  clearFieldErrors();
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('login-tab').classList.add('active');
}
function sendResetEmail() {
  closeModal('login-modal');
  showToast('📧 Email đặt lại mật khẩu đã được gửi!');
}

// ---- CART TOGGLE ----
document.getElementById('cart-toggle').addEventListener('click', () => {
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
});
function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
}

// ---- MODALS ----
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); });
});

// Payment switching
document.addEventListener('change', e => {
  if (e.target.name === 'payment') {
    document.getElementById('qr-section').classList.toggle('hidden', e.target.value !== 'qr');
    document.getElementById('visa-section').classList.toggle('hidden', e.target.value !== 'visa');
  }
});

// ---- CONTACT ----
function sendMessage(e) {
  e.preventDefault();
  showToast('✅ Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi sớm nhất.');
  e.target.reset();
}

// ---- CHAT ----
const botReplies = {
  'sản phẩm': 'Dạ Êm có 4 sản phẩm: Rượu Dâu Tằm, Rượu Mơ, Rượu Mận và Hộp Quà Cao Cấp. Tất cả 100% hữu cơ, không hóa chất! 🍷',
  'đặt hàng': 'Bạn có thể đặt hàng trực tiếp trên website hoặc gọi hotline 0938 753 455. Giao hàng toàn quốc!',
  'giao hàng': '🚚 2–3 ngày (Hà Nội/HCM), 3–5 ngày các tỉnh khác. Miễn phí cho đơn từ 500,000₫!',
  'thanh toán': 'Chúng tôi nhận COD, QR Banking và Visa/Mastercard. An toàn và bảo mật!',
  'giá': 'Giá từ 290,000₫ – 680,000₫/sản phẩm. Liên hệ để được báo giá sỉ số lượng lớn!',
  'hữu cơ': '🌿 100% certified organic, không chất bảo quản, không màu nhân tạo. Trái cây thuần Việt!',
  'quà': 'Hộp Quà Cao Cấp Dạ Êm gồm 1 chai rượu + 2 ly thuỷ tinh khắc logo + thiệp, giá 680,000₫ — rất phù hợp làm quà tặng!',
};

function toggleChat() {
  const panel = document.getElementById('chat-panel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    document.getElementById('chat-badge').style.display = 'none';
    document.getElementById('chat-messages').scrollTop = 9999;
  }
}
function quickReply(msg) { document.getElementById('chat-input').value = msg; sendChatMessage(); }
function chatKeyPress(e) { if (e.key === 'Enter') sendChatMessage(); }

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim(); if (!msg) return;
  addChatMsg(msg, 'user'); input.value = '';
  setTimeout(() => {
    const lower = msg.toLowerCase();
    let reply = 'Cảm ơn bạn đã liên hệ! Gọi hotline 0938 753 455 để được tư vấn trực tiếp nhé 🌙';
    for (const [k, v] of Object.entries(botReplies)) {
      if (lower.includes(k)) { reply = v; break; }
    }
    addChatMsg(reply, 'bot');
  }, 700);
}

function addChatMsg(text, sender) {
  const msgs = document.getElementById('chat-messages');
  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = `chat-msg ${sender}`;
  div.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${time}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ---- TOAST ----
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ---- FORMAT ----
function fmt(p) { return p.toLocaleString('vi-VN') + '₫'; }

// ---- AGE GATE ----
function enterSite() {
  const gate = document.getElementById('age-gate');
  gate.style.transition = 'opacity 0.5s ease'; gate.style.opacity = '0';
  setTimeout(() => {
    gate.style.display = 'none';
    document.getElementById('main-site').classList.remove('hidden');
    sessionStorage.setItem('age-ok', '1');
  }, 500);
}
function denyEntry() { window.location.href = 'https://google.com'; }

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('age-ok')) {
    document.getElementById('age-gate').style.display = 'none';
    document.getElementById('main-site').classList.remove('hidden');
  }
  initAuth();
  renderProducts();
  updateCartUI();

  // Scroll reveal
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.style.opacity = '1';
        en.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.about-card, .testimonial, .contact-item, .product-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
    obs.observe(el);
  });
});
