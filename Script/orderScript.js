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

                const itemsList = Array.isArray(order.items) ? order.items.map(item => {
                    // console.log(item.quantity);
                    
                    const quantity = Number(item.quantity) || 0;
                    const price = Number(item.price) || 0;
                    return `<li>${item.name || 'Unknown Item'} (x${quantity}) - Rs. ${(price * quantity)}</li>`;
                }).join('') : '<li>No items</li>';

                const discount = Number(order.discount) || 0;
                const totalPrice = Number(order.total) || 0;

                row.innerHTML = `
                    <td>${order.id || index + 1}</td>
                    <td>${order.customer.name || 'No Name'}</td>
                    <td>${order.customer.phone || 'No Contact'}</td>
                    <td>
                        <ul>
                            ${itemsList}
                        </ul>
                    </td>
                    <td>Rs. ${discount}</td>
                    <td>Rs. ${totalPrice}</td>
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
