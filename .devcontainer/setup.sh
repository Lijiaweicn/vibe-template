#!/bin/bash
# .devcontainer/setup.sh

echo "⚡ 开始配置前端 AI 沙箱环境..."

# 1. 挂载国内源并安装 pnpm
npm config set registry https://registry.npmmirror.com
npm install -g pnpm

# 2. 安装 Claude Code 官方工具
curl -fsSL https://claude.ai/install.sh | bash

# 3. 注入全局 Git 安全拦截
git config --global alias.push '!echo "[🔒 安全拦截] 容器内禁止 Git Push！" && false'

echo "🎉 沙箱环境初始化成功！"