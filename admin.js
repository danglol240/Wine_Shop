/* ============================
   DẠ ÊM – ADMIN DASHBOARD JS
   ============================*/

// ── SECURITY GUARD ──
const adminSession = JSON.parse(sessionStorage.getItem('daem-admin') || 'null');
if (!adminSession || adminSession.role !== 'admin') {
  window.location.href = 'index.html';
}

// ── PRODUCTS REFERENCE ──
const PRODUCTS = [
  { id:1, name:'Dâu Tằm', nameEn:'Mulberry Wine', price:320000, img:'product-dautam.jpg', category:'red' },
  { id:2, name:'Rượu Mơ', nameEn:'Apricot Wine', price:290000, img:'product-mo.jpg', category:'gold' },
  { id:3, name:'Rượu Mận', nameEn:'Plum Wine', price:310000, img:'product-man.jpg', category:'red' },
  { id:4, name:'Hộp Quà Cao Cấp', nameEn:'Premium Gift Set', price:680000, img:'product-brandkit.jpg', category:'red' }
];

// ── DATA STORE ──
const Store = {
  orders() { try { return JSON.parse(localStorage.getItem('daem-orders') || '[]'); } catch { return []; } },
  users()  { try { return JSON.parse(localStorage.getItem('daem-users')  || '[]'); } catch { return []; } },
  inv()    { try { return JSON.parse(localStorage.getItem('daem-inventory') || '{}'); } catch { return {}; } },

  saveOrders(o) { localStorage.setItem('daem-orders', JSON.stringify(o)); },
  saveInv(i)    { localStorage.setItem('daem-inventory', JSON.stringify(i)); },

  seedDemoData() {
    if (localStorage.getItem('daem-demo-seeded')) return;
    const now = Date.now();
    const names = ['Nguyễn Lan Anh','Trần Minh Đức','Phạm Thị Hương','Lê Văn Khoa','Hoàng Thu Trang','Đỗ Quốc Bảo','Vũ Thị Mai','Bùi Tuấn Anh'];
    const phones = ['0901234567','0912345678','0923456789','0934567890','0945678901','0956789012','0967890123','0978901234'];
    const addrs = ['12 Nguyễn Huệ, Q1, TP.HCM','45 Hoàn Kiếm, Hà Nội','88 Bạch Đằng, Đà Nẵng','23 Lê Lợi, Huế','67 Trần Phú, Nha Trang'];
    const pays = ['cod','qr','visa'];
    const statuses = ['pending','confirmed','shipping','done','done','done'];
    const orders = [];
    for (let i = 0; i < 18; i++) {
      const numItems = Math.floor(Math.random()*2)+1;
      const items = [];
      const usedIds = new Set();
      for (let j = 0; j < numItems; j++) {
        let pid; do { pid = Math.floor(Math.random()*4)+1; } while (usedIds.has(pid));
        usedIds.add(pid);
        const p = PRODUCTS.find(p=>p.id===pid);
        items.push({...p, qty: Math.floor(Math.random()*3)+1});
      }
      const total = items.reduce((s,it)=>s+it.price*it.qty,0);
      const daysAgo = Math.floor(Math.random()*30);
      const nameIdx = i % names.length;
      orders.push({
        id: 'DEM'+( now - i*86400000 - Math.floor(Math.random()*3600000) ),
        date: new Date(now - daysAgo*86400000 - Math.floor(Math.random()*3600000)).toISOString(),
        customer: { name:names[nameIdx], phone:phones[nameIdx%phones.length], address:addrs[i%addrs.length], email: names[nameIdx].toLowerCase().replace(/\s/g,'.')+`${i}@gmail.com`, userId:null },
        items, total, payment:pays[i%pays.length], status:statuses[i%statuses.length]
      });
    }
    localStorage.setItem('daem-orders', JSON.stringify(orders));

    // Demo inventory
    const inv = {};
    PRODUCTS.forEach(p => { inv[p.id] = { stock: Math.floor(Math.random()*60)+20, sold: Math.floor(Math.random()*80)+10 }; });
    localStorage.setItem('daem-inventory', JSON.stringify(inv));
    localStorage.setItem('daem-demo-seeded','1');
  }
};

Store.seedDemoData();

// ── ROUTING ──
let currentPage = 'dashboard';

function goPage(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  const titles = { dashboard:'Tổng Quan', orders:'Hóa Đơn', inventory:'Kho Hàng', customers:'Khách Hàng', analytics:'Phân Tích' };
  document.getElementById('page-title').textContent = titles[page] || page;
  renderPage(page);
  updatePendingBadge();
}

