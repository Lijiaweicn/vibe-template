---
name: issue
description: 需求捕获 — 快速记录需求到 docs/issue/
---

# /issue — 需求捕获

## 命令格式

```
/issue
/issue 需求简要描述
```

## 用途

快速捕获需求想法到 `docs/issue/`，不启动开发流程。适合：

- 开发中突然想到的需求
- 用户提出的零散想法
- 任何不想立即开发但不想丢失的点子

## Issue 文件模板

```
docs/issue/
├── README.md                   ← 索引（自动维护）
├── issue-REQ-001-功能描述.md   ← 带需求编号的 issue
├── issue-001-功能描述.md       ← 自增编号的 issue
└── ...
```

**issue 文件**：

```markdown
---
id: issue-{id}
title: 需求标题
priority: high | medium | low
created: YYYY-MM-DD
---

# {需求标题}

## 背景

为什么需要这个功能（可选）

## 需求描述

具体要做什么

## 验收标准

- [ ] 标准 1
- [ ] 标准 2
```

## 流程

### 捕获

1. 如果命令带了描述，直接用作需求标题；否则询问用户
2. 询问或推断 priority（默认 medium）
3. 确定 issue ID：
   - 用户提供了需求编号 → 直接使用
   - 未提供 → 扫描 `docs/issue/` 现有文件，取最大编号 + 1
4. 创建 issue 文件 `docs/issue/issue-{id}-{slug}.md`
5. 更新 `docs/issue/README.md` 索引，在「待办」区追加条目
6. 向用户确认创建成功

### ID 规则

**带需求编号**（用户提供了需求编号，如 `REQ-001`、`需求-42`）：
- 直接使用需求编号作为 issue ID
- 文件名：`issue-{需求编号}-{kebab-case-slug}.md`
- 示例：`issue-REQ-001-用户登录.md`

**不带需求编号**（用户只描述需求，未提供编号）：
- 自动分配自增编号，格式：`issue-{三位数字}`
- 扫描 `docs/issue/` 现有文件，取最大编号 + 1
- 文件名：`issue-{id}-{kebab-case-slug}.md`
- 示例：`issue-001-用户登录.md`
