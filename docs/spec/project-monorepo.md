# 前端业务架构规范（Monorepo 版）

> **版本**：v4.4
> **基于**：[project.md](./project.md) v5.1（单项目版）
> **目标**：支持多包复用、垂直功能独立打包、跨项目共享
> **落地方式**：新功能严格遵循，老功能迁移时逐步适配
> **示例代码**：[monorepo-example.md](./monorepo-example.md)（Todo 应用完整示例）

---

## 快速导航

**首次阅读**：核心原则 → 目录结构 → 领域包内聚性 → 快速参考卡

**日常开发**：
- 新增领域包 → 第三章目录结构 + 第九章工具链配置
- 编写业务逻辑 → 第五章公共 API 设计 + 第六章可打包性设计
- 页面壳开发 → 第七章视图层归属
- 发布包 → 第六章 6.4 节发布到外部 npm

**决策速查**：[第十五章快速参考卡](#十五快速参考卡)

---

## 一、核心原则

继承单项目版全部原则，新增以下 Monorepo 特有原则：

1. **领域垂直打包**：每个业务域（bidding、contract 等）是独立包，包含完整的 services + components + hooks，可整体迁移。
2. **包边界清晰**：每个 package 是独立的发布单元，有明确的公共 API（`index.ts`）。
3. **依赖方向单向**：`packages/shared` → `packages/*`（领域包） → `apps/*`，反向禁止。
4. **workspace 协议**：内部包之间的依赖使用 `workspace:*`，发布时通过 changeset 或 publishConfig 替换为实际版本号。
5. **页面壳分离**：应用层只放页面壳（路由入口 + 模板），业务能力由领域包提供。
6. **构建隔离**：每个包有独立的构建配置，支持增量构建。
7. **类型共享**：公共类型定义在各自的包内导出，通过 `workspace:*` 引用，不搞全局 `types/` 目录。
   > `shared/src/types/` 是包内类型，与全局 `types/` 或 `@types/` 无关，仅用于导出系统级基础类型（UserContext、TenantContext 等）。

### shared 的定位：系统级基础设施层

shared 不是业务能力的垃圾桶，而是**系统级基础设施层**。只包含两类内容：

```
packages/shared/
├── infra/               # 技术基础
│   ├── request.ts       # HTTP 请求封装
│   ├── logger.ts        # 日志
│   ├── error.ts         # 错误处理
│   ├── storage.ts       # 本地存储
│   └── event.ts         # 事件总线
├── types/               # 全系统基础模型
│   ├── user-context.ts  # 用户上下文
│   ├── tenant-context.ts  # 租户上下文
│   └── permission-context.ts  # 权限上下文
├── hooks/               # UI 交互 hooks（useTable、usePagination 等）
└── utils/               # 工具函数
    ├── format.ts
    ├── validator.ts
    └── helpers.ts
```

> **命名区分**：`types/` 存放系统级基础类型（UserContext、TenantContext），`services/models.ts` 存放领域数据模型（Order、Contract）。两者都叫 "models"，但语义不同：前者描述"系统运行环境"，后者描述"业务数据结构"。

**判断标准**：它描述的是系统运行环境，而不是某个业务。

```typescript
// ✅ 可以进 shared：描述系统运行环境
interface UserContext {
  userId: string
  tenantId: string
  roles: string[]
}

// ❌ 不能进 shared：属于 order 领域
interface OrderContext {
  orderStatus: string
  canEdit: boolean
  totalAmount: number
}
```

**业务能力应该独立成包**：

| 能力 | 错误放置 | 正确放置 |
|------|----------|----------|
| 文件管理 | `shared/cross-domain/upload` | `packages/file` |
| 权限管理 | `shared/cross-domain/permission` | `packages/auth` |
| 组织架构 | `shared/cross-domain/organization` | `packages/organization` |
| 工作流 | `shared/cross-domain/workflow` | `packages/workflow` |

### 领域包的分层依赖

领域包内部存在两层，依赖关系不同：

```
packages/bidding/src/
├── order/
│   ├── services/         # 业务逻辑层（与框架无关）
│   │   ├── models.ts     # 数据模型、业务规则
│   │   ├── rules.ts      # 业务规则（可选，复杂时从 models 拆出）
│   │   ├── services.ts   # 业务编排（异步调度）
│   │   ├── apis.ts       # 接口请求（基础设施）
│   │   ├── constants.ts  # 常量枚举
│   │   ├── configs.ts    # 默认配置
│   │   └── customers.ts  # 客户策略
│   ├── components/       # 视图层（依赖 Vue）
│   └── hooks/            # 视图层（依赖 Vue）
```

| 层级 | 目录 | 框架依赖 | 说明 |
|------|------|----------|------|
| 业务逻辑层 | `services/` | **无** | 纯 JS/TS，不依赖 Vue，可独立测试 |
| 视图层 | `components/`、`hooks/` | **Vue** | 通过 peerDependencies 声明，避免重复打包 |

#### services 内部文件职责

| 文件 | 职责 | 依赖关系 |
|------|------|----------|
| `models.ts` | 数据模型、同步业务规则 | 无（纯函数） |
| `rules.ts` | 复杂业务规则（可选，简单场景合并到 models） | 依赖 models |
| `apis.ts` | 接口请求（基础设施层） | 无（只做网络调用） |
| `services.ts` | 业务编排（异步调度） | 依赖 models、rules、apis |
| `constants.ts` | 常量枚举 | 无 |
| `configs.ts` | 默认配置 | 无 |
| `customers.ts` | 客户策略 | 依赖 models |

#### services/index.ts 完整示例

**简单场景**：业务编排直接写在 index.ts

```typescript
// packages/bidding/src/order/services/index.ts

// 1. 导入内部模块
import * as apis from './apis'
import * as models from './models'
import * as rules from './rules'
import { getCustomerLogic } from './customers'

// 2. 业务编排函数（简单场景直接写在 index.ts）
async function initForm(id: string, context: ServiceContext) {
  const apiData = id ? await apis.getOrderDetail(id) : {}
  const formData = { id: apiData.id || '', items: apiData.items || [] }
  const formContext = models.createFormContext(apiData)
  const validation = rules.validateOrder(formData)
  const logic = getCustomerLogic(context)
  const finalConfig = logic.modifyConfig(defaultConfig, formData, context)
  return { formData, formContext, config: finalConfig, validation }
}

async function submitForm(formData: OrderFormData, context: ServiceContext) {
  if (!rules.canSubmit(formData)) {
    throw new BusinessError('订单不满足提交条件', 'ORDER_INVALID')
  }
  const logic = getCustomerLogic(context)
  if (logic.needApprove(formData, context)) { /* 触发审批 */ }
  return apis.submitOrder(formData)
}

// 3. 统一导出（带场景前缀）
export const orderServices = { initForm, submitForm }
export const orderModels = models
export const orderRules = rules
```

**复杂场景**：业务编排拆分到 services.ts，index.ts 只做 re-export

```typescript
// packages/bidding/src/order/services/services.ts
import * as apis from './apis'
import * as models from './models'
import * as rules from './rules'
import { getCustomerLogic } from './customers'

export async function initForm(id: string, context: ServiceContext) { ... }
export async function submitForm(formData: OrderFormData, context: ServiceContext) { ... }
```

```typescript
// packages/bidding/src/order/services/index.ts（简洁的 re-export）
export { initForm, submitForm } from './services'
export * as orderModels from './models'
export * as orderRules from './rules'
export const orderServices = { initForm, submitForm }
```

> **关键原则**：
> - `index.ts` 是唯一的异步层，负责组合 models、rules、apis
> - `models.ts` 和 `rules.ts` 是同步纯函数，可独立测试
> - `apis.ts` 只做网络调用，不处理业务逻辑
> - 简单场景直接写在 index.ts，复杂场景拆分到 services.ts

### 跨域依赖：禁止内部依赖，允许业务协作

**错误理解**：跨域禁止直接依赖，只能通过 context 传参。

**正确理解**：禁止跨域内部依赖，允许通过公共 API 建立业务协作。

```typescript
// ❌ 错误：直接依赖 contract 的内部实现
import { contractModels } from '@monorepo/contract/src/order/models'

// ❌ 错误：只是技术调用，业务意图不清晰
contractServices.save({ sourceType: 'bid', ... })

// ✅ 正确：通过业务 API 协作，表达业务意图
contractServices.createFromBid({ bidId, supplierId })
```

**业务 API 设计原则**：

```typescript
// packages/contract/src/order/services/index.ts
export const contractServices = {
  // 业务动作：表达业务意图
  createFromBid: async (params: { bidId: string; supplierId: string }) => {
    // 内部实现
  },
  // 业务动作：而不是通用 CRUD
  approve: async (contractId: string) => { ... },
  // ❌ 避免暴露通用 save/delete
}
```

**判断标准**：

| 场景 | 是否允许 |
|------|----------|
| 调用领域包的公共 services（业务 API） | ✅ 允许 |
| 调用领域包的内部 models/apis | ❌ 禁止 |
| 通过 context 传参（无直接依赖） | ✅ 允许（适合松耦合场景） |

### hooks 边界：三类 hooks

hooks 不是简单的"领域 hooks"和"页面 hooks"，而是三类：

#### A. 领域 hooks

关注：**一个业务对象怎么工作**

```typescript
// packages/purchase/order/hooks/useOrderForm.ts
export function useOrderForm() {
  // 属于订单领域
  const loadOrder = () => { ... }
  const calculateTotal = () => { ... }
  const validate = () => { ... }
  const submit = () => { ... }
  
  return { loadOrder, calculateTotal, validate, submit }
}
```

**判断标准**：hook 名字包含业务对象（Order、Contract、Supplier）

#### B. UI 交互 hooks

关注：**怎么展示**

```typescript
// packages/shared/hooks/useTable.ts
export function useTable() { ... }

// packages/shared/hooks/usePagination.ts
export function usePagination() { ... }

// packages/shared/hooks/useDialog.ts
export function useDialog() { ... }
```

**判断标准**：hook 名字包含 UI 组件（Table、Pagination、Dialog、Modal）

#### C. 页面组合 hooks

关注：**页面 controller**

```typescript
// apps/main/src/views/order/hooks/useOrderListPage.ts
export function useOrderListPage() {
  // 组合多个关注点
  const { permissions } = usePermission()
  const { query } = useRouteQuery()
  const { pagination } = usePagination()
  const { orders, loadOrders } = useOrderList()
  
  return { permissions, query, pagination, orders, loadOrders }
}
```

**判断标准**：hook 名字包含 Page、Route、Query 等页面行为

**存放位置**：

| 类型 | 存放位置 | 示例 |
|------|----------|------|
| 领域 hooks | `packages/{domain}/hooks/` | `useOrderForm`、`useContractApproval` |
| UI 交互 hooks | `packages/shared/hooks/` 或 UI 库 | `useTable`、`usePagination` |
| 页面组合 hooks | `apps/main/views/*/hooks/` | `useOrderListPage` |

---

## 二、Monorepo 架构

```
变化频率：低 ──────────────────────────────────────────────────────► 高

┌─────────────────────┬─────────────────────────────────────────────────────────────┐
│  共享基础层          │                     领域业务层                               │
│  packages/shared    │  packages/bidding  packages/contract  packages/supplier...  │
│                     │                                                             │
│  infra, types       │  services（框架无关）+ components/hooks（Vue 依赖）           │
│  utils              │                                                             │
│                     │                                                             │
│  与框架无关          │  业务逻辑与框架无关，视图层通过 peerDependencies 声明 Vue     │
│  极少变化            │  跟随业务变化                                                │
└─────────────────────┴─────────────────────────────────────────────────────────────┘
                                    │ 消费
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    应用层                                           │
│                                    apps/                                            │
│                                                                                    │
│                             页面壳（路由 + 模板）、全局 stores、页面组合 hooks        │
│                                                                                    │
│                                    Vue 强相关                                       │
│                                    跟随需求频繁变化                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 顶层目录职责

| 目录 | 角色 | 产物 | CI 流程 |
|------|------|------|---------|
| `packages/` | 库（被消费） | npm 包 / 构建产物 | build → publish |
| `apps/` | 应用（消费方 + 可部署） | 可运行的站点 / 容器 | build → deploy |

### 领域包的内聚性

每个领域包是**完整的业务单元**，包含该领域的一切能力：

```
packages/bidding/
├── src/
│   ├── order/                # 场景
│   │   ├── services/         # 业务逻辑（models、rules、services、apis）— 与框架无关
│   │   ├── components/       # 领域组件（如 ItemTable、SupplierCard）— 依赖 Vue
│   │   ├── hooks/            # 领域 hooks（如 useOrderForm）— 依赖 Vue
│   │   └── index.ts          # 统一导出
│   └── index.ts              # 域级导出
```

| 包含 | 说明 | 框架依赖 |
|------|------|----------|
| `services/` | 业务逻辑：models、rules、services、apis、constants、configs、customers | 无 |
| `components/` | 领域组件：仅本场景或本域内复用的 UI 组件 | Vue（peerDependency） |
| `hooks/` | 领域 hooks：组合 services 的响应式逻辑 | Vue（peerDependency） |

**打包时只需带走领域包，即可获得该领域的完整能力。**

---

## 三、目录结构

```
monorepo-root/
├── packages/                              # 库（被依赖、可发布）
│   ├── shared/                            # 共享基础层（系统级基础设施）
│   │   ├── src/
│   │   │   ├── infra/            # 技术基础
│   │   │   │   ├── request.ts
│   │   │   │   ├── logger.ts
│   │   │   │   ├── error.ts
│   │   │   │   ├── storage.ts
│   │   │   │   └── event.ts
│   │   │   ├── types/         # 全系统基础模型
│   │   │   │   ├── user-context.ts
│   │   │   │   ├── tenant-context.ts
│   │   │   │   └── permission-context.ts
│   │   │   ├── hooks/                     # UI 交互 hooks
│   │   │   │   ├── useTable.ts
│   │   │   │   ├── usePagination.ts
│   │   │   │   └── useDialog.ts
│   │   │   ├── utils/                     # 工具函数
│   │   │   │   ├── format.ts
│   │   │   │   ├── validator.ts
│   │   │   │   └── helpers.ts
│   │   │   └── index.ts                   # 公共 API 导出
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── file/                              # 文件管理域（独立包）
│   │   └── ...
│   ├── auth/                              # 权限管理域（独立包）
│   │   └── ...
│   ├── organization/                      # 组织架构域（独立包）
│   │   └── ...
│   │
│   ├── bidding/                           # 招投标域（独立包，可整体打包）
│   │   ├── src/
│   │   │   ├── order/                     # 场景
│   │   │   │   ├── services/              # 业务逻辑（与框架无关）
│   │   │   │   │   ├── index.ts           # services 导出
│   │   │   │   │   ├── models.ts          # 数据模型、业务规则
│   │   │   │   │   ├── rules.ts           # 业务规则（可选）
│   │   │   │   │   ├── services.ts        # 业务编排
│   │   │   │   │   ├── apis.ts            # 接口请求
│   │   │   │   │   ├── models.test.ts     # models 单元测试
│   │   │   │   │   ├── constants.ts       # 业务常量
│   │   │   │   │   ├── configs.ts         # 平台默认配置
│   │   │   │   │   └── customers.ts       # 客户策略
│   │   │   │   ├── components/            # 场景内组件（依赖 Vue）
│   │   │   │   │   ├── ItemTable.vue
│   │   │   │   │   └── SupplierCard.vue
│   │   │   │   ├── hooks/                 # 场景内 hooks（依赖 Vue）
│   │   │   │   │   └── useOrderForm.ts
│   │   │   │   └── index.ts               # 场景级导出
│   │   │   └── index.ts                   # 域级导出
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── contract/                          # 合同域（独立包）
│   │   └── ...
│   │
│   └── supplier/                          # 供应商域（独立包）
│       └── ...
│
├── apps/                                  # 应用（依赖库、可部署）
│   ├── main/                              # 主应用
│   │   ├── src/
│   │   │   ├── views/                     # 页面壳（路由入口 + 模板）
│   │   │   │   ├── bidding/
│   │   │   │   │   └── order/
│   │   │   │   │       ├── order-form.vue     # 页面壳
│   │   │   │   │       ├── order-list.vue
│   │   │   │   │       └── hooks/             # 页面组合 hooks
│   │   │   │   │           └── useOrderListPage.ts
│   │   │   │   └── ...
│   │   │   ├── components/                # 应用级跨领域组件
│   │   │   ├── routes/                    # 路由配置
│   │   │   ├── stores/                    # 全局状态
│   │   │   ├── hooks/                     # 应用级通用 hooks
│   │   │   └── App.vue
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── sub-app/                           # 子应用（微前端模块，可选）
│       └── ...
│
├── package.json                           # 根 package.json（workspace 配置）
├── pnpm-workspace.yaml                    # pnpm workspace 声明
├── tsconfig.base.json                     # 基础 TS 配置（被各包继承）
├── turbo.json                             # Turborepo 构建编排（可选）
└── docs/
    └── spec/
```

---

## 四、包依赖关系

```
apps/main
    ├── depends on: @monorepo/bidding (workspace:*)
    ├── depends on: @monorepo/contract (workspace:*)
    ├── depends on: @monorepo/file (workspace:*)
    ├── depends on: @monorepo/auth (workspace:*)
    └── depends on: @monorepo/shared (workspace:*)

@monorepo/bidding
    ├── depends on: @monorepo/shared (workspace:*)
    ├── depends on: @monorepo/file (workspace:*)      # 通过业务 API 协作
    └── peerDependencies: vue

@monorepo/contract
    ├── depends on: @monorepo/shared (workspace:*)
    ├── depends on: @monorepo/bidding (workspace:*)   # 通过业务 API 协作
    └── peerDependencies: vue

@monorepo/shared
    └── depends on: 外部依赖（axios, lodash-es 等）
```

### 依赖规则

| 规则 | 说明 |
|------|------|
| ✅ apps/ → packages/* | 应用可依赖任意领域包和共享包 |
| ✅ 领域包 → shared | 领域包可依赖共享包 |
| ✅ 领域包 → 领域包（业务 API） | 通过公共 services 的业务 API 协作 |
| ❌ 领域包 → 领域包（内部实现） | 禁止依赖其他领域的 models/apis 内部实现 |
| ❌ shared → 领域包 | 共享包不能依赖领域包 |
| ❌ 领域包 → apps/ | 领域包不能依赖应用 |
| ❌ 领域包 dependencies 中放 Vue | Vue 应作为 peerDependencies |

---

## 五、包的公共 API 设计

每个包必须通过 `index.ts` 明确导出公共 API，隐藏内部实现。

### 5.1 领域包导出示例

```typescript
// packages/bidding/src/index.ts

// 导出各场景的 services
export { orderServices } from './order/services'
export { quoteServices } from './quote/services'

// 导出 components（局部导入，支持 tree-shaking）
export { default as ItemTable } from './order/components/ItemTable.vue'
export { default as SupplierCard } from './order/components/SupplierCard.vue'

// 导出 hooks
export { useOrderForm } from './order/hooks/useOrderForm'

// 导出类型（使用 export type）
export type { OrderFormData, OrderFormContext } from './order/services/models'
export type { ServiceContext } from './order/services/customers'

// 不导出内部实现
// ❌ export * from './order/services/apis'        // apis 是内部实现
// ❌ export * from './order/services/constants'   // constants 按需导出

// ❌ 禁止导出无前缀的 services 对象（避免与目录名冲突）
// export const services = { ... }  // 错误！
```

**导出风格约定**：

| 导出内容 | 语法 | 示例 |
|----------|------|------|
| 变量、函数、组件 | `export` | `export { orderServices }` |
| 类型、接口 | `export type` | `export type { OrderFormData }` |

> 使用 `export type` 可确保类型信息在编译后被完全擦除，避免运行时副作用。

### 5.2 命名规则（防侵占）

**在 `services/index.ts` 中，必须导出带场景前缀的具名变量**：

```typescript
// packages/bidding/src/order/services/index.ts

// ✅ 正确：带场景前缀
export const orderServices = { initForm, submitForm }
export const orderModels = { calcTotal, createFormContext }

// ❌ 错误：无前缀，与目录名 services 语义重叠
export const services = { initForm, submitForm }
export default { initForm, submitForm }  // 禁止默认导出
```

| 导出方式 | 示例 | 是否允许 |
|----------|------|----------|
| 场景前缀 + Services | `orderServices`、`quoteServices` | ✅ |
| 场景前缀 + Models | `orderModels`、`quoteModels` | ✅ |
| 无前缀 services | `services`、`default` | ❌ |

**目的**：将目录名 `services/` 降级为物理分类标签，将业务语义赋予导出变量（`orderServices`），彻底隔离两个语义层级。

### 5.3 跨域 Context 定义与使用

**定义 context 类型**：

```typescript
// packages/shared/src/types/user-context.ts（shared 包只定义基础类型）
export interface BaseCrossDomainContext {
  userId: string
  userName: string
  customer?: string
  tenantId?: string
  permissions: string[]
}
```

```typescript
// apps/main/src/types/context.ts（应用层定义扩展）
import type { BaseCrossDomainContext } from '@monorepo/shared'

export interface AppCrossDomainContext extends BaseCrossDomainContext {
  module: 'todo' | 'bidding' | 'contract' | 'supplier'
  // 应用层特有字段，根据实际业务调整
}
```

> - `shared` 包只导出 `BaseCrossDomainContext`，不包含应用层特有字段
> - `AppCrossDomainContext` 由应用层定义，避免反向依赖
> - 禁止使用 `[key: string]: unknown` 索引签名，应通过接口扩展明确契约

**应用层组装 context**：

```vue
<!-- apps/main/src/views/bidding/order/order-form.vue -->
<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { orderServices } from '@monorepo/bidding'
import { contractServices } from '@monorepo/contract'
import type { AppCrossDomainContext } from '@/types/context'  // 从应用层导入

const userStore = useUserStore()

// 组装跨域 context
const context = computed<AppCrossDomainContext>(() => ({
  module: 'bidding',
  userId: userStore.userId,
  userName: userStore.userName,
  customer: userStore.customer,
  tenantId: userStore.tenantId,
  permissions: userStore.permissions,
}))

// 传递给不同领域包
const order = await orderServices.initForm(orderId, context.value)
const contract = await contractServices.initForm(contractId, context.value)
</script>
```

**领域包消费 context**：

```typescript
// packages/bidding/src/order/services/customers.ts
import type { BaseCrossDomainContext } from '@monorepo/shared'

export function getCustomerLogic(context: BaseCrossDomainContext) {
  if (context.customer === 'companyA') {
    return companyAStrategy
  }
  return defaultStrategy
}
```

### 5.4 消费方导入规范

```typescript
// ✅ 正确：从包的公共 API 导入
import { orderServices, ItemTable, useOrderForm } from '@monorepo/bidding'
import { request, createDict } from '@monorepo/shared'

// ❌ 错误：直接访问包内部路径
import { getOrderDetail } from '@monorepo/bidding/src/order/services/apis'
import { createDict } from '@monorepo/shared/src/utils/dict'
```

### 5.5 组件注册方式

领域包导出的组件采用**局部导入**，不进行全局注册：

```vue
<!-- ✅ 正确：局部导入 -->
<script setup>
import { ItemTable } from '@monorepo/bidding'
</script>

<!-- ❌ 错误：全局注册 -->
<script>
app.component('ItemTable', ItemTable)
</script>
```

---

## 六、领域包的可打包性设计

为支持垂直功能独立打包进其他项目，领域包需遵循以下设计：

### 6.1 依赖注入模式

领域包的 services 层不直接依赖应用层的能力（路由、状态管理、UI 框架），而是通过注入获取：

```typescript
// packages/bidding/src/order/services/index.ts

export interface OrderServicesDeps {
  // 可选的外部依赖注入
  showToast?: (msg: string) => void
  navigateTo?: (path: string) => void
  router?: unknown        // 路由实例（可选）
  store?: unknown         // 状态管理实例（可选）
}

export function createOrderServices(deps: OrderServicesDeps = {}) {
  async function submitForm(formData: OrderFormData, context: ServiceContext) {
    const result = await apis.submitOrder(formData)
    deps.showToast?.('提交成功')
    return result
  }

  return { submitForm }
}

// 默认导出（无注入，适用于纯逻辑场景）
export const orderServices = createOrderServices()
```

**应用层注入示例**：

```typescript
// apps/main/src/views/bidding/order/order-form.vue
<script setup>
import { createOrderServices } from '@monorepo/bidding'
import { useRouter } from 'vue-router'
import { useToast } from 'element-plus'

const router = useRouter()
const toast = useToast()

// 注入应用层能力
const orderServices = createOrderServices({
  showToast: (msg) => toast.success(msg),
  navigateTo: (path) => router.push(path),
})
</script>
```

### 6.2 Vue 依赖声明

领域包中的 components 和 hooks 依赖 Vue，应通过 peerDependencies 声明：

```json
// packages/bidding/package.json
{
  "name": "@monorepo/bidding",
  "version": "1.0.0",
  "peerDependencies": {
    "vue": "^3.4.0"
  },
  "peerDependenciesMeta": {
    "vue": {
      "optional": true
    }
  }
}
```

> `optional: true` 表示如果只使用 services 层（纯逻辑），可以不安装 Vue。

### 6.3 两种打包模式

领域包支持两种打包模式，根据消费场景选择：

#### 模式一：完整包（含 Vue 组件）

适用于：需要复用领域组件和 hooks 的场景。

```json
// package.json
{
  "name": "@monorepo/bidding",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./style.css": "./dist/style.css"
  },
  "peerDependencies": { "vue": "^3.4.0" },
  "peerDependenciesMeta": { "vue": { "optional": true } }
}
```

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue(), dts()],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es', 'cjs'] },
    rollupOptions: { external: ['vue'] },
    cssCodeSplit: false,
  },
})
```