function renderPage(page) {
  const c = document.getElementById('content');
  if (page === 'dashboard')  c.innerHTML = pageDashboard();
  else if (page === 'orders')    c.innerHTML = pageOrders();
  else if (page === 'inventory') c.innerHTML = pageInventory();
  else if (page === 'customers') c.innerHTML = pageCustomers();
  else if (page === 'analytics') c.innerHTML = pageAnalytics();
  afterRender(page);
}

function afterRender(page) {
  if (page === 'dashboard')  bindDashboard();
  if (page === 'inventory')  bindInventory();
  if (page === 'orders')     bindOrders();
  if (page === 'customers')  bindCustomers();
  if (page === 'analytics')  bindAnalytics();
}

function updatePendingBadge() {
  const pending = Store.orders().filter(o => o.status === 'pending').length;
  const badge = document.getElementById('pending-badge');
  if (badge) { badge.textContent = pending; badge.style.display = pending ? '' : 'none'; }
}

// ── HELPERS ──
const fmt = p => (p||0).toLocaleString('vi-VN') + '₫';
const fmtDate = d => new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
const fmtTime = d => new Date(d).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
const fmtDateTime = d => fmtDate(d) + ' ' + fmtTime(d);
const statusLabel = { pending:'Chờ xác nhận', confirmed:'Đã xác nhận', shipping:'Đang giao', done:'Hoàn thành', cancelled:'Đã hủy' };
const payLabel = { cod:'💵 COD', qr:'📱 QR', visa:'💳 Visa' };
const payClass = { cod:'pay-cod', qr:'pay-qr', visa:'pay-visa' };
function initials(name) { return (name||'?').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso))/1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return Math.floor(diff/60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff/3600) + ' giờ trước';
  return Math.floor(diff/86400) + ' ngày trước';
}
function showToast(msg) {
  const t = document.getElementById('a-toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─────────────────────────────────────────
// PAGE: DASHBOARD
// ─────────────────────────────────────────
function pageDashboard() {
  const orders = Store.orders();
  const users = Store.users();
  const revenue = orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
  const pending = orders.filter(o=>o.status==='pending').length;
  const recent = [...orders].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

  // Top products
  const soldMap = {};
  orders.filter(o=>o.status!=='cancelled').forEach(o => {
    o.items.forEach(it => {
      soldMap[it.id] = (soldMap[it.id]||0) + it.qty;
    });
  });
  const topProds = PRODUCTS.map(p=>({...p, sold:soldMap[p.id]||0})).sort((a,b)=>b.sold-a.sold);

  // Revenue last 7 days
  const days7 = [];
  for (let i=6; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
    const next = new Date(d); next.setDate(d.getDate()+1);
    const dayRev = orders.filter(o=>o.status!=='cancelled'&&new Date(o.date)>=d&&new Date(o.date)<next).reduce((s,o)=>s+o.total,0);
    days7.push({ label:['CN','T2','T3','T4','T5','T6','T7'][d.getDay()], rev:dayRev });
  }
  const maxRev = Math.max(...days7.map(d=>d.rev), 1);

  // Activity feed
  const allOrders = [...orders].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);

  return `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">Doanh Thu</span>
        <div class="stat-icon wine">💰</div>
      </div>
      <div class="stat-value">${fmt(revenue)}</div>
      <div class="stat-sub">Tổng tất cả đơn thành công</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">Đơn Hàng</span>
        <div class="stat-icon gold">🛍️</div>
      </div>
      <div class="stat-value">${orders.length}</div>
      <div class="stat-sub"><span class="up">▲ ${pending}</span> đang chờ xác nhận</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">Khách Hàng</span>
        <div class="stat-icon green">👥</div>
      </div>
      <div class="stat-value">${users.length}</div>
      <div class="stat-sub">Thành viên đã đăng ký</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">Sản Phẩm</span>
        <div class="stat-icon blue">🍷</div>
      </div>
      <div class="stat-value">${PRODUCTS.length}</div>
      <div class="stat-sub">Đang kinh doanh</div>
    </div>
  </div>

  <div class="grid-2 mb">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Doanh Thu 7 Ngày Qua</span>
      </div>
      <div class="card-body">
        <div class="bar-chart">
          ${days7.map(d=>`
            <div class="bar-group">
              <div class="bar-val">${d.rev>0?Math.round(d.rev/1000)+'k':''}</div>
              <div class="bar-fill" style="height:${Math.round((d.rev/maxRev)*100)}px;"></div>
              <div class="bar-label">${d.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Sản Phẩm Bán Chạy</span>
      </div>
      <div class="card-body">
        ${topProds.map((p,i)=>`
          <div class="top-product">
            <span class="tp-rank">${i+1}</span>
            <img src="${p.img}" class="tp-img" alt="${p.name}">
            <div class="tp-name">${p.name}<div class="tp-sold">${p.sold} chai đã bán</div></div>
            <div class="tp-rev">${fmt(p.price)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Đơn Hàng Gần Đây</span>
        <button class="btn btn-ghost btn-sm" onclick="goPage('orders')">Xem tất cả</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th>
          </tr></thead>
          <tbody>
            ${recent.map(o=>`
              <tr style="cursor:pointer" onclick="openOrderModal('${o.id}')">
                <td><code style="font-size:0.72rem;color:var(--wine)">${o.id.slice(-8)}</code></td>
                <td><strong>${o.customer.name}</strong><div style="font-size:0.72rem;color:var(--text-light)">${fmtDate(o.date)}</div></td>
                <td class="t-right"><strong>${fmt(o.total)}</strong></td>
                <td><span class="status status-${o.status}">${statusLabel[o.status]}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Hoạt Động Gần Đây</span></div>
      <div class="card-body">
        <div class="activity-list">
          ${allOrders.map(o=>`
            <div class="activity-item">
              <div class="activity-dot order">🧾</div>
              <div class="activity-text">
                <strong>${o.customer.name}</strong> đặt ${o.items.length} sản phẩm
                — <strong>${fmt(o.total)}</strong>
                <div style="font-size:0.74rem;color:var(--text-light);margin-top:2px">${o.items.map(i=>i.name+'×'+i.qty).join(', ')}</div>
              </div>
              <div class="activity-time">${timeAgo(o.date)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>
  `;
}
function bindDashboard() {}

// ─────────────────────────────────────────
// PAGE: ORDERS
// ─────────────────────────────────────────
let orderFilter = 'all';
let orderSearch = '';
let orderSort = 'date-desc';

function pageOrders() {
  const orders = Store.orders();
  const counts = { all:orders.length, pending:0, confirmed:0, shipping:0, done:0, cancelled:0 };
  orders.forEach(o => { if (counts[o.status]!==undefined) counts[o.status]++; });

  const filtered = orders
    .filter(o => orderFilter==='all' || o.status===orderFilter)
    .filter(o => !orderSearch || o.customer.name.toLowerCase().includes(orderSearch) || o.id.toLowerCase().includes(orderSearch) || (o.customer.phone||'').includes(orderSearch))
    .sort((a,b) => {
      if (orderSort==='date-desc') return new Date(b.date)-new Date(a.date);
      if (orderSort==='date-asc')  return new Date(a.date)-new Date(b.date);
      if (orderSort==='total-desc') return b.total-a.total;
      return 0;
    });

  const tabs = ['all','pending','confirmed','shipping','done','cancelled'];
  const tabLabel = { all:'Tất cả', pending:'Chờ xác nhận', confirmed:'Đã xác nhận', shipping:'Đang giao', done:'Hoàn thành', cancelled:'Đã hủy' };

  return `
  <div class="card mb">
    <div class="card-body" style="padding-bottom:0">
      <div style="display:flex;gap:0;border-bottom:2px solid var(--border);margin:-1.5rem -1.5rem 1rem;padding:0 1.5rem">
        ${tabs.map(t=>`
          <button onclick="setOrderFilter('${t}')" style="padding:0.75rem 1rem;border:none;background:none;cursor:pointer;font-size:0.8rem;font-weight:700;color:${orderFilter===t?'var(--wine)':'var(--text-light)'};border-bottom:${orderFilter===t?'2px solid var(--wine)':'2px solid transparent'};margin-bottom:-2px;transition:all 0.2s">
            ${tabLabel[t]} <span style="font-size:0.7rem;background:${orderFilter===t?'var(--wine)':'var(--parchment)'};color:${orderFilter===t?'white':'var(--text-light)'};padding:0.1rem 0.4rem;border-radius:50px;margin-left:0.25rem">${counts[t]}</span>
          </button>
        `).join('')}
      </div>
      <div class="filter-row" style="margin-bottom:1rem">
        <input id="order-search" type="text" placeholder="Tìm tên, SĐT, mã đơn..." value="${orderSearch}" oninput="setOrderSearch(this.value)" style="width:260px">
        <select id="order-sort" onchange="setOrderSort(this.value)">
          <option value="date-desc" ${orderSort==='date-desc'?'selected':''}>Mới nhất trước</option>
          <option value="date-asc" ${orderSort==='date-asc'?'selected':''}>Cũ nhất trước</option>
          <option value="total-desc" ${orderSort==='total-desc'?'selected':''}>Giá trị cao nhất</option>
        </select>
        <span style="font-size:0.78rem;color:var(--text-light);margin-left:auto">${filtered.length} đơn hàng</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Mã Đơn</th>
          <th>Khách Hàng</th>
          <th>Sản Phẩm</th>
          <th>Thanh Toán</th>
          <th class="t-right">Tổng Tiền</th>
          <th>Trạng Thái</th>
          <th>Ngày Đặt</th>
          <th>Thao Tác</th>
        </tr></thead>
        <tbody>
          ${filtered.length===0 ? `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🔍</div><p>Không tìm thấy đơn hàng nào</p></div></td></tr>` :
            filtered.map(o=>`
            <tr>
              <td><code style="font-size:0.74rem;color:var(--wine);font-family:monospace">${o.id.slice(-10)}</code></td>
              <td>
                <div style="display:flex;align-items:center;gap:0.5rem">
                  <div style="width:30px;height:30px;border-radius:50%;background:var(--wine);color:var(--gold-light);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;flex-shrink:0">${initials(o.customer.name)}</div>
                  <div>
                    <div style="font-weight:700;font-size:0.84rem;color:var(--wine-deep)">${o.customer.name}</div>
                    <div style="font-size:0.72rem;color:var(--text-light)">${o.customer.phone||'—'}</div>
                  </div>
                </div>
              </td>
              <td style="max-width:180px">
                <div style="font-size:0.78rem;color:var(--text-mid)">${o.items.map(i=>`${i.name} ×${i.qty}`).join('<br>')}</div>
              </td>
              <td><span class="pay-badge ${payClass[o.payment]||'pay-cod'}">${payLabel[o.payment]||o.payment}</span></td>
              <td class="t-right"><strong style="color:var(--wine);font-family:'Playfair Display',serif">${fmt(o.total)}</strong></td>
              <td>
                <select class="status-select" onchange="updateOrderStatus('${o.id}',this.value)" style="font-size:0.74rem;padding:0.2rem 0.4rem;border:1px solid var(--border);border-radius:4px;background:white;cursor:pointer">
                  ${['pending','confirmed','shipping','done','cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${statusLabel[s]}</option>`).join('')}
                </select>
              </td>
              <td style="font-size:0.78rem;color:var(--text-light);white-space:nowrap">${fmtDate(o.date)}<br>${fmtTime(o.date)}</td>
              <td>
                <div style="display:flex;gap:0.3rem">
                  <button class="btn btn-ghost btn-xs" onclick="openOrderModal('${o.id}')">👁 Chi tiết</button>
                  <button class="btn btn-xs" style="background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger)" onclick="deleteOrder('${o.id}')">🗑</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  `;
}

function setOrderFilter(f) { orderFilter=f; goPage('orders'); }
function setOrderSearch(v) { orderSearch=v.toLowerCase(); document.getElementById('content').innerHTML=pageOrders(); bindOrders(); }
function setOrderSort(v) { orderSort=v; document.getElementById('content').innerHTML=pageOrders(); bindOrders(); }
function bindOrders() {}

function updateOrderStatus(orderId, newStatus) {
  const orders = Store.orders();
  const o = orders.find(o=>o.id===orderId);
  if (o) { o.status=newStatus; Store.saveOrders(orders); updatePendingBadge(); showToast('✅ Đã cập nhật trạng thái đơn '+orderId.slice(-6)); }
}

function deleteOrder(orderId) {
  if (!confirm('Xác nhận xoá đơn hàng này?')) return;
  const orders = Store.orders().filter(o=>o.id!==orderId);
  Store.saveOrders(orders);
  goPage('orders');
  showToast('🗑 Đã xoá đơn hàng');
}

function openOrderModal(orderId) {
  const o = Store.orders().find(o=>o.id===orderId);
  if (!o) return;
  const modal = document.getElementById('order-modal');
  document.getElementById('order-modal-content').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem">
      <div>
        <div style="font-size:0.72rem;color:var(--text-light);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:0.25rem">Mã đơn hàng</div>
        <div style="font-family:monospace;font-size:1rem;font-weight:700;color:var(--wine)">${o.id}</div>
        <div style="font-size:0.78rem;color:var(--text-light);margin-top:0.25rem">${fmtDateTime(o.date)}</div>
      </div>
      <button onclick="closeOrderModal()" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:var(--text-light)">✕</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
      <div style="background:var(--cream);border-radius:8px;padding:1rem">
        <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-light);margin-bottom:0.75rem">Thông tin khách hàng</div>
        <div style="font-weight:700;color:var(--wine-deep);margin-bottom:0.2rem">${o.customer.name}</div>
        <div style="font-size:0.82rem;color:var(--text-mid)">${o.customer.phone||'—'}</div>
        <div style="font-size:0.82rem;color:var(--text-mid)">${o.customer.email||'—'}</div>
        <div style="font-size:0.82rem;color:var(--text-mid);margin-top:0.25rem">📍 ${o.customer.address||'—'}</div>
      </div>
      <div style="background:var(--cream);border-radius:8px;padding:1rem">
        <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-light);margin-bottom:0.75rem">Thanh toán & Trạng thái</div>
        <div style="margin-bottom:0.5rem"><span class="pay-badge ${payClass[o.payment]||'pay-cod'}">${payLabel[o.payment]||o.payment}</span></div>
        <div><span class="status status-${o.status}">${statusLabel[o.status]}</span></div>
      </div>
    </div>

    <div style="margin-bottom:1.5rem">
      <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-light);margin-bottom:0.75rem">Sản Phẩm</div>
      ${o.items.map(it=>`
        <div style="display:flex;align-items:center;gap:0.875rem;padding:0.75rem 0;border-bottom:1px solid var(--border)">
          <img src="${it.img}" style="width:44px;height:44px;object-fit:cover;border-radius:6px">
          <div style="flex:1">
            <div style="font-weight:700;font-size:0.88rem;color:var(--wine-deep)">${it.name}</div>
            <div style="font-size:0.76rem;color:var(--text-light)">${it.nameEn}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.8rem;color:var(--text-light)">×${it.qty}</div>
            <div style="font-weight:700;color:var(--wine);font-family:'Playfair Display',serif">${fmt(it.price*it.qty)}</div>
          </div>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding:0.875rem 0;font-size:1rem">
        <strong style="color:var(--text-mid)">Tổng cộng</strong>
        <strong style="color:var(--wine);font-family:'Playfair Display',serif;font-size:1.2rem">${fmt(o.total)}</strong>
      </div>
    </div>

    <div style="margin-bottom:1rem">
      <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-light);margin-bottom:0.5rem">Cập Nhật Trạng Thái</div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        ${['pending','confirmed','shipping','done','cancelled'].map(s=>`
          <button class="btn btn-sm ${o.status===s?'btn-primary':'btn-ghost'}" onclick="updateOrderStatus('${o.id}','${s}');closeOrderModal();goPage('orders')">${statusLabel[s]}</button>
        `).join('')}
      </div>
    </div>
  `;
  modal.classList.add('open');
}

function closeOrderModal() { document.getElementById('order-modal').classList.remove('open'); }
document.getElementById('order-modal').addEventListener('click', e => { if(e.target===document.getElementById('order-modal')) closeOrderModal(); });

// ─────────────────────────────────────────
// PAGE: INVENTORY
// ─────────────────────────────────────────
function pageInventory() {
  const inv = Store.inv();
  return `
  <div class="card mb">
    <div class="card-header">
      <span class="card-title">Quản Lý Kho Hàng</span>
      <span style="font-size:0.78rem;color:var(--text-light)">Chỉnh sửa số lượng tồn kho trực tiếp</span>
    </div>
    <div class="card-body">
      <div class="inv-grid">
        ${PRODUCTS.map(p=>{
          const stock = inv[p.id]?.stock ?? 100;
          const sold  = inv[p.id]?.sold  ?? 0;
          const maxCap = 150;
          const pct = Math.round((stock/maxCap)*100);
          const cls = pct>50?'high':pct>20?'medium':'low';
          const lowWarning = stock<15 ? `<div style="font-size:0.72rem;color:var(--danger);font-weight:700;margin-top:0.4rem">⚠️ Sắp hết hàng!</div>` : '';
          return `
          <div class="inv-card">
            <img src="${p.img}" class="inv-img" alt="${p.name}">
            <div class="inv-name">${p.name}</div>
            <div class="inv-sub">${p.nameEn} · ${fmt(p.price)}</div>
            <div class="stock-bar-wrap">
              <div class="stock-bar"><div class="stock-fill ${cls}" style="width:${pct}%"></div></div>
              <div class="stock-num">${stock}</div>
            </div>
            <div class="inv-stats">
              <span>Tồn kho: <strong>${stock} chai</strong></span>
              <span>Đã bán: <strong style="color:var(--success)">${sold}</strong></span>
            </div>
            ${lowWarning}
            <div class="inv-edit-row">
              <input type="number" id="inv-input-${p.id}" value="${stock}" min="0" max="9999" placeholder="Nhập số">
              <button class="btn btn-gold btn-sm" onclick="updateStock(${p.id})">Cập nhật</button>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title">Lịch Sử Xuất Kho (Đơn Hàng)</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Sản Phẩm</th><th class="t-center">Tổng Đã Bán</th><th class="t-center">Tồn Kho</th><th class="t-right">Doanh Thu</th><th>Trạng Thái</th></tr></thead>
        <tbody>
          ${PRODUCTS.map(p=>{
            const stock = inv[p.id]?.stock ?? 100;
            const sold  = inv[p.id]?.sold  ?? 0;
            const rev   = sold * p.price;
            const status = stock===0?'Hết hàng':stock<15?'Sắp hết':'Còn hàng';
            const sc = stock===0?'cancelled':stock<15?'pending':'done';
            return `<tr>
              <td><div style="display:flex;align-items:center;gap:0.75rem"><img src="${p.img}" style="width:36px;height:36px;object-fit:cover;border-radius:6px"><div><strong style="color:var(--wine-deep)">${p.name}</strong><div style="font-size:0.72rem;color:var(--text-light)">${p.nameEn}</div></div></div></td>
              <td class="t-center"><strong>${sold} chai</strong></td>
              <td class="t-center">${stock}</td>
              <td class="t-right"><strong style="color:var(--wine);font-family:'Playfair Display',serif">${fmt(rev)}</strong></td>
              <td><span class="status status-${sc}">${status}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>
  `;
}

function updateStock(productId) {
  const input = document.getElementById(`inv-input-${productId}`);
  const val = parseInt(input.value);
  if (isNaN(val)||val<0) { showToast('⚠️ Số lượng không hợp lệ'); return; }
  const inv = Store.inv();
  if (!inv[productId]) inv[productId] = { stock:val, sold:0 };
  else inv[productId].stock = val;
  Store.saveInv(inv);
  showToast('✅ Đã cập nhật tồn kho');
  goPage('inventory');
}

function bindInventory() {}

// ─────────────────────────────────────────
// PAGE: CUSTOMERS
// ─────────────────────────────────────────
let custSearch = '';

function pageCustomers() {
  const users = Store.users();
  const orders = Store.orders();

  // Enrich users with order data
  const enriched = users.map(u=>{
    const uOrders = orders.filter(o=>o.customer.userId===u.email || o.customer.email===u.email);
    const total = uOrders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
    const lastOrder = uOrders.length>0 ? uOrders.sort((a,b)=>new Date(b.date)-new Date(a.date))[0] : null;
    const favProduct = (() => {
      const cnt = {};
      uOrders.forEach(o=>o.items.forEach(it=>{ cnt[it.name]=(cnt[it.name]||0)+it.qty; }));
      return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
    })();
    return {...u, orderCount:uOrders.length, totalSpent:total, lastOrder, favProduct};
  });

  const filtered = enriched.filter(u=>
    !custSearch ||
    u.name.toLowerCase().includes(custSearch) ||
    u.email.toLowerCase().includes(custSearch) ||
    (u.phone||'').includes(custSearch)
  ).sort((a,b)=>b.totalSpent-a.totalSpent);

  // Also collect guest customers from orders
  const guestOrders = orders.filter(o=>!o.customer.userId);
  const guestMap = {};
  guestOrders.forEach(o=>{
    const k = o.customer.email||o.customer.phone||o.customer.name;
    if (!guestMap[k]) guestMap[k] = { name:o.customer.name, phone:o.customer.phone, email:o.customer.email, orderCount:0, totalSpent:0, isGuest:true };
    guestMap[k].orderCount++;
    if (o.status!=='cancelled') guestMap[k].totalSpent+=o.total;
  });
  const guests = Object.values(guestMap).filter(g=>
    !custSearch || g.name.toLowerCase().includes(custSearch) || (g.phone||'').includes(custSearch)
  ).sort((a,b)=>b.totalSpent-a.totalSpent).slice(0,10);

  return `
  <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:1.25rem">
    <div class="stat-card">
      <div class="stat-header"><span class="stat-label">Thành Viên</span><div class="stat-icon green">🌙</div></div>
      <div class="stat-value">${users.length}</div>
      <div class="stat-sub">Đã đăng ký tài khoản</div>
    </div>
    <div class="stat-card">
      <div class="stat-header"><span class="stat-label">Khách Vãng Lai</span><div class="stat-icon gold">🛍️</div></div>
      <div class="stat-value">${Object.keys(guestMap).length}</div>
      <div class="stat-sub">Mua không cần đăng ký</div>
    </div>
    <div class="stat-card">
      <div class="stat-header"><span class="stat-label">Chi Tiêu TB</span><div class="stat-icon wine">💰</div></div>
      <div class="stat-value">${enriched.length>0?fmt(Math.round(enriched.reduce((s,u)=>s+u.totalSpent,0)/enriched.length)):'—'}</div>
      <div class="stat-sub">Mỗi thành viên</div>
    </div>
  </div>

  <div class="card mb">
    <div class="card-header">
      <span class="card-title">Thành Viên Đã Đăng Ký</span>
      <input type="text" placeholder="Tìm khách hàng..." oninput="setCustSearch(this.value)" value="${custSearch}" style="padding:0.4rem 0.75rem;border:1px solid var(--border);border-radius:6px;font-size:0.82rem;width:220px">
    </div>
    <div class="card-body">
      ${filtered.length===0?`<div class="empty-state"><div class="empty-icon">👥</div><p>Chưa có thành viên nào</p></div>`:''}
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        ${filtered.map(u=>`
          <div class="cust-card">
            <div class="cust-avatar">${initials(u.name)}</div>
            <div style="flex:1">
              <div class="cust-name">${u.name}</div>
              <div class="cust-email">${u.email} ${u.phone?'· '+u.phone:''}</div>
              <div class="cust-tags">
                ${u.totalSpent>1000000?'<span class="cust-tag vip">⭐ VIP</span>':''}
                <span class="cust-tag">${u.orderCount} đơn hàng</span>
                ${u.provider&&u.provider!=='email'?`<span class="cust-tag">${u.provider}</span>`:''}
                ${u.favProduct?`<span class="cust-tag">🍷 ${u.favProduct}</span>`:''}
                <span class="cust-tag">Tham gia ${fmtDate(u.joined||new Date())}</span>
              </div>
            </div>
            <div class="cust-meta">
              <strong>${fmt(u.totalSpent)}</strong>
              Tổng chi tiêu
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title">Khách Hàng Mua Không Đăng Ký</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Họ tên</th><th>Liên hệ</th><th class="t-center">Số đơn</th><th class="t-right">Tổng chi tiêu</th></tr></thead>
        <tbody>
          ${guests.length===0?`<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">🛍️</div><p>Chưa có đơn từ khách vãng lai</p></div></td></tr>`:''}
          ${guests.map(g=>`
            <tr>
              <td><strong style="color:var(--wine-deep)">${g.name}</strong></td>
              <td style="font-size:0.82rem;color:var(--text-light)">${g.phone||'—'}<br>${g.email||'—'}</td>
              <td class="t-center">${g.orderCount}</td>
              <td class="t-right"><strong style="color:var(--wine);font-family:'Playfair Display',serif">${fmt(g.totalSpent)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  `;
}

function setCustSearch(v) { custSearch=v.toLowerCase(); document.getElementById('content').innerHTML=pageCustomers(); bindCustomers(); }
function bindCustomers() {}

// ─────────────────────────────────────────
// PAGE: ANALYTICS
// ─────────────────────────────────────────
function pageAnalytics() {
  const orders = Store.orders().filter(o=>o.status!=='cancelled');
  const inv = Store.inv();

  // Revenue by product
  const revByProduct = {};
  const qtyByProduct = {};
  orders.forEach(o=>o.items.forEach(it=>{
    revByProduct[it.id] = (revByProduct[it.id]||0) + it.price*it.qty;
    qtyByProduct[it.id] = (qtyByProduct[it.id]||0) + it.qty;
  }));
  const totalRev = Object.values(revByProduct).reduce((s,v)=>s+v,0)||1;

  // Revenue by payment
  const revByPay = { cod:0, qr:0, visa:0 };
  const cntByPay = { cod:0, qr:0, visa:0 };
  orders.forEach(o=>{ revByPay[o.payment]=(revByPay[o.payment]||0)+o.total; cntByPay[o.payment]=(cntByPay[o.payment]||0)+1; });
  const totalPayRev = Object.values(revByPay).reduce((s,v)=>s+v,0)||1;

  // Monthly revenue (last 6 months)
  const months = [];
  for (let i=5; i>=0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-i); d.setHours(0,0,0,0);
    const next = new Date(d); next.setMonth(d.getMonth()+1);
    const rev = orders.filter(o=>new Date(o.date)>=d&&new Date(o.date)<next).reduce((s,o)=>s+o.total,0);
    const cnt = orders.filter(o=>new Date(o.date)>=d&&new Date(o.date)<next).length;
    months.push({ label:(d.getMonth()+1)+'/'+d.getFullYear().toString().slice(2), rev, cnt });
  }
  const maxMonthRev = Math.max(...months.map(m=>m.rev),1);

  // Donut data
  const donutColors = ['#7a1a1a','#c9a96e','#5a1a5a','#1a5a3a'];

  // Status breakdown
  const allOrders = Store.orders();
  const statusCnt = {};
  allOrders.forEach(o=>{ statusCnt[o.status]=(statusCnt[o.status]||0)+1; });

  return `
  <div class="stats-grid" style="margin-bottom:1.25rem">
    <div class="stat-card">
      <div class="stat-header"><span class="stat-label">Tổng Doanh Thu</span><div class="stat-icon wine">💰</div></div>
      <div class="stat-value">${fmt(totalRev)}</div>
      <div class="stat-sub">Đơn hoàn thành + đang xử lý</div>
    </div>
    <div class="stat-card">
      <div class="stat-header"><span class="stat-label">Số Đơn</span><div class="stat-icon gold">📋</div></div>
      <div class="stat-value">${allOrders.length}</div>
      <div class="stat-sub">Tất cả trạng thái</div>
    </div>
    <div class="stat-card">
      <div class="stat-header"><span class="stat-label">Giá Trị TB</span><div class="stat-icon green">📊</div></div>
      <div class="stat-value">${orders.length>0?fmt(Math.round(totalRev/orders.length)):'—'}</div>
      <div class="stat-sub">Mỗi đơn hàng</div>
    </div>
    <div class="stat-card">
      <div class="stat-header"><span class="stat-label">Tổng Chai Bán</span><div class="stat-icon blue">🍷</div></div>
      <div class="stat-value">${Object.values(qtyByProduct).reduce((s,v)=>s+v,0)}</div>
      <div class="stat-sub">Từ tất cả đơn hàng</div>
    </div>
  </div>

  <div class="card mb">
    <div class="card-header"><span class="card-title">Doanh Thu Theo Tháng (6 Tháng Gần Nhất)</span></div>
    <div class="card-body">
      <div class="bar-chart" style="height:160px">
        ${months.map(m=>`
          <div class="bar-group">
            <div class="bar-val" style="font-size:0.7rem">${m.rev>0?Math.round(m.rev/1000)+'k':''}</div>
            <div class="bar-fill" style="height:${Math.max(Math.round((m.rev/maxMonthRev)*140),m.rev>0?4:2)}px;background:var(--wine)"></div>
            <div class="bar-label">${m.label}</div>
            <div class="bar-label" style="color:var(--text-light)">${m.cnt} đơn</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header"><span class="card-title">Doanh Thu Theo Sản Phẩm</span></div>
      <div class="card-body">
        ${PRODUCTS.map((p,i)=>{
          const rev = revByProduct[p.id]||0;
          const pct = Math.round((rev/totalRev)*100);
          return `
          <div style="margin-bottom:1rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem">
              <div style="display:flex;align-items:center;gap:0.5rem">
                <img src="${p.img}" style="width:28px;height:28px;object-fit:cover;border-radius:4px">
                <span style="font-size:0.82rem;font-weight:700;color:var(--wine-deep)">${p.name}</span>
              </div>
              <div style="text-align:right">
                <span style="font-size:0.82rem;font-weight:700;color:var(--wine)">${fmt(rev)}</span>
                <span style="font-size:0.72rem;color:var(--text-light);margin-left:0.35rem">${pct}%</span>
              </div>
            </div>
            <div style="height:6px;background:var(--parchment);border-radius:50px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${donutColors[i]};border-radius:50px;transition:width 0.5s ease"></div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-light);margin-top:0.2rem">${qtyByProduct[p.id]||0} chai · ${fmt(p.price)}/chai</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Phương Thức Thanh Toán</span></div>
      <div class="card-body">
        ${[
          {key:'cod',label:'Tiền mặt COD',color:'#ed8936'},
          {key:'qr',label:'QR Banking',color:'#4299e1'},
          {key:'visa',label:'Visa / Mastercard',color:'#9f7aea'}
        ].map(pay=>{
          const pct = Math.round((revByPay[pay.key]/totalPayRev)*100)||0;
          return `
          <div style="margin-bottom:1.25rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem">
              <span style="font-size:0.84rem;font-weight:700;color:var(--text-mid)">${pay.label}</span>
              <span style="font-size:0.82rem;font-weight:700;color:var(--wine)">${pct}% · ${cntByPay[pay.key]||0} đơn</span>
            </div>
            <div style="height:8px;background:var(--parchment);border-radius:50px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${pay.color};border-radius:50px;transition:width 0.5s ease"></div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-light);margin-top:0.2rem">${fmt(revByPay[pay.key])}</div>
          </div>`;
        }).join('')}

        <div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:0.5rem">
          <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-light);margin-bottom:0.75rem">Trạng Thái Đơn Hàng</div>
          ${Object.entries(statusLabel).map(([k,v])=>{
            const cnt = statusCnt[k]||0;
            const pct = Math.round((cnt/Math.max(allOrders.length,1))*100);
            return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;font-size:0.8rem">
              <span class="status status-${k}" style="min-width:110px">${v}</span>
              <div style="flex:1;height:5px;background:var(--parchment);border-radius:50px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:var(--wine);border-radius:50px"></div>
              </div>
              <span style="font-weight:700;color:var(--text-mid);min-width:20px">${cnt}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  </div>
  `;
}
function bindAnalytics() {}

// ── GLOBAL SEARCH ──
function globalSearch(v) {
  if (!v.trim()) return;
  const q = v.toLowerCase();
  const orders = Store.orders().filter(o =>
    o.customer.name.toLowerCase().includes(q) ||
    o.id.toLowerCase().includes(q) ||
    (o.customer.phone||'').includes(q)
  );
  if (orders.length > 0) {
    orderSearch = q; goPage('orders');
  }
}

// ── SIDEBAR TOGGLE ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}

// ── LOGOUT ──
function adminLogout() {
  sessionStorage.removeItem('daem-admin');
  window.location.href = 'index.html';
}

// ── INIT ──
goPage('dashboard');
updatePendingBadge();
