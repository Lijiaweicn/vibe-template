---
paths:
  - "**/views/**/*.vue"
  - "**/components/**/*.vue"
---

> 完整规范见 [docs/spec/project.md](../../docs/spec/project.md) 第六、七章，本文为自动加载的精简版。

# 视图层规范（精简版）

## 组件存放路径

| 复用范围 | 存放位置 |
|---------|---------|
| 页面私有 | `views/{domain}/{scene}/components/` |
| 同一 scene 内多个页面 | `views/{domain}/{scene}/components/` |
| 跨领域复用 | `src/components/` |

**提取阈值**：同一 UI 逻辑在 2 处及以上出现时考虑提取，优先提取到最小可用范围。

## 模板约束（红线）

- ❌ 禁止 `v-if="a && b || c"`，使用 `uiContext.xxxVisible`
- ❌ 禁止 `data?.a?.b?.c` 可选链防御，由 models 兜底
- ❌ 禁止模板中写业务判断

## 视图层约束

- 禁止直接调用 `apis` 或写业务逻辑
- 禁止导入 `domains` 内部的 `models.js` 或 `apis.js`，统一从 `index.js` 导入 services
- 使用 scoped CSS 或 CSS Modules，避免全局样式污染
