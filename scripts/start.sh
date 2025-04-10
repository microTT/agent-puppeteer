#!/bin/bash

# 构建应用
echo "Building application..."
npm run build

# 启动应用
echo "Starting application..."
npx pm2 start ecosystem.config.js

echo "Application started successfully!" 