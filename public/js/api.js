// API Service Layer
class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.token = this.getAuthToken();
  }

  getAuthToken() {
    const user = JSON.parse(localStorage.getItem(CONFIG.STORAGE.USER) || 'null');
    return user?.session?.access_token || null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      utils.showLoading();
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في الطلب');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    } finally {
      utils.hideLoading();
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST'
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  async updateProfile(userData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // Products endpoints
  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/products?${params}`);
  }

  async getProduct(id) {
    return this.request(`/api/products/${id}`);
  }

  async createProduct(productData) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(id) {
    return this.request(`/api/products/${id}`, {
      method: 'DELETE'
    });
  }

  async getSellerProducts(sellerId) {
    return this.request(`/api/products/seller/${sellerId}`);
  }

  // Orders endpoints
  async createOrder(orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getMyOrders() {
    return this.request('/api/orders/my-orders');
  }

  async getOrder(id) {
    return this.request(`/api/orders/${id}`);
  }

  async updateOrderStatus(id, status) {
    return this.request(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
}

// Create global API instance
window.api = new ApiService();