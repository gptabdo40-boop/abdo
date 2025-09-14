// Products Management
class ProductsManager {
  constructor() {
    this.products = [];
    this.currentProduct = null;
    this.filters = {};
  }

  async loadProducts(filters = {}) {
    try {
      const response = await api.getProducts(filters);
      if (response.success) {
        this.products = response.data;
        return this.products;
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to mock data for demo
      this.products = this.getMockProducts();
      return this.products;
    }
  }

  getMockProducts() {
    return [
      { 
        id: 'p1', 
        name: 'دينمو - مرسيدس C180', 
        price: 500, 
        condition: 'نظيف جداً', 
        city: 'طرابلس', 
        image_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg',
        car_model: 'مرسيدس C180',
        year: 2015,
        seller_id: 'seller1'
      },
      { 
        id: 'p2', 
        name: 'كمبروسر - كيا سورينتو', 
        price: 750, 
        condition: 'ممتاز', 
        city: 'مصراتة', 
        image_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg',
        car_model: 'كيا سورينتو',
        year: 2017,
        seller_id: 'seller1'
      },
      { 
        id: 'p3', 
        name: 'بطارية - هيونداي إلنترا', 
        price: 250, 
        condition: 'شبه جديدة', 
        city: 'بنغازي', 
        image_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg',
        car_model: 'هيونداي إلنترا',
        year: 2018,
        seller_id: 'seller2'
      },
      { 
        id: 'p4', 
        name: 'ردياتير - تويوتا ياريس', 
        price: 300, 
        condition: 'جيد جداً', 
        city: 'زليتن', 
        image_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg',
        car_model: 'تويوتا ياريس',
        year: 2016,
        seller_id: 'seller2'
      },
      { 
        id: 'p5', 
        name: 'مساعدات - BMW X5', 
        price: 650, 
        condition: 'جديدة', 
        city: 'الخمس', 
        image_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg',
        car_model: 'BMW X5',
        year: 2019,
        seller_id: 'seller1'
      }
    ];
  }

  async getProduct(id) {
    try {
      const response = await api.getProduct(id);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.error('Error loading product:', error);
      // Fallback to mock data
      return this.products.find(p => p.id === id);
    }
  }

  async createProduct(productData) {
    try {
      const response = await api.createProduct(productData);
      if (response.success) {
        utils.showAlert('تم إضافة المنتج بنجاح', 'success');
        return response.data;
      }
    } catch (error) {
      utils.showAlert(error.message, 'error');
      throw error;
    }
  }

  async updateProduct(id, productData) {
    try {
      const response = await api.updateProduct(id, productData);
      if (response.success) {
        utils.showAlert('تم تحديث المنتج بنجاح', 'success');
        return response.data;
      }
    } catch (error) {
      utils.showAlert(error.message, 'error');
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const response = await api.deleteProduct(id);
      if (response.success) {
        utils.showAlert('تم حذف المنتج بنجاح', 'success');
        return true;
      }
    } catch (error) {
      utils.showAlert(error.message, 'error');
      throw error;
    }
  }

  renderProductsGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (products.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem;">لا توجد منتجات متاحة حالياً.</p>';
      return;
    }

    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.onclick = () => this.showProductModal(product);
      
      productCard.innerHTML = `
        <img src="${product.image_url || 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg'}" alt="${product.name}" loading="lazy">
        <h3>${product.name}</h3>
        <p class="price">${utils.formatPrice(product.price)}</p>
        <p>الحالة: ${product.condition}</p>
        <p>المدينة: ${product.city}</p>
        ${product.car_model ? `<p>السيارة: ${product.car_model}</p>` : ''}
      `;
      
      container.appendChild(productCard);
    });
  }

  showProductModal(product) {
    this.currentProduct = product;
    
    const modal = document.getElementById('productModal') || this.createProductModal();
    
    document.getElementById("modalTitle").innerText = product.name;
    document.getElementById("modalPrice").innerText = "💰 السعر: " + utils.formatPrice(product.price);
    document.getElementById("modalCondition").innerText = "📦 الحالة: " + product.condition;
    document.getElementById("modalCity").innerText = "🏙️ المدينة: " + product.city;
    document.getElementById("modalImage").src = product.image_url || 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg';
    
    if (product.car_model) {
      const carInfo = document.getElementById("modalCarModel") || document.createElement('p');
      carInfo.id = "modalCarModel";
      carInfo.innerText = `🚗 السيارة: ${product.car_model}`;
      if (!document.getElementById("modalCarModel")) {
        document.querySelector('#productModal .modal-content').insertBefore(carInfo, document.querySelector('.quantity-control'));
      }
    }
    
    document.getElementById("modalQuantity").innerText = "1";
    modal.style.display = "flex";
  }

  createProductModal() {
    const modal = document.createElement('div');
    modal.id = 'productModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button" onclick="closeProductModal()">✖</span>
        <img id="modalImage" src="" alt="صورة المنتج" />
        <h2 id="modalTitle">عنوان المنتج</h2>
        <p id="modalPrice">💰 السعر:</p>
        <p id="modalCondition">📦 الحالة:</p>
        <p id="modalCity">🏙️ المدينة:</p>
        <div class="quantity-control">
            <button onclick="changeModalQuantity(-1)">-</button>
            <span id="modalQuantity">1</span>
            <button onclick="changeModalQuantity(1)">+</button>
        </div>
        <button class="add-cart-btn" onclick="addProductToCartFromModal()">🛒 إضافة إلى السلة</button>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  closeProductModal() {
    const modal = document.getElementById("productModal");
    if (modal) {
      modal.style.display = "none";
    }
    this.currentProduct = null;
  }

  changeModalQuantity(delta) {
    const quantitySpan = document.getElementById("modalQuantity");
    let currentQuantity = parseInt(quantitySpan.innerText);
    currentQuantity = Math.max(1, currentQuantity + delta);
    quantitySpan.innerText = currentQuantity;
  }

  addProductToCartFromModal() {
    if (!this.currentProduct) return;
    
    const quantity = parseInt(document.getElementById("modalQuantity").innerText);
    cart.addItem(this.currentProduct, quantity);
    this.closeProductModal();
  }
}

