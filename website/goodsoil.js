/* =====================================================
   GOOD SOIL — Accessible Interactive Core & Universal Cart
   Includes:
   - Universal persistent Shopping Cart with Accessible Drawer (ARIA compliant, keyboard trap, Escape key)
   - Real-time cart synchronization across all pages
   - Real kit images support
   - Mobile navigation drawer
   - Interactive Video Modal
   - Curriculum PDF Download Preview Modal
   - Batch auto-selection & booking scroll
   - Gallery interactive filtering
   - Accessible Toast Notifications
   ===================================================== */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // 1. PERSISTENT CART STORE (localStorage)
  // ─────────────────────────────────────────────────────────────
  const CART_KEY = 'goodsoil_cart_v1';
  let lastFocusedElement = null;

  function getStoredCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('goodsoil:cartupdated', { detail: { items } }));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }

  window.GoodSoilCart = {
    getItems: getStoredCart,
    addItem: function (item) {
      const items = getStoredCart();
      const existing = items.find(i => i.id === item.id || i.name === item.name);
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
      } else {
        items.push({
          id: item.id || ('kit_' + Date.now()),
          name: item.name,
          price: Number(item.price) || 0,
          img: item.img || 'images/kits/diy_engineering_drone_kit.png',
          cat: item.cat || 'STEM Kit',
          age: item.age || 'All ages',
          qty: 1
        });
      }
      saveStoredCart(items);
      showToast('🛒 Added "' + item.name + '" to your cart!');
      openCartDrawer();
    },
    updateQty: function (id, delta) {
      let items = getStoredCart();
      const target = items.find(i => i.id === id);
      if (target) {
        target.qty = (target.qty || 1) + delta;
        if (target.qty <= 0) {
          items = items.filter(i => i.id !== id);
        }
      }
      saveStoredCart(items);
    },
    removeItem: function (id) {
      let items = getStoredCart();
      const removed = items.find(i => i.id === id);
      items = items.filter(i => i.id !== id);
      saveStoredCart(items);
      if (removed) {
        showToast('Removed "' + removed.name + '" from cart');
      }
    },
    clearCart: function () {
      saveStoredCart([]);
      showToast('Cart has been cleared');
    },
    getCount: function () {
      return getStoredCart().reduce((sum, item) => sum + (item.qty || 1), 0);
    },
    getTotal: function () {
      return getStoredCart().reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. ACCESSIBLE CART DRAWER COMPONENT
  // ─────────────────────────────────────────────────────────────
  let discountPercent = 0;

  function injectCartDrawerHTML() {
    if (document.getElementById('cart-drawer-container')) return;

    const drawerHTML = `
      <div id="cart-drawer-container" style="display: none; position: fixed; inset: 0; z-index: 10000;">
        <!-- Backdrop -->
        <div id="cart-backdrop" onclick="closeCartDrawer()" style="position: absolute; inset: 0; background: rgba(28,27,24,0.65); backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.3s ease;"></div>
        
        <!-- Drawer Dialog -->
        <aside id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-heading" style="position: absolute; top: 0; right: 0; bottom: 0; width: 100%; max-width: 440px; background: #FFFFFF; box-shadow: -10px 0 40px rgba(0,0,0,0.25); display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1); font-family: 'DM Sans', sans-serif;">
          
          <!-- Header -->
          <div style="padding: 20px 24px; border-bottom: 1px solid #ECEAE3; display: flex; align-items: center; justify-content: space-between; background: #FAF9F5;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F6B44" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14l-1.5 10.5a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5Z"></path><path d="M9 7a3 3 0 0 1 6 0"></path></svg>
              <h2 id="cart-heading" style="margin: 0; font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; font-weight: 800; color: #1C1B18;">Your Kit Cart</h2>
              <span id="cart-drawer-badge" style="background: #F5B82E; color: #1C1B18; font-weight: 800; font-size: 13px; padding: 2px 10px; border-radius: 999px;">0</span>
            </div>
            <button type="button" id="cart-close-btn" onclick="closeCartDrawer()" aria-label="Close shopping cart" style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid #DAD7CE; background: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1C1B18; font-size: 20px; transition: all 0.15s;">
              &times;
            </button>
          </div>

          <!-- Free Shipping Notice -->
          <div id="cart-shipping-banner" style="background: #E7EDE3; color: #174F33; font-size: 13px; font-weight: 700; padding: 10px 24px; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            <span id="shipping-banner-text">Free shipping on all orders across India!</span>
          </div>

          <!-- Items List Container -->
          <div id="cart-items-list" style="flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;">
            <!-- Rendered by renderCartDrawer() -->
          </div>

          <!-- Footer Checkout / Total Area -->
          <div id="cart-footer" style="padding: 20px 24px; border-top: 1px solid #ECEAE3; background: #FAF9F5; display: flex; flex-direction: column; gap: 14px;">
            
            <!-- Promo Code Row -->
            <div style="display: flex; gap: 8px;">
              <input type="text" id="promo-input" placeholder="Promo code (try: GOODSOIL10)" aria-label="Promo Code" style="flex: 1; min-height: 42px; padding: 0 14px; border-radius: 10px; border: 1px solid #DAD7CE; font: 14px 'DM Sans', sans-serif;">
              <button type="button" onclick="applyPromoCode()" style="min-height: 42px; padding: 0 16px; border-radius: 10px; border: 0; background: #1C1B18; color: #FFFFFF; font-weight: 700; font-size: 13px; cursor: pointer;">Apply</button>
            </div>
            <div id="promo-status" style="font-size: 12px; font-weight: 700; display: none;"></div>

            <!-- Pricing Breakdown -->
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; color: #55524A;">
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal</span>
                <span id="cart-subtotal-val" style="font-weight: 700; color: #1C1B18;">₹0</span>
              </div>
              <div id="cart-discount-row" style="display: none; justify-content: space-between; color: #1F6B44; font-weight: 700;">
                <span>Discount (10%)</span>
                <span id="cart-discount-val">-₹0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Shipping</span>
                <span style="color: #1F6B44; font-weight: 700;">FREE</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #ECEAE3; padding-top: 8px; font-size: 18px; font-weight: 800; color: #1C1B18;">
                <span>Total Amount</span>
                <span id="cart-total-val" style="font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; color: #1F6B44;">₹0</span>
              </div>
            </div>

            <!-- Order via WhatsApp Action Button -->
            <button type="button" id="btn-checkout-whatsapp" onclick="checkoutViaWhatsApp()" style="min-height: 50px; border-radius: 999px; border: 0; background: #25D366; color: #FFFFFF; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; box-shadow: 0 4px 14px rgba(37,211,102,0.35); transition: transform 0.15s ease;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.78 14.16c-.24.68-1.39 1.3-1.92 1.38-.49.08-1.12.11-3.23-.76-2.69-1.11-4.43-3.85-4.57-4.03-.13-.19-1.11-1.48-1.11-2.82 0-1.34.7-2 1-2.28.24-.24.52-.3.7-.3.17 0 .35 0 .5.01.16.01.37-.06.58.44.22.52.75 1.83.82 1.97.07.14.11.31.02.49-.09.18-.14.29-.27.45-.14.16-.29.35-.41.48-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.21 1.36.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.64-.14.26.1 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.7-.17 1.38z"/></svg>
              <span>Order via WhatsApp &rarr;</span>
            </button>

            <!-- Institutional Invoice / Clear Cart options -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
              <a href="classes.html#book" onclick="closeCartDrawer()" style="color: #55524A; text-decoration: underline; font-weight: 500;">Need school invoice / quote?</a>
              <button type="button" onclick="GoodSoilCart.clearCart()" style="background: none; border: 0; color: #8A4B2A; cursor: pointer; font-weight: 700; text-decoration: underline;">Clear cart</button>
            </div>
          </div>
        </aside>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = drawerHTML;
    document.body.appendChild(div.firstElementChild);

    // Setup Escape key listener
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isCartDrawerOpen()) {
        closeCartDrawer();
      }
    });
  }

  function isCartDrawerOpen() {
    const container = document.getElementById('cart-drawer-container');
    return container && container.style.display !== 'none';
  }

  function openCartDrawer(triggerElement) {
    injectCartDrawerHTML();
    lastFocusedElement = triggerElement || document.activeElement;

    const container = document.getElementById('cart-drawer-container');
    const backdrop = document.getElementById('cart-backdrop');
    const drawer = document.getElementById('cart-drawer');

    renderCartDrawer();

    container.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Animation frame
    requestAnimationFrame(() => {
      backdrop.style.opacity = '1';
      drawer.style.transform = 'translateX(0)';
      const closeBtn = document.getElementById('cart-close-btn');
      if (closeBtn) closeBtn.focus();
    });
  }

  function closeCartDrawer() {
    const container = document.getElementById('cart-drawer-container');
    const backdrop = document.getElementById('cart-backdrop');
    const drawer = document.getElementById('cart-drawer');

    if (!container || container.style.display === 'none') return;

    backdrop.style.opacity = '0';
    drawer.style.transform = 'translateX(100%)';

    setTimeout(() => {
      container.style.display = 'none';
      document.body.style.overflow = '';
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }, 300);
  }

  window.openCartDrawer = openCartDrawer;
  window.closeCartDrawer = closeCartDrawer;

  function renderCartDrawer() {
    const items = GoodSoilCart.getItems();
    const count = GoodSoilCart.getCount();
    const subtotal = GoodSoilCart.getTotal();

    const badge = document.getElementById('cart-drawer-badge');
    if (badge) badge.textContent = count;

    const list = document.getElementById('cart-items-list');
    const footer = document.getElementById('cart-footer');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px; padding: 48px 12px;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: #F2F5EF; display: flex; align-items: center; justify-content: center; font-size: 36px;">
            🌱
          </div>
          <h3 style="margin: 0; font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; color: #1C1B18;">Your cart is empty</h3>
          <p style="margin: 0; color: #55524A; font-size: 15px; max-width: 26ch; line-height: 1.5;">Every Good Soil kit comes with illustrated guides and classroom testing.</p>
          <a href="shop.html" onclick="closeCartDrawer()" style="margin-top: 10px; background: #1F6B44; color: #FFFFFF; font-weight: 700; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px;">Browse 840+ Kits &rarr;</a>
        </div>
      `;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'flex';

    list.innerHTML = items.map(item => `
      <div style="display: flex; gap: 14px; padding: 14px; border-radius: 18px; border: 1px solid #ECEAE3; background: #FFFFFF; align-items: center;">
        <div style="width: 72px; height: 72px; border-radius: 12px; overflow: hidden; background: #F2F5EF; flex-shrink: 0; position: relative;">
          <img src="${item.img}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px;">
          <span style="font-size: 11px; font-weight: 800; color: #8A4B2A; letter-spacing: 0.04em;">${(item.cat || 'STEM').toUpperCase()}</span>
          <span style="font-weight: 700; font-size: 15px; color: #1C1B18; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
          <span style="font-weight: 800; font-family: 'Bricolage Grotesque', sans-serif; font-size: 16px; color: #1F6B44;">₹${item.price.toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
          <button type="button" onclick="GoodSoilCart.removeItem('${item.id}')" aria-label="Remove ${item.name} from cart" style="border: 0; background: none; color: #8E8A7F; cursor: pointer; font-size: 14px; padding: 2px;">
            &times;
          </button>
          <div style="display: flex; align-items: center; border: 1px solid #DAD7CE; border-radius: 999px; background: #FAF9F5; overflow: hidden;">
            <button type="button" onclick="GoodSoilCart.updateQty('${item.id}', -1)" aria-label="Decrease quantity" style="width: 28px; height: 28px; border: 0; background: none; cursor: pointer; font-weight: 700; color: #1C1B18;">-</button>
            <span style="min-width: 22px; text-align: center; font-size: 13px; font-weight: 700;">${item.qty}</span>
            <button type="button" onclick="GoodSoilCart.updateQty('${item.id}', 1)" aria-label="Increase quantity" style="width: 28px; height: 28px; border: 0; background: none; cursor: pointer; font-weight: 700; color: #1C1B18;">+</button>
          </div>
        </div>
      </div>
    `).join('');

    // Update pricing
    const subtotalEl = document.getElementById('cart-subtotal-val');
    const discountRow = document.getElementById('cart-discount-row');
    const discountEl = document.getElementById('cart-discount-val');
    const totalEl = document.getElementById('cart-total-val');

    if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString('en-IN');
    
    let discountAmount = 0;
    if (discountPercent > 0) {
      discountAmount = Math.round(subtotal * (discountPercent / 100));
      if (discountRow) discountRow.style.display = 'flex';
      if (discountEl) discountEl.textContent = '-₹' + discountAmount.toLocaleString('en-IN');
    } else {
      if (discountRow) discountRow.style.display = 'none';
    }

    const finalTotal = Math.max(0, subtotal - discountAmount);
    if (totalEl) totalEl.textContent = '₹' + finalTotal.toLocaleString('en-IN');
  }

  function applyPromoCode() {
    const input = document.getElementById('promo-input');
    const status = document.getElementById('promo-status');
    if (!input || !status) return;

    const code = input.value.trim().toUpperCase();
    if (code === 'GOODSOIL10') {
      discountPercent = 10;
      status.style.display = 'block';
      status.style.color = '#1F6B44';
      status.textContent = '✓ 10% discount applied!';
      renderCartDrawer();
    } else if (code === '') {
      discountPercent = 0;
      status.style.display = 'none';
      renderCartDrawer();
    } else {
      status.style.display = 'block';
      status.style.color = '#C85A32';
      status.textContent = 'Invalid promo code. Use GOODSOIL10';
    }
  }
  window.applyPromoCode = applyPromoCode;

  function checkoutViaWhatsApp() {
    const items = GoodSoilCart.getItems();
    if (items.length === 0) return;

    const subtotal = GoodSoilCart.getTotal();
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    const total = subtotal - discountAmount;

    let text = "Hello Good Soil! 🌱 I would like to order the following kits from your catalogue:\n\n";
    items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.name}* (x${item.qty}) — ₹${(item.price * item.qty).toLocaleString('en-IN')}\n`;
    });

    if (discountPercent > 0) {
      text += `\n*Promo Discount (10%):* -₹${discountAmount.toLocaleString('en-IN')}`;
    }
    text += `\n*Total Amount:* ₹${total.toLocaleString('en-IN')}\n\nPlease confirm availability and delivery details. Thank you!`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/919811100000?text=${encoded}`, '_blank');
    GoodSoilCart.clearCart();
  }
  window.checkoutViaWhatsApp = checkoutViaWhatsApp;

  // Sync navbar cart counters whenever cart changes
  function updateNavCartBadges() {
    const count = GoodSoilCart.getCount();
    document.querySelectorAll('[data-cart-counter], #cart-counter, #nav-cart-badge').forEach(badge => {
      badge.textContent = count;
    });
  }

  window.addEventListener('goodsoil:cartupdated', () => {
    updateNavCartBadges();
    if (isCartDrawerOpen()) {
      renderCartDrawer();
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 3. ACCESSIBLE TOAST NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────
  function showToast(message) {
    let toast = document.getElementById('goodsoil-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'goodsoil-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = 'position: fixed; bottom: 28px; right: 28px; background: #1C1B18; color: #FFFFFF; padding: 14px 24px; border-radius: 999px; font-family: "DM Sans", sans-serif; font-weight: 700; font-size: 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.28); z-index: 10001; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease; opacity: 0; transform: translateY(20px); pointer-events: none; border: 1px solid rgba(255,255,255,0.15);';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
    }, 2800);
  }
  window.showToast = showToast;

  // ─────────────────────────────────────────────────────────────
  // 4. ACCESSIBLE VIDEO SHOWCASE MODAL
  // ─────────────────────────────────────────────────────────────
  function openVideoModal() {
    let modal = document.getElementById('goodsoil-video-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'goodsoil-video-modal';
      modal.style.cssText = 'position: fixed; inset: 0; z-index: 10002; display: flex; align-items: center; justify-content: center; background: rgba(14,14,12,0.85); backdrop-filter: blur(8px); padding: 20px;';
      modal.innerHTML = `
        <div style="position: relative; width: 100%; max-width: 800px; background: #1C1B18; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.5); border: 1px solid #3A3832;">
          <div style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2A2925;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #E03E3E; display: inline-block;"></span>
              <span style="color: #FFFFFF; font-weight: 700; font-size: 15px; font-family: 'Bricolage Grotesque', sans-serif;">Good Soil Hands-On Workshop Reel</span>
            </div>
            <button type="button" onclick="closeVideoModal()" aria-label="Close video player" style="background: none; border: 0; color: #FFFFFF; font-size: 24px; cursor: pointer; padding: 4px;">&times;</button>
          </div>
          <div style="aspect-ratio: 16 / 9; position: relative; background: #000000; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <img src="images/hero-workshop.jpg" alt="Children testing gliders and robots" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.8) 100%);"></div>
            <div style="position: absolute; bottom: 20px; left: 24px; right: 24px; color: #FFFFFF; font-family: 'DM Sans', sans-serif;">
              <div style="font-weight: 800; font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; margin-bottom: 4px;">Glider Lab & Drone Flight Testing Day</div>
              <div style="font-size: 14px; color: #DCEBE2;">Filmed on location at Good Soil Experience Centre, New Delhi</div>
            </div>
          </div>
        </div>
      `;
      modal.onclick = function (e) {
        if (e.target === modal) closeVideoModal();
      };
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeVideoModal() {
    const modal = document.getElementById('goodsoil-video-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  window.openVideoModal = openVideoModal;
  window.closeVideoModal = closeVideoModal;

  // ─────────────────────────────────────────────────────────────
  // 5. ACCESSIBLE CURRICULUM REDIRECTION & MODAL
  // ─────────────────────────────────────────────────────────────
  function openPdfModal(moduleTitle) {
    let modal = document.getElementById('goodsoil-pdf-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'goodsoil-pdf-modal';
      modal.style.cssText = 'position: fixed; inset: 0; z-index: 10002; display: flex; align-items: center; justify-content: center; background: rgba(14,14,12,0.8); backdrop-filter: blur(8px); padding: 20px; font-family: "DM Sans", sans-serif;';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div style="position: relative; width: 100%; max-width: 580px; background: #FFFFFF; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.3); border: 1px solid #ECEAE3;">
        <div style="padding: 20px 24px; border-bottom: 1px solid #ECEAE3; display: flex; justify-content: space-between; align-items: center; background: #FAF9F5;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">📄</span>
            <h3 style="margin: 0; font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; color: #1C1B18;">Curriculum Guide: ${moduleTitle}</h3>
          </div>
          <button type="button" onclick="closePdfModal()" aria-label="Close build guide preview" style="background: none; border: 0; color: #1C1B18; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <div style="background: #F2F5EF; padding: 14px 18px; border-radius: 14px; font-size: 14px; color: #1F6B44; font-weight: 700;">
            ✓ Official Good Soil 25-Class Master Curriculum
          </div>
          <div style="font-size: 15px; color: #4A4740; line-height: 1.6;">
            Complete 25-class STEM &amp; Robotics curriculum for Junior (7–10) and Senior (10–14+) cohorts — including 10 take-home kits, 10 team studio builds, aeromodelling, and hands-on milestone challenges.
          </div>
          <div style="border-top: 1px solid #ECEAE3; padding-top: 14px; display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
            <div><strong>Format:</strong> Detailed Curriculum &amp; Batch Guide</div>
            <div><strong>Covers:</strong> 25 Weekend Classes · 50 Hours · 4 Phases</div>
            <div><strong>Age Groups:</strong> Junior (7–10) &amp; Senior (10–14+)</div>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
            <a href="mailto:info@goodsoilmakers.com?subject=Good%20Soil%20Curriculum%20Request%3A%20${encodeURIComponent(moduleTitle)}&body=Hi%20Good%20Soil%20Team%2C%0A%0AI%20would%20like%20to%20request%20the%20curriculum%20guide%20for%20${encodeURIComponent(moduleTitle)}.%0A%0AParent%20%2F%20School%20Name%3A%0APhone%20%2F%20WhatsApp%3A%0AStudent%20Age%3A%0A%0AThank%20you!" onclick="closePdfModal()" style="flex: 1; min-height: 48px; border-radius: 999px; background: #1F6B44; color: #FFFFFF; font-weight: 700; font-size: 15px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
              <span>✉ Contact info@goodsoilmakers.com &rarr;</span>
            </a>
            <a href="shop.html" onclick="closePdfModal()" style="display: inline-flex; align-items: center; justify-content: center; padding: 0 20px; border-radius: 999px; border: 1.5px solid #1C1B18; color: #1C1B18; font-weight: 700; font-size: 14px; text-decoration: none;">Get the Kit &rarr;</a>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closePdfModal() {
    const modal = document.getElementById('goodsoil-pdf-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function triggerPdfDownload(title) {
    showToast('✉ Redirecting to email info@goodsoilmakers.com…');
    closePdfModal();
    const subject = encodeURIComponent('Good Soil Master Curriculum Request: ' + (title || '25-Class Curriculum'));
    const body = encodeURIComponent('Hi Good Soil Team,\n\nI would like to request the 25-Class Master STEM & Robotics Curriculum guide.\n\nParent / School Name:\nPhone / WhatsApp:\nStudent Age:\n\nThank you!');
    setTimeout(() => {
      window.location.href = `mailto:info@goodsoilmakers.com?subject=${subject}&body=${body}`;
    }, 300);
  }

  window.openPdfModal = openPdfModal;
  window.closePdfModal = closePdfModal;
  window.triggerPdfDownload = triggerPdfDownload;

  // ─────────────────────────────────────────────────────────────
  // 5b. RESPONSIVE MOBILE NAVIGATION SYSTEM
  // ─────────────────────────────────────────────────────────────
  function injectMobileNav() {
    // 1. Inject responsive CSS styles for navigation across all pages
    if (!document.getElementById('goodsoil-mobile-styles')) {
      const style = document.createElement('style');
      style.id = 'goodsoil-mobile-styles';
      style.textContent = `
        /* Mobile-friendly responsiveness */
        @media (max-width: 768px) {
          body {
            overflow-x: hidden !important;
          }
          header {
            position: sticky !important;
            top: 0 !important;
            z-index: 1000 !important;
          }
          header nav {
            padding: 10px 16px !important;
            gap: 10px !important;
            justify-content: space-between !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
          }
          /* Hide desktop links from header bar on mobile */
          header nav > div:first-of-type {
            display: none !important;
          }
          /* Hide desktop 'Book a class' button in top bar on small screens */
          header nav > div:last-of-type > a[href*="classes.html#book"] {
            display: none !important;
          }
          .goodsoil-mobile-toggle {
            display: inline-flex !important;
          }
          section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
        @media (min-width: 769px) {
          .goodsoil-mobile-toggle {
            display: none !important;
          }
          #goodsoil-mobile-menu {
            display: none !important;
          }
        }
        .goodsoil-mobile-toggle {
          display: none;
          width: 44px;
          height: 44px;
          border-radius: 22px;
          border: 1px solid #DAD7CE;
          background: #FFFFFF;
          color: #1C1B18;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 20px;
          transition: background 0.2s, border-color 0.2s;
        }
        .goodsoil-mobile-toggle:hover {
          background: #F2F5EF;
          border-color: #1F6B44;
        }
        #goodsoil-mobile-menu {
          display: none;
          position: fixed;
          top: 65px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(28,27,24,0.6);
          backdrop-filter: blur(4px);
          z-index: 9998;
        }
        #goodsoil-mobile-menu-inner {
          background: #FFFFFF;
          border-bottom: 3px solid #1F6B44;
          box-shadow: 0 16px 40px rgba(0,0,0,0.2);
          padding: 20px 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: calc(100vh - 80px);
          overflow-y: auto;
          animation: slideDownNav 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideDownNav {
          from { transform: translateY(-16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          text-decoration: none;
          color: #1C1B18;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 16px;
          transition: background 0.15s ease;
        }
        .mobile-nav-item:hover, .mobile-nav-item.active {
          background: #F2F5EF;
          color: #1F6B44;
        }
      `;
      document.head.appendChild(style);
    }

    // 2. Add Hamburger button to nav if not present
    const navActions = document.querySelector('header nav > div:last-of-type');
    if (navActions && !document.getElementById('goodsoil-mobile-btn')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.id = 'goodsoil-mobile-btn';
      toggleBtn.className = 'goodsoil-mobile-toggle';
      toggleBtn.setAttribute('aria-label', 'Toggle mobile navigation menu');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = `
        <svg id="goodsoil-burger-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
      toggleBtn.onclick = toggleMobileNav;
      navActions.appendChild(toggleBtn);
    }

    // 3. Inject Mobile Menu Drawer container
    if (!document.getElementById('goodsoil-mobile-menu')) {
      const menu = document.createElement('div');
      menu.id = 'goodsoil-mobile-menu';
      menu.onclick = function (e) {
        if (e.target === menu) closeMobileNav();
      };

      const path = (window.location.pathname || '').toLowerCase();
      const isClasses = path.includes('classes');
      const isShop = path.includes('shop');
      const isCurric = path.includes('curriculum');

      menu.innerHTML = `
        <div id="goodsoil-mobile-menu-inner">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <a href="classes.html" class="mobile-nav-item ${isClasses ? 'active' : ''}" onclick="closeMobileNav()">
              <span style="font-size: 20px;">🏫</span>
              <span>Classes &amp; Camps</span>
            </a>
            <a href="shop.html" class="mobile-nav-item ${isShop ? 'active' : ''}" onclick="closeMobileNav()">
              <span style="font-size: 20px;">🛠️</span>
              <span>Kit Shop</span>
            </a>
            <a href="curriculum.html" class="mobile-nav-item ${isCurric ? 'active' : ''}" onclick="closeMobileNav()">
              <span style="font-size: 20px;">📄</span>
              <span>Curriculum</span>
            </a>
            <a href="index.html#gallery" class="mobile-nav-item" onclick="closeMobileNav()">
              <span style="font-size: 20px;">📸</span>
              <span>Workshop Gallery</span>
            </a>
            <a href="index.html#story" class="mobile-nav-item" onclick="closeMobileNav()">
              <span style="font-size: 20px;">🌱</span>
              <span>Our Story</span>
            </a>
          </div>

          <div style="border-top: 1px solid #ECEAE3; padding-top: 14px; display: flex; flex-direction: column; gap: 10px;">
            <a href="classes.html#book" onclick="closeMobileNav()" style="background: #1C1B18; color: #FFFFFF; text-decoration: none; font-weight: 800; font-size: 16px; padding: 14px; border-radius: 999px; text-align: center; display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              Book a class &rarr;
            </a>
            <div style="font-size: 13px; color: #55524A; text-align: center; line-height: 1.5; padding-top: 4px;">
              <div>Have questions? Contact us:</div>
              <a href="mailto:info@goodsoilmakers.com" style="color: #1F6B44; font-weight: 700; text-decoration: none;">info@goodsoilmakers.com</a>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(menu);
    }
  }

  function toggleMobileNav() {
    const menu = document.getElementById('goodsoil-mobile-menu');
    const btn = document.getElementById('goodsoil-mobile-btn');
    if (!menu) return;

    if (menu.style.display === 'block') {
      closeMobileNav();
    } else {
      menu.style.display = 'block';
      if (btn) {
        btn.setAttribute('aria-expanded', 'true');
        btn.innerHTML = `<span style="font-size: 24px; line-height: 1; font-weight: 800;">&times;</span>`;
      }
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileNav() {
    const menu = document.getElementById('goodsoil-mobile-menu');
    const btn = document.getElementById('goodsoil-mobile-btn');
    if (menu) menu.style.display = 'none';
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = `
        <svg id="goodsoil-burger-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
    }
    document.body.style.overflow = '';
  }

  window.toggleMobileNav = toggleMobileNav;
  window.closeMobileNav = closeMobileNav;

  // ─────────────────────────────────────────────────────────────
  // 6. INITIALIZATION & GLOBAL EVENT WIRING
  // ─────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    injectCartDrawerHTML();
    injectMobileNav();
    updateNavCartBadges();

    // Wire up all Cart trigger buttons across any page
    document.querySelectorAll('[data-open-cart], a[aria-label="Cart"], button[aria-label="Open cart"], a[href="shop.html"][aria-label="Cart"]').forEach(btn => {
      btn.addEventListener('click', function (e) {
        // If clicking on cart icon on any page, open the drawer instead of redirecting!
        e.preventDefault();
        openCartDrawer(this);
      });
    });

    // Wire up video play buttons in heroes and gallery
    document.querySelectorAll('button[aria-label="Play workshop reel"], button[aria-label="Play featured video"]').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openVideoModal();
      });
    });

    // Wire up newsletter forms across all pages
    document.querySelectorAll('form').forEach(f => {
      const emailInput = f.querySelector('input[type="email"]');
      if (emailInput && !f.id.includes('seat-form')) {
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          const email = emailInput.value.trim();
          if (email) {
            try {
              const subs = JSON.parse(localStorage.getItem('goodsoil_subscribers') || '[]');
              subs.push({ email, timestamp: new Date().toISOString() });
              localStorage.setItem('goodsoil_subscribers', JSON.stringify(subs));
            } catch (err) {}
            showToast('🎉 Thank you! ' + email + ' has been subscribed to camp dates.');
            emailInput.value = '';
          }
        });
      }
    });

    // Gallery Filter wiring if on home page
    const gallerySection = document.getElementById('gallery');
    if (gallerySection) {
      const filterBtns = gallerySection.querySelectorAll('div > button[type="button"]');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
          filterBtns.forEach(b => {
            b.style.background = '#FFFFFF';
            b.style.color = '#1C1B18';
            b.style.border = '1px solid #DAD7CE';
          });
          this.style.background = '#1C1B18';
          this.style.color = '#FFFFFF';
          this.style.border = '0';

          const filterType = this.textContent.trim().toLowerCase();
          const photoTiles = gallerySection.querySelectorAll('.tile[role="img"]');
          const videoTile = gallerySection.querySelector('.tile button[aria-label="Play featured video"]')?.closest('.tile');

          if (filterType === 'videos') {
            photoTiles.forEach(t => t.style.opacity = '0.35');
            if (videoTile) { videoTile.style.opacity = '1'; videoTile.style.transform = 'scale(1.03)'; }
          } else if (filterType === 'photos') {
            photoTiles.forEach(t => t.style.opacity = '1');
            if (videoTile) { videoTile.style.opacity = '0.35'; videoTile.style.transform = ''; }
          } else {
            photoTiles.forEach(t => t.style.opacity = '1');
            if (videoTile) { videoTile.style.opacity = '1'; videoTile.style.transform = ''; }
          }
        });
      });
    }
  });

})();
