document.addEventListener('DOMContentLoaded', () => {
    displayOrders();
});

// Fetch orders from API and display them
function displayOrders() {
    const orderTableBody = document.getElementById('orderTableBody');

    fetch('http://localhost:8080/orders/get-all/list')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(orders => {
            orderTableBody.innerHTML = '';
            orders.forEach((order, index) => {
                const row = document.createElement('tr');

                // Check if items exist and are in an array format
                const itemsList = Array.isArray(order.items)
                    ? order.items.map(oi => {
                        const name = oi.item?.name || 'Unknown Item';
                        const quantity = Number(oi.quantity) || 0;
                        const price = Number(oi.unitprice ?? oi.item?.price) || 0;
                        const itemTotal = price * quantity;
                        return `<li>${name} (x${quantity}) - Rs. ${itemTotal.toFixed(2)}</li>`;
                    }).join('')
                    : '<li>No items</li>';

                const discount = Number(order.discount) || 0;
                const totalPrice = Number(order.total) || 0;

                row.innerHTML = `
                    <td>${order.id || index + 1}</td>
                    <td>${order.customer?.name || 'No Name'}</td>
                    <td>${order.customer?.phone || 'No Contact'}</td>
                    <td>
                        <ul>
                            ${itemsList}
                        </ul>
                    </td>
                    <td>Rs. ${discount.toFixed(2)}</td>
                    <td>Rs. ${totalPrice.toFixed(2)}</td>
                    <td><button class="btn btn-sm" style="background-color:rgb(255, 81, 0);" onclick="printOrderReport('${order.id}')">Print Order Report</button></td>
                `;
                orderTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            alert('Failed to load orders. Please try again later.');
        });
}

// Add a new order via API
function addOrder(newOrder) {
    fetch('http://localhost:8080/orders/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newOrder)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            // Refresh the orders list
            displayOrders();
        })
        .catch(error => {
            console.error('Error adding order:', error);
            alert('Failed to add order. Please try again later.');
        });
}

// Delete an order via API
function deleteOrder(orderId) {
    fetch(`http://localhost:8080/orders/delete/${orderId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            // Refresh the orders list
            displayOrders();
        })
        .catch(error => {
            console.error('Error deleting order:', error);
            alert('Failed to delete order. Please try again later.');
        });
}

// Update an existing order via API
function updateOrder(orderId, updatedOrder) {
    // Ensure the ID is included in the payload as backend expects it in body
    updatedOrder = { ...updatedOrder, id: orderId };
    fetch(`http://localhost:8080/orders/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedOrder)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            // Refresh the orders list
            displayOrders();
        })
        .catch(error => {
            console.error('Error updating order:', error);
            alert('Failed to update order. Please try again later.');
        });
}

// Get a single order by ID via API
function getOrderById(orderId, callback) {
    fetch(`http://localhost:8080/orders/search-by-id/${orderId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(order => {
            // Log the order structure for debugging
            console.log('Fetched order:', order);
            callback(order);
        })
        .catch(error => {
            console.error(`Error fetching order ${orderId}:`, error);
            alert('Failed to retrieve order details. Please try again later.');
            callback(null);
        });
}

// Print order report - now fetches the latest data from API
function printOrderReport(orderId) {
    getOrderById(orderId, function (order) {
        if (!order) {
            alert("Order not found!");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("p", "mm", "a4");

        // Safely extract customer information
        const customerName = order.customer?.name || 'N/A';
        const contactNo = order.customer?.phone || 'N/A';

        // Handle potential differences in data structure
    const items = Array.isArray(order.items) ? order.items : [];
    const discountPercent = Number(order.discount) || 0;
    const totalPrice = Number(order.total) || 0;
        const id = order.id || 'Unknown';

        // **HEADER**
        doc.setFillColor(45, 45, 45);
        doc.rect(0, 0, 210, 55, "F");

        // **LOGO & COMPANY DETAILS**  
        const logo = new Image();
        logo.src = "Assets/logo.jpeg";
        doc.addImage(logo, "JPEG", 15, 8, 30, 30);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text("MOS BURGERS", 105, 15, "center");

        doc.setFontSize(9);
        doc.text("Burger Street, Colombo, Sri Lanka", 105, 22, "center");
        doc.text("+94 112 888 888", 105, 27, "center");
        doc.text("www.mosburgers.lk", 105, 32, "center");
        doc.text("contact@mosburgers.lk", 105, 37, "center");

        // **INVOICE DETAILS**  
        const now = new Date();
        const fullDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}  ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        doc.setFontSize(10);
        doc.text(`Invoice No: ${String(id).padStart(4, "0")}`, 175, 50);
        doc.setFontSize(10);
        doc.text(`${fullDateTime}`, 15, 50, "left");

        // **CUSTOMER DETAILS**  
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(10);
        doc.text(`Customer Name: ${customerName}`, 15, 63);
        doc.text(`Contact No: ${contactNo}`, 15, 68);

        // **ORDER TABLE HEADER**  
        let startY = 75;
        doc.setFillColor(230, 230, 230);
        doc.rect(10, startY, 190, 10, "F");

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Item", 15, startY + 7);
        doc.text("Qty", 100, startY + 7);
        doc.text("Price", 130, startY + 7);
        doc.text("Total", 170, startY + 7);

        let yPosition = startY + 15;

        let computedSubtotal = 0;
        items.forEach((oi) => {
            const name = oi.item?.name || 'Unknown Item';
            const quantity = Number(oi.quantity) || 0;
            const price = Number(oi.unitprice ?? oi.item?.price) || 0;
            const total = quantity * price;
            computedSubtotal += total;

            doc.text(truncateText(name, 25), 15, yPosition);
            doc.text(quantity.toString(), 100, yPosition);
            doc.text(`Rs. ${price.toFixed(2)}`, 130, yPosition);
            doc.text(`Rs. ${total.toFixed(2)}`, 170, yPosition);

            yPosition += 10;

            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        });

        // **ORDER SUMMARY**  
        yPosition += 10;
        doc.setFillColor(240, 240, 240);
        doc.rect(120, yPosition, 80, 30, "F");

        doc.setFontSize(12);
    doc.text("Subtotal:", 125, yPosition + 8);
    doc.text(`Rs. ${computedSubtotal.toFixed(2)}`, 165, yPosition + 8);
    doc.text(`Discount (${discountPercent.toFixed(2)}%):`, 125, yPosition + 16);
    const discountAmount = computedSubtotal * (discountPercent / 100);
    doc.text(`Rs. ${discountAmount.toFixed(2)}`, 165, yPosition + 16);

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Total:", 125, yPosition + 26);
        doc.setTextColor(255, 0, 0);
    const finalTotal = Math.max(0, computedSubtotal - discountAmount);
    doc.text(`Rs. ${finalTotal.toFixed(2)}`, 165, yPosition + 26);

        // **FOOTER**  
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.line(20, 275, 190, 275); // Separator line

        doc.text("Thank you for choosing MOS Burgers!", 105, 280, null, null, "center");
        doc.text("Flipping flavors, one bite at a time!", 105, 285, null, null, "center");
        doc.text("We can't wait to serve you again!", 105, 290, null, null, "center");

        // **SAVE PDF**  
        doc.save(`MOS_BURGERS_Invoice_${id}.pdf`);
    });
}

// **Utility Function to Truncate Text**
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}