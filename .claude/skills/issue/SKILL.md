---
name: issue
description: 需求捕获 — 快速记录需求到 docs/issue/
---

# /issue — 需求捕获

## 命令格式

```
/issue                          ← 手动输入需求
/issue 需求简要描述             ← 带描述的手动输入
/issue --from-branch            ← 从当前 git 分支名提取需求信息
```

## 用途

快速捕获需求想法到 `docs/issue/`，不启动开发流程。适合：

- 开发中突然想到的需求
- 用户提出的零散想法
- 任何不想立即开发但不想丢失的点子
- 从当前开发分支提取需求信息（`--from-branch`）

## Issue 文件模板

```
docs/issue/
├── README.md                   ← 索引（自动维护）
├── REQ-001-功能描述.md         ← 带需求编号（无 issue- 前缀）
├── issue-001-功能描述.md       ← 自增编号（有 issue- 前缀）
└── ...
```

**issue 文件**：

```markdown
---
id: {id}  # 带需求编号：REQ-001；自增编号：issue-001
title: 需求标题
priority: high | medium | low
created: YYYY-MM-DD
tags: []  # 可选，如：[用户管理, 登录]
keywords: []  # 可选，如：[认证, 安全, OAuth]
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

**手动模式**（默认）：

1. 如果命令带了描述，直接用作需求标题；否则询问用户
2. 询问或推断 priority（默认 medium）
3. 确定 issue ID：
   - 用户提供了需求编号 → 直接使用
   - 未提供 → 扫描 `docs/issue/` 现有文件，取最大编号 + 1
4. 根据需求描述自动推断 tags 和 keywords（用户可修改）
5. 创建 issue 文件
6. 更新 `docs/issue/README.md` 索引，追加条目
7. 向用户确认创建成功

**分支提取模式**（`--from-branch`）：

1. 获取当前 git 分支名
2. 解析分支名，提取需求编号和标题（常见格式：`feature/REQ-001-用户登录`、`feat/issue-001-用户登录`、`fix/BUG-001-登录失败`）
3. 向用户展示解析结果，确认是否正确
4. 确认后创建 issue 文件，使用解析出的需求编号作为 ID
5. 更新 `docs/issue/README.md` 索引
6. 向用户确认创建成功

### ID 规则

**带需求编号**（用户提供了需求编号，如 `REQ-001`、`需求-42`）：
- 直接使用需求编号作为 issue ID
- 文件名：`{需求编号}-{kebab-case-slug}.md`
- 示例：`REQ-001-用户登录.md`

**不带需求编号**（用户只描述需求，未提供编号）：
- 自动分配自增编号，格式：`issue-{三位数字}`
- 扫描 `docs/issue/` 现有文件，取最大编号 + 1
- 文件名：`issue-{id}-{kebab-case-slug}.md`
- 示例：`issue-001-用户登录.md`
