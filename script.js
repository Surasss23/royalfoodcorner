// Cart Management
let cart = [];

function loadCart() {
  const savedCart = localStorage.getItem('cart');
  return savedCart ? JSON.parse(savedCart) : [];
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

function addToCart(menuItem, isFullSize) {
  const existingItem = cart.find(item => 
    item.id === menuItem.id && item.isFullSize === isFullSize
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...menuItem,
      quantity: 1,
      isFullSize
    });
  }

  saveCart();
  showToast(`${menuItem.name} added to cart`);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
}

function calculateTotal() {
  return cart.reduce((total, item) => 
    total + (item.isFullSize ? item.fullPrice : item.singlePrice) * item.quantity, 0
  );
}

// Menu Rendering
async function fetchMenuItems() {
  try {
    const response = await fetch('/api/menu');
    const menuItems = await response.json();
    renderMenu(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    showToast('Failed to load menu items', 'error');
  }
}

function renderMenu(menuItems) {
  const menuGrid = document.getElementById('menu-items');
  menuGrid.innerHTML = menuItems.map(item => `
    <div class="menu-item">
      <img src="${item.imageUrl}" alt="${item.name}">
      <div class="menu-item-content">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="price-section">
          <div>
            <p>Single: ₹${item.singlePrice}</p>
            <p>Full: ₹${item.fullPrice}</p>
          </div>
          <div class="buttons">
            <button onclick="addToCart(${JSON.stringify(item)}, false)" class="button primary">
              Add Single
            </button>
            <button onclick="addToCart(${JSON.stringify(item)}, true)" class="button secondary">
              Add Full
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Your cart is empty</p>';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
          <p>${item.name}</p>
          <p>${item.quantity}x ${item.isFullSize ? 'Full' : 'Single'}</p>
        </div>
        <div>
          <p>₹${(item.isFullSize ? item.fullPrice : item.singlePrice) * item.quantity}</p>
          <button onclick="removeFromCart(${item.id})" class="button outline">Remove</button>
        </div>
      </div>
    `).join('');
  }
  
  cartTotal.textContent = `₹${calculateTotal()}`;
}

// Reviews Management
async function fetchReviews() {
  try {
    const response = await fetch('/api/reviews');
    const reviews = await response.json();
    renderReviews(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
}

function renderReviews(reviews) {
  const reviewsContainer = document.getElementById('reviews-container');
  reviewsContainer.innerHTML = reviews.map(review => `
    <div class="review-card">
      <div class="review-header">
        <h4>${review.customerName}</h4>
        <div class="rating">
          ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
        </div>
      </div>
      <p>${review.comment}</p>
      <small>${new Date(review.createdAt).toLocaleDateString()}</small>
    </div>
  `).join('');
}

async function handleReviewSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const review = {
    customerName: formData.get('customerName'),
    rating: parseInt(formData.get('rating')),
    comment: formData.get('comment')
  };

  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(review)
    });

    if (response.ok) {
      showToast('Review submitted successfully');
      form.reset();
      fetchReviews();
    } else {
      throw new Error('Failed to submit review');
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    showToast('Failed to submit review', 'error');
  }
}

// WhatsApp Integration
function handleOrder() {
  if (cart.length === 0) {
    showToast('Please add items to cart first', 'error');
    return;
  }

  const message = cart.map(item => 
    `${item.quantity}x ${item.name} (${item.isFullSize ? 'Full' : 'Single'}) - ₹${
      (item.isFullSize ? item.fullPrice : item.singlePrice) * item.quantity
    }`
  ).join('\n');

  const phoneNumber = '+917075954214'; // Replace with actual number
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    `New Order:\n${message}\n\nTotal: ₹${calculateTotal()}`
  )}`;

  window.open(whatsappUrl);
  cart = [];
  saveCart();
}

// Utility Functions
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  cart = loadCart();
  fetchMenuItems();
  fetchReviews();
  renderCart();
  
  // Setup rating stars
  const ratingStars = document.getElementById('rating-stars');
  if (ratingStars) {
    ratingStars.innerHTML = Array.from({length: 5}, (_, i) => `
      <span onclick="setRating(${i + 1})" class="star">☆</span>
    `).join('');
  }
});

function setRating(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    star.textContent = index < rating ? '★' : '☆';
  });
  document.querySelector('input[name="rating"]').value = rating;
}
