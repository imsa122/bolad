// PM2 Ecosystem Configuration
// Usage: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name: 'real-estate-platform',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/real-estate-platform',
      instances: 'max',          // Use all CPU cores
      exec_mode: 'cluster',      // Cluster mode for load balancing
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      log_file: '/var/log/pm2/real-estate-combined.log',
      out_file: '/var/log/pm2/real-estate-out.log',
      error_file: '/var/log/pm2/real-estate-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Restart policy
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'YOUR_VPS_IP',
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_USERNAME/real-estate-platform.git',
      path: '/var/www/real-estate-platform',
      'pre-deploy-local': '',
      'post-deploy':
        'npm install && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      ssh_options: 'StrictHostKeyChecking=no',
    },
  },
};
