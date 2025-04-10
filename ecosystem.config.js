module.exports = {
  apps: [
    {
      name: 'puppeteer-service',
      script: './dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 6102
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 6102
      }
    }
  ]
}; 