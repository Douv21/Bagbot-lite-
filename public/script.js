// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pullBtn = document.getElementById('pullBtn');
const botLogs = document.getElementById('botLogs');
const pm2Status = document.getElementById('pm2Status');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');

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

// Load user info
async function loadUserInfo() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (data.user) {
            const user = data.user;
            const avatarUrl = user.avatar 
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;
            
            userInfo.innerHTML = `
                <img src="${avatarUrl}" alt="Avatar" class="user-avatar">
                <span>${user.username}#${user.discriminator}</span>
            `;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch('/auth/logout');
        window.location.href = '/auth/login';
    } catch (error) {
        console.error('Error logout:', error);
    }
});

// Load user info on page load
loadUserInfo();

// Load guilds on select-server page
async function loadGuilds() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (data.user && data.user.guilds) {
            const guildsList = document.getElementById('guildsList');
            
            // Filtrer seulement les serveurs où l'utilisateur est admin
            const adminGuilds = data.user.guilds.filter(guild => 
                guild.permissions & 0x8 || guild.owner === true
            );
            
            if (adminGuilds.length === 0) {
                guildsList.innerHTML = '<p>Vous n\'êtes administrateur d\'aucun serveur.</p>';
                return;
            }
            
            // Trier les serveurs: d'abord ceux où l'utilisateur est owner
            adminGuilds.sort((a, b) => {
                if (a.owner && !b.owner) return -1;
                if (!a.owner && b.owner) return 1;
                return 0;
            });
            
            guildsList.innerHTML = adminGuilds.map(guild => {
                const icon = guild.icon 
                    ? `<img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png" alt="${guild.name}" class="guild-icon">`
                    : `<div class="guild-icon">${guild.name.substring(0, 2).toUpperCase()}</div>`;
                
                return `
                    <div class="guild-card" onclick="selectGuild('${guild.id}')">
                        ${icon}
                        <div class="guild-name">${guild.name}</div>
                        ${guild.owner ? '<div class="guild-owner">👑 Propriétaire</div>' : '<div class="guild-owner">⚡ Administrateur</div>'}
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading guilds:', error);
        document.getElementById('guildsList').innerHTML = '<p>Erreur lors du chargement des serveurs.</p>';
    }
}

// Select guild
async function selectGuild(guildId) {
    try {
        const response = await fetch('/api/select-guild', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ guildId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/';
        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (error) {
        console.error('Error selecting guild:', error);
        alert('Erreur lors de la sélection du serveur');
    }
}

// Load guilds if on select-server page
if (document.getElementById('guildsList')) {
    loadGuilds();
}

// Tabs functionality
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show target tab content
        document.getElementById(`tab-${tabName}`).classList.add('active');
    });
});

// Update welcome preview
function updateWelcomePreview() {
    const preview = document.getElementById('welcomePreview');
    const message = document.getElementById('welcomeMessage').value || 'Bienvenue {user} sur {server} !';
    const color = document.getElementById('welcomeColor').value;
    const logo = document.getElementById('welcomeLogo').value;
    const thumbnail = document.getElementById('welcomeThumbnail').value;
    const image = document.getElementById('welcomeImage').value;
    const footer = document.getElementById('welcomeFooter').value || 'Bienvenue !';
    const footerIcon = document.getElementById('welcomeFooterIcon').value;
    
    preview.style.borderLeftColor = color;
    
    let html = `
        <div class="embed-preview-header">
            ${logo ? `<img src="${logo}" alt="Logo" class="embed-preview-avatar">` : '<div class="embed-preview-avatar">🤖</div>'}
            <div class="embed-preview-author">Nom du serveur</div>
        </div>
        <div class="embed-preview-content">
            <p>${message}</p>
        </div>
    `;
    
    if (thumbnail) {
        html += `<img src="${thumbnail}" alt="Thumbnail" class="embed-preview-image" style="max-width: 80px; max-height: 80px; border-radius: 8px; margin-bottom: 10px;">`;
    }
    
    if (image) {
        html += `<img src="${image}" alt="Image" class="embed-preview-image">`;
    }
    
    html += `
        <div class="embed-preview-footer">
            ${footerIcon ? `<img src="${footerIcon}" alt="Footer Icon" style="width: 20px; height: 20px; border-radius: 50%;">` : ''}
            <span>${footer}</span>
        </div>
    `;
    
    preview.innerHTML = html;
}

// Update depart preview
function updateDepartPreview() {
    const preview = document.getElementById('departPreview');
    const message = document.getElementById('departMessage').value || '{user} a quitté {server} !';
    const color = document.getElementById('departColor').value;
    const logo = document.getElementById('departLogo').value;
    const thumbnail = document.getElementById('departThumbnail').value;
    const image = document.getElementById('departImage').value;
    const footer = document.getElementById('departFooter').value || 'Au revoir !';
    const footerIcon = document.getElementById('departFooterIcon').value;
    
    preview.style.borderLeftColor = color;
    
    let html = `
        <div class="embed-preview-header">
            ${logo ? `<img src="${logo}" alt="Logo" class="embed-preview-avatar">` : '<div class="embed-preview-avatar">🤖</div>'}
            <div class="embed-preview-author">Nom du serveur</div>
        </div>
        <div class="embed-preview-content">
            <p>${message}</p>
        </div>
    `;
    
    if (thumbnail) {
        html += `<img src="${thumbnail}" alt="Thumbnail" class="embed-preview-image" style="max-width: 80px; max-height: 80px; border-radius: 8px; margin-bottom: 10px;">`;
    }
    
    if (image) {
        html += `<img src="${image}" alt="Image" class="embed-preview-image">`;
    }
    
    html += `
        <div class="embed-preview-footer">
            ${footerIcon ? `<img src="${footerIcon}" alt="Footer Icon" style="width: 20px; height: 20px; border-radius: 50%;">` : ''}
            <span>${footer}</span>
        </div>
    `;
    
    preview.innerHTML = html;
}

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

// Welcome/Depart Configuration
const uploadImageBtn = document.getElementById('uploadImage');
const saveWelcomeConfigBtn = document.getElementById('saveWelcomeConfig');
const loadWelcomeConfigBtn = document.getElementById('loadWelcomeConfig');

// Upload image
uploadImageBtn.addEventListener('click', async () => {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('uploadResult').innerHTML = `
                <p style="color: #3BA55C;">✅ Image uploadée avec succès !</p>
                <p>URL: <a href="${data.url}" target="_blank">${data.url}</a></p>
            `;
        } else {
            document.getElementById('uploadResult').innerHTML = `<p style="color: #ED4245;">❌ Erreur: ${data.error}</p>`;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('uploadResult').innerHTML = `<p style="color: #ED4245;">❌ Erreur lors de l'upload</p>`;
    }
});

