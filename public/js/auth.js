// Authentication Management
class AuthManager {
  constructor() {
    this.currentUser = this.getCurrentUser();
    this.initializeAuth();
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE.USER) || 'null');
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(CONFIG.STORAGE.USER);
    }
    this.updateAuthUI();
  }

  initializeAuth() {
    this.updateAuthUI();
  }

  updateAuthUI() {
    const authNavButton = document.getElementById('auth-nav-button');
    const dashboardNavButton = document.getElementById('dashboard-nav-button');
    const logoutButton = document.getElementById('logout-button');

    if (this.currentUser) {
      authNavButton?.classList.add('hidden');
      dashboardNavButton?.classList.remove('hidden');
      logoutButton?.classList.remove('hidden');
    } else {
      authNavButton?.classList.remove('hidden');
      dashboardNavButton?.classList.add('hidden');
      logoutButton?.classList.add('hidden');
    }
  }

  async login(email, password) {
    try {
      const response = await api.login(email, password);
      if (response.success) {
        this.setCurrentUser(response.data);
        utils.showAlert('تم تسجيل الدخول بنجاح', 'success');
        return response.data;
      }
    } catch (error) {
      utils.showAlert(error.message, 'error');
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await api.register(userData);
      if (response.success) {
        this.setCurrentUser(response.data);
        utils.showAlert('تم إنشاء الحساب بنجاح', 'success');
        return response.data;
      }
    } catch (error) {
      utils.showAlert(error.message, 'error');
      throw error;
    }
  }

  async logout() {
    try {
      await api.logout();
      this.setCurrentUser(null);
      utils.showAlert('تم تسجيل الخروج بنجاح', 'success');
      renderPage('home');
    } catch (error) {
      // Even if API call fails, clear local storage
      this.setCurrentUser(null);
      utils.showAlert('تم تسجيل الخروج', 'success');
      renderPage('home');
    }
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isSeller() {
    return this.currentUser?.user?.user_type === 'seller';
  }

  requireAuth() {
    if (!this.isAuthenticated()) {
      utils.showAlert('يرجى تسجيل الدخول أولاً', 'warning');
      renderPage('auth');
      return false;
    }
    return true;
  }

  requireSeller() {
    if (!this.requireAuth()) return false;
    if (!this.isSeller()) {
      utils.showAlert('هذه الصفحة مخصصة للتجار فقط', 'warning');
      return false;
    }
    return true;
  }
}

// Create global auth manager
window.auth = new AuthManager();

// Auth form handlers
function renderAuth(container) {
  container.innerHTML = `
    <div class="auth-box">
      <h1 id="form-title">تسجيل الدخول</h1>

      <!-- Login Form -->
      <form id="login-form">
        <div id="login-alert" class="auth-alert">
          بيانات الدخول غير صحيحة. حاول مرة أخرى.
        </div>
        <div class="form-group">
          <label for="login-email">البريد الإلكتروني</label>
          <input type="email" id="login-email" placeholder="أدخل بريدك الإلكتروني" required />
        </div>
        <div class="form-group">
          <label for="login-pass">كلمة المرور</label>
          <input type="password" id="login-pass" placeholder="••••••••" required />
        </div>
        <button type="submit">دخول</button>
      </form>

      <!-- Register Form -->
      <form id="register-form" class="hidden">
        <div id="register-alert" class="auth-alert">
          تأكد من تعبئة كل الحقول بشكل صحيح وكلمة المرور لا تقل عن 6 أحرف.
        </div>
        <div class="form-group">
          <label for="reg-username">اسم المستخدم</label>
          <input type="text" id="reg-username" placeholder="مثال: محمد بن سالم" required />
        </div>
        <div class="form-group">
          <label for="reg-email">البريد الإلكتروني</label>
          <input type="email" id="reg-email" placeholder="example@email.com" required />
        </div>
        <div class="form-group">
          <label for="reg-phone">رقم الهاتف</label>
          <input type="tel" id="reg-phone" placeholder="0912345678" required />
        </div>
        <div class="form-group">
          <label for="reg-city">المدينة</label>
          <select id="reg-city" required>
            <option value="">-- اختر المدينة --</option>
            ${CONFIG.CITIES.map(city => `<option value="${city}">${city}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="reg-type">نوع الحساب</label>
          <select id="reg-type" required>
            <option value="buyer">مشتري</option>
            <option value="seller">تاجر</option>
          </select>
        </div>
        <div class="form-group">
          <label for="reg-password">كلمة المرور</label>
          <input type="password" id="reg-password" placeholder="••••••••" required />
        </div>
        <div class="form-group">
          <label for="reg-confirm-password">تأكيد كلمة المرور</label>
          <input type="password" id="reg-confirm-password" placeholder="••••••••" required />
        </div>
        <button type="submit">إنشاء الحساب</button>
      </form>

      <!-- Toggle Link -->
      <div class="toggle-link">
        <p id="toggle-message">
          ما عندكش حساب؟ <a id="toggle-auth-form">سجّل الآن</a>
        </p>
      </div>
    </div>
  `;

  setupAuthForms();
}

function setupAuthForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const formTitle = document.getElementById("form-title");
  const toggleMessage = document.getElementById("toggle-message");
  const toggleButton = document.getElementById("toggle-auth-form");

  toggleButton.onclick = () => {
    loginForm.classList.toggle("hidden");
    registerForm.classList.toggle("hidden");
    formTitle.innerText = loginForm.classList.contains("hidden") ? "إنشاء حساب جديد" : "تسجيل الدخول";
    toggleMessage.innerHTML = loginForm.classList.contains("hidden") ?
      'عندك حساب؟ <a id="toggle-auth-form-again">سجّل الدخول</a>' :
      'ما عندكش حساب؟ <a id="toggle-auth-form-again">سجّل الآن</a>';
    document.getElementById("toggle-auth-form-again").onclick = toggleButton.onclick;
    
    // Clear form fields and alerts
    loginForm.reset();
    registerForm.reset();
    document.getElementById("login-alert").style.display = 'none';
    document.getElementById("register-alert").style.display = 'none';
  };

  loginForm.onsubmit = async (event) => {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-pass").value.trim();
    const alertDiv = document.getElementById("login-alert");

    try {
      await auth.login(email, password);
      if (auth.isSeller()) {
        renderPage('sellerDashboard');
      } else {
        renderPage('home');
      }
    } catch (error) {
      alertDiv.style.display = "block";
    }
  };

  registerForm.onsubmit = async (event) => {
    event.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const city = document.getElementById("reg-city").value;
    const userType = document.getElementById("reg-type").value;
    const password = document.getElementById("reg-password").value.trim();
    const confirmPassword = document.getElementById("reg-confirm-password").value.trim();
    const alertDiv = document.getElementById("register-alert");

    if (!username || !email || !phone || !city || password.length < 6 || password !== confirmPassword) {
      alertDiv.style.display = "block";
      return;
    }

    try {
      await auth.register({
        username,
        email,
        phone,
        city,
        user_type: userType,
        password
      });
      
      if (userType === 'seller') {
        renderPage('sellerDashboard');
      } else {
        renderPage('home');
      }
    } catch (error) {
      alertDiv.style.display = "block";
    }
  };
}

// Global logout function
function logoutUser() {
  showModal('هل أنت متأكد أنك تريد تسجيل الخروج؟', () => {
    auth.logout();
  });
}