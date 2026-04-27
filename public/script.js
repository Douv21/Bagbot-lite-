let currentModalType = 'welcome';

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

// Update welcome embed preview
function updateWelcomeEmbed() {
  const title = document.getElementById('welcomeTitle').value;
  const description = document.getElementById('welcomeMessage').value;
  const color = document.getElementById('welcomeColor').value;
  const imageUrl = document.getElementById('welcomeImage').value;
  const thumbnailUrl = document.getElementById('welcomeThumbnail').value;
  const authorName = document.getElementById('welcomeAuthorName').value;
  const authorIcon = document.getElementById('welcomeAuthorIcon').value;
  const footerText = document.getElementById('welcomeFooterText').value;
  const footerIcon = document.getElementById('welcomeFooterIcon').value;
  
  document.getElementById('welcomeEmbedTitle').textContent = title;
  document.getElementById('welcomeEmbedDescription').textContent = description;
  document.getElementById('welcomeEmbedPreview').style.borderLeftColor = color;
  
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
    document.getElementById('welcomeEmbedAuthorName').textContent = authorName;
    document.getElementById('welcomeEmbedAuthorIcon').src = authorIcon;
    authorElement.style.display = 'flex';
  } else {
    authorElement.style.display = 'none';
  }
  
  // Footer
  const footerElement = document.getElementById('welcomeEmbedFooter');
  if (footerText || footerIcon) {
    document.getElementById('welcomeEmbedFooterText').textContent = footerText;
    document.getElementById('welcomeEmbedFooterIcon').src = footerIcon;
    footerElement.style.display = 'flex';
  } else {
    footerElement.style.display = 'none';
  }
}

// Update depart embed preview
function updateDepartEmbed() {
  const title = document.getElementById('departTitle').value;
  const description = document.getElementById('departMessage').value;
  const color = document.getElementById('departColor').value;
  const imageUrl = document.getElementById('departImage').value;
  const thumbnailUrl = document.getElementById('departThumbnail').value;
  const authorName = document.getElementById('departAuthorName').value;
  const authorIcon = document.getElementById('departAuthorIcon').value;
  const footerText = document.getElementById('departFooterText').value;
  const footerIcon = document.getElementById('departFooterIcon').value;
  
  document.getElementById('departEmbedTitle').textContent = title;
  document.getElementById('departEmbedDescription').textContent = description;
  document.getElementById('departEmbedPreview').style.borderLeftColor = color;
  
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
    document.getElementById('departEmbedAuthorName').textContent = authorName;
    document.getElementById('departEmbedAuthorIcon').src = authorIcon;
    authorElement.style.display = 'flex';
  } else {
    authorElement.style.display = 'none';
  }
  
  // Footer
  const footerElement = document.getElementById('departEmbedFooter');
  if (footerText || footerIcon) {
    document.getElementById('departEmbedFooterText').textContent = footerText;
    document.getElementById('departEmbedFooterIcon').src = footerIcon;
    footerElement.style.display = 'flex';
  } else {
    footerElement.style.display = 'none';
  }
}

// Open image modal
function openImageModal(type) {
  currentModalType = type;
  document.getElementById('imageModal').style.display = 'flex';
  
  // Load current values
  if (type === 'welcome') {
    document.getElementById('modalThumbnail').value = document.getElementById('welcomeThumbnail').value;
    document.getElementById('modalImage').value = document.getElementById('welcomeImage').value;
    document.getElementById('modalAuthorIcon').value = document.getElementById('welcomeAuthorIcon').value;
    document.getElementById('modalFooterIcon').value = document.getElementById('welcomeFooterIcon').value;
  } else {
    document.getElementById('modalThumbnail').value = document.getElementById('departThumbnail').value;
    document.getElementById('modalImage').value = document.getElementById('departImage').value;
    document.getElementById('modalAuthorIcon').value = document.getElementById('departAuthorIcon').value;
    document.getElementById('modalFooterIcon').value = document.getElementById('departFooterIcon').value;
  }
}

// Close image modal
function closeImageModal() {
  document.getElementById('imageModal').style.display = 'none';
}

// Save image modal
function saveImageModal() {
  if (currentModalType === 'welcome') {
    document.getElementById('welcomeThumbnail').value = document.getElementById('modalThumbnail').value;
    document.getElementById('welcomeImage').value = document.getElementById('modalImage').value;
    document.getElementById('welcomeAuthorIcon').value = document.getElementById('modalAuthorIcon').value;
    document.getElementById('welcomeFooterIcon').value = document.getElementById('modalFooterIcon').value;
    updateWelcomeEmbed();
  } else {
    document.getElementById('departThumbnail').value = document.getElementById('modalThumbnail').value;
    document.getElementById('departImage').value = document.getElementById('modalImage').value;
    document.getElementById('departAuthorIcon').value = document.getElementById('modalAuthorIcon').value;
    document.getElementById('departFooterIcon').value = document.getElementById('modalFooterIcon').value;
    updateDepartEmbed();
  }
  closeImageModal();
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

// Load config and channels on page load
loadConfig();
loadChannels();
