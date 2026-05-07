let currentModalType = 'welcome';

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
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    const section = item.getAttribute('data-section');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    const tab = document.querySelector(`.tab[data-tab="${section}"]`);
    const tabContent = document.getElementById(`tab-${section}`);
    
    if (tab) tab.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    
    // Update header title
    const titles = {
      'welcome': 'Configuration Bienvenue',
      'depart': 'Configuration Départ',
      'forum': 'Forum Illimité'
    };
    document.getElementById('headerTitle').textContent = titles[section] || 'Dashboard';
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
      document.getElementById('modalImage').value = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Handle thumbnail upload
function handleThumbnailUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('modalThumbnail').value = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Handle author icon upload
function handleAuthorIconUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('modalAuthorIcon').value = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Handle footer icon upload
function handleFooterIconUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('modalFooterIcon').value = e.target.result;
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
    
    const welcomeSelect = document.getElementById('welcomeChannel');
    const departSelect = document.getElementById('departChannel');
    
    welcomeSelect.innerHTML = '<option value="">Sélectionner un salon...</option>';
    departSelect.innerHTML = '<option value="">Sélectionner un salon...</option>';
    
    channels.forEach(channel => {
      const option = `<option value="${channel.id}">${channel.name}</option>`;
      welcomeSelect.innerHTML += option;
      departSelect.innerHTML += option;
    });
  } catch (error) {
    console.error('Error loading channels:', error);
  }
}

// Load forum channels
async function loadForumChannels() {
  try {
    const response = await fetch('/api/channels');
    const channels = await response.json();
    
    console.log('All channels:', channels);
    console.log('Channel types:', channels.map(ch => ({ name: ch.name || 'undefined', type: ch.type, type_name: getChannelTypeName(ch.type) })));
    
    // Filter only forum channels (type 15 in Discord API) - also try type 16 for media channels
    const forumChannels = channels.filter(ch => ch.type === 15 || ch.type === 16);
    
    console.log('Forum channels found:', forumChannels);
    
    const forumChannelsSelect = document.getElementById('forumChannelsSelect');
    
    if (forumChannels.length === 0) {
      // Show all channels for debugging
      const allChannelsList = channels.map(ch => `${ch.name || 'undefined'} (type: ${ch.type})`).join(', ');
      forumChannelsSelect.innerHTML = `<option value="">Aucun salon forum trouvé (types 15 ou 16). Salons: ${allChannelsList}</option>`;
      return;
    }
    
    forumChannelsSelect.innerHTML = '';
    forumChannels.forEach(channel => {
      const option = document.createElement('option');
      option.value = channel.id;
      option.textContent = channel.name || 'Sans nom';
      forumChannelsSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading forum channels:', error);
    document.getElementById('forumChannelsSelect').innerHTML = '<option value="">Erreur lors du chargement des salons.</option>';
  }
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
      // Load selected forum channels after the select is populated
      setTimeout(() => {
        const forumChannelsSelect = document.getElementById('forumChannelsSelect');
        if (config.forum.channels && Array.isArray(config.forum.channels)) {
          Array.from(forumChannelsSelect.options).forEach(option => {
            option.selected = config.forum.channels.includes(option.value);
          });
        }
      }, 500);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Save configuration
async function saveConfig() {
  // Get selected forum channels
  const forumChannelsSelect = document.getElementById('forumChannelsSelect');
  const selectedForumChannels = Array.from(forumChannelsSelect.selectedOptions).map(option => option.value);

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
      channel: document.getElementById('welcomeChannel').value
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
    }
  };
  
  try {
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
