// Seller Dashboard Management
class DashboardManager {
  constructor() {
    this.sellerProducts = [];
    this.mockMessages = this.loadMockMessages();
    this.mockAnalytics = this.loadMockAnalytics();
    this.mockSubscription = this.loadMockSubscription();
  }

  loadMockMessages() {
    return JSON.parse(localStorage.getItem('khurda_mockMessages') || JSON.stringify([
      { 
        id: 'm1', 
        subject: 'استفسار عن دينمو', 
        name: 'أحمد من بنغازي', 
        phone: '0912345678', 
        message: 'السلام عليكم، هل الدينمو مازال متوفر؟ وكم سعره النهائي مع التوصيل إلى بنغازي؟',
        created_at: new Date().toISOString()
      },
      { 
        id: 'm2', 
        subject: 'سؤال حول كمبروسر', 
        name: 'وليد من طرابلس', 
        phone: '0923456789', 
        message: 'مرحبًا، أريد معرفة حالة القطعة وهل يمكن التوصيل غدًا؟',
        created_at: new Date().toISOString()
      }
    ]));
  }

  loadMockAnalytics() {
    return JSON.parse(localStorage.getItem('khurda_mockAnalytics') || JSON.stringify({
      totalViews: 1230,
      weeklyViews: 320,
      mostViewed: 'كمبروسر - كيا سيراتو',
      topCity: 'طرابلس',
      weeklyVisits: [20, 30, 25, 40, 50, 45, 60]
    }));
  }

  loadMockSubscription() {
    return JSON.parse(localStorage.getItem('khurda_mockSubscription') || JSON.stringify({
      plan: 'الباقة المجانية',
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 7
    }));
  }

  async loadSellerProducts() {
    if (!auth.isAuthenticated()) return [];
    
    try {
      const response = await api.getSellerProducts(auth.currentUser.user.id);
      if (response.success) {
        this.sellerProducts = response.data;
        return this.sellerProducts;
      }
    } catch (error) {
      console.error('Error loading seller products:', error);
      // Fallback to mock data
      this.sellerProducts = this.getMockSellerProducts();
      return this.sellerProducts;
    }
  }

  getMockSellerProducts() {
    return [
      { 
        id: 'sp1', 
        name: 'دينمو', 
        car_model: 'تويوتا ياريس', 
        year: 2018, 
        condition: 'ممتازة', 
        price: 280, 
        image_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg',
        city: 'طرابلس'
      },
      { 
        id: 'sp2', 
        name: 'كمبروسر', 
        car_model: 'كيا سيراتو', 
        year: 2016, 
        condition: 'مستعمل نظيف', 
        price: 450, 
        image_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg',
        city: 'طرابلس'
      }
    ];
  }