消费方：

```typescript
import { orderServices, ItemTable, useOrderForm } from '@monorepo/bidding'
import '@monorepo/bidding/dist/style.css'
```

#### 模式二：SDK 包（仅 services）

适用于：只复用业务逻辑，不复用 UI 的场景（如移动端、其他框架项目）。

```json
// package.json
{
  "name": "@monorepo/bidding-sdk",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" }
  },
  "peerDependencies": { "vue": "^3.4.0" },  // 移除或标记为 optional
  "peerDependenciesMeta": { "vue": { "optional": true } }
}
```

```typescript
// vite.config.sdk.ts（独立配置，排除 Vue 相关文件）
export default defineConfig({
  plugins: [dts()],
  build: {
    lib: { entry: 'src/services/index.ts', formats: ['es', 'cjs'] },
    rollupOptions: { external: ['vue'] },
  },
})
```

```json
// package.json scripts
{
  "scripts": {
    "build": "vite build",                    // 完整包
    "build:sdk": "vite build --config vite.config.sdk.ts"  // SDK 包
  }
}
```

消费方：

```typescript
import { orderServices } from '@monorepo/bidding-sdk'
// 不包含组件和 hooks，无需安装 Vue
```

#### 模式选择

| 场景 | 模式 | 包含内容 | 依赖 Vue |
|------|------|----------|----------|
| 同技术栈项目复用 | 完整包 | services + components + hooks + styles | 是（peerDependency） |
| 跨技术栈/仅逻辑复用 | SDK 包 | services only | 否 |
| 微前端子应用 | 完整包 | 全部 | 是 |

