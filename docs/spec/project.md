# 前端业务架构规范

> **版本**：v4.0
> **目标**：统一垂直领域结构，业务逻辑就近归属，消除认知距离
> **落地方式**：新功能严格遵循，老功能修改时逐步迁移（通过微前端渐进替换）
> **配套规范**：[typescript.md](./typescript.md)（TypeScript 编码规范）

---

## 一、核心原则

1. **统一垂直结构**：所有垂直领域（views 下的 domain/scene/page、components/shared 下的基础设施）内部统一为 `core | components | hooks` 三层结构。
2. **业务逻辑就近归属**：业务逻辑放在消费它的领域/场景的 `core/` 目录下，不脱离视图独立存在。
3. **视图层薄薄一层**：页面只负责模板、交互和调用 services，不写业务判断。
4. **客户差异隔离**：通过 `customers.js` 策略模式管理，禁止在通用代码中写 `if (customer === 'A')`。
5. **提取方向**：`components → hooks → core`（组件中重复逻辑提取为 hooks，hooks 中业务逻辑提取为 core）。
6. **依赖方向**：`core → hooks → components`（core 不依赖 hooks/components，hooks 可依赖 core，components 可依赖 hooks 和 core）。
7. **渐进式落地**：新功能按规范写，老代码不强求全量重构。老模块保留原结构，新模块按本规范在独立子应用中开发，通过微前端（wujie）接入主平台。
8. **架构熔断**：极简页面（纯展示、无联动）允许跳过标准架构直接写在 views 中，但一旦增加显隐、联动、客户差异等业务逻辑，必须迁移到标准架构。
9. **按需创建**：不创建空文件，文件内有实际内容时才建立。

---

## 二、领域层级模型

项目按 **domain → scene → page** 三层组织：

| 层级 | 含义 | 示例 |
| --- | --- | --- |
| **domain** | 业务领域 | `bidding`（招投标）、`contract`（合同）、`supplier`（供应商） |
| **scene** | 业务场景（一个业务概念） | `order`（订单）、`sign`（签章） |
| **page** | 具体页面 | `order-form`（订单表单）、`order-list`（订单列表）、`order-detail`（订单详情） |

### 层级关系

```
views/bidding/                    # domain（业务领域）
├── order/                        # scene（业务场景）
│   ├── order-form.vue            # page（具体页面）
│   ├── order-list.vue
│   ├── order-detail.vue
│   ├── core/                     # 场景级 + 页面级业务逻辑
│   ├── components/               # 场景内共享组件
│   └── hooks/                    # 场景内共享 hooks
└── ...
```

---

## 三、统一垂直结构

所有垂直领域内部遵循统一的三层结构：

```
{vertical}/
├── core/           # 业务逻辑层（纯函数，可独立测试）
├── components/     # 视图组件层
└── hooks/          # 组合式函数层
```

### 提取方向与依赖方向

```
提取方向（从哪到哪）：components → hooks → core
  组件中重复逻辑 → 提取为 hooks
  hooks 中业务逻辑 → 提取为 core

依赖方向（反过来）：  core → hooks → components
  core 不依赖 hooks、components
  hooks 可依赖 core
  components 可依赖 hooks 和 core
```

### 在不同层级的表现

| 位置 | core 内容 | components 内容 | hooks 内容 |
| --- | --- | --- | --- |
| `views/{domain}/` | domain 级共享逻辑（如有） | domain 内跨 scene 共享组件 | domain 内跨 scene 共享 hooks |
| `views/{domain}/{scene}/` | scene 共享 models/apis/constants/customers + 页面级编排 | scene 内跨 page 共享组件 | scene 内跨 page 共享 hooks |
| `views/{domain}/{scene}/{page}/` | 页面专属编排逻辑（如有） | 页面私有组件 | 页面私有 hooks |
| `components/shared/{service}/` | 跨领域通用服务 | 服务配套组件 | 服务配套 hooks |

---

## 四、目录结构概览

