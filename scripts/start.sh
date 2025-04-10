#!/bin/bash

# 确保脚本在错误时退出
set -e

# 显示执行的命令
set -x

# 切换到项目根目录
cd "$(dirname "$0")/.."

# 安装依赖
npm install --verbose

# 编译 TypeScript
npm run build

# 使用 PM2 启动服务
# 如果是生产环境，添加 --env production
# if [ "$NODE_ENV" = "production" ]; then
  npx pm2 start ecosystem.config.js --env production
# else
#   npx pm2 start ecosystem.config.js
# fi

# 显示运行状态
npx pm2 status 