#### 导出入口设计

支持两种模式的包可以配置多个导出入口：

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./sdk": { "types": "./dist/sdk.d.ts", "import": "./dist/sdk.mjs" },
    "./style.css": "./dist/style.css"
  }
}
```

消费方按需导入：

```typescript
// 完整导入
import { orderServices, ItemTable } from '@monorepo/bidding'

// 仅 SDK
import { orderServices } from '@monorepo/bidding/sdk'

// 样式（完整包才需要）
import '@monorepo/bidding/style.css'
```

### 6.4 构建配置（Vite 库模式）

领域包含 `.vue` 文件，**不能使用 tsup**，需使用 Vite 库模式：

```typescript
// packages/bidding/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MonorepoBidding',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.cjs',
    },
    rollupOptions: {
      external: ['vue', '@monorepo/shared'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    cssCodeSplit: false,
  },
})
```

### 6.5 版本管理策略

#### 内部开发 vs 外部发布

| 场景 | 依赖写法 | 版本管理 | 说明 |
|------|----------|----------|------|
| **内部开发** | `workspace:*` | pnpm 自动处理 | monorepo 内部互相引用 |
| **外部发布** | `^1.0.0` | changeset 管理 | 发布到 npm 供其他项目消费 |

#### 内部开发依赖

```json
// packages/bidding/package.json（内部开发时）
{
  "dependencies": {
    "@monorepo/shared": "workspace:*"  // pnpm 自动解析为本地路径
  }
}
```

#### 外部发布依赖

发布到 npm 时，`workspace:*` 会被自动替换为实际版本号：

```json
// packages/bidding/package.json（发布后）
{
  "dependencies": {
    "@monorepo/shared": "^1.2.0"  // 自动替换
  }
}
```

#### 使用 changeset 管理版本（推荐）

```bash
# 安装 changeset
pnpm add -Dw @changesets/cli

