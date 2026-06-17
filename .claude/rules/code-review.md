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

## Import 与清理专项

- [ ] 视图层的 `domains` 导入均来自 `index.js`，未直接引用 `models.js`/`apis.js` 等内部文件
- [ ] 所有 import 的方法/变量在源文件中确实存在（已确认 export）
- [ ] 无重复 import（同一方法只导入一次）
- [ ] 本次修改未产生未使用的 import（新增的 import 都在模板或脚本中被引用）
- [ ] 删除模板元素后，对应的事件处理函数已同步清理
- [ ] 重构/删除功能后，独占的 import 已同步移除

**如任一项不通过，修复后再交付。**
