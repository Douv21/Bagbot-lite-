let currentModalType = 'welcome';
let currentGuildId = localStorage.getItem('selectedGuildId') || null;

// Check authentication on page load
async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    
    if (data.authenticated) {
      // Show user profile in header
      document.getElementById('userProfile').style.display = 'flex';
      document.getElementById('userName').textContent = data.user.username;
      
      if (data.user.avatar) {
        document.getElementById('userAvatar').style.backgroundImage = `url(https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png)`;
      } else {
        // Use default avatar
        const defaultAvatar = (parseInt(data.user.discriminator) % 5).toString();
        document.getElementById('userAvatar').style.backgroundImage = `url(https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png)`;
      }
      
      // Load guilds (filtered)
      loadGuildsFromAPI();
      
      // Check selected guild
      const guildResponse = await fetch('/api/selected-guild');
      const guildData = await guildResponse.json();
      
      if (guildData.guildId) {
        // Show dashboard sections
        document.getElementById('sidebarNav').style.display = 'block';
        document.getElementById('configContent').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('guildSelector').style.display = 'none';
        
        // Update current server display in header
        updateCurrentServer(guildData.guildId);
        
        loadConfig();
        loadChannels();
        loadForumChannels();
      } else {
        // Hide dashboard sections, show guild selector
        document.getElementById('sidebarNav').style.display = 'none';
        document.getElementById('configContent').style.display = 'none';
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('guildSelector').style.display = 'block';
      }
    } else {
      // Show login button, hide everything else
      document.getElementById('userProfile').style.display = 'none';
      document.getElementById('loginSection').style.display = 'block';
      document.getElementById('sidebarNav').style.display = 'none';
      document.getElementById('guildSelector').style.display = 'none';
      document.getElementById('configContent').style.display = 'none';
      document.getElementById('mainContent').style.display = 'block';
    }
  } catch (error) {
    console.error('Error checking auth:', error);
  }
}

// Update current server display in header
async function updateCurrentServer(guildId) {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    if (data.authenticated && data.user.guilds) {
      const guild = data.user.guilds.find(g => g.id === guildId);
      if (guild) {
        document.getElementById('currentServerName').textContent = guild.name;
        const iconElement = document.getElementById('currentServerIcon');
        if (guild.icon) {
          iconElement.style.backgroundImage = `url(https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png)`;
        } else {
          iconElement.style.backgroundImage = 'none';
          iconElement.textContent = guild.name.charAt(0).toUpperCase();
        }
        document.getElementById('currentServerHeader').style.display = 'flex';
      }
    }
  } catch (error) {
    console.error('Error updating current server:', error);
  }
}

// Change server function
function changeServer() {
  document.getElementById('sidebarNav').style.display = 'none';
  document.getElementById('configContent').style.display = 'none';
  document.getElementById('guildSelector').style.display = 'block';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('currentServerHeader').style.display = 'none';
}

// Load guilds from API (filtered)
async function loadGuildsFromAPI() {
  try {
    const response = await fetch('/api/guilds');
    const guilds = await response.json();
    loadGuilds(guilds);
  } catch (error) {
    console.error('Error loading guilds:', error);
  }
}

// Load guilds
function loadGuilds(guilds) {
  const grid = document.getElementById('guildGrid');
  grid.innerHTML = '';
  
  if (guilds.length === 0) {
    grid.innerHTML = '<p style="color: var(--text-secondary);">Aucun serveur disponible. Le bot doit être présent sur le serveur et vous devez avoir les permissions nécessaires.</p>';
    return;
  }
  
  guilds.forEach(guild => {
    const card = document.createElement('div');
    card.className = 'guild-card';
    card.dataset.guildId = guild.id;
    
    const icon = document.createElement('div');
    icon.className = 'guild-icon';
    
    if (guild.icon) {
      icon.style.backgroundImage = `url(https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png)`;
    } else {
      icon.textContent = guild.name.charAt(0).toUpperCase();
    }
    
    const name = document.createElement('div');
    name.className = 'guild-name';
    name.textContent = guild.name;
    
    card.appendChild(icon);
    card.appendChild(name);
    
    if (guild.owner) {
      const owner = document.createElement('div');
      owner.className = 'guild-owner';
      owner.textContent = 'Owner';
      card.appendChild(owner);
    }
    
    card.addEventListener('click', () => selectGuild(guild.id));
    grid.appendChild(card);
  });
}

// Select guild
async function selectGuild(guildId) {
  if (!guildId) {
    document.getElementById('configContent').style.display = 'none';
    return;
  }

  currentGuildId = guildId;
  localStorage.setItem('selectedGuildId', guildId);
  
  // Update visual selection
  document.querySelectorAll('.guild-card').forEach(card => {
    card.classList.remove('selected');
    if (card.dataset.guildId === guildId) {
      card.classList.add('selected');
    }
  });
  
  try {
    const response = await fetch('/api/select-guild', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guildId })
    });
    
    if (response.ok) {
      // Show dashboard sections
      document.getElementById('sidebarNav').style.display = 'block';
      document.getElementById('configContent').style.display = 'block';
      document.getElementById('mainContent').style.display = 'none';
      document.getElementById('guildSelector').style.display = 'none';

      // Update current server display in header
      updateCurrentServer(guildId);

      loadConfig();
      loadChannels();
      loadRoles();
      loadForumChannels();
    }
  } catch (error) {
    console.error('Error selecting guild:', error);
  }
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab');
    document.getElementById(`tab-${tabId}`).classList.add('active');
  });
});

// Sidebar navigation
const sectionTitles = {
  'welcome':        'Bienvenue',
  'depart':         'Départ',
  'forum':          'Forum Illimité',
  'shop':           'Boutique',
  'actions':        'Actions',
  'economy':        'Économie',
  'levels-xp':      'Niveaux — Courbe XP',
  'levels-rewards': 'Niveaux — Récompenses',
  'levels-fire':    'Niveaux — Réinitialisation Feu',
  'levels-themes':  'Niveaux — Thèmes',
  'confession':     'Confessions'
};

function navigateToSection(section) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const tabContent = document.getElementById(`tab-${section}`);
  if (tabContent) tabContent.classList.add('active');
  document.getElementById('headerTitle').textContent = sectionTitles[section] || 'Dashboard';
}

// Nav parent toggle dropdown
document.querySelectorAll('.nav-parent').forEach(parent => {
  parent.addEventListener('click', e => {
    e.preventDefault();
    parent.closest('.nav-group').classList.toggle('open');
  });
});

// Nav sub-items (inside dropdown)
document.querySelectorAll('.nav-sub-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-sub-item, .nav-item:not(.nav-parent)').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    navigateToSection(item.getAttribute('data-section'));
  });
});

// Flat nav items (not inside dropdown)
document.querySelectorAll('.nav-item:not(.nav-parent)').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-sub-item, .nav-item:not(.nav-parent)').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    navigateToSection(item.getAttribute('data-section'));
  });
});