# 初始化
pnpm changeset init

# 添加变更集（交互式选择版本号）
pnpm changeset
# ? Which packages would you like to include? @monorepo/bidding
# ? Which packages should have a patch bump? @monorepo/bidding
# ? Summary: 修复订单计算逻辑

# 版本更新（自动将 workspace:* 替换为实际版本号，更新 CHANGELOG）
pnpm changeset version

# 发布到 npm
pnpm changeset publish
```

#### 使用 publishConfig 配置

```json
// packages/bidding/package.json
{
  "name": "@monorepo/bidding",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "dependencies": {
    "@monorepo/shared": "workspace:*"
  }
}
```

> pnpm publish 会自动将 `workspace:*` 替换为实际版本号。

#### 内部私有 npm（企业场景）

如果使用私有 npm registry（如 Verdaccio、Nexus）：

```json
// packages/bidding/package.json
{
  "publishConfig": {
    "access": "restricted",
    "registry": "https://npm.company.com/"
  }
}
```

---

## 七、视图层在 Monorepo 中的归属

### 7.1 核心原则

**领域内聚**：components 和 hooks 跟随领域走，放在领域包内。

| 内容 | 归属 | 位置 | 框架依赖 |
|------|------|------|----------|
| services、models、apis | 领域包 | `packages/{domain}/src/{scene}/services/` | 无 |
| 领域组件（ItemTable 等） | 领域包 | `packages/{domain}/src/{scene}/components/` | Vue |
| 领域 hooks（useOrderForm 等） | 领域包 | `packages/{domain}/src/{scene}/hooks/` | Vue |
| 页面壳（路由入口 + 模板） | 应用 | `apps/main/src/views/{domain}/{scene}/` | Vue |
| 页面组合 hooks（useOrderListPage 等） | 应用 | `apps/main/src/views/{domain}/{scene}/hooks/` | Vue |
| 跨领域组件 | 应用 | `apps/main/src/components/` | Vue |
| 全局状态 | 应用 | `apps/main/src/stores/` | Pinia |

### 7.2 目录对齐

领域包和应用的目录结构保持对齐：

```
packages/bidding/src/                     apps/main/src/views/
├── order/                                ├── bidding/
│   ├── services/    ← 业务逻辑           │   ├── order/
│   │   ├── index.ts                      │   │   ├── order-form.vue  ← 页面壳
│   │   ├── models.ts                     │   │   ├── order-list.vue
│   │   └── ...                           │   │   └── hooks/          ← 页面组合 hooks
│   ├── components/  ← 领域组件           │   │       └── useOrderListPage.ts
│   ├── hooks/       ← 领域 hooks         │   └── ...
│   └── index.ts     ← 统一导出
```

### 7.3 页面壳消费领域包示例

```vue
<!-- apps/main/src/views/bidding/order/order-form.vue -->
<template>
  <div v-loading="loading">
    <el-form :model="formData">
      <el-form-item label="总金额">{{ formContext.totalAmount }}</el-form-item>
      <ItemTable v-model="formData.items" :can-edit="formContext.statusCtx.canEdit" />
      <el-button @click="submit" :disabled="isSubmitting">提交</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