```
src/
├── views/                                    # 视图层（页面与业务领域）
│   ├── bidding/                              # domain
│   │   ├── order/                            # scene
│   │   │   ├── core/                         # 业务逻辑
│   │   │   │   ├── index.js                  # 导出 services、models
│   │   │   │   ├── models.js                 # 派生状态、业务规则、计算函数
│   │   │   │   ├── models.test.js            # models 单元测试
│   │   │   │   ├── configs.js                # 平台默认配置
│   │   │   │   ├── constants.js              # 业务常量（枚举、状态映射）
│   │   │   │   ├── apis.js                   # 接口请求
│   │   │   │   ├── customers.js              # 客户策略
│   │   │   │   ├── customers.test.js         # customers 策略测试
│   │   │   │   ├── order-form/               # 页面级编排（如需要）
│   │   │   │   │   ├── index.js
│   │   │   │   │   └── index.test.js
│   │   │   │   ├── order-list/
│   │   │   │   └── order-detail/
│   │   │   ├── components/                   # scene 内共享组件
│   │   │   ├── hooks/                        # scene 内共享 hooks
│   │   │   ├── order-form.vue                # 页面
│   │   │   ├── order-list.vue
│   │   │   └── order-detail.vue
│   │   └── ...
│   ├── contract/
│   │   └── sign/
│   │       ├── core/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── sign-form.vue
│   └── supplier/
│       └── ...
│
├── components/                               # 全局组件
│   ├── common/                               # 纯 UI 组件（无业务语义）
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   └── Modal.vue
│   └── shared/                               # 跨领域业务基础设施
│       ├── upload/
│       │   ├── core/                         # services、models、apis
│       │   │   ├── index.js
│       │   │   ├── apis.js
│       │   │   └── models.js
│       │   ├── components/                   # AttachmentUploader 等
│       │   └── hooks/                        # useUpload 等
│       ├── permission/
│       │   ├── core/
│       │   └── hooks/
│       └── form-template/
│           ├── core/
│           └── components/
│
├── routes/                                   # 路由层（纯配置）
│   ├── index.js                              # 创建路由实例，注册守卫
│   ├── modules/                              # 路由定义（按领域拆分）
│   │   ├── bidding.js
│   │   ├── contract.js
│   │   ├── supplier.js
│   │   └── shared.js                         # 公共路由（登录、404、首页）
│   ├── permission.js                         # 权限守卫
│   └── constants.js                          # 路由常量（如 parentCode 枚举）
│
├── stores/                                   # 全局状态（用户、主题、菜单等）
│   ├── user.js
│   └── menu.js
├── hooks/                                    # 全局通用 hooks（无业务依赖）
│   ├── useDebounce.js
│   └── useLocalStorage.js
├── utils/                                    # 工具函数（格式化、深拷贝等）
└── ...
```

### 目录说明

| 目录 | 用途 | 特点 |
| --- | --- | --- |
| `views/{domain}/` | 业务领域 | 包含该领域下所有 scene |
| `views/{domain}/{scene}/` | 业务场景 | 包含页面、共享组件/hooks、业务逻辑 |
| `views/{domain}/{scene}/core/` | 场景级业务逻辑 | 纯 JS/TS，无 UI 框架依赖，可独立测试 |
| `components/common/` | 纯 UI 组件 | 无任何业务词汇，高度可复用 |
| `components/shared/` | 跨领域业务基础设施 | 逻辑 + UI 一体，可被任何领域依赖 |
| `routes/` | 路由配置 | 扁平定义，按领域拆分，守卫与路由同级 |
| `hooks/` | 全局通用 hooks | 不依赖业务逻辑，如防抖、存储 |
| `stores/` | 全局状态 | 如用户信息、主题配置 |
| `utils/` | 工具函数 | 纯函数，无副作用 |

---

## 五、各层职责详解

### 5.1 `core/` 业务逻辑层

每个 core 目录是一个独立的业务逻辑单元，包含以下文件：

| 文件 | 职责 | 约束 |
| --- | --- | --- |
| `constants.js` | 业务常量（枚举、状态映射） | 使用 `createDict` 工厂函数 |
| `configs.js` | 平台默认配置（字段默认值、布局等） | 可被配置中心覆盖 |
| `models.js` | 同步纯函数：派生状态、业务规则、计算函数 | 不依赖 Vue，无副作用 |
| `apis.js` | 接口请求封装 | 只做网络调用，不处理数据 |
| `customers.js` | 客户策略（`defaultStrategy` + `getCustomerLogic`） | 仅同步函数 |
| `index.js` | 定义 services（异步调度），导出 services 和 models | 唯一异步层，返回纯对象 |

#### core 的两种层级

**scene 级 core**（`views/{domain}/{scene}/core/`）：

存放该场景的共享业务逻辑——models、apis、constants、customers。被该 scene 下所有 page 共享。

**页面级 core**（`views/{domain}/{scene}/core/{page}/`）：

存放页面专属的编排逻辑。仅当页面的 services 编排较复杂、需要独立管理时才创建。简单页面可直接在 scene core 中处理。

```javascript
// views/bidding/order/core/order-form/index.js
// 页面级编排：组装 scene core 中的 services 调用顺序
import { orderServices } from '../'

export async function initOrderForm(id, context) {
  return orderServices.initForm(id, context)
}

export async function submitOrderForm(formData, context) {
  return orderServices.submitForm(formData, context)
}
```

#### 示例：`views/bidding/order/core/models.js`

```javascript
import { orderStatusDict } from "./constants";

export function calcTotal(items = []) {
  return items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
}

export function createFormContext(apiData = {}) {
  const statusItem = orderStatusDict.getItem(apiData.status);
  return {
    statusCtx: {
      value: apiData.status || "",
      label: statusItem ? statusItem.label : "未知状态",
      color: statusItem ? statusItem.color : "",
      isDraft: apiData.status === orderStatusDict.DRAFT.value,
      canEdit: apiData.status === orderStatusDict.DRAFT.value && !apiData.locked,
    },
    totalAmount: calcTotal(apiData.items),
  };
}

export function needApprove(formData, context) {
  const total = calcTotal(formData.items);
  return total > 100000;
}

export function canSave(formData) {
  return formData.items.length > 0 && calcTotal(formData.items) > 0;
}

export function createUIContext(formData) {
  return {
    canSave: canSave(formData),
    canSubmit: formData.items.length > 0,
  };
}
```

