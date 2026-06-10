#!/bin/bash
# vbw-init.sh - 初始化 VBW 工作目录和模板文件
# 用法: vbw-init.sh [--quick] [分支名]
# 示例: vbw-init.sh feature/UAC-123-用户管理
#        vbw-init.sh --quick feature/UAC-123-用户管理

set -e

QUICK=false
BRANCH=""

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      QUICK=true
      shift
      ;;
    *)
      BRANCH="$1"
      shift
      ;;
  esac
done

# 如果未传入分支名，尝试从 git 获取
if [ -z "$BRANCH" ]; then
  BRANCH=$(git branch --show-current 2>/dev/null)
  if [ -z "$BRANCH" ]; then
    echo "错误: 无法获取当前分支名，请手动传入"
    echo "用法: vbw-init.sh [--quick] <分支名>"
    exit 1
  fi
fi

# 提取需求标识：去掉 feature/、fix/、hotfix/ 等前缀
REQ_ID=$(echo "$BRANCH" | sed 's|^feature/||;s|^fix/||;s|^hotfix/||;s|^release/||')

if [ -z "$REQ_ID" ]; then
  echo "错误: 无法从分支名提取需求标识: $BRANCH"
  exit 1
fi

# 创建目录
DOCS_DIR="docs/${REQ_ID}"

if [ -d "$DOCS_DIR" ]; then
  echo "目录已存在: $DOCS_DIR"
  echo "如需重新初始化，请先删除该目录"
  exit 1
fi

mkdir -p "$DOCS_DIR"

# 生成 README.md（使用变量展开的 heredoc，避免 sed 兼容性问题）
cat > "${DOCS_DIR}/README.md" << READMEEOF
# ${REQ_ID}

## 概览
<!-- 一句话描述本次需求的目标 -->

## 需求资源
- [需求文档](prd.md)

## 任务列表
<!-- < 3 个任务：直接在此编写任务内容 -->
<!-- >= 3 个任务：用引用格式 -->
<!-- - [task-1-xxx](task-1-xxx.md) -->

## 总结
<!-- 开发完成后填写成果提炼 -->
READMEEOF

# 快速通道模式：调整 README 模板
if [ "$QUICK" = true ]; then
  cat > "${DOCS_DIR}/README.md" << READMEEOF
# ${REQ_ID}

## 概览
<!-- 一句话描述本次需求的目标 -->

## 需求描述
<!-- 简要背景和具体内容 -->

## 任务列表
<!-- 内联任务，每个任务用 ### 标题 + Todo 列表 -->
<!-- ### 任务1：任务目标 -->
<!-- - [ ] 步骤1 -->
<!-- - [ ] 步骤2 -->

## 总结
<!-- 开发完成后填写成果提炼 -->
READMEEOF
else
  # 完整模式：生成 prd.md
  cat > "${DOCS_DIR}/prd.md" << 'PRDEOF'
# 需求文档

## 需求背景
<!-- 为什么要做这个需求 -->

## 需求描述
<!-- 具体要做什么 -->

## 需求链接
<!-- 相关链接、设计稿、接口文档等 -->
PRDEOF
fi

echo "VBW 目录已创建: ${DOCS_DIR}/"
echo "模式: $([ "$QUICK" = true ] && echo "快速通道" || echo "完整流程")"
echo "文件:"
ls -1 "${DOCS_DIR}/"
