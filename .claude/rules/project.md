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
├── packages/                  # 领域分包（有业务语义）
│   ├── {domain}/              # 领域内聚
│   │   ├── domains/           # 纯 TS/JS 业务逻辑（不含 Vue 依赖）
│   │   ├── components/        # 领域组件
│   │   ├── hooks/             # 领域 hooks
│   │   └── constants.ts       # 领域常量
│   └── ...
├── components/                # 纯技术共享组件（无业务语义）
├── hooks/                     # 纯技术共享 hooks
├── utils/                     # 工具函数
├── views/{domain}/            # 页面
├── routes/{domain}/           # 路由
└── stores/                    # 状态管理
```

**判断标准**：有业务归属 → `packages/{domain}/`；纯技术复用 → `src/` 顶层。

**依赖方向（单向）**：
- ✅ `packages/{domain}/` → `src/components/`、`src/hooks/`、`src/utils/`
- ✅ `packages/{domain}/` → `packages/{other-domain}/`（通过接口）
- ❌ `src/components/` → `packages/{domain}/`
- ❌ `src/hooks/` → `packages/{domain}/`

## 核心原则

1. **`packages/{domain}/domains/` 不含 Vue 依赖**：保持框架无关，只放 TS/JS
2. **领域内聚**：同一领域的业务逻辑、组件、hooks 集中在同一个 package 内，通过接口对外暴露
3. **按需创建**：不创建空文件

## 历史遗留坑点

1. **禁用 Mixins**：Vue 2 页面禁止引入新 Mixins，共享逻辑抽离为 `hooks/` 或 `utils/`
2. **大客户定制代码**：`if (isXxxCustomer)` 包裹的代码禁止删除或重构
3. **接口空数据**：部分老接口返回 `null` 而非 `[]`，注意防御