#### 示例：`views/bidding/order/core/apis.js`

```javascript
import request from "@/utils/request";

export function getOrderDetail(id) {
  return request.get(`/bidding/order/${id}`);
}

export function submitOrder(data) {
  return request.post("/bidding/order/submit", data);
}
```

#### 示例：`views/bidding/order/core/customers.js`

```javascript
import { needApprove as defaultNeedApprove, calcTotal } from "./models";

export const defaultStrategy = {
  needApprove: defaultNeedApprove,
  modifyConfig(config, formData, context) {
    return config;
  },
};

const companyAStrategy = {
  needApprove(formData, context) {
    const total = calcTotal(formData.items);
    return total > 50000;
  },
  modifyConfig(config, formData, context) {
    config.sampleRequired.visible = true;
    return config;
  },
};

export function getCustomerLogic(context) {
  const strategies = [defaultStrategy];
  if (context.customer === "companyA") strategies.push(companyAStrategy);
  return mergeStrategies(strategies);
}

function mergeStrategies(strategies) {
  return strategies.reduce((merged, s) => ({ ...merged, ...s }), {});
}
```

#### 示例：`views/bidding/order/core/index.js` - services 定义与导出

```javascript
import * as apis from "./apis";
import * as models from "./models";
import * as configs from "./configs";
import { getCustomerLogic } from "./customers";

async function fetchRemoteConfig(context) {
  const remote = await configCenter.get("bidding.order", context);
  return { ...configs.defaultFieldConfig, ...remote };
}

async function initForm(id, context) {
  const apiData = id ? await apis.getOrderDetail(id) : {};
  const formData = { id: apiData.id || "", items: apiData.items || [], remark: apiData.remark || "" };
  const modelContext = models.createFormContext(apiData);
  const uiContext = models.createUIContext(formData);
  const formContext = {
    ...modelContext,
    isEdit: !!id,
    uiContext,
  };
  const staticConfig = await fetchRemoteConfig(context);
  const logic = getCustomerLogic(context);
  const finalConfig = logic.modifyConfig(staticConfig, formData, context);
  return { formData, formContext, config: finalConfig, dynamic: logic };
}

async function submitForm(formData, context) {
  const logic = getCustomerLogic(context);
  const needApprove = logic.needApprove || models.needApprove;
  if (needApprove(formData, context)) {
    // 触发审批
  }
  return apis.submitOrder(formData);
}

export const orderServices = { initForm, submitForm };
export const orderModels = models;
```

**约束**：
- 唯一允许异步操作的地方。
- services 方法返回**纯对象**（不含 `ref`/`reactive`）。
- services 不能直接依赖其他 scene 的 services；需要跨场景数据时，通过 `context` 参数传入。
- **可以依赖 `components/shared/` 中的 services**（如 `uploadServices`）。

#### formData / formContext 分离

services 返回的数据必须区分**后端字段**和**交互状态**：

| 数据 | 用途 | 约束 |
| --- | --- | --- |
| `formData` | 100% 对应后端字段，可直接提交 | 不含 UI 状态、不含业务判断结果 |
| `formContext` | 业务派生的交互状态（编辑态、状态上下文、显隐联动等） | 不提交给后端，由 services 层返回 |
| 视图层 hook | 纯 UI 交互状态（`isSubmitting`、`loading` 等） | 由 hooks 管理，不进 services |

❌ 禁止将 UI 状态（如 `isEdit`、`canSave`、`statusCtx`）混入 `formData`。

```javascript
// ✅ 正确：formData 纯净，formContext 由 models + services 协作组装
const modelContext = models.createFormContext(apiData);  // → { statusCtx, totalAmount }
const uiContext = models.createUIContext(formData);      // → { canSave, canSubmit }
const formContext = {
  ...modelContext,
  isEdit: !!id,     // 编辑态（services 已知 id 是否存在）
  uiContext,         // 显隐联动（由 models 纯函数计算）
};
return { formData, formContext, config };
```

formContext 内部结构说明：
- `statusCtx`：由 `models.createFormContext()` 生成，基于后端状态值派生（`isDraft`、`canEdit` 等）
- `totalAmount`：由 `models.createFormContext()` 生成，基于 items 计算
- `isEdit`：由 services 层根据 `id` 参数组装（不属于 models 职责）
- `uiContext`：由 `models.createUIContext()` 生成，基于 formData 计算显隐联动（`canSave`、`canSubmit` 等）
- 两者都是**业务派生状态**，区别于视图层 hook 管理的纯 UI 状态（`isSubmitting`、`loading`）

#### context 参数约束

`context` 是 services 层接收跨领域数据的载体，由视图层组装传入：

```typescript
// context 类型声明示例
interface ServiceContext {
  customer?: string;           // 客户标识，用于 customers.js 策略判断
  contractInfo?: ContractInfo; // 跨领域数据，按需扩展
  [key: string]: unknown;      // 允许任意扩展字段
}
```

