module.exports = {
  apps: [
    {
      name: 'bagbot-dashboard',
      script: './src/dashboard.js',
      cwd: '/home/maison/bagbot',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 49501
      }
    },
    {
      name: 'bagbot',
      script: './src/bot.js',
      cwd: '/home/maison/bagbot',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
