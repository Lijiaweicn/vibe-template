---
paths:
  - "**/views/**/*.vue"
  - "**/components/**/*.vue"
---

> 完整规范见 [docs/spec/project.md](../../docs/spec/project.md) 第三、四章，本文为自动加载的精简版。

# 视图层规范（精简版）

## 组件存放路径

| 复用范围 | 存放位置 |
|---------|---------|
| 单页面内私有 | `views/{domain}/{page}/components/` |
| 同一领域内多个页面 | `views/{domain}/components/` |
| 跨领域复用（通用业务） | `src/components/business/` |
| 完全通用（无业务语义） | `src/components/common/` |

**提取阈值**：同一 UI 逻辑在 2 处及以上出现时考虑提取，优先提取到最小可用范围。

## 模板约束（红线）

- ❌ 禁止 `v-if="a && b || c"`，使用 `uiContext.xxxVisible`
- ❌ 禁止 `data?.a?.b?.c` 可选链防御，由 models 兜底
- ❌ 禁止模板中写业务判断

## 视图层约束

- 禁止直接调用 `apis` 或写业务逻辑
- 禁止导入 `domains` 内部的 `models.js` 或 `apis.js`，统一从 `index.js` 导入 services
- 使用 scoped CSS 或 CSS Modules，避免全局样式污染