- `context` 由页面组件或页面 hook 组装，不应在 services 内部构造
- `context` 可包含任意字段，但 services 只应读取，不应修改
- 跨场景数据通过 `context` 传入，禁止 services 直接 import 其他 scene 的 core

#### TypeScript 类型声明

> 完整规范见 [typescript.md](./typescript.md)，此处为核心层要点。

- 类型定义应**就近声明**，与实现代码放在同一目录。
- 可使用 `.d.ts` 文件或 JSDoc 注释。
- 禁止将所有类型集中到单一的 `src/types/` 目录。
- **core 层必须开启 strict 模式**，完整声明 interface，确保下游补全体验。
- 领域模型类型就近手写，API 响应类型就近声明（有 OpenAPI 工具链时可自动生成）。

```typescript
// views/bidding/order/core/models.d.ts
export function calcTotal(items: Array<{ price: number; quantity: number }>): number;
export function createFormContext(apiData: any): {
  statusCtx: { value: string | number; label: string; color: string; isDraft: boolean; canEdit: boolean };
  totalAmount: number;
};
export function canSave(formData: { items: Array<unknown> }): boolean;
export function createUIContext(formData: { items: Array<unknown> }): {
  canSave: boolean;
  canSubmit: boolean;
};
```

#### 测试规范

core 层是纯函数，可独立测试。测试应遵循以下原则。

**测试文件位置**：与被测文件同目录，命名为 `*.test.js` 或 `*.test.ts`。
**测试工具**：Vitest（与 Vite 生态一致）。

```
views/bidding/order/core/
├── models.js
├── models.test.js      ← models 单元测试
├── customers.js
├── customers.test.js   ← customers 策略测试
├── apis.js
└── index.js
```

**测试分级**：按价值分级，不追求覆盖率。测试价值 = 逻辑复杂度 × 变更频率 × 影响范围。

| 级别 | 范围 | 要求 |
| --- | --- | --- |
| P0（必须测） | 多字段聚合、`canSave`、`needApproval`、`uiContext` 显隐分支 | 必须使用参数化测试（`test.each` / `it.each`） |
| P1（建议测） | 中等复杂的表单校验、customers 策略合并 | 按需覆盖 |
| P2/P3（不测） | 纯单项映射、常量枚举、简单赋值 | 无需测试，维护成本高于收益 |

**BDD 风格**：`describe/it` 的描述应贴近用户行为语言，而非纯实现细节。

```typescript
// ✅ 好 — 贴近验收清单的行为描述
describe("报价表单", () => {
  it("输入非法邮箱后点击保存，应显示红色错误提示", () => { ... })
})

// ❌ 差 — 纯实现细节，看不出在测什么行为
describe("validateEmail", () => {
  it("should return false for invalid email", () => { ... })
})
```

**P0 参数化测试示例**：

```typescript
// views/bidding/order/core/models.test.ts
import { describe, it, expect } from "vitest";
import { canSave } from "./models";

describe("报价表单保存条件", () => {
  it.each([
    { desc: "有商品且金额>0", formData: { items: [{ price: 100, quantity: 1 }] }, expected: true },
    { desc: "无商品", formData: { items: [] }, expected: false },
    { desc: "金额为0", formData: { items: [{ price: 0, quantity: 1 }] }, expected: false },
  ])("$desc → 应返回 $expected", ({ formData, expected }) => {
    expect(canSave(formData)).toBe(expected);
  });
});
```

**services 测试**：可 mock `apis` 进行集成测试，验证 services 层的调度逻辑。

---

### 5.2 `views/` 视图层

#### 5.2.1 页面文件

页面 Vue 文件直接放在 scene 目录下，不额外套 `pages/` 子目录。

```vue
<!-- views/bidding/order/order-form.vue -->
<template>
  <div v-loading="loading">
    <el-form :model="formData">
      <el-form-item label="总金额">{{ formContext.totalAmount }}</el-form-item>
      <el-button @click="submit" :disabled="isSubmitting">提交</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { orderServices } from "./core";
import { useOrderForm } from "./hooks/useOrderForm";

const props = defineProps(["id"]);
const context = { customer: "companyA" };

const { loading, formData, formContext, isSubmitting, load, submit } = useOrderForm(
  () => orderServices.initForm(props.id, context),
  (data, ctx) => orderServices.submitForm(data, ctx),
  context,
);

onMounted(load);
</script>
```

**约束**：
- 禁止直接调用 `apis` 或写业务判断。
- 禁止导入 core 内部的 `models.js` 或 `apis.js`，统一从 `index.js` 导入 services。
- 使用 scoped CSS 或 CSS Modules，避免全局样式污染。

#### 5.2.2 页面私有 `components/` 与 `hooks/`

页面私有组件和 hooks 仅在该页面内使用。当页面逻辑较简单时，可直接放在 scene 的 `components/` 和 `hooks/` 中；当页面较复杂时，可在 core 中创建页面子目录。

