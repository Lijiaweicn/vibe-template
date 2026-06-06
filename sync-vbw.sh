#!/bin/bash
# 同步 vbw 到当前项目
# 用法：./sync-vbw.sh [源目录]

SOURCE_DIR="${1:-$(cd "$(dirname "$0")" && pwd)}"
TARGET_DIR=".claude"

if [ ! -d "$SOURCE_DIR/.claude" ]; then
    echo "错误：找不到源目录 $SOURCE_DIR/.claude"
    exit 1
fi

mkdir -p "$TARGET_DIR/rules" "$TARGET_DIR/skills"
cp "$SOURCE_DIR/.claude/rules/plan.md" "$TARGET_DIR/rules/"
cp "$SOURCE_DIR/.claude/skills/vbp-create.md" "$TARGET_DIR/skills/"
cp "$SOURCE_DIR/.claude/skills/vbp-execute.md" "$TARGET_DIR/skills/"
cp "$SOURCE_DIR/.claude/skills/vbp-archive.md" "$TARGET_DIR/skills/"

echo "vbw 已同步到 $TARGET_DIR/"
