let products = JSON.parse(localStorage.getItem('products')) || [];
let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Eletrônicos', 'Alimentos', 'Limpeza', 'Vestuário'];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    companyName: 'Minha Empresa',
    lowStockThreshold: 10,
    defaultCurrency: 'BRL',
    autoBackup: false
};

let currentPage = {
    products: 1,
    suppliers: 1
};

const itemsPerPage = 10;
let confirmActionCallback = null;
let categoryChart = null;

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', function() {
    // Configura a data atual
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Carrega os dados iniciais
    loadProducts();
    loadSuppliers();
    loadCategories();
    loadSettings();
    updateDashboard();
    initializeChart();
    
    // Configura eventos de busca e filtros
    document.getElementById('productSearch').addEventListener('input', loadProducts);
    document.getElementById('productCategoryFilter').addEventListener('change', loadProducts);
    document.getElementById('productStockFilter').addEventListener('change', loadProducts);
    document.getElementById('supplierSearch').addEventListener('input', loadSuppliers);
    document.getElementById('supplierTypeFilter').addEventListener('change', loadSuppliers);
    document.getElementById('autoBackup').addEventListener('change', toggleAutoBackup);
});

// Função para mostrar/esconder seções
function showSection(sectionId) {
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    document.getElementById('mobileMenu').classList.add('hidden');
}

// Função para alternar menu mobile
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
}

// Função para carregar produtos
function loadProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('productCategoryFilter').value;
    const stockFilter = document.getElementById('productStockFilter').value;
    
    let filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(search) ||
                             product.code.toLowerCase().includes(search) ||
                             (product.category && product.category.toLowerCase().includes(search));
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesStock = stockFilter === 'all' ||
                            (stockFilter === 'low' && product.stock <= settings.lowStockThreshold) ||
                            (stockFilter === 'normal' && product.stock > settings.lowStockThreshold) ||
                            (stockFilter === 'out' && product.stock === 0);
        return matchesSearch && matchesCategory && matchesStock;
    });

    const startIndex = (currentPage.products - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    renderProductsTable(paginatedProducts);
    updatePagination('products', filteredProducts.length);
}

