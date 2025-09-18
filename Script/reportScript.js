"use strict";

document.addEventListener('DOMContentLoaded', () => {
    // Stamp generated time
    const reportDateTime = document.getElementById('reportDateTime');
    reportDateTime.innerText = `Report generated on: ${new Date().toLocaleString()}`;

    // Wire PDF button
    const pdfBtn = document.getElementById('generatePDFButton');
    if (pdfBtn) pdfBtn.addEventListener('click', generatePDFReport);

    // Load and render report from backend
    loadAndRenderReport();
});

async function loadAndRenderReport() {
    let orders = [];
    try {
        const res = await fetch('http://localhost:8080/orders/get-all/list');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        orders = Array.isArray(json) ? json : [];
    } catch (err) {
        console.error('Failed to fetch orders:', err);
        displayNoDataMessage();
        return;
    }

    if (!orders.length) {
        displayNoDataMessage();
        return;
    }

    // Optional daily filter: if orders have a recognizable date, use only today's
    const todayStr = toISODateOnly(new Date());
    const ordersWithDate = orders
        .map(o => ({ order: o, when: getOrderDate(o) }))
        .filter(x => !!x.when);

    const filtered = ordersWithDate.length
        ? ordersWithDate.filter(x => toISODateOnly(x.when) === todayStr).map(x => x.order)
        : orders; // If no dates, use all

    processAndDisplayData(filtered);
}

function toISODateOnly(date) {
    try {
        return new Date(date).toISOString().split('T')[0];
    } catch {
        return '';
    }
}