  getDaysRemaining(startDateStr, durationDays) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  getEndDate(startDateStr, durationDays) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);
    return endDate.toISOString().split('T')[0];
  }

  getSubscriptionProgress(startDateStr, durationDays) {
    const startDate = new Date(startDateStr);
    const today = new Date();
    const elapsedDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progress = (elapsedDays / durationDays) * 100;
    return Math.min(100, Math.max(0, progress)).toFixed(0);
  }

  getChartImageUrl(data) {
    const labels = ['سبت','أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة'];
    const chartData = JSON.stringify({
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'الزيارات',
          data: data,
          backgroundColor: 'rgba(255, 152, 0, 0.6)',
          borderColor: 'rgba(255, 152, 0, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    return `https://quickchart.io/chart?c=${encodeURIComponent(chartData)}`;
  }
}

// Create global dashboard manager
window.dashboardManager = new DashboardManager();

// Dashboard Rendering
function renderSellerDashboard(container) {
  if (!auth.requireSeller()) return;

  container.innerHTML = `
    <div class="dashboard-container">
      <aside class="dashboard-aside">
        <h2>خُردة</h2>
        <ul>
          <li class="active" onclick="showDashboardTab('products', this)">📦 منتجاتي</li>
          <li onclick="showDashboardTab('add', this)">➕ إضافة منتج</li>
          <li onclick="showDashboardTab('subscription', this)">💳 اشتراكي</li>
          <li onclick="showDashboardTab('messages', this)">📩 رسائل العملاء</li>
          <li onclick="showDashboardTab('analytics', this)">📈 تحليلات النشاط</li>
          <li onclick="showDashboardTab('settings', this)">⚙️ الإعدادات</li>
          <li onclick="logoutUser()">🚪 تسجيل خروج</li>
        </ul>
      </aside>
      <main class="dashboard-main">
        ${renderDashboardTabs()}
      </main>
    </div>
  `;

  // Load initial data
  loadDashboardData();
}

function renderDashboardTabs() {
  const user = auth.currentUser?.user;
  const subscription = dashboardManager.mockSubscription;
  const daysRemaining = dashboardManager.getDaysRemaining(subscription.startDate, subscription.durationDays);

  return `
    <div class="dashboard-tab-content active" id="dashboard-products">
      <h1>👋 مرحبًا ${user?.username || 'تاجر'}</h1>
      <div class="stats-cards">
        <div class="card">
          <h3>إجمالي المنتجات</h3>
          <p id="total-products-count">0</p>
        </div>
        <div class="card">
          <h3>منتجات هذا الأسبوع</h3>
          <p>4</p>
        </div>
        <div class="card">
          <h3>رسائل جديدة</h3>
          <p>${dashboardManager.mockMessages.length}</p>
        </div>
        <div class="card ${daysRemaining <= 7 ? 'alert' : ''}">
          <h3>⚠️ تنبيه</h3>
          <p id="subscription-alert">باقتك ستنتهي خلال ${daysRemaining} أيام</p>
        </div>
      </div>
      <h2 style="margin-top: 2rem;">🧾 منتجاتك الحالية</h2>
      <div class="dashboard-product-grid" id="seller-dashboard-products-grid">
        <!-- Seller products will be loaded here -->
      </div>
    </div>

    <div class="dashboard-tab-content" id="dashboard-add">
      <h1>➕ إضافة قطعة جديدة</h1>
      <form id="add-product-form" style="max-width: 600px;">
        <div class="form-group">
          <label for="add-product-name">اسم القطعة</label>
          <input type="text" id="add-product-name" placeholder="مثلاً: دينمو، كمبروسر..." required />
        </div>
        <div class="form-group">
          <label for="add-product-car">نوع السيارة</label>
          <input type="text" id="add-product-car" placeholder="مثلاً: تويوتا ياريس، كيا سيراتو..." required />
        </div>
        <div class="form-group">
          <label for="add-product-year">موديل السيارة (السنة)</label>
          <input type="number" id="add-product-year" placeholder="مثلاً: 2015" min="1990" max="2025" required />
        </div>
        <div class="form-group">
          <label for="add-product-condition">الحالة</label>
          <select id="add-product-condition" required>
            <option value="">-- اختر الحالة --</option>
            ${CONFIG.CONDITIONS.map(condition => `<option value="${condition}">${condition}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="add-product-city">المدينة</label>
          <select id="add-product-city" required>
            <option value="">-- اختر المدينة --</option>
            ${CONFIG.CITIES.map(city => `<option value="${city}">${city}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="add-product-price">السعر (د.ل)</label>
          <input type="number" id="add-product-price" placeholder="مثلاً: 350" min="1" required />
        </div>
        <div class="form-group">
          <label for="add-product-image">رابط صورة القطعة (اختياري)</label>
          <input type="url" id="add-product-image" placeholder="https://example.com/image.jpg" />
        </div>
        <div class="form-group">
          <button type="submit" class="btn btn-primary">➕ إضافة القطعة</button>
        </div>
      </form>
    </div>

    <div class="dashboard-tab-content" id="dashboard-subscription">
      <h1>💳 اشتراكي</h1>
      <div class="subscription-box">
        <div class="plan-header ${subscription.plan === 'الباقة الذهبية' ? 'gold' : ''}">
          <h2>${subscription.plan}</h2>
          <span class="status">نشطة</span>
        </div>
        <div class="plan-details">
          <p><strong>تاريخ التفعيل:</strong> ${utils.formatDate(subscription.startDate)}</p>
          <p><strong>تاريخ الانتهاء:</strong> ${utils.formatDate(dashboardManager.getEndDate(subscription.startDate, subscription.durationDays))}</p>
          <p><strong>الأيام المتبقية:</strong> <span class="days-left">${daysRemaining} يوم</span></p>
          <div class="progress-bar">
            <div class="progress" style="width: ${dashboardManager.getSubscriptionProgress(subscription.startDate, subscription.durationDays)}%;"></div>
          </div>
          <ul class="features">
            <li>✔️ نشر حتى 50 منتج</li>
            <li>✔️ إمكانية رفع صور</li>
            <li>✔️ دعم فني عبر واتساب</li>
            <li>✔️ ظهور مميز في نتائج البحث</li>
          </ul>
          <div class="dashboard-actions">
            <button class="renew" onclick="showModal('تم تجديد اشتراكك بنجاح! (وظيفة وهمية)')">تجديد الاشتراك</button>
            <button class="upgrade" onclick="renderPage('packages')">ترقية للباقات الأعلى</button>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-tab-content" id="dashboard-messages">
      <h1>📩 رسائل العملاء</h1>
      <div class="messages-list" id="dashboard-messages-list">
        <!-- Messages will be loaded here -->
      </div>
    </div>

    <div class="dashboard-tab-content" id="dashboard-analytics">
      <h1>📈 تحليلات النشاط</h1>
      <div class="analytics-grid">
        <div class="analytic-card">
          <h3>👁️ إجمالي المشاهدات</h3>
          <p>${dashboardManager.mockAnalytics.totalViews}</p>
        </div>
        <div class="analytic-card">
          <h3>📅 مشاهدات هذا الأسبوع</h3>
          <p>${dashboardManager.mockAnalytics.weeklyViews}</p>
        </div>
        <div class="analytic-card">
          <h3>🧩 القطعة الأكثر مشاهدة</h3>
          <p>${dashboardManager.mockAnalytics.mostViewed}</p>
        </div>
        <div class="analytic-card">
          <h3>🏙️ المدينة الأعلى تفاعلاً</h3>
          <p>${dashboardManager.mockAnalytics.topCity}</p>
        </div>
      </div>

      <div class="chart-container">
        <h3>📊 زيارات المنتجات خلال الأسبوع</h3>
        <img src="${dashboardManager.getChartImageUrl(dashboardManager.mockAnalytics.weeklyVisits)}" alt="رسم بياني للزيارات" style="max-width:100%; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      </div>
    </div>

    <div class="dashboard-tab-content" id="dashboard-settings">
      <h1>⚙️ إعدادات الحساب</h1>
      <div class="settings-container">
        <form id="settings-form">
          <div class="form-group">
            <label>👤 الاسم الكامل</label>
            <input type="text" id="settings-username" value="${user?.username || ''}" placeholder="عبدالباري أبوشعالة" />
          </div>
          <div class="form-group">
            <label>📧 البريد الإلكتروني</label>
            <input type="email" id="settings-email" value="${user?.email || ''}" placeholder="you@example.com" />
          </div>
          <div class="form-group">
            <label>📱 رقم الهاتف</label>
            <input type="tel" id="settings-phone" value="${user?.phone || ''}" placeholder="0912345678" />
          </div>
          <div class="form-group">
            <label>🏙️ المدينة</label>
            <select id="settings-city">
              <option value="">-- اختر المدينة --</option>
              ${CONFIG.CITIES.map(city => `<option value="${city}" ${user?.city === city ? 'selected' : ''}>${city}</option>`).join('')}
            </select>
          </div>
          <hr/>
          <h3>🔒 تغيير كلمة المرور</h3>
          <div class="form-group">
            <label>كلمة المرور الحالية</label>
            <input type="password" id="current-password" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label>كلمة المرور الجديدة</label>
            <input type="password" id="new-password" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label>تأكيد كلمة المرور الجديدة</label>
            <input type="password" id="confirm-password" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">💾 حفظ التعديلات</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function loadDashboardData() {
  // Load seller products
  const products = await dashboardManager.loadSellerProducts();
  renderDashboardProducts(products);
  renderDashboardMessages();
  setupDashboardForms();
}

function renderDashboardProducts(products = []) {
  const grid = document.getElementById('seller-dashboard-products-grid');
  const countElement = document.getElementById('total-products-count');
  
  if (!grid) return;
  
  grid.innerHTML = '';
  if (countElement) countElement.textContent = products.length;

  if (products.length === 0) {
    grid.innerHTML = '<p style="text-align: center; padding: 2rem;">لم تقم بإضافة أي منتجات بعد.</p>';
    return;
  }

  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'dashboard-product-card';
    productCard.innerHTML = `
      <img src="${product.image_url || 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg'}" alt="${product.name}" loading="lazy"/>
      <div class="info">
        <h3>${product.name}</h3>
        <p>${product.car_model} - ${product.condition}</p>
        <span class="price">${utils.formatPrice(product.price)}</span>
        <div class="actions">
          <button class="edit" onclick="editProduct('${product.id}')">تعديل</button>
          <button class="delete" onclick="deleteProduct('${product.id}')">حذف</button>
        </div>
      </div>
    `;
    grid.appendChild(productCard);
  });
}

function renderDashboardMessages() {
  const messagesList = document.getElementById('dashboard-messages-list');
  if (!messagesList) return;
  
  messagesList.innerHTML = '';
  
  if (dashboardManager.mockMessages.length === 0) {
    messagesList.innerHTML = '<p style="text-align: center; padding: 2rem;">لا توجد رسائل جديدة.</p>';
    return;
  }

  dashboardManager.mockMessages.forEach(msg => {
    const messageCard = document.createElement('div');
    messageCard.className = 'message-card';
    messageCard.innerHTML = `
      <h3>${msg.subject}</h3>
      <p><strong>الاسم:</strong> ${msg.name}</p>
      <p><strong>الهاتف:</strong> ${msg.phone}</p>
      <p><strong>الرسالة:</strong> ${msg.message}</p>
      <p><strong>التاريخ:</strong> ${utils.formatDate(msg.created_at)}</p>
      <div class="msg-actions">
        <button onclick="showModal('تم إرسال الرد! (وظيفة وهمية)')">رد</button>
        <button class="delete" onclick="deleteMessage('${msg.id}')">حذف</button>
      </div>
    `;
    messagesList.appendChild(messageCard);
  });
}

function setupDashboardForms() {
  // Add Product Form
  const addProductForm = document.getElementById('add-product-form');
  if (addProductForm) {
    addProductForm.onsubmit = async (event) => {
      event.preventDefault();
      await addNewProduct();
    };
  }

  // Settings Form
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateSettings();
    };
  }
}

async function addNewProduct() {
  const name = document.getElementById('add-product-name').value.trim();
  const carModel = document.getElementById('add-product-car').value.trim();
  const year = document.getElementById('add-product-year').value.trim();
  const condition = document.getElementById('add-product-condition').value;
  const city = document.getElementById('add-product-city').value;
  const price = document.getElementById('add-product-price').value.trim();
  const imageUrl = document.getElementById('add-product-image').value.trim();

  if (!name || !carModel || !year || !condition || !city || !price) {
    utils.showAlert('يرجى ملء جميع الحقول المطلوبة', 'warning');
    return;
  }

  try {
    const productData = {
      name,
      car_model: carModel,
      year: parseInt(year),
      condition,
      city,
      price: parseFloat(price),
      image_url: imageUrl || 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg'
    };

    await productsManager.createProduct(productData);
    
    // Clear form
    document.getElementById('add-product-form').reset();
    
    // Refresh products list
    const products = await dashboardManager.loadSellerProducts();
    renderDashboardProducts(products);
    
    // Switch to products tab
    showDashboardTab('products', document.querySelector('.dashboard-aside ul li:first-child'));
  } catch (error) {
    console.error('Error adding product:', error);
  }
}

async function updateSettings() {
  const username = document.getElementById('settings-username').value.trim();
  const email = document.getElementById('settings-email').value.trim();
  const phone = document.getElementById('settings-phone').value.trim();
  const city = document.getElementById('settings-city').value;

  try {
    await api.updateProfile({
      username,
      email,
      phone,
      city
    });
    
    // Update local user data
    if (auth.currentUser) {
      auth.currentUser.user = {
        ...auth.currentUser.user,
        username,
        email,
        phone,
        city
      };
      auth.setCurrentUser(auth.currentUser);
    }
    
    utils.showAlert('تم حفظ التعديلات بنجاح', 'success');
  } catch (error) {
    utils.showAlert('حدث خطأ أثناء حفظ التعديلات', 'error');
  }
}

function showDashboardTab(tabId, element) {
  const tabs = document.querySelectorAll('.dashboard-tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  const targetTab = document.getElementById('dashboard-' + tabId);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  const menuItems = document.querySelectorAll('.dashboard-aside ul li');
  menuItems.forEach(item => item.classList.remove('active'));
  
  if (element) {
    element.classList.add('active');
  }
}

async function editProduct(productId) {
  utils.showAlert('وظيفة تعديل المنتج ستكون متاحة قريباً', 'info');
}

async function deleteProduct(productId) {
  showModal('هل أنت متأكد أنك تريد حذف هذا المنتج؟', async () => {
    try {
      await productsManager.deleteProduct(productId);
      const products = await dashboardManager.loadSellerProducts();
      renderDashboardProducts(products);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  });
}

function deleteMessage(messageId) {
  showModal('هل أنت متأكد أنك تريد حذف هذه الرسالة؟', () => {
    dashboardManager.mockMessages = dashboardManager.mockMessages.filter(m => m.id !== messageId);
    localStorage.setItem('khurda_mockMessages', JSON.stringify(dashboardManager.mockMessages));
    renderDashboardMessages();
    utils.showAlert('تم حذف الرسالة بنجاح', 'success');
  });
}