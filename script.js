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
    
    let filtered