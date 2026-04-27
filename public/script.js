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
  const imageUrl = document.getElementById('welcomeImage').value;
  
  document.getElementById('welcomeEmbedTitle').textContent = title;
  document.getElementById('welcomeEmbedDescription').textContent = description;
  
  const imageElement = document.getElementById('welcomeEmbedImage');
  if (imageUrl) {
    imageElement.src = imageUrl;
    imageElement.style.display = 'block';
  } else {
    imageElement.style.display = 'none';
  }
}

// Update depart embed preview
function updateDepartEmbed() {
  const title = document.getElementById('departTitle').value;
  const description = document.getElementById('departMessage').value;
  const imageUrl = document.getElementById('departImage').value;
  
  document.getElementById('departEmbedTitle').textContent = title;
  document.getElementById('departEmbedDescription').textContent = description;
  
  const imageElement = document.getElementById('departEmbedImage');
  if (imageUrl) {
    imageElement.src = imageUrl;
    imageElement.style.display = 'block';
  } else {
    imageElement.style.display = 'none';
  }
}

// Edit welcome embed (focus on inputs)
function editWelcomeEmbed() {
  document.getElementById('welcomeTitle').focus();
}

// Edit depart embed (focus on inputs)
function editDepartEmbed() {
  document.getElementById('departTitle').focus();
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
      document.getElementById('welcomeImage').value = config.welcome.image || '';
      document.getElementById('welcomeChannel').value = config.welcome.channel || '';
      updateWelcomeEmbed();
    }
    
    if (config.depart) {
      document.getElementById('departEnabled').checked = config.depart.enabled;
      document.getElementById('departTitle').value = config.depart.title || '👋 Au revoir';
      document.getElementById('departMessage').value = config.depart.message || 'Au revoir {user} !';
      document.getElementById('departImage').value = config.depart.image || '';
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
      image: document.getElementById('welcomeImage').value,
      channel: document.getElementById('welcomeChannel').value
    },
    depart: {
      enabled: document.getElementById('departEnabled').checked,
      title: document.getElementById('departTitle').value,
      message: document.getElementById('departMessage').value,
      image: document.getElementById('departImage').value,
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

// Load config on page load
loadConfig();
