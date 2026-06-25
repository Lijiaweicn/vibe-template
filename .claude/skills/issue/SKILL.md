---
name: issue
description: 需求捕获 — 快速记录需求到 docs/issue/
---

# /issue — 需求捕获

## When to Use

- 开发中突然想到的需求
- 用户提出的零散想法
- 任何不想立即开发但不想丢失的点子
- 用户说"记录一下"、"先记下来"

## When NOT to Use

- 想立即开发 → 用 `/dev`
- 修复 bug → 用 `/fix`
- 只是想讨论想法 → 直接对话，不需要文件记录

## 命令格式

```
/issue                          ← 手动输入需求
/issue 需求简要描述             ← 带描述的手动输入
```

## 用途

快速捕获需求想法到 `docs/issue/`，不启动开发流程。适合：

- 开发中突然想到的需求
- 用户提出的零散想法
- 任何不想立即开发但不想丢失的点子

## 文件命名

有明确需求编号时：

```
{需求编号}-{中文描述}.md
```

无明确需求编号时：

```
issue-{MMDD}{序号}-{中文描述}.md
```

- `MMDD`：创建日期（月日）
- `{序号}`：同一天内的序号（2位，从01开始）
- `{中文描述}`：语义化的中文描述

**示例：**

- `PROJ-123-消息通知图标.md`（有明确编号）
- `issue-062305-请求错误处理.md`（自动生成）
- `issue-062301-消息通知图标.md`（自动生成）

## Frontmatter

```yaml
---
id: issue-062301
title: 导航栏消息通知功能
priority: medium
status: open
tags: [导航栏, 消息通知]
keywords: [未读数量, 通知图标]
summary: |
  在导航栏添加消息通知图标，
  支持未读消息数量显示和点击跳转
---
```

**字段说明：**

- `id`：需求编号。有明确需求编号时直接使用（如项目管理系统编号）；无明确编号时自动生成 `issue-{MMDD}{序号}`
- `priority`：high / medium / low
- `status`：open / dev / archive / spec
- `tags`：业务分类标签
- `keywords`：搜索关键词
- `summary`：一句话摘要（放最后，因为内容较长）

## Issue 文件模板

```markdown
---
id: issue-062301
title: 需求标题
priority: medium
status: open
tags: []
keywords: []
summary: |
  一句话描述需求的核心内容
---

# 需求标题

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
   - 用户提供了明确需求编号（如项目管理系统编号）→ 直接用作 id 和文件名前缀
   - 无明确编号 → 自动生成：获取当前日期（MMDD），扫描 `docs/issue/` 现有文件，找到同一天的最大序号 + 1，格式 `issue-{MMDD}{序号}`
4. 生成中文描述（从标题提取关键词）
5. 根据需求描述自动推断 tags 和 keywords（用户可修改）
6. 生成 summary（一句话摘要）
7. 创建 issue 文件
8. 更新 `docs/issue/README.md` 索引
9. 向用户确认创建成功

### 索引维护

`docs/issue/README.md` 按优先级分组：

```markdown
# 需求待办

## High

- [ ] [issue-062305](issue-062305-请求错误处理.md) — request 内部错误处理优化

## Medium

- [ ] [issue-062301](issue-062301-消息通知图标.md) — 导航栏消息通知

## Low

- [ ] [issue-062203](issue-062203-文案系统.md) — 文案系统设计
```

当 issue 状态变为 `dev` 时，从索引中移除（由 `/dev` skill 处理）。

## Verification

完成的证据：

- [ ] issue 文件已创建，frontmatter 字段完整
- [ ] `docs/issue/README.md` 索引已更新
- [ ] 用户确认创建成功
