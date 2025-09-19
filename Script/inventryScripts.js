// Wait for the DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', function () {
    let editingIndex = -1;

    // Get DOM elements
    const itemForm = document.getElementById('itemForm');
    const submitBtn = document.getElementById('submitBtn');
    const codeInput = document.getElementById('code');
    const nameInput = document.getElementById('name');
    const categoryInput = document.getElementById('inCategory');
    const priceInput = document.getElementById('price');
    const discountInput = document.getElementById('discount');
    const quantityInput = document.getElementById('quantity');
    const expireDateInput = document.getElementById('expireDate');
    const searchInput = document.getElementById('searchInput');
    const totalItemsSpan = document.getElementById('totalItems');

    // Initialize the page by loading items from API
    loadItemsFromAPI();
    loadCategoryComboBox();

    // Event listeners
    if (itemForm) {
        itemForm.addEventListener('submit', handleFormSubmit);
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', searchItem);
    }

    //load Catagary combo box
    function loadCategoryComboBox() {
        fetch(`http://localhost:8080/category/get-all/list`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                const categorySelect = document.getElementById('inCategory');
                if (categorySelect) {
                    // Clear existing options except the first disabled one
                    while (categorySelect.options.length > 1) {
                        categorySelect.remove(1);
                    }
                    
                    data.forEach(category => {
                        const option = document.createElement('option');
                        option.value = [category.id, category.name];
                        option.textContent = category.name;
                        categorySelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                AlertUtils.showNetworkError();
            });
    }
   
    function handleFormSubmit(e) {
        e.preventDefault();

        const code = codeInput.value.trim();
        const name = nameInput.value.trim();
        const category = categoryInput.value.trim();
        const price = parseFloat(priceInput.value.trim());
        const discount = parseInt(discountInput.value.trim() || "0");
        const stock = parseInt(quantityInput.value.trim());
        const doexpire = expireDateInput.value.trim();

        if (code === '' || name === '' || category === '' || isNaN(price) || isNaN(stock)) {
            AlertUtils.showValidationError(['Please fill in all required fields']);
            return;
        }

        // Ensure we have valid category data
        if (!category || !category.includes(',')) {
            AlertUtils.showValidationError(['Please select a valid category']);
            return;
        }

        const categoryId = category.split(',')[0];
        const categoryName = category.split(',')[1];
        
        if (editingIndex === -1) {
            const item = {
                "code": code,
                "name": name,
                "price": price,
                "discount": discount,
                "stock": stock,
                "doexpire": doexpire,
                "category": {
                    "id": categoryId,
                    "name": categoryName
                }
            };
            addItemToAPI(item);
        } else {
            const item = {
                "id": editingIndex,
                "code": code,
                "name": name,
                "price": price,
                "discount": discount,
                "stock": stock,
                "doexpire": doexpire,
                "category": {
                    "id": categoryId,
                    "name": categoryName
                }
            };
            updateItemInAPI(item);
            submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Add Item';
            editingIndex = -1;
        }

        itemForm.reset();
    }

    function loadItemsFromAPI() {
        fetch(`http://localhost:8080/item/get-all/list`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                refreshTable(data);
                updateTotalItems(data.length);
            })
            .catch(error => {
                AlertUtils.showNetworkError();
            });
    }

    function addItemToAPI(item) {
        fetch(`http://localhost:8080/item/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Failed to add item: ${response.status} ${response.statusText}. Details: ${text || 'No details'}`);
                    });
                }
                // Check if response is empty before parsing
                return response.text().then(text => {
                    if (!text || text.trim() === '') {
                        return {}; // Return empty object if response is empty
                    }
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.warn('Response is not valid JSON, but operation may have succeeded:', text);
                        return {}; // Return empty object if parsing fails
                    }
                });
            })
            .then(data => {
                // Reload items from API to get updated list
                loadItemsFromAPI();
                AlertUtils.showInventoryUpdate('add', 'Item');
            })
            .catch(error => {
                AlertUtils.showError('Failed to add item', error.message);
            });
    }

    function updateItemInAPI(item) {
        // Ensure category is properly formatted
        if (!item.category || !item.category.id) {
            AlertUtils.showValidationError(['Invalid category data. Please try again.']);
            return;
        }

        fetch(`http://localhost:8080/item/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Failed to update item: ${response.status} ${response.statusText}. Details: ${text || 'No details'}`);
                    });
                }
                // Check if response is empty before parsing
                return response.text().then(text => {
                    if (!text || text.trim() === '') {
                        return {}; // Return empty object if response is empty
                    }
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        return {}; // Return empty object if parsing fails
                    }
                });
            })
            .then(data => {
                // Reload items from API to get updated list
                loadItemsFromAPI();
                AlertUtils.showInventoryUpdate('update', 'Item');
            })
            .catch(error => {
                AlertUtils.showError('Failed to update item', error.message);
            });
    }

    function deleteItemFromAPI(id) {
        fetch(`http://localhost:8080/item/delete/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Failed to delete item: ${response.status} ${response.statusText}. Details: ${text || 'No details'}`);
                    });
                }
                // Check if response is empty before parsing
                return response.text().then(text => {
                    if (!text || text.trim() === '') {
                        return {}; // Return empty object if response is empty
                    }
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        return {}; // Return empty object if parsing fails
                    }
                });
            })
            .then(data => {
                // Reload items from API to get updated list
                loadItemsFromAPI();
                AlertUtils.showInventoryUpdate('delete', 'Item');
            })
            .catch(error => {
                AlertUtils.showError('Failed to delete item', error.message);
            });
    }

    function refreshTable(items) {
        const tableBody = document.querySelector('#itemTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        items.forEach(item => addItemToTable(item));
    }

    function addItemToTable(item) {
        const tableBody = document.querySelector('#itemTable tbody');
        if (!tableBody) return;

        const row = document.createElement('tr');

        // Format price with thousand separators
        const formattedPrice = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(item.price);

        row.innerHTML = `
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${item.category.name}</td>
                <td class="text-end">Rs. ${formattedPrice}</td>
                <td class="text-center">${item.stock}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${item.id}" data-code="${item.code}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

        // Add event listeners to the buttons
        const editBtn = row.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                const code = this.getAttribute('data-code');
                getItemDetails(code, id);
            });
        }

        const deleteBtn = row.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                confirmDelete(id);
            });
        }

        tableBody.appendChild(row);
    }

    function getItemDetails(code, id) {
        fetch(`http://localhost:8080/item/search-by-code/${code}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to get item details: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(item => {
                // Store the item ID for updates
                editingIndex = item.id || id;
                populateForm(item);
            })
            .catch(error => {
                AlertUtils.showError('Failed to get item details', error.message);
            });
    }

    function populateForm(item) {
        codeInput.value = item.code;
        nameInput.value = item.name;
        priceInput.value = item.price;
        discountInput.value = item.discount || 0;
        quantityInput.value = item.stock || item.quantity;
        expireDateInput.value = item.doexpire || item.expireDate || '';

        // Set the category dropdown value
        if (item.category && categoryInput) {
            // First make sure we have the current categories loaded
            fetch(`http://localhost:8080/category/get-all/list`)
                .then(response => response.json())
                .then(categories => {
                    // Find the matching category
                    const categoryMatch = categories.find(cat => 
                        cat.id === item.category.id || 
                        cat.name === item.category.name
                    );
                    
                    if (categoryMatch) {
                        // Set the value using both id and name to match our format
                        const categoryValue = `${categoryMatch.id},${categoryMatch.name}`;
                        
                        // Check if the option exists
                        let optionExists = false;
                        for (let i = 0; i < categoryInput.options.length; i++) {
                            if (categoryInput.options[i].value === categoryValue) {
                                optionExists = true;
                                categoryInput.selectedIndex = i;
                                break;
                            }
                        }
                        
                        // If option doesn't exist, create it
                        if (!optionExists) {
                            const option = document.createElement('option');
                            option.value = categoryValue;
                            option.textContent = categoryMatch.name;
                            categoryInput.appendChild(option);
                            categoryInput.value = categoryValue;
                        }
                    }
                })
                .catch(err => {
                    console.error('Error loading categories for edit:', err);
                });
        }

        submitBtn.innerHTML = '<i class="fas fa-edit me-2"></i>Update Item';
    }

    async function confirmDelete(id) {
        try {
            const result = await AlertUtils.showConfirmation(
                'Delete Item?',
                'This item will be permanently deleted. This action cannot be undone.',
                'Yes, delete it!',
                'Cancel'
            );

            if (result.isConfirmed) {
                deleteItemFromAPI(id);
            }
        } catch (error) {
            AlertUtils.showError('Error', 'Failed to delete item');
        }
    }

    function searchItem() {
        const searchValue = searchInput.value.toLowerCase().trim();
        
        if (searchValue === '') {
            // If search field is empty, load all items
            loadItemsFromAPI();
            return;
        }

        // You can implement client-side filtering for already loaded items
        // OR make an API call for server-side searching (preferred for large datasets)
        fetch(`http://localhost:8080/item/search?query=${encodeURIComponent(searchValue)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                refreshTable(data);
                updateTotalItems(data.length);
            })
            .catch(error => {
                // Fallback to client-side filtering if API doesn't support search
                clientSideSearch(searchValue);
            });
    }

    // Fallback client-side search if API doesn't support search endpoint
    function clientSideSearch(searchValue) {
        const tableRows = document.querySelectorAll('#itemTable tbody tr');
        let visibleCount = 0;

        tableRows.forEach(row => {
            const code = row.cells[0].innerText.toLowerCase();
            const name = row.cells[1].innerText.toLowerCase();
            const category = row.cells[2].innerText.toLowerCase();

            if (code.includes(searchValue) || name.includes(searchValue) || category.includes(searchValue)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        updateTotalItems(visibleCount);
    }

    function updateTotalItems(count) {
        if (totalItemsSpan) {
            totalItemsSpan.textContent = count;
        }
        updateMenuItemCount(count);
    }

    function updateMenuItemCount(count) {
        const menuItemCountElement = document.getElementById('totalItems');
        if (menuItemCountElement) {
            menuItemCountElement.textContent = count;
        }
    }

    // Make functions accessible globally for any button onclick events in HTML
    window.getItemDetails = getItemDetails;
    window.confirmDelete = confirmDelete;
    window.searchItem = searchItem;
});