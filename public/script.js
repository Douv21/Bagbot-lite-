let currentModalType = 'welcome';

// Check authentication on page load
async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    
    if (data.authenticated) {
      // Show user info
      document.getElementById('userInfo').style.display = 'flex';
      document.getElementById('loginSection').style.display = 'none';
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
        document.getElementById('configContent').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
        loadConfig();
        loadChannels();
      } else {
        document.getElementById('guildSelector').style.display = 'block';
        document.getElementById('configContent').style.display = 'none';
        document.getElementById('mainContent').style.display = 'none';
      }
    } else {
      // Show login button
      document.getElementById('userInfo').style.display = 'none';
      document.getElementById('loginSection').style.display = 'block';
      document.getElementById('guildSelector').style.display = 'none';
      document.getElementById('configContent').style.display = 'none';
      document.getElementById('mainContent').style.display = 'block';
    }
  } catch (error) {
    console.error('Error checking auth:', error);
  }
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
      document.getElementById('configContent').style.display = 'block';
      document.getElementById('mainContent').style.display = 'none';
      document.getElementById('guildSelector').style.display = 'none';
      loadConfig();
      loadChannels();
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
  
  document.getElementById('welcomeEmbedTitle').textContent = replaceVariables(title, user, guild);
  document.getElementById('welcomeEmbedDescription').textContent = replaceVariables(description, user, guild);
  document.getElementById('welcomeEmbedPreview').style.borderLeftColor = color;
  
  // Guild icon
  const guildIconElement = document.getElementById('welcomeGuildIcon');
  if (guild && guild.icon) {
    guildIconElement.style.backgroundImage = `url(https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png)`;
    guildIconElement.style.display = 'block';
  } else {
    guildIconElement.style.display = 'none';
  }
  
  // Image
  const imageElement = document.getElementById('welcomeEmbedImage');
  if (imageUrl) {
    imageElement.src = imageUrl;
    imageElement.style.display = 'block';
  } else {
    imageElement.style.display = 'none';
  }
  
  // Thumbnail
  const thumbnailElement = document.getElementById('welcomeEmbedThumbnail');
  if (thumbnailUrl) {
    thumbnailElement.querySelector('img').src = thumbnailUrl;
    thumbnailElement.style.display = 'block';
  } else {
    thumbnailElement.style.display = 'none';
  }
  
  // Author
  const authorElement = document.getElementById('welcomeEmbedAuthor');
  if (authorName || authorIcon) {
    document.getElementById('welcomeEmbedAuthorName').textContent = replaceVariables(authorName, user, guild);
    document.getElementById('welcomeEmbedAuthorIcon').src = authorIcon;
    authorElement.style.display = 'flex';
  } else {
    authorElement.style.display = 'none';
  }
  
  // Footer
  const footerElement = document.getElementById('welcomeEmbedFooter');
  if (footerText || footerIcon) {
    document.getElementById('welcomeEmbedFooterText').textContent = replaceVariables(footerText, user, guild);
    const footerIconImg = document.getElementById('welcomeEmbedFooterIcon');
    if (footerIcon) {
      footerIconImg.src = footerIcon;
      footerIconImg.style.display = 'inline';
    } else {
      footerIconImg.style.display = 'none';
    }
    footerElement.style.display = 'flex';
  } else {
    footerElement.style.display = 'none';
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
  
  document.getElementById('departEmbedTitle').textContent = replaceVariables(title, user, guild);
  document.getElementById('departEmbedDescription').textContent = replaceVariables(description, user, guild);
  document.getElementById('departEmbedPreview').style.borderLeftColor = color;
  
  // Guild icon
  const guildIconElement = document.getElementById('departGuildIcon');
  if (guild && guild.icon) {
    guildIconElement.style.backgroundImage = `url(https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png)`;
    guildIconElement.style.display = 'block';
  } else {
    guildIconElement.style.display = 'none';
  }
  
  // Image
  const imageElement = document.getElementById('departEmbedImage');
  if (imageUrl) {
    imageElement.src = imageUrl;
    imageElement.style.display = 'block';
  } else {
    imageElement.style.display = 'none';
  }
  
  // Thumbnail
  const thumbnailElement = document.getElementById('departEmbedThumbnail');
  if (thumbnailUrl) {
    thumbnailElement.querySelector('img').src = thumbnailUrl;
    thumbnailElement.style.display = 'block';
  } else {
    thumbnailElement.style.display = 'none';
  }
  
  // Author
  const authorElement = document.getElementById('departEmbedAuthor');
  if (authorName || authorIcon) {
    document.getElementById('departEmbedAuthorName').textContent = replaceVariables(authorName, user, guild);
    document.getElementById('departEmbedAuthorIcon').src = authorIcon;
    authorElement.style.display = 'flex';
  } else {
    authorElement.style.display = 'none';
  }
  
  // Footer
  const footerElement = document.getElementById('departEmbedFooter');
  if (footerText || footerIcon) {
    document.getElementById('departEmbedFooterText').textContent = replaceVariables(footerText, user, guild);
    const footerIconImg = document.getElementById('departEmbedFooterIcon');
    if (footerIcon) {
      footerIconImg.src = footerIcon;
      footerIconImg.style.display = 'inline';
    } else {
      footerIconImg.style.display = 'none';
    }
    footerElement.style.display = 'flex';
  } else {
    footerElement.style.display = 'none';
  }
}

// Modal functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
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
    ? document.getElementById('welcomeFooterText').value 
    : document.getElementById('departFooterText').value;
  document.getElementById('modalFooterIcon').value = type === 'welcome' 
    ? document.getElementById('welcomeFooterIcon').value 
    : document.getElementById('departFooterIcon').value;
  openModal('footerModal');
}

function saveFooterModal() {
  if (currentModalType === 'welcome') {
    document.getElementById('welcomeFooterText').value = document.getElementById('modalFooterText').value;
    document.getElementById('welcomeFooterIcon').value = document.getElementById('modalFooterIcon').value;
    updateWelcomeEmbed();
  } else {
    document.getElementById('departFooterText').value = document.getElementById('modalFooterText').value;
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
    
    channels.forEach(channel => {
      const option1 = document.createElement('option');
      option1.value = channel.id;
      option1.textContent = channel.name;
      welcomeSelect.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = channel.id;
      option2.textContent = channel.name;
      departSelect.appendChild(option2);
    });
  } catch (error) {
    console.error('Error loading channels:', error);
  }
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