// Get current user info for preview
async function getCurrentUser() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    if (data.authenticated) {
      return data.user;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  }
  return null;
}

// Get current guild info for preview
async function getCurrentGuild() {
  try {
    const response = await fetch('/api/selected-guild');
    const data = await response.json();
    if (data.guildId) {
      // Fetch guild info from user's guilds
      const userResponse = await fetch('/api/user');
      const userData = await userResponse.json();
      if (userData.authenticated && userData.user.guilds) {
        const guild = userData.user.guilds.find(g => g.id === data.guildId);
        if (guild) {
          return guild;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching guild:', error);
  }
  return null;
}

// Replace variables in text
function replaceVariables(text, user, guild) {
  let result = text;
  if (user) {
    result = result.replace('{user}', user.username);
  }
  if (guild) {
    result = result.replace('{server}', guild.name);
    result = result.replace('{member_count}', '1234'); // Mock value
  }
  return result;
}

// Update welcome embed preview
async function updateWelcomeEmbed() {
  const title = document.getElementById('welcomeTitle').value;
  const description = document.getElementById('welcomeMessage').value;
  const color = document.getElementById('welcomeColor').value;
  const imageUrl = document.getElementById('welcomeImage').value;
  const thumbnailUrl = document.getElementById('welcomeThumbnail').value;
  const authorName = document.getElementById('welcomeAuthorName').value;
  const authorIcon = document.getElementById('welcomeAuthorIcon').value;
  const footerText = document.getElementById('welcomeFooterText').value;
  const footerIcon = document.getElementById('welcomeFooterIcon').value;

  const user = await getCurrentUser();
  const guild = await getCurrentGuild();

  document.getElementById('welcomeEmbedTitle').textContent = replaceVariables(title || '👋 Bienvenue', user, guild);
  document.getElementById('welcomeEmbedDescription').textContent = replaceVariables(description || 'Bienvenue {user} sur le serveur !', user, guild);
  document.getElementById('welcomeEmbedPreview').style.borderLeftColor = color || '#5865F2';

  // Timestamp
  const timestampElement = document.getElementById('welcomeEmbedTimestamp');
  const now = new Date();
  timestampElement.textContent = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Thumbnail
  const thumbnailImg = document.getElementById('welcomeEmbedThumbnail').querySelector('img');
  if (thumbnailUrl) {
    thumbnailImg.src = thumbnailUrl;
    thumbnailImg.style.display = 'block';
  } else {
    thumbnailImg.style.display = 'none';
  }

  // Image
  const imageElement = document.getElementById('welcomeEmbedImage');
  if (imageUrl) {
    imageElement.src = imageUrl;
    imageElement.style.display = 'block';
    imageElement.style.background = 'none';
    imageElement.style.border = 'none';
  } else {
    imageElement.style.display = 'flex';
    imageElement.style.background = 'rgba(255, 255, 255, 0.05)';
    imageElement.style.border = '2px dashed rgba(255, 255, 255, 0.1)';
    imageElement.innerHTML = '';
  }

  // Author
  const authorElement = document.getElementById('welcomeEmbedAuthor');
  const authorNameElement = document.getElementById('welcomeEmbedAuthorName');
  const authorIconElement = document.getElementById('welcomeEmbedAuthorIcon');
  if (authorName || authorIcon) {
    authorNameElement.textContent = replaceVariables(authorName, user, guild);
    authorElement.style.display = 'flex';
    if (authorIcon) {
      authorIconElement.src = authorIcon;
      authorIconElement.style.display = 'block';
    } else {
      authorIconElement.style.display = 'none';
    }
  } else {
    authorElement.style.display = 'flex';
    authorNameElement.textContent = '🤖 BagBot';
    authorIconElement.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
    authorIconElement.style.display = 'block';
  }

  // Footer
  const footerElement = document.getElementById('welcomeEmbedFooter');
  const footerTextElement = document.getElementById('welcomeEmbedFooterText');
  const footerIconImg = document.getElementById('welcomeEmbedFooterIcon');
  if (footerText || footerIcon) {
    footerTextElement.textContent = replaceVariables(footerText || '', user, guild);
    footerElement.style.display = 'flex';
    footerElement.style.background = 'transparent';
    footerElement.style.border = '1px solid #4E5058';
    if (footerIcon) {
      footerIconImg.src = footerIcon;
      footerIconImg.style.display = 'inline';
    } else {
      footerIconImg.style.display = 'none';
    }
  } else {
    footerElement.style.display = 'flex';
    footerElement.style.background = 'rgba(255, 255, 255, 0.05)';
    footerElement.style.border = '1px solid #4E5058';
    footerTextElement.textContent = '';
    footerIconImg.style.display = 'none';
  }
}

// Update depart embed preview
async function updateDepartEmbed() {
  const title = document.getElementById('departTitle').value;
  const description = document.getElementById('departMessage').value;
  const color = document.getElementById('departColor').value;
  const imageUrl = document.getElementById('departImage').value;
  const thumbnailUrl = document.getElementById('departThumbnail').value;
  const authorName = document.getElementById('departAuthorName').value;
  const authorIcon = document.getElementById('departAuthorIcon').value;
  const footerText = document.getElementById('departFooterText').value;
  const footerIcon = document.getElementById('departFooterIcon').value;

  const user = await getCurrentUser();
  const guild = await getCurrentGuild();

  document.getElementById('departEmbedTitle').textContent = replaceVariables(title || '👋 Au revoir', user, guild);
  document.getElementById('departEmbedDescription').textContent = replaceVariables(description || 'Au revoir {user} !', user, guild);
  document.getElementById('departEmbedPreview').style.borderLeftColor = color || '#5865F2';

  // Timestamp
  const timestampElement = document.getElementById('departEmbedTimestamp');
  const now = new Date();
  timestampElement.textContent = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Thumbnail
  const thumbnailImg = document.getElementById('departEmbedThumbnail').querySelector('img');
  if (thumbnailUrl) {
    thumbnailImg.src = thumbnailUrl;
    thumbnailImg.style.display = 'block';
  } else {
    thumbnailImg.style.display = 'none';
  }

  // Image
  const imageElement = document.getElementById('departEmbedImage');
  if (imageUrl) {
    imageElement.src = imageUrl;
    imageElement.style.display = 'block';
    imageElement.style.background = 'none';
    imageElement.style.border = 'none';
  } else {
    imageElement.style.display = 'flex';
    imageElement.style.background = 'rgba(255, 255, 255, 0.05)';
    imageElement.style.border = '2px dashed rgba(255, 255, 255, 0.1)';
    imageElement.innerHTML = '';
  }

  // Author
  const authorElement = document.getElementById('departEmbedAuthor');
  const authorNameElement = document.getElementById('departEmbedAuthorName');
  const authorIconElement = document.getElementById('departEmbedAuthorIcon');
  if (authorName || authorIcon) {
    authorNameElement.textContent = replaceVariables(authorName, user, guild);
    authorElement.style.display = 'flex';
    if (authorIcon) {
      authorIconElement.src = authorIcon;
      authorIconElement.style.display = 'block';
    } else {
      authorIconElement.style.display = 'none';
    }
  } else {
    authorElement.style.display = 'flex';
    authorNameElement.textContent = '🤖 BagBot';
    authorIconElement.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
    authorIconElement.style.display = 'block';
  }

  // Footer
  const footerElement = document.getElementById('departEmbedFooter');
  const footerTextElement = document.getElementById('departEmbedFooterText');
  const footerIconImg = document.getElementById('departEmbedFooterIcon');
  if (footerText || footerIcon) {
    footerTextElement.textContent = replaceVariables(footerText || '', user, guild);
    footerElement.style.display = 'flex';
    footerElement.style.background = 'transparent';
    footerElement.style.border = '1px solid #4E5058';
    if (footerIcon) {
      footerIconImg.src = footerIcon;
      footerIconImg.style.display = 'inline';
    } else {
      footerIconImg.style.display = 'none';
    }
  } else {
    footerElement.style.display = 'flex';
    footerElement.style.background = 'rgba(255, 255, 255, 0.05)';
    footerElement.style.border = '1px solid #4E5058';
    footerTextElement.textContent = '';
    footerIconImg.style.display = 'none';
  }
}

// Modal functions
function openModal(modalId) {
  console.log('Opening modal:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.zIndex = '10000';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    console.log('Modal display set to flex with inline styles');
  } else {
    console.error('Modal not found:', modalId);
  }
}

function closeModal(modalId) {
  console.log('Closing modal:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Toggle sidebar for mobile
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('sidebar-open');

  // Close sidebar when clicking outside on mobile
  if (sidebar.classList.contains('sidebar-open')) {
    setTimeout(() => {
      document.addEventListener('click', closeSidebarOnClickOutside);
    }, 100);
  } else {
    document.removeEventListener('click', closeSidebarOnClickOutside);
  }
}

function closeSidebarOnClickOutside(e) {
  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.getElementById('hamburgerMenu');
  if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
    sidebar.classList.remove('sidebar-open');
    document.removeEventListener('click', closeSidebarOnClickOutside);
  }
}

// Shop type change handler
document.getElementById('shopItemType')?.addEventListener('change', function() {
  const type = this.value;
  const roleGroup = document.getElementById('roleSelectGroup');
  const xpGroup = document.getElementById('xpAmountGroup');

  if (type === 'role' || type === 'temp_role') {
    roleGroup.style.display = 'block';
    xpGroup.style.display = 'none';
  } else if (type === 'xp') {
    roleGroup.style.display = 'none';
    xpGroup.style.display = 'block';
  } else {
    roleGroup.style.display = 'none';
    xpGroup.style.display = 'none';
  }
});

// Add shop item
function addShopItem() {
  const name = document.getElementById('shopItemName').value;
  const description = document.getElementById('shopItemDescription').value;
  const price = document.getElementById('shopItemPrice').value;
  const type = document.getElementById('shopItemType').value;
  const role = document.getElementById('shopItemRole').value;
  const xp = document.getElementById('shopItemXP').value;

  if (!name || !price) {
    alert('Veuillez remplir le nom et le prix de l\'item');
    return;
  }

  const item = {
    id: Date.now().toString(),
    name,
    description,
    price: parseInt(price),
    type,
    role: type === 'role' || type === 'temp_role' ? role : null,
    xp: type === 'xp' ? parseInt(xp) : null
  };

  // Get existing items
  let shopItems = JSON.parse(localStorage.getItem('shopItems') || '[]');
  shopItems.push(item);
  localStorage.setItem('shopItems', JSON.stringify(shopItems));

  // Clear form
  document.getElementById('shopItemName').value = '';
  document.getElementById('shopItemDescription').value = '';
  document.getElementById('shopItemPrice').value = '';
  document.getElementById('shopItemRole').value = '';
  document.getElementById('shopItemXP').value = '';

  // Reload items list
  loadShopItems();
}

// Load shop items
function loadShopItems() {
  const shopItems = JSON.parse(localStorage.getItem('shopItems') || '[]');
  const itemsList = document.getElementById('shopItemsList');

  if (shopItems.length === 0) {
    itemsList.innerHTML = '<p>Aucun item pour le moment.</p>';
    return;
  }

  itemsList.innerHTML = '';
  shopItems.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'shop-item';
    itemDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-bottom: 10px;">
        <div>
          <strong>${item.name}</strong> (${item.price} pts)
          <br><small>${item.description || 'Pas de description'}</small>
          <br><small>Type: ${item.type} ${item.role ? '| Rôle: ' + item.role : ''} ${item.xp ? '| XP: ' + item.xp : ''}</small>
        </div>
        <button class="btn btn-danger" onclick="deleteShopItem('${item.id}')">Supprimer</button>
      </div>
    `;
    itemsList.appendChild(itemDiv);
  });
}

// Delete shop item
function deleteShopItem(itemId) {
  let shopItems = JSON.parse(localStorage.getItem('shopItems') || '[]');
  shopItems = shopItems.filter(item => item.id !== itemId);
  localStorage.setItem('shopItems', JSON.stringify(shopItems));
  loadShopItems();
}

// Title modal
function openTitleModal(type) {
  currentModalType = type;
  document.getElementById('modalTitle').value = type === 'welcome' 
    ? document.getElementById('welcomeTitle').value 
    : document.getElementById('departTitle').value;
  openModal('titleModal');
}

function saveTitleModal() {
  if (currentModalType === 'welcome') {
    document.getElementById('welcomeTitle').value = document.getElementById('modalTitle').value;
    updateWelcomeEmbed();
  } else {
    document.getElementById('departTitle').value = document.getElementById('modalTitle').value;
    updateDepartEmbed();
  }
  closeModal('titleModal');
}

// Subtitle modal
function openSubtitleModal(type) {
  currentModalType = type;
  document.getElementById('modalSubtitle').value = type === 'welcome' 
    ? document.getElementById('welcomeSubtitle').value 
    : document.getElementById('departSubtitle').value;
  openModal('subtitleModal');
}

function saveSubtitleModal() {
  if (currentModalType === 'welcome') {
    document.getElementById('welcomeSubtitle').value = document.getElementById('modalSubtitle').value;
    updateWelcomeEmbed();
  } else {
    document.getElementById('departSubtitle').value = document.getElementById('modalSubtitle').value;
    updateDepartEmbed();
  }
  closeModal('subtitleModal');
}

// Description modal
function openDescriptionModal(type) {
  currentModalType = type;
  document.getElementById('modalDescription').value = type === 'welcome' 
    ? document.getElementById('welcomeMessage').value 
    : document.getElementById('departMessage').value;
  openModal('descriptionModal');
}

function saveDescriptionModal() {
  if (currentModalType === 'welcome') {
    document.getElementById('welcomeMessage').value = document.getElementById('modalDescription').value;
    updateWelcomeEmbed();
  } else {
    document.getElementById('departMessage').value = document.getElementById('modalDescription').value;
    updateDepartEmbed();
  }
  closeModal('descriptionModal');
}

// Author modal
function openAuthorModal(type) {
  currentModalType = type;
  document.getElementById('modalAuthorName').value = type === 'welcome' 
    ? document.getElementById('welcomeAuthorName').value 
    : document.getElementById('departAuthorName').value;
  document.getElementById('modalAuthorIcon').value = type === 'welcome' 
    ? document.getElementById('welcomeAuthorIcon').value 
    : document.getElementById('departAuthorIcon').value;
  openModal('authorModal');
}

function saveAuthorModal() {
  if (currentModalType === 'welcome') {
    document.getElementById('welcomeAuthorName').value = document.getElementById('modalAuthorName').value;
    document.getElementById('welcomeAuthorIcon').value = document.getElementById('modalAuthorIcon').value;
    updateWelcomeEmbed();
  } else {
    document.getElementById('departAuthorName').value = document.getElementById('modalAuthorName').value;
    document.getElementById('departAuthorIcon').value = document.getElementById('modalAuthorIcon').value;
    updateDepartEmbed();
  }
  closeModal('authorModal');
}

// Thumbnail modal
function openThumbnailModal(type) {
  currentModalType = type;
  document.getElementById('modalThumbnail').value = type === 'welcome' 
    ? document.getElementById('welcomeThumbnail').value 
    : document.getElementById('departThumbnail').value;
  openModal('thumbnailModal');
}

function saveThumbnailModal() {
  if (currentModalType === 'welcome') {
    document.getElementById('welcomeThumbnail').value = document.getElementById('modalThumbnail').value;
    updateWelcomeEmbed();
  } else {
    document.getElementById('departThumbnail').value = document.getElementById('modalThumbnail').value;
    updateDepartEmbed();
  }
  closeModal('thumbnailModal');
}

// Handle image upload
function handleImageUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      // Limit size to avoid issues with save (increased to 2MB)
      if (base64.length > 2000000) {
        alert('⚠️ L\'image est trop grande. Veuillez utiliser une image plus petite (max 2MB).');
        return;
      }
      document.getElementById('modalImage').value = base64;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Handle thumbnail upload
function handleThumbnailUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      // Limit size to avoid issues with save (increased to 1MB)
      if (base64.length > 1000000) {
        alert('⚠️ L\'image est trop grande. Veuillez utiliser une image plus petite (max 1MB).');
        return;
      }
      document.getElementById('modalThumbnail').value = base64;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Handle author icon upload
function handleAuthorIconUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      // Limit size to avoid issues with save (increased to 1MB)
      if (base64.length > 1000000) {
        alert('⚠️ L\'image est trop grande. Veuillez utiliser une image plus petite (max 1MB).');
        return;
      }
      document.getElementById('modalAuthorIcon').value = base64;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Handle footer icon upload
function handleFooterIconUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      // Limit size to avoid issues with save (increased to 1MB)
      if (base64.length > 1000000) {
        alert('⚠️ L\'image est trop grande. Veuillez utiliser une image plus petite (max 1MB).');
        return;
      }
      document.getElementById('modalFooterIcon').value = base64;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Image modal
function openImageModal(type) {
  currentModalType = type;
  document.getElementById('modalImage').value = type === 'welcome' 
    ? document.getElementById('welcomeImage').value 
    : document.getElementById('departImage').value;
  openModal('imageModal');
}

function saveImageModal() {
  if (currentModalType === 'welcome') {
    document.getElementById('welcomeImage').value = document.getElementById('modalImage').value;
    updateWelcomeEmbed();
  } else {
    document.getElementById('departImage').value = document.getElementById('modalImage').value;
    updateDepartEmbed();
  }
  closeModal('imageModal');
}

// Footer modal
function openFooterModal(type) {
  currentModalType = type;
  document.getElementById('modalFooterText').value = type === 'welcome' 
    ? document.getElementById('welcomeFooterText').textContent 
    : document.getElementById('departFooterText').textContent;
  document.getElementById('modalFooterIcon').value = type === 'welcome' 
    ? document.getElementById('welcomeFooterIcon').value 
    : document.getElementById('departFooterIcon').value;
  openModal('footerModal');
}

function saveFooterModal() {
  if (currentModalType === 'welcome') {
    document.getElementById('welcomeFooterText').textContent = document.getElementById('modalFooterText').value;
    document.getElementById('welcomeFooterIcon').value = document.getElementById('modalFooterIcon').value;
    updateWelcomeEmbed();
  } else {
    document.getElementById('departFooterText').textContent = document.getElementById('modalFooterText').value;
    document.getElementById('departFooterIcon').value = document.getElementById('modalFooterIcon').value;
    updateDepartEmbed();
  }
  closeModal('footerModal');
}

// Load channels
async function loadChannels() {
  try {
    const response = await fetch('/api/channels');
    const channels = await response.json();
    
    const welcomeChannelSelect = document.getElementById('welcomeChannel');
    const departChannelSelect = document.getElementById('departChannel');
    const shopChannelSelect = document.getElementById('shopChannel');
    const levelUpChannelSelect = document.getElementById('levelUpChannel');

    const textChannels = channels.filter(ch => ch.type === 0 || ch.type === 5); // GUILD_TEXT or GUILD_ANNOUNCEMENT
    
    const populateSelect = (select) => {
      if (!select) return;
      select.innerHTML = '<option value="">Sélectionner un salon...</option>';
      textChannels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = channel.name || 'Sans nom';
        select.appendChild(option);
      });
    };

    const confessionModSelect = document.getElementById('confessionModChannel');

    populateSelect(welcomeChannelSelect);
    populateSelect(departChannelSelect);
    populateSelect(shopChannelSelect);
    populateSelect(levelUpChannelSelect);

    // Confession multi-picker
    availableConfessionChannels = textChannels;
    refreshConfessionPicker();

    // Confession mod channel (single select)
    if (confessionModSelect) {
      confessionModSelect.innerHTML = '<option value="">Désactivé</option>';
      textChannels.forEach(ch => {
        const o = document.createElement('option');
        o.value = ch.id; o.textContent = '#' + (ch.name || 'Sans nom');
        confessionModSelect.appendChild(o);
      });
    }
  } catch (error) {
    console.error('Error loading channels:', error);
  }
}

// Load roles
async function loadRoles() {
  try {
    const response = await fetch('/api/roles');
    const roles = await response.json();

    const welcomeRoleSelect = document.getElementById('welcomeRole');
    const shopItemRoleSelect = document.getElementById('shopItemRole');
    const rewardRoleSelect = document.getElementById('rewardRole');
    const themeRoleSelect = document.getElementById('themeRole');

    welcomeRoleSelect.innerHTML = '<option value="">Tous les membres</option>';
    shopItemRoleSelect.innerHTML = '<option value="">Sélectionner un rôle...</option>';
    if (rewardRoleSelect) {
      rewardRoleSelect.innerHTML = '<option value="">Sélectionner un rôle...</option>';
    }
    if (themeRoleSelect) {
      themeRoleSelect.innerHTML = '<option value="">Sélectionner un rôle...</option>';
    }

    roles.forEach(role => {
      const option = `<option value="${role.id}">${role.name}</option>`;
      welcomeRoleSelect.innerHTML += option;
      shopItemRoleSelect.innerHTML += option;
      if (rewardRoleSelect) {
        rewardRoleSelect.innerHTML += option;
      }
      if (themeRoleSelect) {
        themeRoleSelect.innerHTML += option;
      }
    });
  } catch (error) {
    console.error('Error loading roles:', error);
  }
}

// Store available forum channels for the picker
let availableForumChannels = [];
// Store selected forum channel IDs
let selectedForumChannels = [];

// Load forum channels into the picker dropdown
async function loadForumChannels() {
  try {
    const response = await fetch('/api/channels');
    const channels = await response.json();

    // Filter only forum channels (type 15) and media channels (type 16)
    availableForumChannels = channels.filter(ch => ch.type === 15 || ch.type === 16);

    refreshForumPicker();
  } catch (error) {
    console.error('Error loading forum channels:', error);
    const picker = document.getElementById('forumChannelPicker');
    if (picker) picker.innerHTML = '<option value="">Erreur lors du chargement des salons.</option>';
  }
}

// Refresh the picker to only show channels not yet selected
function refreshForumPicker() {
  const picker = document.getElementById('forumChannelPicker');
  if (!picker) return;

  const unselected = availableForumChannels.filter(ch => !selectedForumChannels.includes(ch.id));

  if (availableForumChannels.length === 0) {
    picker.innerHTML = '<option value="">Aucun salon forum trouvé sur ce serveur</option>';
  } else if (unselected.length === 0) {
    picker.innerHTML = '<option value="">Tous les salons forum sont déjà ajoutés</option>';
  } else {
    picker.innerHTML = '<option value="">Choisir un salon forum...</option>';
    unselected.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = '💬 ' + (ch.name || 'Sans nom');
      picker.appendChild(opt);
    });
  }
}

// Add selected channel from picker as a tag
function addForumChannel() {
  const picker = document.getElementById('forumChannelPicker');
  const channelId = picker.value;
  if (!channelId) return;

  const channel = availableForumChannels.find(ch => ch.id === channelId);
  if (!channel || selectedForumChannels.includes(channelId)) return;

  selectedForumChannels.push(channelId);
  renderForumTags();
  refreshForumPicker();
}

// Remove a channel tag
function removeForumChannel(channelId) {
  selectedForumChannels = selectedForumChannels.filter(id => id !== channelId);
  renderForumTags();
  refreshForumPicker();
}

// Render the selected channel tags
function renderForumTags() {
  const container = document.getElementById('forumChannelTags');
  if (!container) return;

  container.innerHTML = '';
  selectedForumChannels.forEach(channelId => {
    const channel = availableForumChannels.find(ch => ch.id === channelId);
    const name = channel ? (channel.name || 'Sans nom') : channelId;

    const tag = document.createElement('div');
    tag.className = 'forum-channel-tag';
    tag.innerHTML = `
      <span>💬 ${name}</span>
      <button type="button" onclick="removeForumChannel('${channelId}')" title="Retirer ce salon">&times;</button>
    `;
    container.appendChild(tag);
  });

  if (selectedForumChannels.length === 0) {
    container.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.85rem;">Aucun salon sélectionné</span>';
  }
}

// ── Confession channel multi-picker ────────────────────────────────────────
let availableConfessionChannels = [];
let selectedConfessionChannels  = [];

function refreshConfessionPicker() {
  const picker = document.getElementById('confessionChannelPicker');
  if (!picker) return;
  const unselected = availableConfessionChannels.filter(ch => !selectedConfessionChannels.includes(ch.id));
  if (availableConfessionChannels.length === 0) {
    picker.innerHTML = '<option value="">Aucun salon texte trouvé</option>';
  } else if (unselected.length === 0) {
    picker.innerHTML = '<option value="">Tous les salons sont déjà ajoutés</option>';
  } else {
    picker.innerHTML = '<option value="">Choisir un salon...</option>';
    unselected.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = '# ' + (ch.name || 'Sans nom');
      picker.appendChild(opt);
    });
  }
}

function addConfessionChannel() {
  const picker = document.getElementById('confessionChannelPicker');
  const channelId = picker.value;
  if (!channelId) return;
  const channel = availableConfessionChannels.find(ch => ch.id === channelId);
  if (!channel || selectedConfessionChannels.includes(channelId)) return;
  selectedConfessionChannels.push(channelId);
  renderConfessionTags();
  refreshConfessionPicker();
}

function removeConfessionChannel(channelId) {
  selectedConfessionChannels = selectedConfessionChannels.filter(id => id !== channelId);
  renderConfessionTags();
  refreshConfessionPicker();
}

function renderConfessionTags() {
  const container = document.getElementById('confessionChannelTags');
  if (!container) return;
  container.innerHTML = '';
  if (selectedConfessionChannels.length === 0) {
    container.innerHTML = '<span style="color:var(--text-secondary);font-size:0.85rem;">Aucun salon — commande utilisable partout</span>';
    return;
  }
  selectedConfessionChannels.forEach(channelId => {
    const ch   = availableConfessionChannels.find(c => c.id === channelId);
    const name = ch ? (ch.name || 'Sans nom') : channelId;
    const tag  = document.createElement('div');
    tag.className = 'forum-channel-tag';
    tag.innerHTML = `<span># ${name}</span><button type="button" onclick="removeConfessionChannel('${channelId}')" title="Retirer">&times;</button>`;
    container.appendChild(tag);
  });
}

function getChannelTypeName(type) {
  const types = {
    0: 'GUILD_TEXT',
    1: 'DM',
    2: 'GUILD_VOICE',
    3: 'GROUP_DM',
    4: 'CATEGORY',
    5: 'GUILD_ANNOUNCEMENT',
    10: 'ANNOUNCEMENT_THREAD',
    11: 'PUBLIC_THREAD',
    12: 'PRIVATE_THREAD',
    13: 'GUILD_STAGE_VOICE',
    14: 'GUILD_DIRECTORY',
    15: 'GUILD_FORUM',
    16: 'GUILD_MEDIA'
  };
  return types[type] || 'UNKNOWN';
}

// Load actions configuration
const actionsList = [
  { id: 'calin', name: 'Câlin', emoji: '🤗' },
  { id: 'embrasser', name: 'Embrasser', emoji: '💋' },
  { id: '69', name: '69', emoji: '🔞' },
  { id: 'branler', name: 'Branler', emoji: '🤫' },
  { id: 'lecher', name: 'Lécher', emoji: '👅' },
  { id: 'mordre', name: 'Mordre', emoji: '🦷' },
  { id: 'caresser', name: 'Caresser', emoji: '✋' },
  { id: 'attrape', name: 'Attraper', emoji: '🤲' },
  { id: 'collier', name: 'Mettre un collier', emoji: '📿' },
  { id: 'agenouiller', name: 'S\'agenouiller', emoji: '🙇' },
  { id: 'batailleoreiller', name: 'Bataille d\'oreiller', emoji: '🛏️' },
  { id: 'chatouiller', name: 'Chatouiller', emoji: '😂' },
  { id: 'mouiller', name: 'Mouiller', emoji: '💧' },
  { id: 'orgasme', name: 'Faire jouir', emoji: '🌊' },
  { id: 'pecher', name: 'Pêcher', emoji: '🎣' },
  { id: 'punir', name: 'Punir', emoji: '⚖️' },
  { id: 'reanimer', name: 'Réanimer', emoji: '⚡' },
  { id: 'reconforter', name: 'Réconforter', emoji: '🤗' },
  { id: 'reveiller', name: 'Réveiller', emoji: '⏰' },
  { id: 'rose', name: 'Offrir une rose', emoji: '🌹' },
  { id: 'seduire', name: 'Séduire', emoji: '💋' },
  { id: 'sodo', name: 'Sodo', emoji: '🍑' },
  { id: 'sucer', name: 'Sucer', emoji: '👄' },
  { id: 'tirercheveux', name: 'Tirer les cheveux', emoji: '💇' },
  { id: 'touche', name: 'Toucher', emoji: '👋' },
  { id: 'travailler', name: 'Travailler', emoji: '⚒️' },
  { id: 'vin', name: 'Offrir du vin', emoji: '🍷' }
];

function loadActionsConfig() {
  const actionsConfig = JSON.parse(localStorage.getItem('actionsConfig') || '{}');
  const actionsGrid = document.getElementById('actionsGrid');
  
  if (!actionsGrid) return;
  
  actionsGrid.innerHTML = '';
  
  actionsList.forEach(action => {
    const config = actionsConfig[action.id] || { enabled: true, rewardMin: 5, rewardMax: 15, karmaMin: 1, karmaMax: 3, messages: [] };
    
    const actionCard = document.createElement('div');
    actionCard.className = 'action-card';
    actionCard.innerHTML = `
      <div class="action-header">
        <span class="action-emoji">${action.emoji}</span>
        <span class="action-name">${action.name}</span>
        <label class="toggle-switch">
          <input type="checkbox" class="action-enabled" data-action="${action.id}" ${config.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="action-config">
        <div class="config-row">
          <label>💰 BAG min:</label>
          <input type="number" class="action-reward-min" data-action="${action.id}" value="${config.rewardMin || 5}" min="0">
        </div>
        <div class="config-row">
          <label>💰 BAG max:</label>
          <input type="number" class="action-reward-max" data-action="${action.id}" value="${config.rewardMax || 15}" min="0">
        </div>
        <div class="config-row">
          <label>⭐ Karma min:</label>
          <input type="number" class="action-karma-min" data-action="${action.id}" value="${config.karmaMin ?? 1}" min="0">
        </div>
        <div class="config-row">
          <label>⭐ Karma max:</label>
          <input type="number" class="action-karma-max" data-action="${action.id}" value="${config.karmaMax ?? 3}" min="0">
        </div>
        <div class="config-row">
          <label>Messages:</label>
          <textarea class="action-messages" data-action="${action.id}" rows="3" placeholder="Un message par ligne">${(config.messages || []).join('\n')}</textarea>
        </div>
      </div>
    `;
    
    actionsGrid.appendChild(actionCard);
  });
  
  // Add event listeners
  document.querySelectorAll('.action-enabled').forEach(checkbox => {
    checkbox.addEventListener('change', saveActionsConfig);
  });
  
  document.querySelectorAll('.action-reward-min').forEach(input => {
    input.addEventListener('change', saveActionsConfig);
  });
  
  document.querySelectorAll('.action-reward-max').forEach(input => {
    input.addEventListener('change', saveActionsConfig);
  });

  document.querySelectorAll('.action-karma-min').forEach(input => {
    input.addEventListener('change', saveActionsConfig);
  });

  document.querySelectorAll('.action-karma-max').forEach(input => {
    input.addEventListener('change', saveActionsConfig);
  });
  
  document.querySelectorAll('.action-messages').forEach(textarea => {
    textarea.addEventListener('change', saveActionsConfig);
  });
}

function saveActionsConfig() {
  const actionsConfig = {};
  
  actionsList.forEach(action => {
    const enabled    = document.querySelector(`.action-enabled[data-action="${action.id}"]`)?.checked ?? true;
    const rewardMin  = parseInt(document.querySelector(`.action-reward-min[data-action="${action.id}"]`)?.value) || 5;
    const rewardMax  = parseInt(document.querySelector(`.action-reward-max[data-action="${action.id}"]`)?.value) || 15;
    const karmaMin   = parseInt(document.querySelector(`.action-karma-min[data-action="${action.id}"]`)?.value) ?? 1;
    const karmaMax   = parseInt(document.querySelector(`.action-karma-max[data-action="${action.id}"]`)?.value) ?? 3;
    const messagesText = document.querySelector(`.action-messages[data-action="${action.id}"]`)?.value || '';
    const messages = messagesText.split('\n').filter(m => m.trim());
    
    actionsConfig[action.id] = {
      enabled,
      rewardMin,
      rewardMax,
      karmaMin,
      karmaMax,
      messages
    };
  });
  
  localStorage.setItem('actionsConfig', JSON.stringify(actionsConfig));
}

// Add level reward
function addLevelReward() {
  const level = document.getElementById('rewardLevel').value;
  const role = document.getElementById('rewardRole').value;

  if (!level || !role) {
    alert('Veuillez remplir le niveau et sélectionner un rôle.');
    return;
  }

  let levelRewards = JSON.parse(localStorage.getItem('levelRewards') || '{}');
  levelRewards[level] = role;
  localStorage.setItem('levelRewards', JSON.stringify(levelRewards));

  // Clear form
  document.getElementById('rewardLevel').value = '';
  document.getElementById('rewardRole').value = '';

  loadLevelRewards();
}

// Load level rewards
async function loadLevelRewards() {
  const levelRewards = JSON.parse(localStorage.getItem('levelRewards') || '{}');
  const rewardsList = document.getElementById('levelRewardsList');

  if (!rewardsList) return;

  const entries = Object.entries(levelRewards);
  if (entries.length === 0) {
    rewardsList.innerHTML = '<p>Aucune récompense configurée.</p>';
    return;
  }

  // Fetch roles to get role names
  let roles = [];
  try {
    const response = await fetch('/api/roles');
    const rolesData = await response.json();
    roles = rolesData;
  } catch (error) {
    console.error('Error loading roles:', error);
  }

  rewardsList.innerHTML = '';
  entries.sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([level, roleId]) => {
    const role = roles.find(r => r.id === roleId);
    const roleName = role ? role.name : roleId;
    
    const rewardDiv = document.createElement('div');
    rewardDiv.className = 'reward-item';
    rewardDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-bottom: 10px;">
        <div>
          <strong>Niveau ${level}</strong>
          <br><small>Rôle: ${roleName}</small>
        </div>
        <button class="btn btn-danger" onclick="deleteLevelReward('${level}')">Supprimer</button>
      </div>
    `;
    rewardsList.appendChild(rewardDiv);
  });
}

// Delete level reward
function deleteLevelReward(level) {
  let levelRewards = JSON.parse(localStorage.getItem('levelRewards') || '{}');
  delete levelRewards[level];
  localStorage.setItem('levelRewards', JSON.stringify(levelRewards));
  loadLevelRewards();
}

// Add role theme
function addRoleTheme() {
  const roleId = document.getElementById('themeRole').value;
  const theme = document.getElementById('themeSelect').value;

  if (!roleId) {
    alert('Veuillez sélectionner un rôle.');
    return;
  }

  let roleThemes = JSON.parse(localStorage.getItem('roleThemes') || '{}');
  roleThemes[roleId] = theme || 'random';
  localStorage.setItem('roleThemes', JSON.stringify(roleThemes));

  // Clear form
  document.getElementById('themeRole').value = '';
  document.getElementById('themeSelect').value = '';

  loadRoleThemes();
}

// Load role themes
async function loadRoleThemes() {
  const roleThemes = JSON.parse(localStorage.getItem('roleThemes') || '{}');
  const themesList = document.getElementById('roleThemesList');

  if (!themesList) return;

  const entries = Object.entries(roleThemes);
  if (entries.length === 0) {
    themesList.innerHTML = '<p>Aucun thème configuré.</p>';
    return;
  }

  // Fetch roles to get role names
  let roles = [];
  try {
    const response = await fetch('/api/roles');
    const rolesData = await response.json();
    roles = rolesData;
  } catch (error) {
    console.error('Error loading roles:', error);
  }

  const themeNames = {
    'random': 'Aléatoire',
    'blue': 'Bleu',
    'gaming': 'Gaming',
    'holographic': 'Holographique',
    'futuristic': 'Futuriste',
    'love': 'Amour',
    'sensual': 'Sensuel',
    'rose': 'Rose',
    'gold': 'Or'
  };

  themesList.innerHTML = '';
  entries.forEach(([roleId, theme]) => {
    const role = roles.find(r => r.id === roleId);
    const roleName = role ? role.name : roleId;
    const themeName = themeNames[theme] || theme;
    
    const themeDiv = document.createElement('div');
    themeDiv.className = 'theme-item';
    themeDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-bottom: 10px;">
        <div>
          <strong>${roleName}</strong>
          <br><small>Thème: ${themeName}</small>
        </div>
        <button class="btn btn-danger" onclick="deleteRoleTheme('${roleId}')">Supprimer</button>
      </div>
    `;
    themesList.appendChild(themeDiv);
  });
}