// Create global products manager
window.productsManager = new ProductsManager();

// Global functions for modal
function closeProductModal() {
  productsManager.closeProductModal();
}

function changeModalQuantity(delta) {
  productsManager.changeModalQuantity(delta);
}

function addProductToCartFromModal() {
  productsManager.addProductToCartFromModal();
}

// Seller Profile Page
function renderSellerProfile(container) {
  container.innerHTML = `
    <section class="vendor-profile">
      <img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" alt="صورة التاجر" />
      <h2>محمود العبيدي</h2>
      <p>المدينة: طرابلس</p>
      <div class="rating">⭐ 4.7 / 5 (36 تقييم)</div>
      <p>خبير في بيع قطع السيارات الألمانية والكورية المستعملة منذ أكثر من 8 سنوات.</p>
      <button class="contact-btn" onclick="showModal('تم إرسال رسالتك إلى التاجر. سيتم التواصل معك قريباً.')">📞 تواصل مع التاجر</button>
    </section>

    <section class="products-section">
      <h2 style="text-align:center;">منتجات محمود</h2>
      
      <!-- Search and Filter -->
      <div class="filters" style="margin-bottom: 2rem; text-align: center;">
        <input type="text" id="search-products" placeholder="ابحث عن قطعة..." style="padding: 0.5rem; margin: 0.5rem; border: 1px solid #ccc; border-radius: 5px;">
        <select id="filter-city" style="padding: 0.5rem; margin: 0.5rem; border: 1px solid #ccc; border-radius: 5px;">
          <option value="">كل المدن</option>
          ${CONFIG.CITIES.map(city => `<option value="${city}">${city}</option>`).join('')}
        </select>
        <select id="filter-condition" style="padding: 0.5rem; margin: 0.5rem; border: 1px solid #ccc; border-radius: 5px;">
          <option value="">كل الحالات</option>
          ${CONFIG.CONDITIONS.map(condition => `<option value="${condition}">${condition}</option>`).join('')}
        </select>
      </div>
      
      <div class="products-grid" id="seller-products-grid">
        <!-- Products will be loaded here -->
      </div>
    </section>
  `;

  // Load and display products
  loadSellerProducts();
  setupProductFilters();
}

async function loadSellerProducts() {
  const products = await productsManager.loadProducts();
  productsManager.renderProductsGrid(products, 'seller-products-grid');
}

function setupProductFilters() {
  const searchInput = document.getElementById('search-products');
  const cityFilter = document.getElementById('filter-city');
  const conditionFilter = document.getElementById('filter-condition');

  const applyFilters = utils.debounce(async () => {
    const filters = {
      search: searchInput?.value || '',
      city: cityFilter?.value || '',
      condition: conditionFilter?.value || ''
    };

    const products = await productsManager.loadProducts(filters);
    const filteredProducts = products.filter(product => {
      const matchesSearch = !filters.search || 
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.car_model?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCity = !filters.city || product.city === filters.city;
      const matchesCondition = !filters.condition || product.condition === filters.condition;
      
      return matchesSearch && matchesCity && matchesCondition;
    });

    productsManager.renderProductsGrid(filteredProducts, 'seller-products-grid');
  }, 300);

  searchInput?.addEventListener('input', applyFilters);
  cityFilter?.addEventListener('change', applyFilters);
  conditionFilter?.addEventListener('change', applyFilters);
}