```javascript
// views/bidding/order/hooks/useOrderForm.js
import { ref } from "vue";

export function useOrderForm(initFn, submitFn, context = {}) {
  const loading = ref(false);
  const formData = ref({});
  const formContext = ref({});
  const isSubmitting = ref(false);

  const load = async () => {
    loading.value = true;
    try {
      const res = await initFn();
      formData.value = res.formData;
      formContext.value = res.formContext;
    } finally {
      loading.value = false;
    }
  };

  const submit = async () => {
    isSubmitting.value = true;
    try {
      await submitFn(formData.value, context);
    } finally {
      isSubmitting.value = false;
    }
  };

  return { loading, formData, formContext, isSubmitting, load, submit };
}
```

#### 5.2.3 场景内共享 `components/` 与 `hooks/`

当同一 scene 内多个页面需要复用组件或 hook 时，放在 scene 的 `components/` 或 `hooks/` 中。

**场景内共享 hooks 只能调用本 scene 的 core services**（不能跨场景直接调用）。

```javascript
// views/bidding/order/hooks/useBiddingPermission.js
import { permissionServices } from "@/components/shared/permission/core";
export function useBiddingPermission() {
  return { hasPermission: permissionServices.hasPermission };
}
```

---

### 5.3 `components/shared/` 跨领域业务基础设施

存放跨领域通用的业务服务及其配套 UI 组件。每个服务是一个独立目录，内部遵循统一的 `core | components | hooks` 结构。

#### 目录结构

```
components/shared/
├── upload/
│   ├── core/                       # 上传服务逻辑
│   │   ├── index.js
│   │   ├── apis.js
│   │   └── models.js
│   ├── components/                 # AttachmentUploader 等
│   └── hooks/                      # useUpload 等
├── permission/
│   ├── core/                       # 权限服务逻辑
│   │   ├── index.js
│   │   └── apis.js
│   └── hooks/                      # usePermission 等
└── form-template/
    ├── core/
    │   ├── index.js
    │   └── apis.js
    └── components/                 # FormBuilder 等
```

**依赖边界**：
- `components/shared/` 可依赖 `utils/`，不可依赖 `stores/` 或具体领域。
- 任何 scene 的 core 可以依赖 `components/shared/` 中的 services。
- `components/shared/` 不能依赖具体领域（`views/{domain}/`）。

#### 示例：`components/shared/upload/core/index.js`

```javascript
import * as apis from './apis'
import * as models from './models'

async function uploadFile(file, context) {
  const res = await apis.upload(file)
  return models.createUploadResult(res)
}

export const uploadServices = { uploadFile }
export const uploadModels = models
```

#### 示例：在业务 core 中调用共享服务

```javascript
// views/bidding/order/core/index.js
import { uploadServices } from '@/components/shared/upload/core'

async function submitForm(formData, context) {
  if (formData.attachment) {
    const uploadResult = await uploadServices.uploadFile(formData.attachment, context)
    formData.attachmentUrl = uploadResult.url
  }
  return apis.submitOrder(formData)
}
```

#### 示例：`components/shared/permission/core/index.js`

```javascript
import * as apis from './apis'

const permissionCache = new Map()

async function loadPermissions() {
  const perms = await apis.getCurrentUserPermissions()
  perms.forEach(p => permissionCache.set(p, true))
}

function hasPermission(code) {
  return permissionCache.has(code)
}

function filterMenusByPermission(menus) {
  return menus.filter(m => !m.meta?.permission || hasPermission(m.meta.permission))
}

export const permissionServices = { loadPermissions, hasPermission, filterMenusByPermission }
```

---

### 5.4 `components/common/` 纯 UI 组件

无任何业务语义的组件（Button、Input、Modal 等）。

---

### 5.5 全局目录

#### `hooks/` - 全局通用 hooks

与业务无关的通用组合式函数（如 `useDebounce`、`useLocalStorage`），**不依赖任何 core 的 services**。需要通过业务能力时，采用参数注入方式。

```javascript
// src/hooks/useFetch.js
export function useFetch(fetchFn) {
  const loading = ref(false);
  const data = ref(null);
  const execute = async (...args) => {
    loading.value = true;
    data.value = await fetchFn(...args);
    loading.value = false;
  };
  return { loading, data, execute };
}
```

#### `stores/` - 全局状态

跨领域共享的全局状态（用户信息、主题等）。

#### `utils/` - 工具函数

纯函数工具，不依赖业务逻辑。

---

## 六、组件与 Hooks 抽取路径

### 6.1 组件抽取原则

- 同一 UI 逻辑在 **2 处及以上** 出现时考虑提取。
- 优先提取到最小可用范围，不要提前抽象。

### 6.2 组件存放路径

| 复用范围 | 存放位置 | 示例 |
| --- | --- | --- |
| 单个页面内 | `views/{domain}/{scene}/components/`（页面私有） | `views/bidding/order/components/ItemTable.vue` |
| 同一 scene 内多个页面 | `views/{domain}/{scene}/components/` | `views/bidding/order/components/SupplierCard.vue` |
| 跨领域复用（有业务语义） | `components/shared/{service}/components/` | `components/shared/upload/components/AttachmentUploader.vue` |
| 完全通用（无业务语义） | `components/common/` | `components/common/Button.vue` |

