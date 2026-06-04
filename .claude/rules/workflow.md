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

## Code Review 清单（AI 自检）

在交付前，检查以下项目：

- [ ] models 是否纯函数？（无 this、无响应式 API）
- [ ] 常量是否收拢到 `constants.ts` 并加了 `as const`？
- [ ] 表单场景：`formData` 是否不含 UI 交互属性？（UI 属性应放 `uiContext`）
- [ ] 视图模板：是否有 `v-if="a && b"` 或 `data?.xxx?.yyy` 防御链？

**如任一项不通过，修复后再交付。**