// 从领域包导入：services、components、hooks（局部导入）
import { orderServices, ItemTable, useOrderForm } from '@monorepo/bidding'

const props = defineProps(['id'])
const context = { customer: 'companyA' }

const { loading, formData, formContext, isSubmitting, load, submit } = useOrderForm(
  () => orderServices.initForm(props.id, context),
  (data, ctx) => orderServices.submitForm(data, ctx),
  context,
)

onMounted(load)
</script>
```

**页面壳只负责**：
1. 路由入口（定义 path、meta）
2. 模板编排（组合领域组件）
3. 调用领域 hooks 获取响应式数据

### 7.4 领域包的导出设计

```typescript
// packages/bidding/src/order/index.ts

// services 导出
export { orderServices } from './services'

// components 导出（局部导入）
export { default as ItemTable } from './components/ItemTable.vue'
export { default as SupplierCard } from './components/SupplierCard.vue'

// hooks 导出
export { useOrderForm } from './hooks/useOrderForm'

// 类型导出
export type { OrderFormData, OrderFormContext } from './services/models'
```

### 7.5 样式处理

领域组件的样式打包策略：

```vue
<!-- packages/bidding/src/order/components/ItemTable.vue -->
<style scoped>
/* scoped 样式，打包时会提取到 style.css */
.item-table { ... }
</style>
```

**消费方引入样式**：

```vue
<!-- 推荐：手动引入，最可靠 -->
<script setup>
import { ItemTable } from '@monorepo/bidding'
import '@monorepo/bidding/dist/style.css'
</script>
```

> 领域包的样式打包在 `dist/style.css`，消费方需显式引入。如需自动引入，可配置 `vite-plugin-style-import`，但会增加额外依赖和配置复杂度。

---

## 八、路由组织（Monorepo 版）

### 8.1 路由归属

路由配置属于应用，按领域拆分模块：

```
apps/main/src/routes/
├── index.ts               # 路由实例 + 守卫注册
├── modules/
│   ├── bidding.ts         # 招投标路由
│   ├── contract.ts        # 合同路由
│   └── shared.ts          # 公共路由
├── permission.ts          # 权限守卫
└── constants.ts           # parentCode 等常量
```

### 8.2 路由定义示例

```typescript
// apps/main/src/routes/modules/bidding.ts
import { PARENT_CODE } from '../constants'

