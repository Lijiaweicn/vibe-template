---
paths:
  - "src/**/*.{ts,tsx}"
  - "!**/*.test.{ts,tsx}"
  - "!**/*.spec.{ts,tsx}"
---

> 完整规范见 [docs/spec/typescript.md](../../docs/spec/typescript.md)，本文为自动加载的精简版。

# TypeScript 编码规范（精简版）

## 分层策略

- **核心层**（`domains/`、`utils/`、`stores/`）：strict 模式，完整 interface 声明
- **视图层**（`views/`、`components/`）：依赖推导，禁止类型体操

## 红线

- ❌ 视图层超过3层的条件类型或嵌套映射类型
- ❌ 使用 `any`（优先 `unknown`）
- ❌ 有初始值的 `ref` 加冗余泛型（如 `ref<boolean>(false)`）
- ❌ 核心层缺少类型声明（隐式 `any`）

## 领域模型类型

`domains/` 层的领域模型（`StatusContext`、`FormContext` 等）不是 API 响应的直接映射，就近手写 interface。