// Save welcome/depart configuration
saveWelcomeConfigBtn.addEventListener('click', async () => {
    const guildId = document.getElementById('welcomeGuildId').value;
    
    if (!guildId) {
        alert('Veuillez entrer le Guild ID');
        return;
    }
    
    const config = {
        welcome: {
            enabled: document.getElementById('welcomeEnabled').checked,
            channelId: document.getElementById('welcomeChannelId').value,
            message: document.getElementById('welcomeMessage').value,
            color: document.getElementById('welcomeColor').value,
            logo: document.getElementById('welcomeLogo').value,
            thumbnail: document.getElementById('welcomeThumbnail').value,
            image: document.getElementById('welcomeImage').value,
            footer: document.getElementById('welcomeFooter').value,
            footerIcon: document.getElementById('welcomeFooterIcon').value
        },
        depart: {
            enabled: document.getElementById('departEnabled').checked,
            channelId: document.getElementById('departChannelId').value,
            message: document.getElementById('departMessage').value,
            color: document.getElementById('departColor').value,
            logo: document.getElementById('departLogo').value,
            thumbnail: document.getElementById('departThumbnail').value,
            image: document.getElementById('departImage').value,
            footer: document.getElementById('departFooter').value,
            footerIcon: document.getElementById('departFooterIcon').value
        }
    };
    
    try {
        const response = await fetch(`/api/welcome-depart/${guildId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Configuration sauvegardée avec succès !');
        } else {
            alert('❌ Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Erreur lors de la sauvegarde');
    }
});

// Load welcome/depart configuration
loadWelcomeConfigBtn.addEventListener('click', async () => {
    const guildId = document.getElementById('welcomeGuildId').value;
    
    if (!guildId) {
        alert('Veuillez entrer le Guild ID');
        return;
    }
    
    try {
        const response = await fetch(`/api/welcome-depart/${guildId}`);
        const data = await response.json();
        
        if (data.config) {
            const config = data.config;
            
            // Load welcome config
            if (config.welcome) {
                document.getElementById('welcomeEnabled').checked = config.welcome.enabled;
                document.getElementById('welcomeChannelId').value = config.welcome.channelId || '';
                document.getElementById('welcomeMessage').value = config.welcome.message || '';
                document.getElementById('welcomeColor').value = config.welcome.color || '#FF0040';
                document.getElementById('welcomeLogo').value = config.welcome.logo || '';
                document.getElementById('welcomeThumbnail').value = config.welcome.thumbnail || '';
                document.getElementById('welcomeImage').value = config.welcome.image || '';
                document.getElementById('welcomeFooter').value = config.welcome.footer || '';
                document.getElementById('welcomeFooterIcon').value = config.welcome.footerIcon || '';
            }
            
            // Load depart config
            if (config.depart) {
                document.getElementById('departEnabled').checked = config.depart.enabled;
                document.getElementById('departChannelId').value = config.depart.channelId || '';
                document.getElementById('departMessage').value = config.depart.message || '';
                document.getElementById('departColor').value = config.depart.color || '#FF0040';
                document.getElementById('departLogo').value = config.depart.logo || '';
                document.getElementById('departThumbnail').value = config.depart.thumbnail || '';
                document.getElementById('departImage').value = config.depart.image || '';
                document.getElementById('departFooter').value = config.depart.footer || '';
                document.getElementById('departFooterIcon').value = config.depart.footerIcon || '';
            }
            
            alert('✅ Configuration chargée avec succès !');
        } else {
            alert('⚠️ Aucune configuration trouvée pour ce serveur');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Erreur lors du chargement');
    }
});
