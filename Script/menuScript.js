// Initialize global variables
let cart = [];

// Load all items from the API
function loadItems() {
    fetch('http://localhost:8080/item/get-all/list', { method: "GET", redirect: "follow" })
        .then(response => response.json())
        .then(items => {
            renderMenu(items);
            console.log(items);
        })
        .catch(error => {
            console.error('Error loading items:', error);
        });
}

// Render menu items dynamically
function renderMenu(items) {
    const menuContent = document.getElementById('menuGrid');
    menuContent.innerHTML = '';

    items.forEach((item) => {
        const card = document.createElement('div');
        card.classList.add('col-md-4', 'col-sm-6', 'mb-3');
        card.innerHTML = `
            <div class="card border-secondary mb-3" style="max-width: 18rem;">
                <div class="card-header fw-bold">${item.category.name}</div>
                <div class="card-body text-secondary text-center">
                    <h5 class="card-title text-primary fw-bold fs-4">${item.name}</h5>
                    <p class="card-text text-warning fw-bold fs-5">Rs.${item.price}</p>
                    <p class="text-muted small">Stock: ${item.stock} | Exp: ${item.doexpire}</p>
                    <button class="btn btn-outline-success w-100 mt-3" onclick="addToCart(${item.id})">
                        <i class="bi bi-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        menuContent.appendChild(card);
    });
}

// Add item to cart using API
function addToCart(itemId) {
    fetch(`http://localhost:8080/item/search-by-id/${itemId}`, { method: "GET", redirect: "follow" })
        .then(response => response.json())
        .then(item => {
            const cartItem = cart.find(cartItem => cartItem.id === item.id);
            if (cartItem) {
                cartItem.quantity++;
            } else {
                cart.push({ ...item, quantity: 1 });
            }
            renderCart();
        })
        .catch(error => {
            console.error('Error loading item details:', error);
        });
}

// Update cart count
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Calculate raw total price (no discount)
function calculateRawTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Calculate total price with discount
function calculateTotal() {
    const rawTotal = calculateRawTotal();
    const discount = parseFloat(document.getElementById('discount')?.value) || 0;
    return Math.max(0, rawTotal - discount);
}

// Update displayed totals
function updateTotals() {
    const rawTotal = calculateRawTotal();
    const discountedTotal = calculateTotal();

    const totalPriceElem = document.getElementById('totalPrice');
    const totalWithDiscountElem = document.getElementById('totalWithDiscount');

    if (totalPriceElem) totalPriceElem.textContent = rawTotal.toFixed(2);
    if (totalWithDiscountElem) totalWithDiscountElem.textContent = discountedTotal.toFixed(2);
}

// Render cart items
function renderCart() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;

    cartItems.innerHTML = '';

    cart.forEach((item, index) => {
        const cartItemElem = document.createElement('div');
        cartItemElem.classList.add('cart-item', 'mb-2', 'p-2', 'border-bottom');
        cartItemElem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${item.name} - Rs.${item.price.toFixed(2)}</span>
                <div>
                    <input type="number" class="form-control d-inline-block" 
                           style="width: 60px;" value="${item.quantity}" min="1" 
                           onchange="updateQuantity(${index}, this.value)">
                    <button class="btn btn-sm btn-danger ms-2" onclick="removeFromCart(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItemElem);
    });

    updateTotals();
    updateCartCount();
}

// Update cart item quantity
function updateQuantity(index, quantity) {
    cart[index].quantity = Math.max(1, parseInt(quantity));
    renderCart();
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

// Load and populate category filter
function filterItemsByCategory() {
    fetch('http://localhost:8080/category/get-all/list', { method: "GET", redirect: "follow" })
        .then(response => response.json())
        .then(categories => {
            const categoryFilter = document.getElementById('categoryFilter');
            if (!categoryFilter) return;

            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name;
                categoryFilter.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading categories:', error);
        });
}

// Filter items by selected category
function filterByCategory(categoryId) {
    if (categoryId) {
        fetch(`http://localhost:8080/item/search-by-category/${categoryId}`, { method: "GET" })
            .then(response => response.json())
            .then(items => {
                renderMenu(items);
            })
            .catch(error => {
                console.error('Error filtering items by category:', error);
            });
    } else {
        loadItems(); // Load all items if "All Categories" selected
    }
}

// Search items by name
function searchItems(searchTerm) {
    if (searchTerm.trim() !== '') {
        fetch(`http://localhost:8080/item/search/${searchTerm}`, { method: "GET" })
            .then(response => response.json())
            .then(items => {
                renderMenu(items);
            })
            .catch(error => {
                console.error('Error searching items:', error);
            });
    } else {
        loadItems(); // Reload all if search is empty
    }
}

// Place an order
function placeOrder() {
    const customerName = document.getElementById('customerName')?.value.trim();
    const contactNo = document.getElementById('contactNo')?.value.trim();
    const discount = parseFloat(document.getElementById('discount')?.value) || 0;


    if (!customerName || !contactNo) {
        alert('Please enter customer information');
        return;
    }

    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }

    const customerData = {
        name: customerName,
        phone: contactNo
    };

    fetch('http://localhost:8080/customer/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
    })
        .then(response => response.json())
        .then(customer => {

            const orderData = {
                "code": getNextOrderId(),
                "datetime": new Date().toLocaleString(),
                "discount": discount,
                "total": calculateTotal(),
                "customer": {
                    "id": customer.id,
                    "name": customer.name
                },
                "admin": {
                    "id": 1,
                    "name": "admin "
                },
                "paymentmethod": {
                    "id": 1,
                    "name": "Cash"
                },
                "items": cart.map(item => ({
                    "id": item.id
                }))
            };

            return fetch('http://localhost:8080/orders/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
        })
        .then(response => response.json())
        .then(order => {
            alert(`Order #${order.id} placed successfully!`);
            cart = [];
            document.getElementById('customerName').value = '';
            document.getElementById('contactNo').value = '';
            document.getElementById('discount').value = '0';
            renderCart();
        })
        .catch(error => {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        });
}

function getNextOrderId() {
    return fetch('http://localhost:8080/orders/get-order-code', { method: "GET" })
        .then(response => response.json())
        .then(data => {
            if (!data || typeof data !== 'string') return null;

            // Expected format: "ORD-2025-0020"
            const parts = data.split('-');
            if (parts.length !== 3) return null;

            const prefix = parts[0]; // "ORD"
            const year = parts[1];   // "2025"
            let number = parseInt(parts[2], 10); // 20

            if (isNaN(number)) return null;

            number += 1;

            // Pad the number with leading zeros to keep 4 digits
            const newNumber = number.toString().padStart(4, '0');

            return `${prefix}-${year}-${newNumber}`;
        })
        .catch(error => {
            console.error('Error fetching order code:', error);
            return null;
        });
}

// Load customers
function loadCustomers() {
    fetch('http://localhost:8080/customer/get-all/list', { method: "GET" })
        .then(response => response.json())
        .then(customers => {
            const customerSelect = document.getElementById('existingCustomer');
            if (!customerSelect) return;

            customerSelect.innerHTML = '<option value="">-- Select a customer --</option>';
            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = `${customer.name} (${customer.phone})`;
                customerSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading customers:', error);
        });
}

// Fill customer info
function fillCustomerInfo(customerId) {
    if (!customerId) {
        document.getElementById('customerName').value = '';
        document.getElementById('contactNo').value = '';
        return;
    }

    fetch(`http://localhost:8080/customer/search-by-id/${customerId}`, { method: "GET" })
        .then(response => response.json())
        .then(customer => {
            document.getElementById('customerName').value = customer.name;
            document.getElementById('contactNo').value = customer.phone;
        })
        .catch(error => {
            console.error('Error loading customer details:', error);
        });
}

// Initialize page on load
window.onload = function () {
    loadItems();
    filterItemsByCategory(); // Corrected line
    loadCustomers();
    renderCart();

    document.getElementById('searchItems')?.addEventListener('input', function () {
        searchItems(this.value);
    });

    document.getElementById('categoryFilter')?.addEventListener('change', function () {
        filterByCategory(this.value);
    });

    document.getElementById('existingCustomer')?.addEventListener('change', function () {
        fillCustomerInfo(this.value);
    });

    document.getElementById('placeOrder')?.addEventListener('click', placeOrder);

    document.getElementById('discount')?.addEventListener('input', updateTotals);
};
