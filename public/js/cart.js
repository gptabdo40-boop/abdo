// Shopping Cart Management
class CartManager {
  constructor() {
    this.items = this.loadCart();
    this.updateCartCount();
  }

  loadCart() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE.CART) || '[]');
  }

  saveCart() {
    localStorage.setItem(CONFIG.STORAGE.CART, JSON.stringify(this.items));
    this.updateCartCount();
  }

  addItem(product, quantity = 1) {
    const existingItemIndex = this.items.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
      this.items[existingItemIndex].quantity += quantity;
    } else {
      this.items.push({
        ...product,
        quantity: quantity
      });
    }

    this.saveCart();
    utils.showAlert(`تم إضافة ${quantity} من ${product.name} إلى السلة`, 'success');
  }

  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      const item = this.items[index];
      this.items.splice(index, 1);
      this.saveCart();
      utils.showAlert(`تم حذف ${item.name} من السلة`, 'success');
    }
  }

  updateQuantity(index, newQuantity) {
    if (index >= 0 && index < this.items.length && newQuantity > 0) {
      this.items[index].quantity = newQuantity;
      this.saveCart();
    }
  }

  changeQuantity(index, delta) {
    if (index >= 0 && index < this.items.length) {
      const newQuantity = Math.max(1, this.items[index].quantity + delta);
      this.updateQuantity(index, newQuantity);
    }
  }

  getTotal() {
    return this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  clear() {
    this.items = [];
    this.saveCart();
  }

  updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = this.getItemCount();
    }
  }

  async checkout(orderData) {
    if (this.items.length === 0) {
      utils.showAlert('سلتك فارغة، لا يمكن إتمام الطلب', 'warning');
      return false;
    }

    if (!auth.isAuthenticated()) {
      utils.showAlert('يرجى تسجيل الدخول لإتمام الطلب', 'warning');
      renderPage('auth');
      return false;
    }

    try {
      const items = this.items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const response = await api.createOrder({
        items,
        ...orderData
      });

      if (response.success) {
        this.clear();
        utils.showAlert('تم إتمام طلبك بنجاح! سيتم التواصل معك قريباً', 'success');
        return true;
      }
    } catch (error) {
      utils.showAlert('حدث خطأ أثناء إتمام الطلب. حاول مرة أخرى', 'error');
      return false;
    }
  }
}

// Create global cart manager
window.cart = new CartManager();

// Cart Page Rendering
function renderCart(container) {
  container.innerHTML = `
    <div class="cart-container">
      <h1 style="text-align: center; margin-bottom: 2rem;">🛒 سلة المشتريات</h1>
      <div id="cartItemsContainer">
        <!-- Cart items will be rendered here -->
      </div>
      <div class="total-section" id="cartTotal">الإجمالي: ${utils.formatPrice(cart.getTotal())}</div>
      
      ${cart.items.length > 0 ? `
        <div class="checkout-form" style="max-width: 500px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <h3>معلومات التوصيل</h3>
          <div class="form-group">
            <label for="shipping-address">عنوان التوصيل</label>
            <textarea id="shipping-address" placeholder="أدخل عنوان التوصيل بالتفصيل" required></textarea>
          </div>
          <div class="form-group">
            <label for="shipping-phone">رقم الهاتف</label>
            <input type="tel" id="shipping-phone" placeholder="0912345678" required />
          </div>
          <div class="form-group">
            <label for="order-notes">ملاحظات إضافية (اختياري)</label>
            <textarea id="order-notes" placeholder="أي ملاحظات خاصة بالطلب"></textarea>
          </div>
          <button class="checkout-btn" onclick="processCheckout()">✅ إتمام الطلب</button>
        </div>
      ` : ''}
    </div>
  `;
  
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById("cartItemsContainer");
  const totalBox = document.getElementById("cartTotal");
  
  if (!container) return;
  
  container.innerHTML = "";

  if (cart.items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem;">
        <h3>سلتك فارغة حاليًا</h3>
        <p>تصفح منتجاتنا وأضف ما يعجبك إلى السلة</p>
        <button class="btn btn-primary" onclick="renderPage('sellerProfile')">تصفح المنتجات</button>
      </div>
    `;
    if (totalBox) totalBox.innerText = "الإجمالي: " + utils.formatPrice(0);
    return;
  }

  cart.items.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    itemEl.innerHTML = `
      <img src="${item.image_url || 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg'}" alt="صورة المنتج" loading="lazy">
      <div class="item-info">
        <h3>${item.name}</h3>
        <p class="price">💰 ${utils.formatPrice(item.price)}</p>
        <p>🏙 ${item.city}</p>
        ${item.car_model ? `<p>🚗 ${item.car_model}</p>` : ''}
      </div>
      <div class="item-controls">
        <div class="quantity-control">
          <button onclick="cart.changeQuantity(${index}, -1); renderCartItems()">-</button>
          <span>${item.quantity}</span>
          <button onclick="cart.changeQuantity(${index}, 1); renderCartItems()">+</button>
        </div>
        <button class="remove-btn" onclick="removeCartItem(${index})">حذف</button>
      </div>
    `;
    container.appendChild(itemEl);
  });

  if (totalBox) {
    totalBox.innerText = "الإجمالي: " + utils.formatPrice(cart.getTotal());
  }
}

function removeCartItem(index) {
  showModal('هل أنت متأكد من حذف هذا المنتج من السلة؟', () => {
    cart.removeItem(index);
    renderCartItems();
  });
}

async function processCheckout() {
  const address = document.getElementById('shipping-address')?.value.trim();
  const phone = document.getElementById('shipping-phone')?.value.trim();
  const notes = document.getElementById('order-notes')?.value.trim();

  if (!address || !phone) {
    utils.showAlert('يرجى ملء عنوان التوصيل ورقم الهاتف', 'warning');
    return;
  }

  const orderData = {
    shipping_address: address,
    phone: phone,
    notes: notes
  };

  const success = await cart.checkout(orderData);
  if (success) {
    renderCartItems(); // Refresh to show empty cart
  }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
  cart.updateCartCount();
});