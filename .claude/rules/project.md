---
paths:
  - "src/**/*"
  - "docs/**/*.md"
---

> 完整规范见 [docs/spec/project.md](../../docs/spec/project.md)，本文为自动加载的精简版。

# 项目规范（精简版）

## 技术栈

Vue 3 + TypeScript + Vite | 微前端：wujie | UI：Antdv Next | 包管理：pnpm

## 核心原则

1. **统一垂直结构**：所有垂直领域内部统一为 `core | components | hooks` 三层结构
2. **业务逻辑就近归属**：业务逻辑放在消费它的领域/场景的 `core/` 目录下
3. **视图层薄薄一层**：页面只负责模板、交互和调用 services，不写业务判断
4. **客户差异隔离**：通过 `customers.js` 策略模式管理，禁止 `if (customer === 'A')`
5. **依赖方向**：`core → hooks → components`（core 不依赖 hooks/components）
6. **渐进式落地**：新功能按规范写，老代码不强求全量重构
7. **架构熔断**：极简页面允许跳过标准架构，增加联动后必须重构
8. **按需创建**：不创建空文件

## 领域层级

- **domain**（业务领域）：bidding、contract、supplier
- **scene**（业务场景）：order、sign
- **page**（具体页面）：order-form、order-list、order-detail

## 目录结构

```
src/
├── views/{domain}/
│   └── {scene}/
│       ├── {page}.vue              # 页面文件
│       ├── core/                   # 业务逻辑（models/apis/constants/customers）
│       │   └── {page}/             # 页面级编排（按需）
│       ├── components/             # scene 共享组件
│       └── hooks/                  # scene 共享 hooks
├── components/
│   ├── common/                     # 纯 UI
│   └── shared/{service}/           # 跨领域基础设施
│       ├── core/
│       ├── components/
│       └── hooks/
├── hooks/                          # 全局通用（无业务依赖）
├── routes/
├── stores/
└── utils/
```

## 统一结构

所有垂直领域 = `core | components | hooks`

- 提取方向：`components → hooks → core`
- 依赖方向：`core → hooks → components`

## 依赖方向（红线）

- ✅ `views/{domain}/{scene}/core/` → `components/shared/*/core/`
- ✅ page core → scene core（细化→基础）
- ✅ hooks → core
- ✅ components → hooks、core
- ❌ core → hooks、components
- ❌ 跨场景 core 直接 import（通过 `context` 参数传入）
- ❌ `components/shared/` → 具体领域

## 历史遗留坑点

1. 禁用 Mixins：Vue 2 页面禁止引入新 Mixins
2. 大客户定制代码：`if (isXxxCustomer)` 包裹的代码禁止删除或重构
3. 接口空数据：部分老接口返回 `null` 而非 `[]`，注意防御
