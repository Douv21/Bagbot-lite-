// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pullBtn = document.getElementById('pullBtn');
const botLogs = document.getElementById('botLogs');
const pm2Status = document.getElementById('pm2Status');

// Mobile Sidebar Toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Hide all pages
        pages.forEach(page => page.classList.remove('active'));
        
        // Show target page
        const targetPage = item.getAttribute('data-page');
        document.getElementById(`page-${targetPage}`).classList.add('active');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
        
        // Load page-specific data
        if (targetPage === 'logs') {
            loadLogs();
        } else if (targetPage === 'status') {
            loadStatus();
        }
    });
});

// Pull & Restart
pullBtn.addEventListener('click', async () => {
    pullBtn.disabled = true;
    pullBtn.textContent = '⏳ Pull en cours...';
    
    try {
        const response = await fetch('/api/pull', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            pullBtn.textContent = '✅ Succès !';
            setTimeout(() => {
                pullBtn.textContent = '🔄 Pull & Restart';
                pullBtn.disabled = false;
            }, 2000);
        } else {
            pullBtn.textContent = '❌ Erreur';
            setTimeout(() => {
                pullBtn.textContent = '🔄 Pull & Restart';
                pullBtn.disabled = false;
            }, 2000);
        }
    } catch (error) {
        console.error('Error:', error);
        pullBtn.textContent = '❌ Erreur';
        setTimeout(() => {
            pullBtn.textContent = '🔄 Pull & Restart';
            pullBtn.disabled = false;
        }, 2000);
    }
});

// Load Logs
async function loadLogs() {
    botLogs.textContent = 'Chargement des logs...';
    
    try {
        const response = await fetch('/api/logs/bot');
        const data = await response.json();
        botLogs.textContent = data.logs || 'Aucun log disponible';
    } catch (error) {
        console.error('Error loading logs:', error);
        botLogs.textContent = 'Erreur lors du chargement des logs';
    }
}

// Load Status
async function loadStatus() {
    pm2Status.textContent = 'Chargement du statut...';
    
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        pm2Status.textContent = data.status || 'Statut non disponible';
    } catch (error) {
        console.error('Error loading status:', error);
        pm2Status.textContent = 'Erreur lors du chargement du statut';
    }
}

// Update stats (simulated for now)
function updateStats() {
    // These would normally come from the API
    document.getElementById('serverCount').textContent = '1';
    document.getElementById('userCount').textContent = '-';
    document.getElementById('commandCount').textContent = '2';
    document.getElementById('uptime').textContent = 'En ligne';
}

// Initialize
updateStats();

// Auto-refresh logs every 10 seconds if on logs page
setInterval(() => {
    const logsPage = document.getElementById('page-logs');
    if (logsPage.classList.contains('active')) {
        loadLogs();
    }
}, 10000);

// Auto-refresh status every 30 seconds if on status page
setInterval(() => {
    const statusPage = document.getElementById('page-status');
    if (statusPage.classList.contains('active')) {
        loadStatus();
    }
}, 30000);
