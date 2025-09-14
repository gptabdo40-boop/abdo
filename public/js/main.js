// Main Application Logic
class App {
  constructor() {
    this.currentPage = 'home';
    this.init();
  }

  init() {
    // Initialize configuration
    initConfig();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial page
    this.renderPage('home');
    
    // Update cart count
    cart.updateCartCount();
  }

  setupEventListeners() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      const page = event.state?.page || 'home';
      this.renderPage(page, false);
    });

    // Handle clicks outside modals to close them
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('modal')) {
        this.hideModal();
        productsManager.closeProductModal();
      }
    });

    // Handle escape key to close modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hideModal();
        productsManager.closeProductModal();
      }
    });
  }

  renderPage(pageName, updateHistory = true) {
    const appContent = document.getElementById('app-content');
    if (!appContent) return;

    this.currentPage = pageName;
    appContent.innerHTML = '';

    // Update browser history
    if (updateHistory) {
      const title = this.getPageTitle(pageName);
      history.pushState({ page: pageName }, title, `#${pageName}`);
      document.title = title;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render the appropriate page
    switch (pageName) {
      case 'home':
        this.renderHome(appContent);
        break;
      case 'auth':
        renderAuth(appContent);
        break;
      case 'packages':
        this.renderPackages(appContent);
        break;
      case 'sellerProfile':
        renderSellerProfile(appContent);
        break;
      case 'cart':
        renderCart(appContent);
        break;
      case 'sellerDashboard':
        if (auth.requireSeller()) {
          renderSellerDashboard(appContent);
        }
        break;
      default:
        this.renderHome(appContent);
    }
  }

  getPageTitle(pageName) {
    const titles = {
      home: 'خُردة | السوق الليبي لقطع السيارات',
      auth: 'تسجيل الدخول | خُردة',
      packages: 'الباقات | خُردة',
      sellerProfile: 'ملف التاجر | خُردة',
      cart: 'سلة المشتريات | خُردة',
      sellerDashboard: 'لوحة تحكم التاجر | خُردة'
    };
    return titles[pageName] || titles.home;
  }

  renderHome(container) {
    container.innerHTML = `
      <section class="hero">
        <h2>مرحبًا بك في خُردة</h2>
        <p>أول سوق إلكتروني متخصص في بيع وشراء قطع السيارات المستعملة داخل ليبيا.</p>
        <button onclick="app.renderPage('sellerProfile')">استعرض القطع الآن</button>
      </section>

      <section class="features">
        <div class="feature">
          <h3>🔍 بحث ذكي</h3>
          <p>اكتب نوع القطعة أو السيارة وشاهد العروض المتوفرة.</p>
        </div>
        <div class="feature">
          <h3>📍 فلترة ذكية</h3>
          <p>صفّ النتائج حسب المدينة، النوع، والسعر.</p>
        </div>
        <div class="feature">
          <h3>🤝 تواصل مباشر</h3>
          <p>راسل البائع واتفق معه بسهولة عبر الموقع.</p>
        </div>
        <div class="feature">
          <h3>⭐ تقييمات موثوقة</h3>
          <p>شوف تقييمات البائعين من زبائن سابقين.</p>
        </div>
        <div class="feature">
          <h3>🚚 توصيل مرن</h3>
          <p>خدمة توصيل متوفرة مع خيارات دفع عند الاستلام.</p>
        </div>
      </section>

      <section class="call-to-action">
        <h2>هل أنت تاجر؟ افتح متجرك مجانًا!</h2>
        <button onclick="app.renderPage('sellerDashboard')">ادخل لوحة التحكم</button>
      </section>
    `;
  }

  renderPackages(container) {
    container.innerHTML = `
      <h1 style="text-align: center; font-size: 2rem; margin-bottom: 2.5rem; color: #2d3e50;">📦 اختر الباقة المناسبة</h1>
      <div class="packages-grid">
        ${Object.entries(CONFIG.PACKAGES).map(([key, pkg]) => `
          <div class="package-card ${key}" onclick="showPackagePopup('${key}')">
            <div class="icon">${this.getPackageIcon(key)}</div>
            <div class="title">${pkg.name}</div>
            <div class="price" style="margin-top: 1rem; font-weight: bold; color: #ff9800;">
              ${pkg.price === 0 ? 'مجاني' : utils.formatPrice(pkg.price)}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="package-notes">
        <h3>📌 ملاحظات هامة:</h3>
        <ul>
          <li>كل باقة تبدأ من تاريخ تفعيلها مباشرة.</li>
          <li>يمكنك تغيير أو ترقية الباقة في أي وقت.</li>
          <li>الدفع يتم إلكترونيًا أو عن طريق الدعم الفني.</li>
          <li>ننصح بتجربة الباقة المجانية أولًا.</li>
          <li>لأي استفسار أو مساعدة، تواصل معنا عبر واتساب: 091xxxxxxx</li>
        </ul>
      </div>

      ${this.renderPackageModals()}
    `;
  }

  getPackageIcon(packageKey) {
    const icons = {
      free: '📦',
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇'
    };
    return icons[packageKey] || '📦';
  }

  renderPackageModals() {
    return Object.entries(CONFIG.PACKAGES).map(([key, pkg]) => `
      <div class="modal" id="popup-${key}">
        <div class="modal-content">
          <span class="close-button" onclick="closePackagePopup()">×</span>
          <h2>${this.getPackageIcon(key)} ${pkg.name}</h2>
          <ul>
            <li>نشر حتى ${pkg.products} منتج</li>
            <li>صور غير محدودة</li>
            <li>${key === 'free' ? 'لا مزايا إضافية' : key === 'bronze' ? 'ميزة إضافية واحدة' : key === 'gold' ? '2 إلى 3 مزايا إضافية' : 'لا مزايا إضافية'}</li>
          </ul>
          <div class="price" style="font-size: 1.2rem; font-weight: bold; margin: 1rem 0; color: #ff9800;">
            ${pkg.price === 0 ? 'مجاني' : utils.formatPrice(pkg.price)} / ${pkg.days} ${pkg.days === 7 ? 'أيام' : 'يوم'}
          </div>
          <button onclick="subscribeToPackage('${pkg.name}', ${pkg.days})">اشترك الآن</button>
        </div>
      </div>
    `).join('');
  }

  showModal(message, callback = null) {
    const modal = document.getElementById('custom-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalOkButton = document.getElementById('modal-ok-button');

    if (!modal || !modalMessage || !modalOkButton) return;

    modalMessage.innerText = message;
    modal.style.display = 'flex';

    modalOkButton.onclick = () => {
      this.hideModal();
      if (callback) callback();
    };
  }

  hideModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

// Package functions
function showPackagePopup(id) {
  closePackagePopup();
  const popup = document.getElementById('popup-' + id);
  if (popup) {
    popup.style.display = 'flex';
  }
}

function closePackagePopup() {
  document.querySelectorAll('.modal').forEach(modal => {
    if (modal.id.startsWith('popup-')) {
      modal.style.display = 'none';
    }
  });
}

function subscribeToPackage(planName, duration) {
  if (!auth.isAuthenticated()) {
    app.showModal('يرجى تسجيل الدخول للاشتراك في الباقة.', () => app.renderPage('auth'));
    return;
  }

  const subscription = {
    plan: planName,
    startDate: new Date().toISOString().split('T')[0],
    durationDays: duration
  };
  
  localStorage.setItem('khurda_mockSubscription', JSON.stringify(subscription));
  dashboardManager.mockSubscription = subscription;
  
  closePackagePopup();
  app.showModal(`تهانينا! لقد اشتركت في ${planName} لمدة ${duration} يومًا.`, () => {
    app.renderPage('sellerDashboard');
  });
}

// Global functions
function renderPage(pageName) {
  app.renderPage(pageName);
}

function showModal(message, callback) {
  app.showModal(message, callback);
}

function hideModal() {
  app.hideModal();
}

// Initialize the application
const app = new App();

// Make app globally available
window.app = app;

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  // Handle initial page load from URL hash
  const hash = window.location.hash.slice(1);
  if (hash && ['home', 'auth', 'packages', 'sellerProfile', 'cart', 'sellerDashboard'].includes(hash)) {
    app.renderPage(hash, false);
  }
});