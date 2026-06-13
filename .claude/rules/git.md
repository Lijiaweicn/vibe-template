---
paths:
  - "**/*"
---

# 工作流规范

## Git 提交规范

**格式**：`<type>(需求编号): <subject>`

- type: `feat`/`fix`/`refactor`/`test`
- scope: 需求编号（从分支名提取，如 `REQ-8894`）
- subject: 中文动宾结构，多需求用「及」连接

**示例**：`feat(REQ-8894): 建立价格校验模型及开发大客户显隐控制`

## 行为红线

1. **允许**：阶段性多次 commit，测试全绿后打包提交
2. **禁止**：AI 擅自执行 `git push`（必须由人类审查后手动推送）
3. **禁止**：AI 擅自 `git push --force`
