#!/bin/bash

# 确保脚本在错误时退出
set -e

# 显示执行的命令
set -x

# 切换到项目根目录
cd "$(dirname "$0")/.."

# 停止服务
npx pm2 stop puppeteer-service

# 删除服务
npx pm2 delete puppeteer-service

# 显示运行状态
npx pm2 status 