### 6.3 Hooks 抽取路径与调用规则

| 复用范围 | 存放位置 | 允许调用的 services | 示例 |
| --- | --- | --- | --- |
| 单个页面内 | `views/{domain}/{scene}/hooks/` | ✅ 可调用任何 scene 的 core services | `views/bidding/order/hooks/useOrderFormWithContract.js` |
| 同一 scene 内多个页面 | `views/{domain}/{scene}/hooks/` | ✅ 只能调用本 scene 的 core services | `views/bidding/order/hooks/useBiddingPermission.js` |
| 跨领域复用（无业务依赖） | `src/hooks/` | ❌ 不能调用 services，通过参数注入 | `src/hooks/useFetch.js` |
| 跨领域复用（有业务依赖） | 不应直接共享 Hook；应由页面级组合实现 | — | — |

**约束**：
- 页面私有 hooks 可以自由组合任意 scene 的 core services，用于处理该页面的复杂交互。
- 场景内共享 hooks 必须保持内聚，只能调用本 scene 的 core services，不得跨场景直接依赖。
- 全局 hooks 必须保持纯净，只能通过参数接收业务能力。

---

## 七、Services 与 Hooks 的分工

### 7.1 职责划分

| 类型 | 职责 | 位置 | 依赖规则 | 返回 |
| --- | --- | --- | --- | --- |
| **services** | 业务逻辑：API、数据转换、规则判断、客户策略 | `views/{domain}/{scene}/core/index.js` | 可依赖同 scene 内页面级 core，不可跨场景直接依赖；需要跨场景数据时通过 `context` 参数传入；**可依赖 `components/shared/`** | 纯对象，不含响应式 |
| **hooks（页面私有）** | 视图逻辑：响应式封装、状态管理、调用 services | `views/{domain}/{scene}/hooks/` | **可调用任何 scene 的 core services** | 响应式数据 + 方法 |
| **hooks（场景共享）** | 视图逻辑：响应式封装、状态管理、调用 services | `views/{domain}/{scene}/hooks/` | **只能调用本 scene 的 core services** | 响应式数据 + 方法 |
| **hooks（全局）** | 通用组合式函数，与业务无关 | `src/hooks/` | **不可调用 services**，只能通过参数注入 | 响应式数据 + 方法 |

### 7.2 详细说明

#### services

- 不跨场景直接依赖其他 scene 的 core。如需其他场景的数据，应在 `context` 参数中声明，由调用方传入。
- 页面级 core 可依赖同一 scene 的共享 core。
- **可以依赖 `components/shared/` 中的 services**（如文件上传、权限服务）。
- 返回纯对象，供视图层包装。

#### 页面私有 hooks

- 可以直接调用任何 scene 的 core services，用于处理该页面的特定组合逻辑（如同时加载 bidding 和 contract 的数据）。
- 可以包含 `loading`、`error` 等 UI 状态管理。
- 可调用全局 stores、其他 hooks。

#### 场景内共享 hooks

- 只能调用本 scene 的 core services，保持场景内聚。
- 如果某个逻辑需要跨场景数据，应将该逻辑放在页面私有 hooks 中，而不是场景共享 hook。

#### 全局 hooks

- 必须保持业务无关，不能直接依赖任何 core 下的 services。
- 如果需要业务能力，应通过参数注入（例如传入一个 `fetch` 函数）。
- 适用于 `useDebounce`、`useLocalStorage`、`useMediaQuery` 等。

### 7.3 示例

```javascript
// ✅ 页面私有 hooks 可调用任何 scene 的 core services
// views/bidding/order/hooks/useOrderWithContract.js
import { ref } from 'vue'
import { orderServices } from '../core'
import { signServices } from '@/views/contract/sign/core'
export function useOrderWithContract(orderId, contractId) {
  const loading = ref(false)
  const orderData = ref(null)
  const contractData = ref(null)
  const load = async () => {
    loading.value = true
    const orderRes = await orderServices.initForm(orderId, {})
    const contractRes = await signServices.initForm(contractId, {})
    orderData.value = orderRes.formData
    contractData.value = contractRes.formData
    loading.value = false
  }
  return { loading, orderData, contractData, load }
}

// ✅ 场景内共享 hooks 只能调用本 scene 的 core services
// views/bidding/order/hooks/useBiddingPermission.js
import { permissionServices } from '@/components/shared/permission/core'
export function useBiddingPermission() {
  return { hasPermission: permissionServices.hasPermission }
}

// ✅ 全局 hooks 不可直接调用 services
// src/hooks/useFetch.js
export function useFetch(fetchFn) {
  const loading = ref(false)
  const data = ref(null)
  const execute = async (...args) => {
    loading.value = true
    data.value = await fetchFn(...args)
    loading.value = false
  }
  return { loading, data, execute }
}
```

---

## 八、客户策略（customers.js）设计规范

### 8.1 定位与职责

