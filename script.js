// Global state for cart and menu items
let cart = [];
let menuItems = [];

// DOM elements
const menuItemsContainer = document.getElementById('menu-items-container');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items');
const emptyCartMessage = document.getElementById('empty-cart-message');
const cartCount = document.getElementById('cart-count');
const cartFooter = document.getElementById('cart-footer');
const totalAmountElement = document.getElementById('total-amount');
const orderNowBtn = document.getElementById('order-now-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');
const currentYearElement = document.getElementById('current-year');

// Set current year for the footer
currentYearElement.textContent = new Date().getFullYear();

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);
cartToggleBtn.addEventListener('click', toggleCart);
closeCartBtn.addEventListener('click', toggleCart);
orderNowBtn.addEventListener('click', handleOrderNow);
clearCartBtn.addEventListener('click', clearCart);

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    await fetchMenuItems();
    renderMenuItems();
    loadCartFromStorage();
    updateCartDisplay();
    
    // Set up polling to check for updates every 5 minutes
    setInterval(fetchMenuItems, 5 * 60 * 1000);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showToast('Error loading menu items', 'error');
  }
}

/**
 * Fetch menu items from Google Sheets
 */
async function fetchMenuItems() {
  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTe1TOsmeLBW4qqahFR_HFlYCp-XZyjKJRPyKSc63t3-7rlNmjAdBfhsHkv8hjgOZfuYkMJfFI3iOKb/pub?output=csv');
    
    if (!response.ok) {
      throw new Error('Failed to fetch menu data');
    }
    
    const csvText = await response.text();
    
    // Parse CSV data
    const rows = csvText.split('\n');
    const headers = rows[0].split(',');
    
    // Map CSV data to menu items
    const items = [];
    
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue; // Skip empty rows
      
      const values = rows[i].split(',');
      const item = {
        id: parseInt(values[0] || '0'),
        name: values[1] || 'Unknown Item',
        description: values[2] || '',
        singlePrice: parseInt(values[3] || '0'),
        fullPrice: parseInt(values[4] || '0'),
        image: values[5] || '',
        category: values[6] || 'Other'
      };
      
      items.push(item);
    }
    
    menuItems = items;
    console.log('Fetched menu items:', menuItems);
    
    if (menuItemsContainer) {
      renderMenuItems();
      showToast(`Successfully loaded ${items.length} menu items`, 'success');
    }
  } catch (error) {
    console.error('Error fetching menu items:', error);
    showToast('Could not load the menu items. Please try again later.', 'error');
  }
}

/**
 * Render menu items in the container
 */
function renderMenuItems() {
  // Clear loading placeholders
  menuItemsContainer.innerHTML = '';
  
  if (menuItems.length === 0) {
    const noMenuElement = document.createElement('div');
    noMenuElement.className = 'no-menu-message';
    noMenuElement.innerHTML = `
      <div class="empty-menu">
        <div class="utensils-icon"></div>
        <h2>Menu Unavailable</h2>
        <p>We couldn't load the menu items at this time. Please check back later.</p>
      </div>
    `;
    menuItemsContainer.appendChild(noMenuElement);
    return;
  }
  
  // Create and append menu items
  menuItems.forEach(item => {
    const menuItemElement = document.createElement('div');
    menuItemElement.className = 'menu-item';
    menuItemElement.innerHTML = `
      <img src="${item.image || '/placeholder.svg'}" alt="${item.name}" class="menu-item-image" onerror="this.src='/placeholder.svg'">
      <h3 class="menu-item-title">${item.name}</h3>
      ${item.description ? `<p class="menu-item-description">${item.description}</p>` : ''}
      <div class="menu-item-actions">
        <button id="btn-${item.id}-single" class="btn-cart">Add Single - ₹${item.singlePrice}</button>
        <button id="btn-${item.id}-full" class="btn-cart light">Add Full - ₹${item.fullPrice}</button>
      </div>
    `;
    
    menuItemsContainer.appendChild(menuItemElement);
    
    // Add event listeners to the buttons
    const singleBtn = document.getElementById(`btn-${item.id}-single`);
    const fullBtn = document.getElementById(`btn-${item.id}-full`);
    
    singleBtn.addEventListener('click', () => addToCart(item, 'single'));
    fullBtn.addEventListener('click', () => addToCart(item, 'full'));
  });
}

/**
 * Add an item to the cart
 */
