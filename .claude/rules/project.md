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

```
src/
├── views/ # 页面视图（路由级组件）
├── components/ # 通用组件（可复用）
├── domains/ # 业务领域逻辑（按业务模块划分）
├── hooks/ # Vue 组合式函数 / React hooks（跨组件复用逻辑）
├── stores/ # 全局状态管理（Pinia / Vuex）
├── utils/ # 纯工具函数（无业务逻辑）
├── routes/ # 路由配置
├── styles/ # 全局样式
├── assets/ # 静态资源（图片、字体等）
```

### 目录职责说明

| 目录          | 职责                         | 示例                                           |
| ------------- | ---------------------------- | ---------------------------------------------- |
| `views/`      | 页面视图，路由级组件         | `views/QuoteForm/index.vue`                    |
| `components/` | 通用组件，跨页面复用         | `components/PriceInput.vue`                    |
| `domains/`    | 业务逻辑层，按业务模块划分   | `domains/quote/{models,services,constants}.ts` |
| `hooks/`      | 组合式函数，封装有状态的逻辑 | `hooks/useTablePagination.ts`                  |
| `stores/`     | 全局状态管理                 | `stores/user.ts`                               |
| `utils/`      | 纯函数工具（无业务）         | `utils/formatDate.ts`                          |
| `routes/`     | 路由配置                     | `routes/index.ts`                              |
| `styles/`     | 全局样式、变量               | `styles/variables.scss`                        |
| `assets/`     | 静态资源                     | `assets/logo.png`                              |

## 历史遗留坑点

1. **禁用 Mixins**：Vue 2 页面禁止引入新 Mixins，共享逻辑抽离为纯函数
2. **大客户定制代码**：`if (isXxxCustomer)` 包裹的代码禁止删除或重构
3. **接口空数据**：部分老接口返回 `null` 而非 `[]`，注意防御