export default [
  {
    path: '/bidding/order-form/:id?',
    name: 'BiddingOrderForm',
    // 页面壳：只负责路由入口和模板编排
    component: () => import('@/views/bidding/order/order-form.vue'),
    meta: {
      title: '订单表单',
      parentCode: PARENT_CODE.BIDDING_ORDER,
      permission: 'bidding:order:edit',
    },
  },
]
```

### 8.3 微前端场景（扩展能力）

> 微前端是**扩展能力**，不是核心架构目标。领域包解决代码复用和边界，微前端解决部署隔离，两者关系弱。

当领域包需要作为微前端子模块独立加载时：

```typescript
// packages/bidding/src/micro-app.ts
// 微前端入口文件，独立部署时使用

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// 微前端独立运行时的路由和状态
const router = createRouter({
  history: createWebHistory('/bidding/'),
  routes: [
    { path: '/order-form/:id?', component: () => import('./views/order-form.vue') },
    { path: '/order-list', component: () => import('./views/order-list.vue') },
  ],
})

const app = createApp(App)
app.use(router)
app.mount('#bidding-app')
```

```json
// packages/bidding/package.json
{
  "scripts": {
    "build": "vite build",
    "build:micro": "vite build --mode micro",  // 微前端独立构建
    "dev": "vite --mode micro"                  // 微前端独立开发
  }
}
```

**版本隔离与边界**：

| 关注点 | 边界说明 |
|--------|----------|
| **Vue 版本** | 主应用和子应用各自打包 Vue，运行时隔离（wujie/qiankun 自带沙箱） |
| **状态隔离** | 领域包不直接访问主应用的 store，通过 postMessage 或共享状态库（如 mitt）通信 |
| **路由隔离** | 子应用使用独立的 router 实例，主应用通过 URL 或 postMessage 触发导航 |
| **依赖版本** | 各自打包，不要求 Vue 版本一致；如需共享 Vue，通过 externals + CDN 注入 |

**领域包的职责边界**：领域包只提供业务能力（services + components + hooks），微前端加载、沙箱隔离、版本协调由应用层（基座）负责。

---

## 九、Monorepo 工具链配置

### 9.1 pnpm workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

> 只需声明顶层 `packages/*`，无需额外声明子目录，pnpm 会自动发现有 `package.json` 的目录。

### 9.2 根 package.json

```json
{
  "name": "@monorepo/root",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @monorepo/main dev",
    "build": "turbo run build",
    "build:packages": "turbo run build --filter='./packages/*'",
    "build:bidding": "turbo run build --filter=@monorepo/bidding",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "typecheck:strict": "turbo run typecheck:strict"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
```

> - `build:packages` 构建所有库（不含应用）；`build:bidding` 单独构建招投标域，用于垂直打包。
> - 应用包名统一为 `@monorepo/main`，与目录名 `apps/main` 对应。

### 9.3 统一依赖版本（pnpm overrides）

当不同包依赖同一库的不同版本时，使用 `pnpm.overrides` 强制统一：

```json
// 根 package.json
{
  "pnpm": {
    "overrides": {
      "vue": "^3.4.0",
      "typescript": "^5.5.0"
    }
  }
}
```

**使用场景**：
- 领域包 A 依赖 `vue@^3.3.0`，领域包 B 依赖 `vue@^3.4.0` → 统一为 `^3.4.0`
- 避免因不同包依赖不同版本导致的类型冲突或运行时问题
- 外部项目消费多个领域包时，统一版本有助于减少重复打包

### 9.4 Turborepo 配置

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "typecheck:strict": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### 9.5 TypeScript 项目引用

```json
// tsconfig.base.json（根配置，被各包继承）
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@monorepo/shared": ["packages/shared/src"],
      "@monorepo/bidding": ["packages/bidding/src"],
      "@monorepo/contract": ["packages/contract/src"],
      "@monorepo/supplier": ["packages/supplier/src"],
      "@monorepo/file": ["packages/file/src"],
      "@monorepo/auth": ["packages/auth/src"]
    }
  }
}
```

```json
// packages/bidding/tsconfig.json（库包：需要生成声明）
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "exclude": ["src/**/*.test.ts"],
  "references": [
    { "path": "../shared" }
  ]
}
```

```json
// apps/main/tsconfig.json（应用包：不需要生成声明）
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": false,
    "declarationMap": false,
    "composite": false,
    "noImplicitAny": false,
    "strictNullChecks": false
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "references": [
    { "path": "../../packages/shared" },
    { "path": "../../packages/bidding" },
    { "path": "../../packages/contract" }
  ]
}
```

> - 库包（packages/*）：需要 `declaration: true`、`composite: true`，用于生成类型声明和项目引用。
> - 应用包（apps/*）：不需要生成声明，`composite` 设为 false。

### 9.6 严格模式门禁配置

CI 需要两条独立的检查流水线，分别覆盖 services 层（.ts）和视图层（.vue）：

**流水线一：services 层严格检查**

```json
// tsconfig.strict.json（仅检查 .ts，覆盖 services 层）
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": [
    "packages/*/src/**/*.ts"
  ],
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.vue"
  ]
}
```

**流水线二：视图层类型检查**

```json
// tsconfig.strict-vue.json（检查 .vue 文件中的 <script> 类型）
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": [
    "packages/*/src/**/*.vue"
  ],
  "exclude": [
    "**/*.test.ts"
  ]
}
```

**检查脚本**：

```json
{
  "scripts": {
    "typecheck": "vue-tsc --noEmit",
    "typecheck:strict": "tsc -p tsconfig.strict.json --noEmit",
    "typecheck:strict-vue": "vue-tsc -p tsconfig.strict-vue.json --noEmit",
    "typecheck:ci": "pnpm typecheck:strict && pnpm typecheck:strict-vue"
  }
}
```

| 命令 | 检查范围 | 工具 |
|------|----------|------|
| `typecheck:strict` | services 层（.ts） | tsc |
| `typecheck:strict-vue` | 视图层（.vue） | vue-tsc |
| `typecheck:ci` | 两者都检查 | 组合 |

---

## 十、渐进式迁移路径

### 10.1 从单项目迁移到 Monorepo

```
阶段 1：初始化 workspace 结构
monorepo-root/
├── apps/
│   └── main/              ← 原项目代码移入（保留 src/ 结构）
├── packages/
├── pnpm-workspace.yaml
└── package.json

