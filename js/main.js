// Tesla Clone - Main JS

// Password show/hide toggle (delegated — works for any .pw-toggle button)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.pw-toggle');
  if (!btn) return;
  const input = document.getElementById(btn.dataset.target);
  if (!input) return;
  const reveal = input.type === 'password';
  input.type = reveal ? 'text' : 'password';
  const eye = btn.querySelector('.pw-eye');
  const off = btn.querySelector('.pw-eye-off');
  if (eye) eye.style.display = reveal ? 'none' : '';
  if (off) off.style.display = reveal ? '' : 'none';
  btn.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
});

// ─── Searchable country dropdown (Tesla markets) ─────────────────────────────
var TESLA_COUNTRIES = [
  'United States','Canada','Mexico','Puerto Rico',
  'United Kingdom','Ireland','France','Germany','Austria','Belgium','Netherlands',
  'Luxembourg','Switzerland','Italy','Spain','Portugal','Denmark','Sweden','Norway',
  'Finland','Iceland','Poland','Czech Republic','Hungary','Romania','Greece','Croatia',
  'Slovenia',
  'United Arab Emirates','Israel','Jordan','Qatar',
  'China','Hong Kong','Macau','Taiwan','Japan','South Korea','Singapore','Thailand',
  'Malaysia','India','Australia','New Zealand'
];

function initCountrySelect(root) {
  var input = root.querySelector('.country-search');
  var list = root.querySelector('.country-options');
  if (!input || !list) return;
  var activeIndex = -1;

  function render(filter) {
    var q = (filter || '').trim().toLowerCase();
    var matches = TESLA_COUNTRIES.filter(function (c) { return !q || c.toLowerCase().indexOf(q) !== -1; });
    list.innerHTML = '';
    if (!matches.length) {
      var li = document.createElement('li');
      li.className = 'country-empty';
      li.textContent = 'No matching country';
      list.appendChild(li);
      return;
    }
    matches.forEach(function (c, i) {
      var li = document.createElement('li');
      li.className = 'country-option' + (c === input.value ? ' selected' : '');
      li.setAttribute('role', 'option');
      li.dataset.index = i;
      li.textContent = c;
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        input.value = c;
        close();
      });
      list.appendChild(li);
    });
    activeIndex = -1;
  }

  function open() { render(''); root.classList.add('open'); }
  function close() { root.classList.remove('open'); }

  input.addEventListener('focus', open);
  input.addEventListener('input', function () { root.classList.add('open'); render(input.value); });
  input.addEventListener('keydown', function (e) {
    var opts = Array.prototype.slice.call(list.querySelectorAll('.country-option'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!root.classList.contains('open')) { open(); return; }
      activeIndex += (e.key === 'ArrowDown' ? 1 : -1);
      if (activeIndex < 0) activeIndex = opts.length - 1;
      if (activeIndex >= opts.length) activeIndex = 0;
      opts.forEach(function (o, i) { o.classList.toggle('active', i === activeIndex); });
      if (opts[activeIndex]) opts[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (root.classList.contains('open') && opts[activeIndex]) { e.preventDefault(); input.value = opts[activeIndex].textContent; close(); }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  document.addEventListener('click', function (e) { if (!root.contains(e.target)) close(); });
}

document.querySelectorAll('[data-country-select]').forEach(initCountrySelect);

// Mobile menu is wired inside navbar.ejs (openM/closeM). No duplicate handler here.

// Header scroll behavior — adapts to dark cinematic pages (body.vd-dark) and
// see-through headers over a hero (body.nav-overlay)
const header = document.getElementById('main-header');
if (header) {
  const onScroll = () => {
    const scrolled = window.scrollY > 20;
    const dark = document.body.classList.contains('vd-dark');
    header.style.background = scrolled ? (dark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.98)') : '';
    header.style.boxShadow = scrolled ? (dark ? '0 1px 0 rgba(255,255,255,0.08)' : '0 1px 0 rgba(0,0,0,0.08)') : '';
    header.classList.toggle('is-scrolled', scrolled);   // body.nav-overlay pages switch to dark text
  };
  window.addEventListener('scroll', onScroll);
  onScroll();
}

// Cinematic vehicle-detail carousel (peeking slides, active one centered)
document.querySelectorAll('[data-vd-carousel]').forEach((root) => {
  const viewport = root.querySelector('.vd-viewport');
  const track = root.querySelector('.vd-track');
  const slides = Array.from(root.querySelectorAll('.vd-slide'));
  const dots = Array.from(root.querySelectorAll('.vd-dot'));
  if (!track || slides.length < 2) return;
  let i = 0;
  const layout = () => {
    const slide = slides[i];
    const offset = slide.offsetLeft - (viewport.clientWidth - slide.clientWidth) / 2;
    track.style.transform = 'translateX(' + (-offset) + 'px)';
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    dots.forEach((d, k) => d.classList.toggle('active', k === i));
  };
  const show = (n) => { i = (n + slides.length) % slides.length; layout(); };
  root.querySelectorAll('.vd-arrow').forEach((b) =>
    b.addEventListener('click', () => show(i + parseInt(b.dataset.dir, 10)))
  );
  dots.forEach((d) => d.addEventListener('click', () => show(parseInt(d.dataset.go, 10))));
  window.addEventListener('resize', layout);
  layout();
});

// Flash messages auto-dismiss
const flashes = document.querySelectorAll('.flash-msg');
flashes.forEach(flash => {
  setTimeout(() => {
    flash.style.opacity = '0';
    flash.style.transform = 'translateX(100%)';
    flash.style.transition = 'all 0.3s ease';
    setTimeout(() => flash.remove(), 300);
  }, 5000);
});

// Payment method tabs
function initPaymentTabs() {
  const tabs = document.querySelectorAll('.payment-tab');
  const panels = document.querySelectorAll('.payment-details');

  // Maps short DOM keys (used for data-method/panel matching) to the
  // full enum values required by the Investment/Share Mongoose schemas.
  const PAYMENT_METHOD_ENUM_MAP = {
    btc: 'bitcoin',
    eth: 'ethereum',
    usdt: 'usdt',
    wallet: 'wallet',
    bank_transfer: 'bank_transfer',
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const method = tab.dataset.method;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector(`.payment-details[data-method="${method}"]`);
      if (panel) panel.classList.add('active');
      
      // Update hidden input — use the full enum value, not the short DOM key
      const methodInput = document.getElementById('paymentMethodInput');
      if (methodInput) methodInput.value = PAYMENT_METHOD_ENUM_MAP[method] || method;
    });
  });
}

