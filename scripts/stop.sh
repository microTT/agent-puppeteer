#!/bin/bash

# 停止应用
echo "Stopping application..."
npx pm2 stop agent-puppeteer

echo "Application stopped successfully!" 