// Delete role theme
function deleteRoleTheme(roleId) {
  let roleThemes = JSON.parse(localStorage.getItem('roleThemes') || '{}');
  delete roleThemes[roleId];
  localStorage.setItem('roleThemes', JSON.stringify(roleThemes));
  loadRoleThemes();
}


// Load configuration on page load
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    
    if (config.welcome) {
      document.getElementById('welcomeEnabled').checked = config.welcome.enabled;
      document.getElementById('welcomeTitle').value = config.welcome.title || '👋 Bienvenue';
      document.getElementById('welcomeMessage').value = config.welcome.message || 'Bienvenue {user} sur le serveur !';
      document.getElementById('welcomeColor').value = config.welcome.color || '#C41E3A';
      document.getElementById('welcomeImage').value = config.welcome.image || '';
      document.getElementById('welcomeThumbnail').value = config.welcome.thumbnail || '';
      document.getElementById('welcomeAuthorName').value = config.welcome.authorName || '';
      document.getElementById('welcomeAuthorIcon').value = config.welcome.authorIcon || '';
      document.getElementById('welcomeFooterText').value = config.welcome.footerText || '';
      document.getElementById('welcomeFooterIcon').value = config.welcome.footerIcon || '';
      document.getElementById('welcomeChannel').value = config.welcome.channel || '';
      document.getElementById('welcomeRole').value = config.welcome.role || '';
      updateWelcomeEmbed();
    }
    
    if (config.depart) {
      document.getElementById('departEnabled').checked = config.depart.enabled;
      document.getElementById('departTitle').value = config.depart.title || '👋 Au revoir';
      document.getElementById('departMessage').value = config.depart.message || 'Au revoir {user} !';
      document.getElementById('departColor').value = config.depart.color || '#C41E3A';
      document.getElementById('departImage').value = config.depart.image || '';
      document.getElementById('departThumbnail').value = config.depart.thumbnail || '';
      document.getElementById('departAuthorName').value = config.depart.authorName || '';
      document.getElementById('departAuthorIcon').value = config.depart.authorIcon || '';
      document.getElementById('departFooterText').value = config.depart.footerText || '';
      document.getElementById('departFooterIcon').value = config.depart.footerIcon || '';
      document.getElementById('departChannel').value = config.depart.channel || '';
      updateDepartEmbed();
    }

    if (config.forum) {
      document.getElementById('forumEnabled').checked = config.forum.enabled;
      if (config.forum.channels && Array.isArray(config.forum.channels)) {
        selectedForumChannels = config.forum.channels;
        renderForumTags();
        refreshForumPicker();
      }
    }

    if (config.shop) {
      document.getElementById('shopEnabled').checked = config.shop.enabled;
      document.getElementById('shopChannel').value = config.shop.channel || '';
      document.getElementById('shopCurrencyName').value = config.shop.currencyName || 'BAG';
      if (config.shop.items && Array.isArray(config.shop.items)) {
        localStorage.setItem('shopItems', JSON.stringify(config.shop.items));
        loadShopItems();
      }
    }

    if (config.actions) {
      document.getElementById('actionsEnabled').checked = config.actions.enabled;
      if (config.actions.commands) {
        localStorage.setItem('actionsConfig', JSON.stringify(config.actions.commands));
        loadActionsConfig();
      } else {
        // Initialize with default enabled state
        const defaultActionsConfig = {};
        actionsList.forEach(action => {
          defaultActionsConfig[action.id] = { enabled: true, rewardMin: 5, rewardMax: 15, karmaMin: 1, karmaMax: 3, messages: [] };
        });
        localStorage.setItem('actionsConfig', JSON.stringify(defaultActionsConfig));
        loadActionsConfig();
      }
    } else {
      // Initialize with default enabled state
      const defaultActionsConfig = {};
      actionsList.forEach(action => {
        defaultActionsConfig[action.id] = { enabled: true, rewardMin: 5, rewardMax: 15, karmaMin: 1, karmaMax: 3, messages: [] };
      });
      localStorage.setItem('actionsConfig', JSON.stringify(defaultActionsConfig));
      loadActionsConfig();
    }

    if (config.economy) {
      document.getElementById('economyEnabled').checked = config.economy.enabled;
      document.getElementById('moneyPerMessage').value = config.economy.moneyPerMessage || 1;
      document.getElementById('xpMinPerMessage').value = config.economy.xpMinPerMessage || 1;
      document.getElementById('xpMaxPerMessage').value = config.economy.xpMaxPerMessage || 5;
      document.getElementById('moneyPerVoiceMinute').value = config.economy.moneyPerVoiceMinute || 2;
      document.getElementById('xpMinPerVoiceMinute').value = config.economy.xpMinPerVoiceMinute || 2;
      document.getElementById('xpMaxPerVoiceMinute').value = config.economy.xpMaxPerVoiceMinute || 10;
    }

    if (config.levelCurve) {
      document.getElementById('levelCurveBase').value = config.levelCurve.base || 100;
      document.getElementById('levelCurveFactor').value = config.levelCurve.factor || 1.2;
    }

    if (config.levelUpChannel) {
      document.getElementById('levelUpChannel').value = config.levelUpChannel || '';
    }

    if (config.fireReset) {
      document.getElementById('fireResetEnabled').checked = config.fireReset.enabled || false;
      document.getElementById('fireResetDay').value       = config.fireReset.day  ?? 1;
      document.getElementById('fireResetHour').value      = config.fireReset.hour ?? 0;
    }

    if (config.rewards) {
      localStorage.setItem('levelRewards', JSON.stringify(config.rewards));
      loadLevelRewards();
    }

    if (config.roleThemes) {
      localStorage.setItem('roleThemes', JSON.stringify(config.roleThemes));
      loadRoleThemes();
    }

    if (config.confession) {
      document.getElementById('confessionEnabled').checked = config.confession.enabled || false;
      document.getElementById('confessionModChannel').value = config.confession.modChannel || '';
      document.getElementById('confessionColor').value = config.confession.color || '#5865f2';
      if (Array.isArray(config.confession.channels)) {
        selectedConfessionChannels = config.confession.channels;
        renderConfessionTags();
        refreshConfessionPicker();
      }
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Save configuration
async function saveConfig() {

  const config = {
    welcome: {
      enabled: document.getElementById('welcomeEnabled').checked,
      title: document.getElementById('welcomeTitle').value,
      message: document.getElementById('welcomeMessage').value,
      color: document.getElementById('welcomeColor').value,
      image: document.getElementById('welcomeImage').value,
      thumbnail: document.getElementById('welcomeThumbnail').value,
      authorName: document.getElementById('welcomeAuthorName').value,
      authorIcon: document.getElementById('welcomeAuthorIcon').value,
      footerText: document.getElementById('welcomeFooterText').value,
      footerIcon: document.getElementById('welcomeFooterIcon').value,
      channel: document.getElementById('welcomeChannel').value,
      role: document.getElementById('welcomeRole').value
    },
    depart: {
      enabled: document.getElementById('departEnabled').checked,
      title: document.getElementById('departTitle').value,
      message: document.getElementById('departMessage').value,
      color: document.getElementById('departColor').value,
      image: document.getElementById('departImage').value,
      thumbnail: document.getElementById('departThumbnail').value,
      authorName: document.getElementById('departAuthorName').value,
      authorIcon: document.getElementById('departAuthorIcon').value,
      footerText: document.getElementById('departFooterText').value,
      footerIcon: document.getElementById('departFooterIcon').value,
      channel: document.getElementById('departChannel').value
    },
    forum: {
      enabled: document.getElementById('forumEnabled').checked,
      channels: selectedForumChannels
    },
    shop: {
      enabled: document.getElementById('shopEnabled').checked,
      channel: document.getElementById('shopChannel').value,
      currencyName: document.getElementById('shopCurrencyName').value || 'BAG',
      items: JSON.parse(localStorage.getItem('shopItems') || '[]')
    },
    actions: {
      enabled: document.getElementById('actionsEnabled').checked,
      commands: JSON.parse(localStorage.getItem('actionsConfig') || '{}')
    },
    economy: {
      enabled: document.getElementById('economyEnabled').checked,
      moneyPerMessage: parseInt(document.getElementById('moneyPerMessage').value) || 1,
      xpMinPerMessage: parseInt(document.getElementById('xpMinPerMessage').value) || 1,
      xpMaxPerMessage: parseInt(document.getElementById('xpMaxPerMessage').value) || 5,
      moneyPerVoiceMinute: parseInt(document.getElementById('moneyPerVoiceMinute').value) || 2,
      xpMinPerVoiceMinute: parseInt(document.getElementById('xpMinPerVoiceMinute').value) || 2,
      xpMaxPerVoiceMinute: parseInt(document.getElementById('xpMaxPerVoiceMinute').value) || 10
    },
    levelCurve: {
      base: parseInt(document.getElementById('levelCurveBase').value) || 100,
      factor: parseFloat(document.getElementById('levelCurveFactor').value) || 1.2
    },
    fireReset: {
      enabled: document.getElementById('fireResetEnabled').checked,
      day:     parseInt(document.getElementById('fireResetDay').value) ?? 1,
      hour:    parseInt(document.getElementById('fireResetHour').value) ?? 0
    },
    levelUpChannel: document.getElementById('levelUpChannel').value || '',
    rewards: JSON.parse(localStorage.getItem('levelRewards') || '{}'),
    roleThemes: JSON.parse(localStorage.getItem('roleThemes') || '{}'),
    confession: {
      enabled:    document.getElementById('confessionEnabled').checked,
      channels:   selectedConfessionChannels,
      modChannel: document.getElementById('confessionModChannel').value || '',
      color:      document.getElementById('confessionColor').value || '#5865f2'
    }
  };
  
  try {
    // Always include guildId so the server can recover if the session was lost
    config._guildId = currentGuildId || localStorage.getItem('selectedGuildId');

    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('✅ Configuration sauvegardée !');
    } else {
      alert('❌ Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    alert('❌ Erreur lors de la sauvegarde');
  }
}

// Event listeners
document.getElementById('saveBtn').addEventListener('click', saveConfig);

// Check auth on page load
checkAuth();