阶段 2：提取共享基础层
packages/shared/           ← 从原 src/utils/ 和 src/domains/shared/ 提取

阶段 3：提取领域包（垂直打包）
packages/bidding/          ← 从原 src/domains/bidding/ + views/bidding/components|hooks/ 提取
packages/contract/         ← 从原 src/domains/contract/ + views/contract/components|hooks/ 提取

阶段 4：应用层瘦身
apps/main/src/views/       ← 只保留页面壳（.vue 文件），components/hooks 迁移到领域包
apps/main/src/             ← 修改导入路径为 @monorepo/bidding
```

### 10.2 版本管理策略

**迁移期间的版本策略**：

1. **内部依赖**：使用 `workspace:*`，pnpm 自动处理
2. **外部发布**：使用 changeset 管理版本号
3. **迁移期间新旧共存**：
   - 老代码保留原路径，逐步迁移
   - 新代码直接使用新路径
   - 通过 re-export 保持兼容：

```typescript
// 临时兼容层：迁移完成后删除
// src/domains/bidding/index.ts
export { orderServices } from '@monorepo/bidding'  // 转发到新包
```

### 10.3 垂直功能打包

当「企业管理」领域需要打包到其他应用时：

```bash
# 单独构建该领域包及其依赖
pnpm --filter @monorepo/bidding build

# 发布到私有 npm 或直接引用产物
pnpm --filter @monorepo/bidding publish

# 批量构建所有领域包
pnpm build:packages
```

**打包带走的内容**：
- ✅ `packages/bidding/`（services + components + hooks）
- ✅ `packages/shared/`（依赖的共享包）
- ⚠️ `apps/main/src/views/bidding/`（页面壳，可选择性迁移）

**目标应用接入**：
```json
// 目标应用 package.json
{
  "dependencies": {
    "@monorepo/bidding": "^1.0.0",
    "@monorepo/shared": "^1.0.0"
  }
}
```

---

## 十一、错误处理与横切关注点

### 11.1 统一错误处理

```typescript
// packages/shared/src/infra/errors.ts

export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'BusinessError'
  }
}

export function isBusinessError(error: unknown): error is BusinessError {
  return error instanceof BusinessError
}
```

```typescript
// packages/bidding/src/order/services/index.ts

import { BusinessError } from '@monorepo/shared'

async function submitForm(formData: OrderFormData, context: ServiceContext) {
  if (!formData.items.length) {
    throw new BusinessError('订单不能为空', 'ORDER_EMPTY')
  }
  return apis.submitOrder(formData)
}
```

### 11.2 日志规范

```typescript
// packages/shared/src/infra/logger.ts

export interface Logger {
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
  error(message: string, error?: unknown): void
}

// 默认实现（可通过依赖注入替换）
export const defaultLogger: Logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
}
```

```typescript
// packages/bidding/src/order/services/index.ts

import { defaultLogger } from '@monorepo/shared'

export function createOrderServices(deps: OrderServicesDeps = {}) {
  const logger = deps.logger ?? defaultLogger

  async function submitForm(formData: OrderFormData, context: ServiceContext) {
    logger.info('提交订单', { orderId: formData.id })
    // ...
  }
}
```

---

## 十二、测试策略

### 12.1 业务逻辑测试（services）

```typescript
// packages/bidding/src/order/services/models.test.ts
import { describe, it, expect } from 'vitest'
import { canSave, calcTotal } from './models'

describe('报价表单保存条件', () => {
  it.each([
    { desc: '有商品且金额>0', formData: { items: [{ price: 100, quantity: 1 }] }, expected: true },
    { desc: '无商品', formData: { items: [] }, expected: false },
    { desc: '金额为0', formData: { items: [{ price: 0, quantity: 1 }] }, expected: false },
  ])('$desc → 应返回 $expected', ({ formData, expected }) => {
    expect(canSave(formData)).toBe(expected)
  })
})
```

### 12.2 组件测试

```typescript
// packages/bidding/src/order/components/ItemTable.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemTable from './ItemTable.vue'

describe('ItemTable', () => {
  it('应渲染表格行', () => {
    const wrapper = mount(ItemTable, {
      props: {
        modelValue: [{ name: '商品A', price: 100 }],
        canEdit: true,
      },
    })
    expect(wrapper.findAll('tr')).toHaveLength(2) // header + 1 row
  })
})
```

### 12.3 Hooks 测试

```typescript
// packages/bidding/src/order/hooks/useOrderForm.test.ts
import { describe, it, expect } from 'vitest'
import { useOrderForm } from './useOrderForm'

describe('useOrderForm', () => {
  it('应正确加载表单数据', async () => {
    const mockInitFn = vi.fn().mockResolvedValue({
      formData: { id: '1', items: [] },
      formContext: { statusCtx: { isDraft: true } },
    })

    const { load, formData, formContext } = useOrderForm(mockInitFn, vi.fn())
    await load()

    expect(formData.value.id).toBe('1')
    expect(formContext.value.statusCtx.isDraft).toBe(true)
  })
})
```

### 12.4 测试脚本配置

```json
// packages/bidding/package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 十三、Code Review 检查清单

继承单项目版全部检查项，新增以下检查：

**依赖与构建**：
- [ ] 包之间的依赖方向是否正确？（shared ← 领域包 ← apps/）
- [ ] 内部依赖是否使用 `workspace:*`？
- [ ] Vue 是否放在 peerDependencies 而非 dependencies？
- [ ] 构建配置是否使用 Vite 库模式（非 tsup）？
- [ ] 构建产物是否包含 `.d.ts` 文件？

