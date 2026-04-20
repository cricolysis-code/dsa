// State variables
let inventory = [];
let transactions = [];
let sales = [];
let cart = [];
let orders = []; // New state to track async orders
const LOW_STOCK_THRESHOLD = 10;
let currentUser = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    setupLogin();
    loadData();
    setupNavigation();
    setupForms();
    setupSearch();
    setupCart();
    if(currentUser) {
        renderDashboard();
        renderInventory();
        updateCartUI();
        if(currentUser.role === 'admin') renderApprovals();
        if(currentUser.role === 'member') renderMyOrders();
    }
});

function checkLogin() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('user-role-display').textContent = `${currentUser.role} (${currentUser.username})`;
        applyRoleRestrictions();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }
}

function setupLogin() {
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value;

            if (user === 'admin' && pass === 'admin123') {
                login('admin', user);
            } else if (user.includes('@niet') && pass === 'member123') {
                login('member', user);
            } else {
                alert('Invalid credentials! Admin must use admin/admin123. Members must use an @niet email and member123.');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            currentUser = null;
            window.location.reload();
        });
    }
}

function login(role, username) {
    currentUser = { role, username };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    window.location.reload();
}

function applyRoleRestrictions() {
    const adminOnlyEls = document.querySelectorAll('.admin-only');
    const memberOnlyEls = document.querySelectorAll('.member-only');
    const cartBtn = document.getElementById('cart-btn');

    if (currentUser && currentUser.role === 'admin') {
        adminOnlyEls.forEach(el => el.classList.remove('hidden'));
        memberOnlyEls.forEach(el => el.classList.add('hidden'));
        if (cartBtn) cartBtn.classList.add('hidden');
    } else if (currentUser && currentUser.role === 'member') {
        adminOnlyEls.forEach(el => el.classList.add('hidden'));
        memberOnlyEls.forEach(el => el.classList.remove('hidden'));
        if (cartBtn) cartBtn.classList.remove('hidden');
    }
}

