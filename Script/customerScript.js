// Global variable for tracking editing state
let editingId = null;
let currentLoyaltyPoints = 0;

document.addEventListener('DOMContentLoaded', function () {
    loadCustomers();
    setupEventListeners();
});

// Set up event listeners for the form and search functionality
function setupEventListeners() {
    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', handleFormSubmit);
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchCustomer);
    }
}



// Handle form submission (add/update customer)
function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const preferences = document.getElementById('preferences').value.trim();

    if (name === '' || email === '' || phone === '') {
        alert('Please fill in all required fields');
        return;
    }

    if (editingId === null) {
        // Adding a new customer
        const customerData = { 
            name, 
            email, 
            phone,
            loyaltyPoints: 0,
            preferences
        };
        addCustomer(customerData);
    } else {
        // Updating an existing customer
        const customerData = { 
            id: editingId,
            name, 
            email, 
            phone,
            loyaltyPoints: currentLoyaltyPoints,
            preferences
        };
        updateCustomer(customerData);
    }
}

// Add a new customer via API
function addCustomer(customer) {
    fetch('http://localhost:8080/customer/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(customer)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        
        // Check if the response has content before trying to parse it
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().catch(error => {
                console.warn('Warning: Empty or invalid JSON response from server');
                return {};
            });
        } else {
            return {};
        }
    })
    .then(() => {
        loadCustomers();
        resetForm();
        alert('Customer added successfully!');
    })
    .catch(error => {
        console.error('Error adding customer:', error);
        alert('Failed to add customer. Please try again. Error: ' + error.message);
    });
}

// Update an existing customer via API
function updateCustomer(customer) {
    fetch(`http://localhost:8080/customer/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(customer)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        
        // Check if the response has content before trying to parse it
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().catch(error => {
                console.warn('Warning: Empty or invalid JSON response from server');
                return {};
            });
        } else {
            return {};
        }
    })
    .then(() => {
        loadCustomers();
        resetForm();
        alert('Customer updated successfully!');
    })
    .catch(error => {
        console.error('Error updating customer:', error);
        alert('Failed to update customer. Please try again. Error: ' + error.message);
    });
}

// Reset the form and editing state
function resetForm() {
    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.reset();
    }
    
    const formButton = document.querySelector('#customerForm button[type="submit"]');
    if (formButton) {
        formButton.innerText = 'Add Customer';
    }
    
    editingId = null;
    currentLoyaltyPoints = 0;
}


// Add a customer to the table
function addCustomerToTable(customer) {
    const tableBody = document.querySelector('#customerTable tbody');
    if (!tableBody) return;
    
    const row = document.createElement('tr');
    row.dataset.id = customer.id;
    
    // Handle both property spellings for backward compatibility
    const loyaltyPoints = customer.loyaltyPoints !== undefined ? customer.loyaltyPoints : customer.loyalitypoints || 0;
    
    row.innerHTML = `
        <td>${customer.id}</td>
        <td>${customer.name}</td>
        <td>${customer.email}</td>
        <td>${customer.phone}</td>
        <td>${loyaltyPoints}</td>
        <td>${customer.preferences || ''}</td>
        <td class="actions">
            <button onclick="editCustomer(${customer.id})" class="btn btn-warning btn-sm">
                <i class="bi bi-pencil"></i> Edit
            </button>
            
            <button onclick="deleteCustomer(${customer.id})" class="btn btn-danger btn-sm">
                <i class="bi bi-trash"></i> Delete
            </button>
        </td>
    `;

    tableBody.appendChild(row);
}

// Load customer data for editing
function editCustomer(id) {
    fetch(`http://localhost:8080/customer/search-by-id/${id}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
    })
    .then(customer => {
        document.getElementById('name').value = customer.name;
        document.getElementById('email').value = customer.email;
        document.getElementById('phone').value = customer.phone;
        document.getElementById('preferences').value = customer.preferences || '';

        // Store the current loyalty points value
        currentLoyaltyPoints = customer.loyaltyPoints !== undefined ? customer.loyaltyPoints : customer.loyalitypoints || 0;
        
        const formButton = document.querySelector('#customerForm button[type="submit"]');
        if (formButton) {
            formButton.innerText = 'Update Customer';
        }
        
        editingId = customer.id;
        
        // Scroll to the form
        document.getElementById('searchInput').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(error => {
        console.error('Error loading customer details:', error);
        alert('Failed to load customer details. Please try again. Error: ' + error.message);
    });
}

// Delete a customer via API
function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        fetch(`http://localhost:8080/customer/delete/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete customer: ' + response.status);
            }
            
            loadCustomers();
            alert('Customer deleted successfully!');
            
            if (editingId === id) {
                resetForm();
            }
        })
        .catch(error => {
            console.error('Error deleting customer:', error);
            alert('Failed to delete customer. Please try again. Error: ' + error.message);
        });
    }
}

// Search for customers in the table
function searchCustomer() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        loadCustomers();
        return;
    }
    
    fetch(`http://localhost:8080/customer/search/${searchTerm}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Search API error: ' + response.status);
        }
        return response.json();
    })
    .then(customers => {
        refreshTable(customers);
    })
    .catch(error => {
        console.error('Error searching customers:', error);
        // If API search fails, perform client-side filtering
        const tableRows = document.querySelectorAll('#customerTable tbody tr');
        tableRows.forEach(row => {
            const name = row.cells[1].innerText.toLowerCase(); 
            const email = row.cells[2].innerText.toLowerCase();
            const phone = row.cells[3].innerText.toLowerCase();
            
            if (name.includes(searchTerm) || 
                email.includes(searchTerm) || 
                phone.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Refresh the customer table with new data
function refreshTable(customers) {
    const tableBody = document.querySelector('#customerTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!customers || customers.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="7" class="text-center">No customers found</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    customers.forEach(customer => {
        addCustomerToTable(customer);
    });
}

// Load all customers from API
function loadCustomers() {
    fetch('http://localhost:8080/customer/get-all/list', { 
        method: "GET", 
        redirect: "follow" 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
    })
    .then(customers => {
        console.log('Customers loaded:', customers);
        refreshTable(customers);
    })
    .catch(error => {
        console.error('Error loading customers:', error);
        alert('Failed to load customers. Please check your connection. Error: ' + error.message);
    });
}