- 集中管理客户、灰度、租户等维度的业务差异。
- 提供 `defaultStrategy` 和 `getCustomerLogic(context)`。
- `context` 参数可包含任意扩展信息（如 `contractInfo`），用于策略判断。

### 8.2 文件结构

```javascript
// views/bidding/order/core/customers.js
import { needApprove as defaultNeedApprove, calcTotal } from "./models";

export const defaultStrategy = { needApprove: defaultNeedApprove };
const companyAStrategy = {
  needApprove: (formData, context) => {
    const total = calcTotal(formData.items);
    if (context.contractInfo?.type === "urgent") return total > 10000;
    return total > 50000;
  },
};

export function getCustomerLogic(context) {
  const strategies = [defaultStrategy];
  if (context.customer === "companyA") strategies.push(companyAStrategy);
  return strategies.reduce((merged, s) => ({ ...merged, ...s }), {});
}
```

### 8.3 在 services 中使用

```javascript
// views/bidding/order/core/index.js
import { getCustomerLogic } from "./customers";

async function submitForm(formData, context) {
  const logic = getCustomerLogic(context);
  const needApprove = logic.needApprove || models.needApprove;
  if (needApprove(formData, context)) {
    // 审批
  }
  return apis.submitOrder(formData);
}
```

---

## 九、路由组织规范

### 9.1 核心原则

1. **路由扁平定义**：所有路由在同一层级，不嵌套 `children`，适配菜单可配置架构。
2. **按领域拆分模块**：每个领域独立一个文件，位于 `routes/modules/` 下。
3. **与 `views` 目录对齐**：路由的 `name`、`path`、`component` 导入路径保持一致的命名规则。
4. **通过 `meta` 携带归属信息**：使用 `parentCode` 字段标识该路由归属的模块，便于运营配置菜单时关联。
5. **路由守卫与路由定义同级**：守卫逻辑写在 `routes/permission.js` 等文件中，无需创建 `guards/` 子目录。
6. **权限判断依赖领域服务**：守卫调用 `components/shared/permission/core` 服务，不自行实现业务逻辑。

### 9.2 目录结构

```
src/routes/
├── index.js               # 路由实例创建 + 守卫注册
├── modules/               # 路由定义（按领域拆分）
│   ├── bidding.js
│   ├── contract.js
│   └── shared.js
├── permission.js          # 权限守卫（可选，与 index.js 同级）
└── constants.js           # parentCode 等常量
```

### 9.3 路由定义示例

```javascript
// routes/modules/bidding.js
import { PARENT_CODE } from '../constants';

export default [
  {
    path: '/bidding/order-form/:id?',
    name: 'BiddingOrderForm',
    component: () => import('@/views/bidding/order/order-form.vue'),
    meta: {
      title: '订单表单',
      parentCode: PARENT_CODE.BIDDING_ORDER,
      permission: 'bidding:order:edit',
    },
  },
  {
    path: '/bidding/order-list',
    name: 'BiddingOrderList',
    component: () => import('@/views/bidding/order/order-list.vue'),
    meta: {
      title: '订单列表',
      parentCode: PARENT_CODE.BIDDING_ORDER,
      permission: 'bidding:order:view',
    },
  },
];
```

```javascript
// routes/constants.js
export const PARENT_CODE = {
  BIDDING_ORDER: 'bidding_order',
  CONTRACT_MANAGE: 'contract_manage',
  SUPPLIER_MANAGE: 'supplier_manage',
};
```

> **约定**：`PARENT_CODE` 的值必须与后端菜单配置中的 `parentCode` 保持一致，新增领域时同步维护。

### 9.4 权限守卫示例

```javascript
// routes/permission.js
import { permissionServices } from '@/components/shared/permission/core';

export function setupPermissionGuard(router) {
  router.beforeEach((to, from, next) => {
    const permission = to.meta.permission;
    if (permission && !permissionServices.hasPermission(permission)) {
      next({ name: 'Forbidden' });
    } else {
      next();
    }
  });
}
```

### 9.5 路由入口组装

```javascript
// routes/index.js
import { createRouter, createWebHistory } from 'vue-router';
import biddingRoutes from './modules/bidding';
import contractRoutes from './modules/contract';
import sharedRoutes from './modules/shared';
import { setupPermissionGuard } from './permission';

const routes = [...sharedRoutes, ...biddingRoutes, ...contractRoutes];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

setupPermissionGuard(router);

export default router;
```

### 9.6 菜单数据存储（store）

```javascript
// stores/menu.js
import { defineStore } from 'pinia';
import { permissionServices } from '@/components/shared/permission/core';

export const useMenuStore = defineStore('menu', {
  state: () => ({
    rawMenus: [],
  }),
  getters: {
    filteredMenus: (state) => {
      return permissionServices.filterMenusByPermission(state.rawMenus);
    },
  },
});
```

### 9.7 与老代码的过渡

- **新功能**：严格按照上述规范组织路由、守卫、菜单 store。
- **老功能**：逐步迁移，先将路由定义拆分到 `modules/`，再逐步替换守卫中的硬编码权限判断为调用 `permissionServices`。

---

## 十、Code Review 检查清单