// Load Data from LocalStorage
function loadData() {
    const storedInventory = localStorage.getItem('inventory_pos');
    const storedTransactions = localStorage.getItem('transactions_pos');
    const storedSales = localStorage.getItem('sales_pos');
    const storedCart = localStorage.getItem('cart_pos');
    const storedOrders = localStorage.getItem('orders_pos');
    
    if (storedInventory) {
        inventory = JSON.parse(storedInventory);
    } else {
        // Mock data
        inventory = [
            { id: 'GEN-001', name: 'Fresh Apples', category: 'Food', price: 150, costPrice: 100, quantity: 45, imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=400&q=80' },
            { id: 'GEN-002', name: 'Whole Wheat Bread', category: 'Food', price: 40, costPrice: 25, quantity: 8, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80' },
            { id: 'GEN-003', name: 'Organic Milk (1L)', category: 'Food', price: 65, costPrice: 45, quantity: 15, imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
            { id: 'GEN-004', name: 'Farm Eggs (Dozen)', category: 'Food', price: 80, costPrice: 55, quantity: 20, imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80' },
            { id: 'GEN-005', name: 'Roasted Coffee Beans (250g)', category: 'Food', price: 350, costPrice: 200, quantity: 5, imageUrl: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=400&q=80' }
        ];
        saveData();
    }
    
    if (storedTransactions) transactions = JSON.parse(storedTransactions);
    if (storedSales) sales = JSON.parse(storedSales);
    if (storedCart) cart = JSON.parse(storedCart);
    if (storedOrders) orders = JSON.parse(storedOrders);
}

// Save Data to LocalStorage
function saveData() {
    localStorage.setItem('inventory_pos', JSON.stringify(inventory));
    localStorage.setItem('transactions_pos', JSON.stringify(transactions));
    localStorage.setItem('sales_pos', JSON.stringify(sales));
    localStorage.setItem('cart_pos', JSON.stringify(cart));
    localStorage.setItem('orders_pos', JSON.stringify(orders));
    
    if(currentUser) {
        renderDashboard();
        renderInventory();
        if(currentUser.role === 'admin') renderApprovals();
        if(currentUser.role === 'member') renderMyOrders();
    }
}

// Log Transaction
function logTransaction(action, productName, saleId = null) {
    const transaction = {
        action,
        productName,
        date: new Date().toLocaleString(),
        saleId
    };
    transactions.unshift(transaction);
    if (transactions.length > 10) transactions.pop();
    saveData();
}

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    const btnGoAdd = document.getElementById('btn-go-add');

    function switchSection(targetId) {
        navItems.forEach(nav => {
            if(nav.dataset.target === targetId) nav.classList.add('active');
            else nav.classList.remove('active');
        });
        
        sections.forEach(sec => {
            if(sec.id === targetId) sec.classList.add('active');
            else sec.classList.remove('active');
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(item.dataset.target);
            if(window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('open');
            }
        });
    });

    if(btnGoAdd) {
        btnGoAdd.addEventListener('click', () => {
            switchSection('add-product');
        });
    }

    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });
}

// Dashboard Rendering
function renderDashboard() {
    const totalProductsEl = document.getElementById('total-products');
    const lowStockEl = document.getElementById('low-stock');
    const totalValueEl = document.getElementById('total-value');
    const dailySalesEl = document.getElementById('daily-sales');
    const dailyProfitEl = document.getElementById('daily-profit');
    const tbody = document.querySelector('#transactions-table tbody');

    let totalItems = inventory.length;
    let lowStockCount = 0;
    let totalValue = 0;

    inventory.forEach(item => {
        if (item.quantity < LOW_STOCK_THRESHOLD) lowStockCount++;
        totalValue += (item.price * item.quantity);
    });

    const todayStr = new Date().toLocaleDateString();
    let dailySales = 0;
    let dailyProfit = 0;
    
    sales.forEach(sale => {
        if (sale.dateStr === todayStr) {
            dailySales += sale.totalPrice;
            dailyProfit += sale.profit;
        }
    });

    if(totalProductsEl) totalProductsEl.textContent = totalItems;
    if(lowStockEl) lowStockEl.textContent = lowStockCount;
    if(totalValueEl) totalValueEl.textContent = `₹${totalValue.toFixed(2)}`;
    if(dailySalesEl) dailySalesEl.textContent = `₹${dailySales.toFixed(2)}`;
    if(dailyProfitEl) dailyProfitEl.textContent = `₹${dailyProfit.toFixed(2)}`;

    renderCatalog();

    if(tbody) {
        tbody.innerHTML = '';
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No recent transactions</td></tr>';
        } else {
            transactions.forEach(t => {
                const tr = document.createElement('tr');
                let actionColor = t.action === 'Added' ? 'var(--success)' : (t.action === 'Updated' ? 'var(--info)' : (t.action.includes('Sold') || t.action.includes('Approved') ? 'var(--warning)' : 'var(--danger)'));
                
                let productHtml = `<td>${t.productName}</td>`;
                if (t.saleId) {
                    productHtml = `<td style="display: flex; align-items: center; justify-content: space-between;">
                        <span>${t.productName}</span>
                        <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px;" onclick="viewRecentBill(${t.saleId})">
                            <ion-icon name="document-text-outline"></ion-icon> View Bill
                        </button>
                    </td>`;
                }

                tr.innerHTML = `
                    <td><span style="color: ${actionColor}; font-weight: 600;">${t.action}</span></td>
                    ${productHtml}
                    <td>${t.date}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }
}

// Render Catalog Grid
function renderCatalog() {
    const catalogGrid = document.getElementById('catalog-grid');
    if(!catalogGrid) return;
    
    catalogGrid.innerHTML = '';
    
    if (inventory.length === 0) {
        catalogGrid.innerHTML = '<p style="color: var(--text-muted);">No products available in catalog.</p>';
        return;
    }

    const actionText = (currentUser && currentUser.role === 'member') ? 'Add to Cart' : 'Sell';
    const actionType = (currentUser && currentUser.role === 'member') ? 'cart' : 'sell';

    inventory.forEach(item => {
        const isLowStock = item.quantity < LOW_STOCK_THRESHOLD;
        const stockStatusClass = isLowStock ? 'status-low-stock' : 'status-in-stock';
        const stockText = isLowStock ? 'Low Stock' : 'In Stock';
        
        const imgUrl = item.imageUrl || 'https://images.unsplash.com/photo-1601598851547-4302969d0614?w=400&q=80';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${imgUrl}" alt="${item.name}" class="product-image" loading="lazy">
            <div class="product-details">
                <div class="product-category">${item.category}</div>
                <h4>${item.name}</h4>
                <div class="product-price-row">
                    <span class="product-price">₹${parseFloat(item.price).toFixed(2)}</span>
                    <button class="btn btn-primary btn-sm" onclick="openActionModal('${item.id}', '${actionType}')" ${item.quantity === 0 ? 'disabled' : ''}>${actionText}</button>
                </div>
            </div>
        `;
        catalogGrid.appendChild(card);
    });
}

// Inventory Table Rendering
function renderInventory(filterText = '') {
    const tbody = document.querySelector('#inventory-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const filtered = inventory.filter(item => 
        item.name.toLowerCase().includes(filterText.toLowerCase()) || 
        item.id.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No products found</td></tr>';
        return;
    }

    filtered.forEach(item => {
        const isLowStock = item.quantity < LOW_STOCK_THRESHOLD;
        const statusClass = isLowStock ? 'status-low-stock' : 'status-in-stock';
        const statusText = isLowStock ? 'Low Stock' : 'In Stock';
        const rowClass = isLowStock ? 'row-low-stock' : '';

        const tr = document.createElement('tr');
        if(rowClass) tr.className = rowClass;
        
        let actionsHtml = '';
        if (currentUser && currentUser.role === 'admin') {
            actionsHtml = `
                <td class="actions">
                    <button class="btn-icon sell" onclick="openActionModal('${item.id}', 'sell')" title="Sell" ${item.quantity === 0 ? 'disabled' : ''}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </button>
                    <button class="btn-icon" onclick="openEditModal('${item.id}')" title="Edit">
                        <ion-icon name="create-outline"></ion-icon>
                    </button>
                    <button class="btn-icon delete" onclick="deleteProduct('${item.id}')" title="Delete">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </td>
            `;
        } else {
            actionsHtml = `
                <td class="actions">
                    <button class="btn-icon sell" onclick="openActionModal('${item.id}', 'cart')" title="Add to Cart" ${item.quantity === 0 ? 'disabled' : ''}>
                        <ion-icon name="cart-outline"></ion-icon>
                    </button>
                </td>
            `;
        }

        tr.innerHTML = `
            <td><strong>${item.id}</strong></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>₹${parseFloat(item.price).toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            ${actionsHtml}
        `;
        tbody.appendChild(tr);
    });
}

// Forms Setup
function setupForms() {
    // Add Form
    const addForm = document.getElementById('product-form');
    if(addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('prod-id').value.trim();
            const name = document.getElementById('prod-name').value.trim();
            const category = document.getElementById('prod-category').value;
            const price = parseFloat(document.getElementById('prod-price').value);
            const costPrice = parseFloat(document.getElementById('prod-cost').value);
            const quantity = parseInt(document.getElementById('prod-qty').value);
            const imageUrlInput = document.getElementById('prod-image');
            const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';

            if (inventory.some(item => item.id === id)) {
                showToast('error', 'Product ID already exists!');
                return;
            }
            if (costPrice > price) {
                if(!confirm("Cost Price is higher than Selling Price. Are you sure?")) return;
            }

            inventory.push({ id, name, category, price, costPrice, quantity, imageUrl });
            logTransaction('Added', name);
            addForm.reset();
            showToast('success', 'Product added successfully!');
        });
    }

    // Edit Form
    const editForm = document.getElementById('edit-form');
    document.getElementById('close-modal').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
    if(editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const originalId = document.getElementById('edit-original-id').value;
            const id = document.getElementById('edit-id').value.trim();
            const name = document.getElementById('edit-name').value.trim();
            const category = document.getElementById('edit-category').value;
            const price = parseFloat(document.getElementById('edit-price').value);
            const costPrice = parseFloat(document.getElementById('edit-cost').value);
            const quantity = parseInt(document.getElementById('edit-qty').value);

            if (id !== originalId && inventory.some(item => item.id === id)) {
                showToast('error', 'Product ID already exists!');
                return;
            }

            const index = inventory.findIndex(item => item.id === originalId);
            if (index !== -1) {
                const imageUrl = inventory[index].imageUrl || '';
                inventory[index] = { id, name, category, price, costPrice, quantity, imageUrl };
                logTransaction('Updated', name);
                closeEditModal();
                showToast('success', 'Product updated successfully!');
            }
        });
    }

    // Action Form (Sell or Add to Cart)
    const actionForm = document.getElementById('action-form');
    const actionQtyInput = document.getElementById('action-qty');
    document.getElementById('close-action-modal').addEventListener('click', closeActionModal);
    document.getElementById('cancel-action').addEventListener('click', closeActionModal);
    
    if(actionQtyInput) {
        actionQtyInput.addEventListener('input', () => {
            const id = document.getElementById('action-product-id').value;
            const product = inventory.find(item => item.id === id);
            if(product) {
                let qty = parseInt(actionQtyInput.value) || 0;
                if(qty > product.quantity) {
                    actionQtyInput.value = product.quantity;
                    qty = product.quantity;
                }
                document.getElementById('action-total-price').textContent = `₹${(product.price * qty).toFixed(2)}`;
            }
        });
    }

    if(actionForm) {
        actionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('action-product-id').value;
            const type = document.getElementById('action-type').value;
            const qty = parseInt(document.getElementById('action-qty').value);
            
            const product = inventory.find(item => item.id === id);
            if(!product) return;

            if (type === 'cart') {
                const existing = cart.find(i => i.id === product.id);
                if (existing) {
                    if (existing.cartQty + qty > product.quantity) {
                        showToast('error', 'Not enough total stock available!');
                        return;
                    }
                    existing.cartQty += qty;
                } else {
                    cart.push({ ...product, cartQty: qty });
                }
                saveData();
                updateCartUI();
                closeActionModal();
                showToast('success', 'Added to cart!');
            } else if (type === 'sell') { // Admin POS Instant Sell
                if(product.quantity >= qty) {
                    product.quantity -= qty;
                    const totalPrice = product.price * qty;
                    const totalCost = (product.costPrice || (product.price*0.7)) * qty;
                    const profit = totalPrice - totalCost;
                    
                    const sale = {
                        id: Date.now(),
                        username: currentUser.username,
                        dateStr: new Date().toLocaleDateString(),
                        dateTime: new Date().toLocaleString(),
                        role: currentUser.role,
                        items: [{ name: product.name, qty: qty, price: product.price, total: totalPrice }],
                        totalPrice: totalPrice,
                        profit: profit
                    };
                    sales.push(sale);
                    logTransaction('Sold', `${qty}x ${product.name}`, sale.id);
                    closeActionModal();
                    showToast('success', 'Sale completed successfully!');
                    generateBill(sale);
                } else {
                    showToast('error', 'Not enough stock!');
                }
            }
        });
    }

    document.getElementById('close-bill-modal').addEventListener('click', closeBillModal);
}

