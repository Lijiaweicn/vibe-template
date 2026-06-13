---
paths:
  - "**/*"
---

# Code Review 清单（AI 自检）

**所有项必须标记 `[x]` 才能交付。**

- [ ] models 是纯函数（无 `this`、无响应式 API）
- [ ] 常量已收拢到 `constants.ts` 并加了 `as const`
- [ ] 表单场景：`formData` 不含 UI 属性（UI 属性已放 `uiContext`）
- [ ] 视图模板：无复杂表达式（如 `v-if="a && b"`）
- [ ] 视图模板：无可选链防御链（如 `data?.xxx`）

**如任一项不通过，修复后再交付。**