- [ ] 业务逻辑是否写在对应 scene 的 `core/` 中？
- [ ] `views` 页面中是否有直接调用 `apis` 或写业务判断？
- [ ] `models.js` 是否只包含同步纯函数，无副作用？
- [ ] `models.js` 中是否有客户判断（`if customer === 'A'`）？
- [ ] 客户差异是否通过 `customers.js` 策略实现？
- [ ] services 是否返回纯对象（不含 `ref`）？
- [ ] 是否避免了跨场景直接依赖 core services？需要跨场景数据时，是否通过 `context` 传入？
- [ ] 场景内共享 hooks 是否只调用了本 scene 的 core services？
- [ ] 全局 hooks（`src/hooks/`）是否没有直接调用任何 services？
- [ ] 跨领域通用服务是否放在 `components/shared/` 下？
- [ ] 组件/Hooks 是否按抽取路径放置？
- [ ] 枚举常量是否使用 `createDict` 工厂？
- [ ] `formData` 是否只包含后端字段？业务派生状态是否放在 `formContext`？纯 UI 状态（`isSubmitting`、`loading`）是否由 hook 管理？
- [ ] 模板中是否有可选链防御（`data?.a?.b`）？应由 models 兜底。
- [ ] 样式是否使用 scoped CSS 或 CSS Modules？

---

## 十一、红线（禁止事项）

| 禁止事项 | 正确做法 |
| --- | --- |
| ❌ `views` 页面中直接写 `axios.get` 或业务逻辑 | 封装在对应 scene 的 `core/` services 中 |
| ❌ `models.js` 中写客户判断 | 移到 `customers.js` 策略 |
| ❌ services 返回 `ref`/`reactive` | 返回纯对象 |
| ❌ services 中直接 `import` 其他 scene 的 core | 通过 `context` 参数接收所需数据；**通用服务可依赖 `components/shared/`** |
| ❌ 场景内共享 hooks 中调用其他 scene 的 core services | 只能调用本 scene 的 core services |
| ❌ 全局 hooks 中直接调用任何 services | 通过参数注入或保持在场景内 |
| ❌ 将场景内 Hooks 直接放入全局 `src/hooks` | 先放场景内，确定无业务依赖再提升 |
| ❌ 跨领域组件放在 `views/{domain}/{scene}/components/` | 提升到 `components/shared/` |
| ❌ `constants.js` 中放可变配置 | 配置放 `configs.js` |
| ❌ 未出现重复就提前抽象 | 遵循"第三次重复再抽象" |
| ❌ 模板中写 `data?.a?.b?.c` 可选链防御 | 由 models 兜底返回默认值，模板直接取值 |
| ❌ UI 状态（`isEdit`、`canSave` 等）混入 `formData` | 交互状态放 `formContext`，`formData` 只对应后端字段 |
| ❌ 老接口返回 `null` 时不做防御 | `items = apiData.items \|\| []`，对 `null` 返回值兜底 |

---

## 十二、快速参考卡

### 目录速查

```
src/
├── views/{domain}/
│   └── {scene}/
│       ├── {page}.vue              # 页面文件
│       ├── core/                   # 业务逻辑
│       │   ├── index.js            # services
│       │   ├── models.js           # 派生状态、规则
│       │   ├── configs.js          # 默认配置
│       │   ├── constants.js        # 常量（createDict）
│       │   ├── apis.js             # 接口
│       │   ├── customers.js        # 客户策略
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
├── stores/
├── routes/
└── utils/
```

### 决策速查

| 问题 | 答案 |
| --- | --- |
| 业务逻辑放哪？ | `views/{domain}/{scene}/core/` |
| 跨领域通用服务放哪？ | `components/shared/{service}/core/` |
| 页面如何消费？ | 调用 services，用 `ref` 包装 |
| 客户差异放哪？ | `customers.js`，`getCustomerLogic(context)` 合并 |
| 组件放哪？ | 页面私有 → scene 共享 → `components/shared/`（跨领域）→ `components/common/`（纯 UI） |
| 页面私有 hooks 放哪？ | `views/{domain}/{scene}/hooks/`，可调用任何 core services |
| 场景内共享 hooks 放哪？ | `views/{domain}/{scene}/hooks/`，只能调用本 scene 的 core services |
| 全局 hooks 放哪？ | `src/hooks/`，不能调用 services，只能参数注入 |
| 枚举常量放哪？ | `constants.js`，使用 `createDict` |
| 默认配置放哪？ | `configs.js` |

### 统一结构速记

```
所有垂直领域 = core | components | hooks

提取方向：components → hooks → core
依赖方向：core → hooks → components
```

### 检查清单速记

1. **页面** 只调 services，不写业务。
2. **models** 是纯函数，无客户判断。
3. **customers** 收口差异逻辑。
4. **services** 返回纯对象，不返回 ref；跨场景数据通过 context 传入。
5. **场景内共享 hooks** 只调本 scene 的 core services。
6. **全局 hooks** 不调任何 services，只能参数注入。
7. **跨领域服务**放 `components/shared/`，**业务逻辑**放 scene 的 `core/`。