// Edit Modal Functions
window.openEditModal = function(id) {
    if(!currentUser || currentUser.role !== 'admin') return;
    const product = inventory.find(item => item.id === id);
    if (!product) return;
    document.getElementById('edit-original-id').value = product.id;
    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-category').value = product.category;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-cost').value = product.costPrice || (product.price * 0.7).toFixed(2);
    document.getElementById('edit-qty').value = product.quantity;
    document.getElementById('edit-modal').classList.add('active');
}
window.closeEditModal = function() { document.getElementById('edit-modal').classList.remove('active'); }

// Action (Sell/Cart) Modal Functions
window.openActionModal = function(id, type) {
    const product = inventory.find(item => item.id === id);
    if (!product || product.quantity <= 0) return;
    document.getElementById('action-product-id').value = product.id;
    document.getElementById('action-type').value = type;
    document.getElementById('action-modal-title').textContent = type === 'cart' ? 'Add to Cart' : 'Sell Product';
    document.getElementById('action-qty-label').textContent = type === 'cart' ? 'Quantity to Add' : 'Quantity to Sell';
    document.getElementById('action-product-name').textContent = product.name;
    document.getElementById('action-available-stock').textContent = product.quantity;
    
    const qtyInput = document.getElementById('action-qty');
    qtyInput.value = 1;
    qtyInput.max = product.quantity;
    document.getElementById('action-total-price').textContent = `₹${(product.price * 1).toFixed(2)}`;
    
    const confirmBtn = document.getElementById('confirm-action-btn');
    confirmBtn.innerHTML = type === 'cart' ? '<ion-icon name="cart-outline"></ion-icon> Add to Cart' : '<ion-icon name="cash-outline"></ion-icon> Generate Bill';
    document.getElementById('action-modal').classList.add('active');
}
window.closeActionModal = function() { document.getElementById('action-modal').classList.remove('active'); }

