// Configuration
const CONFIG = {
  API_BASE_URL: window.location.origin,
  SUPABASE_URL: '', // Will be set from environment
  SUPABASE_ANON_KEY: '', // Will be set from environment
  STORAGE: {
    USER: 'khurda_currentUser',
    CART: 'khurda_cart',
    PRODUCTS: 'khurda_products'
  },
  CITIES: [
    'طرابلس', 'بنغازي', 'مصراتة', 'الزاوية', 'البيضاء', 
    'زليتن', 'الخمس', 'صبراتة', 'درنة', 'توكرة'
  ],
  CONDITIONS: [
    'جديدة', 'شبه جديدة', 'ممتازة', 'جيد جداً', 'نظيف جداً', 'مستعملة'
  ],
  PACKAGES: {
    free: { name: 'الباقة المجانية', products: 30, price: 0, days: 7 },
    bronze: { name: 'الباقة البرونزية', products: 65, price: 29, days: 30 },
    silver: { name: 'الباقة الفضية', products: 100, price: 49, days: 30 },
    gold: { name: 'الباقة الذهبية', products: 300, price: 99, days: 30 }
  }
};

// Initialize configuration from environment or defaults
const initConfig = () => {
  // In a real application, these would come from environment variables
  CONFIG.SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
  CONFIG.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
};

// Utility functions
const utils = {
  formatPrice: (price) => {
    return `${price} د.ل`;
  },
  
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-LY');
  },
  
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  showLoading: () => {
    document.getElementById('loading').classList.remove('hidden');
  },
  
  hideLoading: () => {
    document.getElementById('loading').classList.add('hidden');
  },
  
  showAlert: (message, type = 'info') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.getElementById('app-content');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
};

// Export for use in other files
window.CONFIG = CONFIG;
window.utils = utils;