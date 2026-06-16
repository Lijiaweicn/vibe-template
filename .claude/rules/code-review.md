---
paths:
  - "src/**/*"
  - "!**/*.test.{js,ts}"
  - "!**/*.spec.{js,ts}"
---

> 完整清单见 [docs/spec/project.md](../../docs/spec/project.md) 第七章，本文为自动加载的精简版。

# Code Review 清单（AI 自检）

**所有项必须标记 `[x]` 才能交付。**

- [ ] models 是纯函数（无 `this`、无响应式 API、无客户判断）
- [ ] 常量使用 `createDict` 工厂
- [ ] formData 只含后端字段，UI 状态放在 formContext
- [ ] 视图模板无复杂表达式（如 `v-if="a && b"`）
- [ ] 视图模板无可选链防御链（如 `data?.xxx`）
- [ ] services 返回纯对象（不含 `ref`/`reactive`）
- [ ] 跨领域数据通过 `context` 传入，未直接 import 其他领域的 services
- [ ] 样式使用 scoped CSS 或 CSS Modules
- [ ] 视图层无超过3层的条件类型/嵌套映射类型
- [ ] 不确定类型时用 `unknown` 而非 `any`
- [ ] P0 逻辑（canSave、uiContext 等）有参数化单元测试

**如任一项不通过，修复后再交付。**
