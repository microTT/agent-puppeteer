module.exports = {
  apps: [
    {
      name: 'agent-puppeteer',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 6102',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}; 