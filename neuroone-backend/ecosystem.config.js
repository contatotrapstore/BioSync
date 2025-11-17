// PM2 Ecosystem Configuration for NeuroOne Backend
// Deploy to VPS: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      // Application name
      name: 'neuroone-backend',

      // Script to run
      script: 'src/server.js',

      // Instances (cluster mode)
      instances: 2, // Run 2 instances for load balancing
      exec_mode: 'cluster', // Cluster mode for better performance

      // Auto-restart configuration
      autorestart: true,
      watch: false, // Don't watch files in production
      max_memory_restart: '1G', // Restart if memory exceeds 1GB

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Logging
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,

      // Merge logs from different instances
      merge_logs: true,

      // Restart delay
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Health check
      // PM2 will check if app is alive
      wait_ready: false,
    },
  ],

  deploy: {
    production: {
      // SSH connection
      user: 'deployer',
      host: 'your-server-ip',
      ref: 'origin/master',
      repo: 'git@github.com:your-username/neuroone.git',
      path: '/var/www/neuroone-backend',

      // Post-deploy commands
      'post-deploy':
        'npm install && pm2 reload ecosystem.config.js --env production',

      // Pre-setup commands
      'pre-setup': 'apt-get install git',
    },
  },
};
