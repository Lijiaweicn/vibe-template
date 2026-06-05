# 执行任务工作流

基于 plans 目录下的计划文档驱动本地开发流程。

## 触发条件

输入路径包含 `plans` 时自动触发

## 模式

- **有 superpowers**：可调用 `superpowers:using-git-worktrees`（隔离工作空间）、`superpowers:finishing-a-development-branch`（完成验证）
- **无 superpowers**：使用 vbw 内置逻辑

## 流程

### 1. 准备分支

从计划文档路径提取需求编号和任务名，创建本地分支：
- 多任务：`docs/plans/UAC-123/01-用户列表.md` → `local/UAC-123-01-用户列表`
- 单任务：`docs/plans/UAC-123/README.md` → `local/UAC-123`

### 2. 执行任务

1. 读取计划文档，在 local 分支上完善内容
2. 按要求开发，可任意 `git commit`（存档点：`WIP: <简述>`）
3. **禁止推送 local 分支到 remote**

### 3. 验收

开发完成后通知用户验收，通过后继续；有问题则继续修复。

### 4. 完成合并

```bash
git checkout feature/<需求编号>-xxx
git merge --squash local/<需求编号>-<任务名>
git commit -m "feat(<需求编号>): <任务汇总>"
git branch -D local/<需求编号>-<任务名>
```

### 5. 更新状态

- 计划文档：标记 `- [x] 已完成`，追加变更文件表格
- README.md：更新计划分解表格状态为 ✅ 完成

### 6. 需求总结（所有 plan 完成后）

检查 README.md，所有计划都完成后：
1. 追加完成总结和变更文件汇总
2. 生成 PR commit 信息草稿供用户调整
3. 确认后执行 `git commit`

## 异常处理

- **中途中断**：保留 local 分支，下次继续
- **合并冲突**：手动解决后 `git add` + `git commit`