// Função para renderizar tabela de produtos
function renderProductsTable(productsData) {
    const tableBody = document.getElementById('productsTableBody');
    tableBody.innerHTML = '';

    if (productsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">Nenhum produto cadastrado</td>
            </tr>
        `;
        return;
    }

    productsData.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${product.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${product.code}</td>
            <td class="px-6 py-4 whitespace-nowrap">${product.category || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">R$ ${product.price.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${product.stock}</td>
            <td class="px-6 py-4 whitespace-nowrap">${product.expiry || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
                <button onclick="editProduct('${product.id}')" class="text-blue-500 hover:text-blue-700 mr-2" aria-label="Editar Produto">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="confirmDelete('product', '${product.id}')" class="text-red-500 hover:text-red-700" aria-label="Excluir Produto">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Função para atualizar paginação
function updatePagination(type, totalItems) {
    const page = currentPage[type];
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationDiv = document.getElementById(`${type}Pagination`);
    const prevButton = document.getElementById(`${type}PrevPage`);
    const nextButton = document.getElementById(`${type}NextPage`);
    const showingStart = document.getElementById(`${type}ShowingStart`);
    const showingEnd = document.getElementById(`${type}ShowingEnd`);
    const total = document.getElementById(`${type}Total`);

    paginationDiv.innerHTML = '';
    showingStart.textContent = (page - 1) * itemsPerPage + 1;
    showingEnd.textContent = Math.min(page * itemsPerPage, totalItems);
    total.textContent = totalItems;

    prevButton.disabled = page === 1;
    nextButton.disabled = page === totalPages;

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = `px-3 py-1 border border-gray-300 rounded text-gray-700 ${i === page ? 'bg-blue-500 text-white' : 'hover:bg-blue-50'}`;
        button.onclick = () => {
            currentPage[type] = i;
            if (type === 'products') loadProducts();
            else loadSuppliers();
        };
        paginationDiv.appendChild(button);
    }

    prevButton.onclick = () => {
        if (page > 1) {
            currentPage[type] = page - 1;
            if (type === 'products') loadProducts();
            else loadSuppliers();
        }
    };

    nextButton.onclick = () => {
        if (page < totalPages) {
            currentPage[type] = page + 1;
            if (type === 'products') loadProducts();
            else loadSuppliers();
        }
    };
}

// Função para carregar fornecedores (similar a loadProducts)
function loadSuppliers() {
    const search = document.getElementById('supplierSearch').value.toLowerCase();
    const typeFilter = document.getElementById('supplierTypeFilter').value;
    
    let filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch = supplier.legalName.toLowerCase().includes(search) ||
                             supplier.tradeName.toLowerCase().includes(search) ||
                             supplier.document.toLowerCase().includes(search);
        const matchesType = typeFilter === 'all' || supplier.documentType === typeFilter;
        return matchesSearch && matchesType;
    });

    const startIndex = (currentPage.suppliers - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

    renderSuppliersTable(paginatedSuppliers);
    updatePagination('suppliers', filteredSuppliers.length);
}

// Função para renderizar tabela de fornecedores
function renderSuppliersTable(suppliersData) {
    const tableBody = document.getElementById('suppliersTableBody');
    tableBody.innerHTML = '';

    if (suppliersData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Nenhum fornecedor cadastrado</td>
            </tr>
        `;
        return;
    }

    suppliersData.forEach(supplier => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${supplier.legalName}</td>
            <td class="px-6 py-4 whitespace-nowrap">${supplier.tradeName || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${supplier.document}</td>
            <td class="px-6 py-4 whitespace-nowrap">${supplier.phone}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
                <button onclick="editSupplier('${supplier.id}')" class="text-blue-500 hover:text-blue-700 mr-2" aria-label="Editar Fornecedor">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="confirmDelete('supplier', '${supplier.id}')" class="text-red-500 hover:text-red-700" aria-label="Excluir Fornecedor">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Funções adicionais (stub para completar o sistema)
function loadCategories() {
    const select = document.getElementById('productCategory');
    const categorySelect = document.getElementById('productCategoryFilter');
    select.innerHTML = '<option value="">Selecione uma categoria</option>';
    categorySelect.innerHTML = '<option value="all">Todas categorias</option>';
    categories.forEach(category => {
        select.innerHTML += `<option value="${category}">${category}</option>`;
        categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
    });
    document.getElementById('categoriesList').innerHTML = categories.map(cat => `<div class="px-4 py-2">${cat}</div>`).join('') || '<div class="px-4 py-2 text-center text-sm text-gray-500">Nenhuma categoria cadastrada</div>';
}

function loadSettings() {
    document.getElementById('companyName').value = settings.companyName;
    document.getElementById('lowStockThreshold').value = settings.lowStockThreshold;
    document.getElementById('defaultCurrency').value = settings.defaultCurrency;
    const autoBackup = document.getElementById('autoBackup');
    autoBackup.checked = settings.autoBackup;
    const dot = autoBackup.parentElement.querySelector('.dot');
    dot.style.transform = settings.autoBackup ? 'translateX(24px)' : 'translateX(0)';
}

function updateDashboard() {
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalSuppliers').textContent = suppliers.length;
    document.getElementById('totalStockValue').textContent = `R$ ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}`;
    document.getElementById('lowStockProducts').textContent = products.filter(p => p.stock <= settings.lowStockThreshold).length;
}

function initializeChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    const categoryData = categories.map(cat => ({
        category: cat,
        count: products.filter(p => p.category === cat).length
    }));
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categoryData.map(item => item.category),
            datasets: [{
                label: 'Quantidade de Produtos',
                data: categoryData.map(item => item.count),
                backgroundColor: ['#A5D8FF', '#C3B1E1', '#FFD6A5', '#B2F2BB'],
                borderColor: ['#7CB9E8', '#A78BFA', '#FFBB80', '#81E89C'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Funções de modais e ações (stub para completar)
function openProductModal() { /* Implementar */ }
function openSupplierModal() { /* Implementar */ }
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}
function confirmDelete(type, id) { /* Implementar */ }
function confirmAction() { /* Implementar */ }
function saveProduct(event) { /* Implementar */ }
function saveSupplier(event) { /* Implementar */ }
function editProduct(id) { /* Implementar */ }
function editSupplier(id) { /* Implementar */ }
function toggleAutoBackup() { /* Implementar */ }
function createBackup() { /* Implementar */ }
function restoreBackup(input) { /* Implementar */ }
function addCategory() { /* Implementar */ }
function saveGeneralSettings() { /* Implementar */ }
function exportToCSV() { /* Implementar */ }
function exportToJSON() { /* Implementar */ }
function exportToPDF() { /* Implementar */ }
function showReport(reportType) { /* Implementar */ }
function printReport() { /* Implementar */ }
function previewImage(input) { /* Implementar */ }
function submitContactForm(event) { /* Implementar */ }
function toggleFAQ(element) { /* Implementar */ }
function hideToast() {
    document.getElementById('toast').classList.add('hidden');
}