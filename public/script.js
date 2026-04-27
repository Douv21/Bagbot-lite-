// Load configuration on page load
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    
    if (config.welcome) {
      document.getElementById('welcomeEnabled').checked = config.welcome.enabled;
      document.getElementById('welcomeMessage').value = config.welcome.message;
      document.getElementById('welcomeChannel').value = config.welcome.channel;
    }
    
    if (config.depart) {
      document.getElementById('departEnabled').checked = config.depart.enabled;
      document.getElementById('departMessage').value = config.depart.message;
      document.getElementById('departChannel').value = config.depart.channel;
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
      message: document.getElementById('welcomeMessage').value,
      channel: document.getElementById('welcomeChannel').value
    },
    depart: {
      enabled: document.getElementById('departEnabled').checked,
      message: document.getElementById('departMessage').value,
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