function getOrderDate(order) {
    // Try common fields: adjust as your backend provides
    const candidates = [
        order?.date,
        order?.orderDate,
        order?.createdAt,
        order?.created_at,
        order?.datetime,
        order?.dateTime,
        order?.timestamp,
        order?.time
    ];
    for (const v of candidates) {
        if (!v) continue;
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

function displayNoDataMessage() {
    document.getElementById('totalCustomers').innerText = '0';
    document.getElementById('totalOrders').innerText = '0';
    document.getElementById('totalRevenue').innerText = 'Rs. 0.00';

    const tables = ['customerTable', 'itemTable', 'transactionTable'];
    tables.forEach(tableId => {
        const tableBody = document.getElementById(tableId).getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = tableId === 'transactionTable' ? 3 : 2;
        cell.className = 'text-center text-muted';
        cell.textContent = 'No data available';
    });
}

function processAndDisplayData(orders) {
    const customerOrderCount = {};
    const itemCount = {};
    const transactions = [];
    let totalRevenue = 0;

    orders.forEach(order => {
        const customerName = order?.customer?.name || 'Unknown Customer';
        customerOrderCount[customerName] = (customerOrderCount[customerName] || 0) + 1;

        const totalAmount = Number(order?.total) || 0;
        totalRevenue += totalAmount;

        if (Array.isArray(order?.items)) {
            order.items.forEach(oi => {
                const itemName = oi?.item?.name || 'Unknown Item';
                const quantity = Number(oi?.quantity) || 0;
                itemCount[itemName] = (itemCount[itemName] || 0) + quantity;
            });
        }

        transactions.push(order);
    });

    // Update summary cards
    document.getElementById('totalCustomers').innerText = Object.keys(customerOrderCount).length.toString();
    document.getElementById('totalOrders').innerText = orders.length.toString();
    document.getElementById('totalRevenue').innerText = `Rs. ${totalRevenue.toFixed(2)}`;

    const sortedCustomers = Object.entries(customerOrderCount).sort((a, b) => b[1] - a[1]);
    populateCustomerTable(sortedCustomers);

    const sortedItems = Object.entries(itemCount).sort((a, b) => b[1] - a[1]);
    populateItemTable(sortedItems);

    populateTransactionTable(transactions);

    // Create charts
    createItemsChart(sortedItems.slice(0, 5));
    createCustomersChart(sortedCustomers.slice(0, 5));
}

function populateTransactionTable(transactions) {
    const transactionTableBody = document.getElementById('transactionTable').getElementsByTagName('tbody')[0];
    transactionTableBody.innerHTML = '';

    if (transactions.length === 0) {
        const row = transactionTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.className = 'text-center text-muted';
        cell.textContent = 'No transactions available';
        return;
    }

    transactions.forEach(order => {
        const row = transactionTableBody.insertRow();
        const items = Array.isArray(order?.items)
            ? order.items.map(oi => {
                const name = oi?.item?.name || 'Unknown Item';
                const qty = Number(oi?.quantity) || 0;
                return `${name} (x${qty})`;
            }).join(', ')
            : 'No items';

        const totalAmount = Number(order?.total) || 0;

        row.innerHTML = `
            <td>${order?.customer?.name || 'Unknown Customer'}</td>
            <td>${items}</td>
            <td>Rs. ${totalAmount.toFixed(2)}</td>
        `;
    });
}

function populateCustomerTable(sortedCustomers) {
    const customerTableBody = document.getElementById('customerTable').getElementsByTagName('tbody')[0];
    customerTableBody.innerHTML = '';

    if (sortedCustomers.length === 0) {
        const row = customerTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 2;
        cell.className = 'text-center text-muted';
        cell.textContent = 'No customer data available';
        return;
    }

    sortedCustomers.forEach(([customerName, orderCount]) => {
        const row = customerTableBody.insertRow();
        row.innerHTML = `
            <td>${customerName}</td>
            <td>${orderCount}</td>
        `;
    });
}

function populateItemTable(sortedItems) {
    const itemTableBody = document.getElementById('itemTable').getElementsByTagName('tbody')[0];
    itemTableBody.innerHTML = '';

    if (sortedItems.length === 0) {
        const row = itemTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 2;
        cell.className = 'text-center text-muted';
        cell.textContent = 'No item data available';
        return;
    }

    sortedItems.forEach(([itemName, quantity]) => {
        const row = itemTableBody.insertRow();
        row.innerHTML = `
            <td>${itemName}</td>
            <td>${quantity}</td>
        `;
    });
}

function createItemsChart(topItems) {
    const ctx = document.getElementById('itemsChart').getContext('2d');

    // If no data, show "No data" message
    if (topItems.length === 0) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#6c757d';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const labels = topItems.map(item => item[0]);
    const data = topItems.map(item => item[1]);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantity Sold',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Top 5 Items by Quantity'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function createCustomersChart(topCustomers) {
    const ctx = document.getElementById('customersChart').getContext('2d');

    // If no data, show "No data" message
    if (topCustomers.length === 0) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#6c757d';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const labels = topCustomers.map(customer => customer[0]);
    const data = topCustomers.map(customer => customer[1]);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Top Customers by Orders'
                }
            }
        }
    });
}

