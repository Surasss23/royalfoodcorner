const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS1IUyfhP0Q-WI5g8T1I9yzBZskCJYkDnLwZRibYpqCWBhJwl1lD8mYm7q7XYkYVTx8ei2nK7Zl0uqb/pub?output=csv";
let cart = [];

async function fetchFoodItems() {
    try {
        const response = await fetch(sheetURL);
        const data = await response.text();
        const rows = data.split("\n").slice(1); // Skip Header Row

        const foodContainer = document.getElementById("food-container");
        foodContainer.innerHTML = "";

        rows.forEach(row => {
            const cols = row.split(",");
            if (cols.length >= 4) {
                const [image, name, singlePrice, fullPrice] = cols;
                const foodBox = document.createElement("div");
                foodBox.className = "food-box";

                foodBox.innerHTML = `
                    <img src="${image.trim()}" alt="${name.trim()}">
                    <h3>${name.trim()}</h3>
                    <p>Single: ₹${singlePrice.trim()} | Full: ₹${fullPrice.trim()}</p>
                    <button onclick="addToCart('${name.trim()}', ${singlePrice.trim()}, 'Single')">Add Single ₹${singlePrice.trim()}</button>
                    <button onclick="addToCart('${name.trim()}', ${fullPrice.trim()}, 'Full')">Add Full ₹${fullPrice.trim()}</button>
                `;
                foodContainer.appendChild(foodBox);
            }
        });
    } catch (error) {
        console.error("Error fetching food data:", error);
    }
}

function addToCart(name, price, type) {
    cart.push({ name, price, type });
    alert(`${name} (${type}) added to cart!`);
}

function openCart() {
    document.getElementById("cart-modal").style.display = "block";
    updateCart();
}

function closeCart() {
    document.getElementById("cart-modal").style.display = "none";
}

function updateCart() {
    const cartItems = document.getElementById("cart-items");
    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        total += Number(item.price);
        const li = document.createElement("li");
        li.innerHTML = `${item.name} (${item.type}) - ₹${item.price} <button onclick="removeFromCart(${index})">X</button>`;
        cartItems.appendChild(li);
    });

    const deliveryText = `Total ₹${total} + Delivery Charges (As per delivery app)`;
    const totalLi = document.createElement("li");
    totalLi.innerHTML = `<strong>${deliveryText}</strong>`;
    cartItems.appendChild(totalLi);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function placeOrder() {
    let message = "Order Details:\n";
    cart.forEach(item => {
        message += `${item.name} (${item.type}) - ₹${item.price}\n`;
    });
    message += "Total + Delivery Charges (As per delivery app)";
    
    const whatsappURL = `https://wa.me/7989386499?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
}

fetchFoodItems();
