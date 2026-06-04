---
paths:
  - "**/*"
---

# 项目信息

## 技术栈

- 主体：Vue 3 + TypeScript + Vite
- 微前端：无界（wujie）
- UI 库：Antdv Next
- 包管理器：pnpm

## 目录规范
- `views/{domain}/`：页面（如 `quote/buyer-list.vue`）
- `components/common/`：纯交互组件
- `components/business/{domain}/`：业务组件
- `domains/{domain}/`：纯 TS/JS 业务逻辑

## 核心原则

1. **`domains/` 不含 Vue 依赖**：保持框架无关，只放 TS/JS
2. **按需创建**：不创建空文件

## 历史遗留坑点

1. **禁用 Mixins**：Vue 2 页面禁止引入新 Mixins，共享逻辑抽离为 `hooks/` 或 `utils/`
2. **大客户定制代码**：`if (isXxxCustomer)` 包裹的代码禁止删除或重构
3. **接口空数据**：部分老接口返回 `null` 而非 `[]`，注意防御