initPaymentTabs();

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Address copied to clipboard!', 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied!', 'success');
  });
}

// Toast notification
function showToast(message, type = 'success') {
  let container = document.querySelector('.flash-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'flash-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `flash-msg flash-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '✗'}</span> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal control
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

// Sidebar toggle for mobile dashboard
const sidebarToggle = document.getElementById('sidebarToggle');
const dashSidebar = document.querySelector('.dash-sidebar');

if (sidebarToggle && dashSidebar) {
  sidebarToggle.addEventListener('click', () => {
    dashSidebar.classList.toggle('open');
  });
}

// Investment amount calculator
const amountInput = document.getElementById('investAmount');
const rateDisplay = document.getElementById('monthlyReturn');
const planRateInput = document.getElementById('planRate');

if (amountInput && rateDisplay) {
  amountInput.addEventListener('input', () => {
    const amount = parseFloat(amountInput.value) || 0;
    const rate = parseFloat(planRateInput?.value || '12') / 100;
    const monthly = amount * rate;
    rateDisplay.textContent = '$' + monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });
}

// Shares calculator
const sharesInput = document.getElementById('sharesCount');
const pricePerShare = document.getElementById('pricePerShare');
const totalDisplay = document.getElementById('totalAmount');

if (sharesInput && pricePerShare && totalDisplay) {
  sharesInput.addEventListener('input', () => {
    const count = parseFloat(sharesInput.value) || 0;
    const price = parseFloat(pricePerShare.value) || 0;
    const total = count * price;
    totalDisplay.textContent = '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });
}

// Withdraw method toggle
const withdrawMethodBtns = document.querySelectorAll('.withdraw-tab');
const withdrawForms = document.querySelectorAll('.withdraw-form-section');

withdrawMethodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const method = btn.dataset.method;
    withdrawMethodBtns.forEach(b => b.classList.remove('active'));
    withdrawForms.forEach(f => f.style.display = 'none');
    btn.classList.add('active');
    const form = document.querySelector(`.withdraw-form-section[data-method="${method}"]`);
    if (form) form.style.display = 'block';
    
    const methodInput = document.getElementById('withdrawMethodInput');
    if (methodInput) methodInput.value = method;
  });
});