function addToCart(item, portion) {
  const selectedItem = {
    ...item,
    selectedPortion: portion,
    price: portion === 'single' ? item.singlePrice : item.fullPrice,
  };
  
  cart.push(selectedItem);
  saveCartToStorage();
  updateCartDisplay();
  
  // Add animation to button
  const btnElement = document.getElementById(`btn-${item.id}-${portion}`);
  if (btnElement) {
    btnElement.classList.add('animate-scale-up');
    setTimeout(() => {
      btnElement.classList.remove('animate-scale-up');
    }, 300);
  }
  
  showToast(`${item.name} (${portion}) has been added to your cart.`, 'success');
}

/**
 * Remove an item from the cart
 */
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCartToStorage();
  updateCartDisplay();
  showToast('Item removed from cart', 'info');
}

/**
 * Clear the entire cart
 */
function clearCart() {
  cart = [];
  saveCartToStorage();
  updateCartDisplay();
  showToast('Cart has been cleared', 'info');
}

/**
 * Toggle the cart overlay visibility
 */
function toggleCart() {
  cartOverlay.classList.toggle('hidden');
  updateCartDisplay();
}

/**
 * Update the cart display with current items
 */
function updateCartDisplay() {
  // Update cart count
  cartCount.textContent = cart.length;
  
  // Show/hide empty cart message and footer
  if (cart.length === 0) {
    emptyCartMessage.classList.remove('hidden');
    cartFooter.classList.add('hidden');
    cartItemsContainer.innerHTML = '';
    cartItemsContainer.appendChild(emptyCartMessage);
  } else {
    emptyCartMessage.classList.add('hidden');
    cartFooter.classList.remove('hidden');
    
    // Clear existing items
    cartItemsContainer.innerHTML = '';
    
    // Add each cart item
    cart.forEach((item, index) => {
      const cartItemElement = document.createElement('div');
      cartItemElement.className = 'cart-item';
      cartItemElement.innerHTML = `
        <div class="cart-item-details">
          <div class="cart-item-info">
            <h3>${item.name}</h3>
            <p class="cart-item-portion">${item.selectedPortion === 'single' ? 'Single' : 'Full'}</p>
            <p class="cart-item-price">₹${item.price}</p>
          </div>
          <button class="remove-from-cart-btn" data-index="${index}">×</button>
        </div>
      `;
      
      cartItemsContainer.appendChild(cartItemElement);
      
      // Add event listener to remove button
      const removeBtn = cartItemElement.querySelector('.remove-from-cart-btn');
      removeBtn.addEventListener('click', () => removeFromCart(index));
    });
    
    // Calculate and update total amount
    const totalAmount = cart.reduce((total, item) => total + item.price, 0);
    totalAmountElement.textContent = `₹${totalAmount}`;
  }
}

/**
 * Handle Order Now button click
 */
function handleOrderNow() {
  // Format the order message for WhatsApp
  const phoneNumber = "7075954214";
  const orderItems = cart.map(item => 
    `${item.name} (${item.selectedPortion === 'single' ? 'Single' : 'Full'}) - ₹${item.price}`
  ).join('\n');
  
  const totalAmount = cart.reduce((total, item) => total + item.price, 0);
  const message = `Order Details:\n${orderItems}\nTotal: ₹${totalAmount} + Delivery charges as per delivery app.`;
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Open WhatsApp with the pre-filled message
  window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
}

/**
 * Save cart to local storage
 */
function saveCartToStorage() {
  localStorage.setItem('royalFoodCart', JSON.stringify(cart));
}

/**
 * Load cart from local storage
 */
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('royalFoodCart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (error) {
      console.error('Error parsing cart from storage:', error);
      cart = [];
    }
  }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
    
    // Add styles for toast container
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        bottom: 1rem;
        left: 1rem;
        z-index: 1000;
      }
      
      .toast {
        background-color: white;
        color: #333;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: center;
        min-width: 16rem;
        max-width: 24rem;
        animation: toast-in 0.3s ease-out forwards;
      }
      
      .toast.success {
        border-left: 4px solid #10B981;
      }
      
      .toast.error {
        border-left: 4px solid #EF4444;
      }
      
      .toast.info {
        border-left: 4px solid #3B82F6;
      }
      
      @keyframes toast-in {
        from {
          transform: translateY(1rem);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Remove after delay
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(1rem)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
