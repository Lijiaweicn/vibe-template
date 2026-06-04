---
paths:
  - "**/views/**/*.vue"
  - "**/components/**/*.vue"
---

# 视图层规范

## 组件存放位置

| 复用范围             | 存放位置                            |
| -------------------- | ----------------------------------- |
| 单页面内私有         | `views/{module}/{page}/components/` |
| 领域内复用           | `views/{module}/components/`        |
| 跨领域业务复用       | `src/components/business/`          |
| 纯交互组件（无业务） | `src/components/common/`            |

## 组件提取原则

- 同一 UI 逻辑在 **2 处及以上** 出现时考虑提取
- 优先提取到最小可用范围，不要提前抽象

## 模板约束

- 禁止 `v-if="a && b || c"`，使用 `uiContext.xxxVisible`
- 禁止 `data?.a?.b?.c` 防御链，由 models 兜底

## 样式规范

- 使用 scoped CSS / CSS Modules
- 避免全局样式污染