**领域包设计**：
- [ ] 领域包是否通过 `index.ts` 明确导出公共 API（services + components + hooks）？
- [ ] services 层是否与框架无关（不依赖 Vue）？
- [ ] 是否存在跨域内部依赖？（应通过业务 API 协作）
- [ ] shared 是否只包含基础设施和基础模型？（业务能力应独立成包）

**应用层设计**：
- [ ] 页面壳是否只包含模板和领域组件引用，不含业务逻辑？
- [ ] 组件是否采用局部导入（非全局注册）？
- [ ] 应用包名是否与目录名一致（`@monorepo/main`）？
- [ ] 页面组合 hooks 是否放在应用层？（而非领域包）

**类型与测试**：
- [ ] 跨包类型引用是否使用 `import type`？
- [ ] 是否存在循环类型依赖？
- [ ] services 是否有单元测试？
- [ ] 组件和 hooks 是否有测试？

---

## 十四、红线（禁止事项）

| 禁止事项 | 正确做法 |
|----------|----------|
| ❌ 将 Vue/Router/Pinia 放在领域包的 dependencies 中 | 作为 peerDependencies |
| ❌ 跨域内部依赖（import 其他领域的 models/apis） | 通过业务 API 协作 |
| ❌ shared 放业务能力（upload、permission、workflow） | 独立成包（packages/file、packages/auth） |
| ❌ 共享包依赖任何领域包或应用 | 共享包只能依赖外部库 |
| ❌ 领域包依赖应用（`apps/`） | 依赖方向只能是 apps → packages |
| ❌ 直接访问包内部路径 `@monorepo/bidding/src/...` | 从包的 `index.ts` 导入 |
| ❌ 页面壳中写业务逻辑 | 页面壳只负责模板编排和调用领域 hooks |
| ❌ 领域组件/hooks 散落在 apps/ 里 | 跟随领域走，放在 packages/{domain}/ 内 |
| ❌ 硬编码版本号 `"@monorepo/shared": "1.0.0"` | 内部使用 `workspace:*`，发布时由 changeset 处理 |
| ❌ 全局 types/ 目录 | 类型就近定义，通过包导出 |
| ❌ services 层直接依赖 Vue | services 层必须与框架无关 |
| ❌ 使用 tsup 构建含 .vue 的领域包 | 使用 Vite 库模式 |
| ❌ 全局注册领域组件 | 局部导入，保持 tree-shaking |
| ❌ 领域 hooks 变成页面 controller | 页面组合 hooks 放在应用层 |

---

## 十五、快速参考卡

### 目录结构速查

```
monorepo-root/
├── packages/              # 库（被依赖、可发布）
│   ├── shared/            # 系统级基础设施（infra + types + utils）
│   ├── file/              # 文件管理域
│   ├── auth/              # 权限管理域
│   ├── bidding/           # 招投标域（services + components + hooks）
│   ├── contract/          # 合同域
│   └── supplier/          # 供应商域
├── apps/                  # 应用（依赖库、可部署）
│   ├── main/              # 主应用（页面壳 + 路由 + stores + 页面组合 hooks）
│   └── sub-app/           # 子应用（微前端，可选）
└── pnpm-workspace.yaml
```

### 领域包内聚速查

```
packages/bidding/src/
├── order/
│   ├── services/          # 业务逻辑（与框架无关）
│   │   ├── models.ts      # 数据模型、业务规则
│   │   ├── rules.ts       # 业务规则（可选）
│   │   ├── services.ts    # 业务编排
│   │   ├── apis.ts        # 接口请求
│   │   ├── constants.ts   # 常量枚举
│   │   ├── configs.ts     # 默认配置
│   │   └── customers.ts   # 客户策略
│   ├── components/        # 领域组件（依赖 Vue）
│   ├── hooks/             # 领域 hooks（依赖 Vue）
│   └── index.ts           # 统一导出
└── index.ts               # 域级导出
```

### 依赖方向速查

```
apps/main (@monorepo/main)
    ↓ depends on
@monorepo/bidding, @monorepo/contract, @monorepo/file, @monorepo/auth, @monorepo/shared
    ↓ depends on
外部依赖

@monorepo/bidding
    ├── dependencies: @monorepo/shared
    ├── dependencies: @monorepo/file (通过业务 API 协作)
    └── peerDependencies: vue
```

### hooks 分类速查

| 类型 | 存放位置 | 判断标准 | 示例 |
|------|----------|----------|------|
| 领域 hooks | `packages/{domain}/hooks/` | 业务对象名 | `useOrderForm`、`useContractApproval` |
| UI 交互 hooks | `packages/shared/hooks/` | UI 组件名 | `useTable`、`usePagination` |
| 页面组合 hooks | `apps/main/views/*/hooks/` | Page/Route/Query | `useOrderListPage` |

### 导入方式速查

```typescript
// ✅ 从领域包导入 services、components、hooks
import { orderServices, ItemTable, useOrderForm } from '@monorepo/bidding'
import { request } from '@monorepo/shared'

// ✅ 跨域业务 API 协作
import { contractServices } from '@monorepo/contract'
await contractServices.createFromBid({ bidId, supplierId })

// ❌ 直接访问包内部
import { apis } from '@monorepo/bidding/src/order/services/apis'

// ❌ 跨域内部依赖
import { contractModels } from '@monorepo/contract/src/order/models'
```

### 构建与发布速查

```bash
# 构建单个领域包
pnpm --filter @monorepo/bidding build

# 构建所有库
pnpm build:packages

# 发布（使用 changeset）
pnpm changeset
pnpm changeset version
pnpm changeset publish
```

### 决策速查

| 问题 | 答案 |
|------|------|
| 通用工具放哪？ | `packages/shared/src/utils/` |
| 系统基础模型放哪？ | `packages/shared/src/types/` |
| 文件管理放哪？ | `packages/file/`（独立包） |
| 权限管理放哪？ | `packages/auth/`（独立包） |
| 业务域逻辑放哪？ | `packages/{domain}/src/{scene}/services/` |
| 领域组件放哪？ | `packages/{domain}/src/{scene}/components/` |
| 领域 hooks 放哪？ | `packages/{domain}/src/{scene}/hooks/` |
| 页面壳放哪？ | `apps/main/src/views/{domain}/{scene}/` |
| 页面组合 hooks 放哪？ | `apps/main/src/views/{domain}/{scene}/hooks/` |
| 新增领域需要改什么？ | 新建 `packages/{domain}/`，更新 `tsconfig.base.json` paths |
| 垂直功能如何打包？ | `pnpm --filter @monorepo/{domain} build` |
| 如何发布到外部 npm？ | 使用 changeset 管理版本号 |
| 领域包含 Vue 怎么构建？ | 使用 Vite 库模式（非 tsup） |
| 跨域能否直接依赖？ | 可以通过业务 API 协作，禁止内部依赖 |