// Cart Setup and Logic
function setupCart() {
    const cartBtn = document.getElementById('cart-btn');
    if(cartBtn) cartBtn.addEventListener('click', openCartModal);
    
    const closeBtn = document.getElementById('close-cart-modal');
    if(closeBtn) closeBtn.addEventListener('click', closeCartModal);
    
    const emptyBtn = document.getElementById('empty-cart-btn');
    if(emptyBtn) emptyBtn.addEventListener('click', () => {
        cart = [];
        saveData();
        updateCartUI();
        renderCartItems();
    });
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if(checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            
            // Check stock logic
            for (let item of cart) {
                const invItem = inventory.find(i => i.id === item.id);
                if (!invItem || invItem.quantity < item.cartQty) {
                    showToast('error', `Not enough stock for ${item.name}`);
                    return;
                }
            }
            
            let totalPrice = 0;
            let totalCost = 0;
            const itemsSold = [];
            
            for (let item of cart) {
                const itemTotal = item.price * item.cartQty;
                const itemCost = (item.costPrice || (item.price*0.7)) * item.cartQty;
                totalPrice += itemTotal;
                totalCost += itemCost;
                itemsSold.push({
                    name: item.name,
                    qty: item.cartQty,
                    price: item.price,
                    total: itemTotal
                });
            }
            
            // Create pending order, do not deduct stock yet
            const order = {
                id: Date.now(),
                username: currentUser.username,
                role: currentUser.role,
                dateStr: new Date().toLocaleDateString(),
                dateTime: new Date().toLocaleString(),
                items: itemsSold,
                totalPrice: totalPrice,
                profit: totalPrice - totalCost,
                status: 'pending' // pending, approved, rejected
            };
            
            orders.push(order);
            logTransaction('Request', `Checkout requested by ${currentUser.username}`);
            
            cart = [];
            saveData();
            updateCartUI();
            closeCartModal();
            showToast('success', 'Order sent to Admin for approval!');
            
            // Switch to My Orders view automatically
            document.querySelector('.nav-item[data-target="my-orders"]').click();
        });
    }
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.cartQty, 0);
        countEl.textContent = totalItems;
        if (totalItems > 0) countEl.style.display = 'block';
        else countEl.style.display = 'none';
    }
}