function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;

    // Create an array to track pages where we need to add headers/footers
    let pagesToProcess = [];

    function addHeaderAndFooter(pageNum) {
        // Select the page to modify
        doc.setPage(pageNum);
        if (pageNum == 1) {

            // Add header
            // Header background
            doc.setFillColor(45, 45, 45);
            doc.rect(0, 0, pageWidth, 30, "F");

            // Accent line
            doc.setFillColor(200, 70, 30);
            doc.rect(0, 30, pageWidth, 3, "F");

            // Logo placement
            const logo = new Image();
            logo.src = "Assets/logo.jpeg";
            doc.addImage(logo, "JPEG", margin, 3, 24, 24);

            // Company name and details
            const textX = margin + 35;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text("MOS BURGERS", textX, 13);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text("Burger Street, Colombo, Sri Lanka", textX, 19);
            doc.text("+94 112 888 888", textX, 23);

            const rightColumnX = pageWidth - margin - 50;
            doc.text("www.mosburgers.lk", rightColumnX, 19);
            doc.text("contact@mosburgers.lk", rightColumnX, 23);
        }
        // Add footer
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        // Footer text
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);

        doc.text("www.mosburgers.lk", margin, pageHeight - 7);
        doc.text("Tasty burgers, happy customers!", pageWidth / 2, pageHeight - 7, { align: 'center' });
        doc.text(`Page ${pageNum} of ${pagesToProcess.length}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    // Content start position - below header
    let yPos = 45;

    // Add title section on first page
    doc.setFillColor(248, 248, 250);
    doc.roundedRect(margin, 40, pageWidth - (margin * 2), 15, 2, 2, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(45, 45, 45);
    doc.text("DAILY SALES REPORT", pageWidth / 2, 48, { align: 'center' });

    // Date of report
    const today = new Date();
    const dateStr = today.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, pageWidth / 2, 52, { align: 'center' });

    yPos = 60; // After title section

    function addTableToPDF(title, tableId, columns) {
        // Check if we need a new page
        if (yPos > pageHeight - 45) {
            doc.addPage();
            yPos = 40; // Start position on new pages
        }

        // Section title with subtle styling
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 10, 1, 1, 'F');

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text(title, margin + 5, yPos + 7);
        yPos += 15;

        const table = document.getElementById(tableId);
        const data = [];

        // Get headers and add a "#" header for row numbers
        const headers = ["#"].concat(Array.from(table.querySelectorAll('th')).map(th => th.textContent));

        // Add row numbers to each row of data
        Array.from(table.querySelectorAll('tbody tr')).forEach((row, index) => {
            const rowData = Array.from(row.querySelectorAll('td')).map(td => td.textContent);
            // Add row number as the first column (index + 1 to start from 1 instead of 0)
            data.push([(index + 1).toString()].concat(rowData));
        });

        // Adjust column styles to include the row number column
        const updatedColumns = {
            0: { cellWidth: 10, halign: 'center' } // Row number column styling
        };

        // Shift existing column styles by 1 to account for the row number column
        Object.keys(columns).forEach(key => {
            updatedColumns[parseInt(key) + 1] = columns[key];
        });

        // Modified table styling
        doc.autoTable({
            head: [headers],
            body: data,
            startY: yPos,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [70, 70, 70],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [248, 248, 248]
            },
            columnStyles: updatedColumns,
            margin: { left: margin, right: margin, bottom: 20 },
            tableWidth: pageWidth - (margin * 2),
            // No header/footer in didDrawPage - we'll add them after all content is created
        });

        // Update position after table
        yPos = doc.lastAutoTable.finalY + 15;

        // If too close to bottom for next content, add a new page
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 40;
        }
    }

    // Add summary section
    const summaryBoxY = yPos;

    // Summary box
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, summaryBoxY, pageWidth - (margin * 2), 35, 3, 3, 'FD');

    // Summary heading
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Daily Summary", margin + 5, summaryBoxY + 8);

    // Horizontal divider
    doc.setDrawColor(220, 220, 220);
    doc.line(margin + 5, summaryBoxY + 12, pageWidth - margin - 5, summaryBoxY + 12);

    // Summary content
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const col1X = margin + 10;
    const col2X = pageWidth / 2 - 15;
    const col3X = pageWidth - margin - 70;
    const metricY = summaryBoxY + 22;

    // Column 1
    doc.setFontSize(12);
    doc.text("Total Customers:", col1X, metricY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 45, 45);
    doc.text(document.getElementById('totalCustomers').innerText, col1X, metricY + 6);

    // Column 2
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Total Orders:", col2X, metricY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 45, 45);
    doc.text(document.getElementById('totalOrders').innerText, col2X, metricY + 6);

    // Column 3
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Total Revenue:", col3X, metricY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 70, 30);
    doc.text(document.getElementById('totalRevenue').innerText, col3X, metricY + 6);

    yPos += 45; // Move down after summary box

    // Add tables with proper spacing
    addTableToPDF("Customers with Most Orders", "customerTable", {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' }
    });

    addTableToPDF("Most Popular Items for the Day", "itemTable", {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' }
    });

    addTableToPDF("Transaction History for Today", "transactionTable", {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' }
    });

    // Now we know the total number of pages - add headers and footers to all pages
    const totalPages = doc.internal.getNumberOfPages();

    // Create array of page numbers
    for (let i = 1; i <= totalPages; i++) {
        pagesToProcess.push(i);
    }

    // Add headers and footers to all pages
    pagesToProcess.forEach(pageNum => {
        addHeaderAndFooter(pageNum);
    });

    // **SAVE PDF**
    doc.save(`MOS_BURGERS_Report.pdf`);

}