function openCartModal() {
    renderCartItems();
    document.getElementById('cart-modal').classList.add('active');
}
function closeCartModal() { document.getElementById('cart-modal').classList.remove('active'); }

window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    saveData();
    updateCartUI();
    renderCartItems();
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    if(!container) return;
    
    container.innerHTML = '';
    if (cart.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Your cart is empty.</p>';
        totalEl.textContent = '₹0.00';
        checkoutBtn.disabled = true;
        return;
    }
    
    let total = 0;
    checkoutBtn.disabled = false;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.cartQty;
        total += itemTotal;
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color);';
        div.innerHTML = `
            <div>
                <h4 style="margin-bottom: 4px; font-size: 14px;">${item.name}</h4>
                <div style="font-size: 12px; color: var(--text-muted);">${item.cartQty} x ₹${item.price.toFixed(2)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <span style="font-weight: 600;">₹${itemTotal.toFixed(2)}</span>
                <button class="btn-icon delete" onclick="removeFromCart('${item.id}')" title="Remove"><ion-icon name="trash-outline"></ion-icon></button>
            </div>
        `;
        container.appendChild(div);
    });
    totalEl.textContent = `₹${total.toFixed(2)}`;
}

// Approvals Logic (Admin Only)
function renderApprovals() {
    const tbody = document.querySelector('#approvals-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const pendingOrders = orders.filter(o => o.status === 'pending');
    if(pendingOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No pending orders to approve</td></tr>';
        return;
    }

    pendingOrders.forEach(order => {
        const tr = document.createElement('tr');
        const itemsList = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td><strong>${order.username}</strong></td>
            <td>${order.dateTime}</td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsList}">${itemsList}</td>
            <td><strong>₹${order.totalPrice.toFixed(2)}</strong></td>
            <td><span class="status-badge" style="background: #fef08a; color: #ca8a04;">Pending</span></td>
            <td class="actions">
                <button class="btn btn-primary btn-sm" onclick="approveOrder(${order.id})"><ion-icon name="checkmark-outline"></ion-icon> Approve</button>
                <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="rejectOrder(${order.id})"><ion-icon name="close-outline"></ion-icon> Reject</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.approveOrder = function(orderId) {
    if(!currentUser || currentUser.role !== 'admin') return;
    const order = orders.find(o => o.id === orderId);
    if(!order || order.status !== 'pending') return;

    // Verify stock availability one last time before approval
    for (let item of order.items) {
        const invItem = inventory.find(i => i.name === item.name);
        if(!invItem || invItem.quantity < item.qty) {
            showToast('error', `Cannot approve: Insufficient stock for ${item.name}`);
            return;
        }
    }

    // Deduct stock
    for (let item of order.items) {
        const invItem = inventory.find(i => i.name === item.name);
        invItem.quantity -= item.qty;
    }

    order.status = 'approved';
    sales.push(order); // Add to sales for metrics tracking
    logTransaction('Approved Order', `#${order.id} for ${order.username}`, order.id);
    
    saveData();
    showToast('success', 'Order approved successfully!');
}

window.rejectOrder = function(orderId) {
    if(!currentUser || currentUser.role !== 'admin') return;
    if(!confirm("Are you sure you want to reject this order?")) return;

    const order = orders.find(o => o.id === orderId);
    if(!order || order.status !== 'pending') return;

    order.status = 'rejected';
    logTransaction('Rejected Order', `#${order.id} for ${order.username}`);
    saveData();
    showToast('success', 'Order rejected.');
}

// My Orders Logic (Member Only)
function renderMyOrders() {
    const tbody = document.querySelector('#my-orders-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const myOrders = orders.filter(o => o.username === currentUser.username).sort((a,b) => b.id - a.id);
    if(myOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">You have no orders yet.</td></tr>';
        return;
    }

    myOrders.forEach(order => {
        const tr = document.createElement('tr');
        const itemsList = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        
        let statusBadge = '';
        if(order.status === 'pending') statusBadge = '<span class="status-badge" style="background: #fef08a; color: #ca8a04;">Pending</span>';
        else if(order.status === 'approved') statusBadge = '<span class="status-badge" style="background: #d1fae5; color: #065f46;">Approved</span>';
        else statusBadge = '<span class="status-badge" style="background: #fee2e2; color: #991b1b;">Rejected</span>';

        const billBtn = order.status === 'approved' ? `<button class="btn btn-primary btn-sm" onclick="viewOrderBill(${order.id})"><ion-icon name="document-text-outline"></ion-icon> Print Bill</button>` : `<span style="color: var(--text-muted); font-size: 12px;">Not Available</span>`;

        tr.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.dateTime}</td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsList}">${itemsList}</td>
            <td><strong>₹${order.totalPrice.toFixed(2)}</strong></td>
            <td>${statusBadge}</td>
            <td>${billBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.viewOrderBill = function(orderId) {
    const order = orders.find(o => o.id === orderId);
    if(order && order.status === 'approved') {
        generateBill(order);
    }
}

window.viewRecentBill = function(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if(sale) {
        generateBill(sale);
    } else {
        showToast('error', 'Bill not found or no longer available.');
    }
}

// Generate & Print Bill
window.generateBill = function(sale) {
    const billContent = document.getElementById('bill-content');
    if(!billContent) return;
    
    let itemsHtml = '';
    if (sale.items) {
        sale.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px dotted #eee;">${item.name}</td>
                    <td style="text-align: center; padding: 12px 0; border-bottom: 1px dotted #eee;">${item.qty}</td>
                    <td style="text-align: right; padding: 12px 0; border-bottom: 1px dotted #eee;">₹${item.price.toFixed(2)}</td>
                    <td style="text-align: right; padding: 12px 0; border-bottom: 1px dotted #eee;">₹${item.total.toFixed(2)}</td>
                </tr>
            `;
        });
    }
    
    let billHtml = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 22px;">INVENTO GENERAL STORE</h2>
            <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">123 Commerce Avenue, City</p>
            <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Tel: +91 9876543210</p>
        </div>
        <div style="margin-bottom: 16px; border-bottom: 1px dashed #ccc; padding-bottom: 12px;">
            <div><strong>Date:</strong> ${sale.dateTime}</div>
            <div><strong>Receipt No:</strong> #${sale.id}</div>
            <div><strong>Customer:</strong> ${(sale.username || 'Admin').toUpperCase()}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
                <tr style="border-bottom: 1px dashed #ccc;">
                    <th style="text-align: left; padding-bottom: 8px; font-weight: 600;">Item</th>
                    <th style="text-align: center; padding-bottom: 8px; font-weight: 600;">Qty</th>
                    <th style="text-align: right; padding-bottom: 8px; font-weight: 600;">Price</th>
                    <th style="text-align: right; padding-bottom: 8px; font-weight: 600;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        <div style="border-top: 1px dashed #ccc; padding-top: 16px; text-align: right; font-size: 18px;">
            <strong>Total Amount: ₹${sale.totalPrice.toFixed(2)}</strong>
        </div>
        <div style="text-align: center; margin-top: 32px; font-size: 12px; color: #666;">
            <p>Thank you for shopping with us!</p>
            <p>Please visit again.</p>
        </div>
    `;
    
    billContent.innerHTML = billHtml;
    document.getElementById('bill-modal').classList.add('active');
}

window.closeBillModal = function() {
    document.getElementById('bill-modal').classList.remove('active');
}

window.printBill = function() {
    window.print();
}

// Delete Product
window.deleteProduct = function(id) {
    if(!currentUser || currentUser.role !== 'admin') {
        showToast('error', 'Unauthorized action!');
        return;
    }
    if (confirm('Are you sure you want to delete this product?')) {
        const product = inventory.find(item => item.id === id);
        inventory = inventory.filter(item => item.id !== id);
        if(product) logTransaction('Deleted', product.name);
        else saveData(); // Fallback to just saving
        showToast('success', 'Product deleted successfully!');
    }
}

// Search Setup
function setupSearch() {
    const searchInput = document.getElementById('global-search');
    if(!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        renderInventory(val);
        
        // Auto switch to inventory tab if searching from another tab
        if(val.length > 0) {
            const navItems = document.querySelectorAll('.nav-item');
            const sections = document.querySelectorAll('.section');
            navItems.forEach(nav => {
                if(nav.dataset.target === 'inventory') nav.classList.add('active');
                else nav.classList.remove('active');
            });
            sections.forEach(sec => {
                if(sec.id === 'inventory') sec.classList.add('active');
                else sec.classList.remove('active');
            });
        }
    });
}

// Toast Notifications
function showToast(type, message) {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'checkmark-circle' : 'alert-circle';
    toast.innerHTML = `
        <ion-icon name="${icon}" class="toast-icon"></ion-icon>
        <div class="toast-message">${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
