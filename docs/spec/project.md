# 前端业务架构规范

> **版本**：v3.6
> **目标**：解决业务逻辑散落、客户差异污染、代码腐化问题
> **落地方式**：新功能严格遵循，老功能修改时逐步迁移（通过微前端渐进替换）
> **配套规范**：[typescript.md](./typescript.md)（TypeScript 编码规范）
> **示例语言**：文中示例为 JavaScript 以便阅读，实际开发推荐 TypeScript，核心层（`domains/`）必须开启 strict 模式

---

## 一、核心原则

1. **业务逻辑集中**：所有业务规则、API 调用、数据转换、客户差异必须放在 `domains` 目录。
2. **视图层薄薄一层**：页面只负责模板、交互和调用 services，不写业务判断。
3. **客户差异隔离**：通过 `customers.js` 策略模式管理，禁止在通用代码中写 `if (customer === 'A')`。
4. **依赖方向**：
   - 细化场景（如 `order-form`）可依赖同一领域内的基础子域（如 `order`），但基础子域不能依赖细化场景。
   - `services` 不能直接依赖其他领域的 `services`；需要跨领域数据时，通过 `context` 参数传入（`context` 可包含任意扩展字段，如 `contractInfo`）。
   - 领域内共享 hooks 只能调用本领域的 services；跨领域组合由页面级 hooks 或页面组件完成。
   - **任何领域可以依赖 `domains/shared`（跨领域通用业务服务），但 `shared` 不能依赖具体领域。**
   - `domains` 不依赖 `views` 或 `components`；`views` 可以依赖 `domains`。
5. **渐进式落地**：新功能按规范写，老代码不强求全量重构。老模块保留原结构，新模块按本规范在独立子应用中开发，通过微前端（wujie）接入主平台。
6. **架构熔断**：极简页面（纯展示、无联动）允许跳过标准架构直接写在 `views` 中，但一旦增加显隐、联动、客户差异等业务逻辑，必须迁移到 `domains` 标准架构。
7. **按需创建**：不创建空文件，文件内有实际内容时才建立。

---

## 二、目录结构概览

```
src/
├── domains/                          # 业务核心层（纯逻辑，可独立测试）
│   ├── shared/                       # 跨领域通用业务服务（可被任何领域依赖）
│   │   ├── upload/                   # 文件上传服务
│   │   │   ├── index.js              # 导出 services、models
│   │   │   ├── apis.js               # 上传相关接口
│   │   │   └── models.js             # 上传结果模型
│   │   └── form-template/            # 表单模板服务
│   │       ├── index.js
│   │       └── apis.js
│   ├── bidding/                      # 招投标领域
│   │   ├── order/                    # 订单子域（基础模块）
│   │   │   ├── index.js              # 导出 services、models
│   │   │   ├── models.js             # 派生状态、业务规则、计算函数
│   │   │   ├── models.test.js        # models 单元测试
│   │   │   ├── configs.js            # 平台默认配置
│   │   │   ├── constants.js          # 业务常量（枚举、状态映射）
│   │   │   ├── apis.js               # 接口请求
│   │   │   ├── customers.js          # 客户策略
│   │   │   └── customers.test.js     # customers 策略测试
│   │   ├── order-form/               # 订单表单场景（依赖 order）
│   │   ├── order-list/               # 订单列表场景
│   │   ├── order-detail/             # 订单详情场景
│   │   └── ...
│   ├── contract/
│   └── supplier/
│
├── views/                            # 视图层（页面与 UI 相关）
│   ├── bidding/
│   │   ├── order-form/
│   │   │   ├── components/           # 页面私有组件
│   │   │   ├── hooks/                # 页面私有 hooks
│   │   │   └── index.vue
│   │   ├── components/               # 领域内共享组件（多个页面共用）
│   │   ├── hooks/                    # 领域内共享 hooks
│   │   └── ...
│   └── contract/...
│
├── components/                       # 全局组件
│   ├── common/                       # 纯 UI 组件（无业务语义）
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   └── Modal.vue
│   └── business/                     # 跨领域业务组件（可含业务逻辑，但不专属于某个领域）
│       ├── RichTextEditor.vue        # 富文本编辑器（依赖 domains/shared/upload）
│       ├── FormBuilder.vue           # 表单配置化组件
│       ├── AttachmentUploader.vue
│       └── ...
│
├── routes/                           # 路由层（纯配置）
│   ├── index.js                      # 创建路由实例，注册守卫
│   ├── modules/                      # 路由定义（按领域拆分）
│   │   ├── bidding.js
│   │   ├── contract.js
│   │   ├── supplier.js
│   │   └── shared.js                 # 公共路由（登录、404、首页）
│   ├── permission.js                 # 权限守卫（可选，与 index.js 同级）
│   └── constants.js                  # 路由常量（如 parentCode 枚举）
│
├── stores/                           # 全局状态（用户、主题、菜单等）
│   ├── user.js
│   ├── menu.js                       # 菜单数据存储（调用 domains 权限服务过滤）
│   └── ...
├── hooks/                            # 全局通用 hooks（无业务依赖）
│   ├── useDebounce.js
│   └── useLocalStorage.js
├── utils/                            # 工具函数（格式化、深拷贝等）
└── ...
```

### 目录说明

| 目录 | 用途 | 特点 |
| --- | --- | --- |
| `domains/shared/` | 跨领域通用业务服务 | 纯逻辑，可被任何领域依赖，如文件上传、表单模板等 |
| `domains/{domain}/` | 具体领域业务逻辑 | 纯 JS/TS，无 UI 框架依赖，可独立打包测试 |
| `views/` | 页面视图 | 可包含页面私有组件/hooks，允许跨领域调用多个 `domains` |
| `components/common/` | 纯 UI 组件 | 无任何业务词汇，高度可复用 |
| `components/business/` | 跨领域业务组件 | 可依赖 `domains/shared` 或后端服务，但不归属特定领域（无需领域前缀） |
| `routes/` |	路由配置	| 扁平定义，按领域拆分，守卫与路由同级 |
| `hooks/` | 全局通用 hooks | 不依赖业务逻辑，如防抖、存储 |
| `stores/` | 全局状态 | 如用户信息、主题配置 |
| `utils/` | 工具函数 | 纯函数，无副作用 |

---

## 三、各层职责详解

### 3.1 `domains/` 业务核心层

每个子域（基础模块或场景）是一个独立目录，包含以下文件：

| 文件 | 职责 | 约束 |
| --- | --- | --- |
| `constants.js` | 业务常量（枚举、状态映射） | 使用 `createDict` 工厂函数 |
| `configs.js` | 平台默认配置（字段默认值、布局等） | 可被配置中心覆盖 |
| `models.js` | 同步纯函数：派生状态、业务规则、计算函数 | 不依赖 Vue，无副作用 |
| `apis.js` | 接口请求封装 | 只做网络调用，不处理数据 |
| `customers.js` | 客户策略（`defaultStrategy` + `getCustomerLogic`） | 仅同步函数 |
| `index.js` | 定义 services（异步调度），导出 services 和 models | 唯一异步层，返回纯对象 |

**特别说明 - `domains/shared/`**：
- 用于存放跨领域通用的业务服务（如文件上传、权限校验、表单模板管理等）。
- 内部每个服务按子目录组织（如 `upload/`、`permission/`、`form-template/`），结构与其他 `domains` 一致（含 `index.js`、`apis.js`、`models.js` 等）。
- 任何领域（如 `bidding`、`contract`）可以依赖 `domains/shared` 中的服务，但 `shared` 不能依赖具体领域。
- **依赖边界**：`shared` 可依赖 `utils/`，不可依赖 `stores/` 或具体领域。
- 示例：`bidding/order-form` 中的 services 可以调用 `shared/upload` 的 services 来上传附件。

#### 示例：`domains/shared/upload/index.js`

```javascript
// domains/shared/upload/index.js
import * as apis from './apis'
import * as models from './models'

async function uploadFile(file, context) {
  const res = await apis.upload(file)
  return models.createUploadResult(res)
}

export const uploadServices = { uploadFile }
export const uploadModels = models
```

#### 示例：在业务领域中调用共享服务

```javascript
// domains/bidding/order/index.js
import { uploadServices } from '@/domains/shared/upload'

async function submitForm(formData, context) {
  // 上传附件
  if (formData.attachment) {
    const uploadResult = await uploadServices.uploadFile(formData.attachment, context)
    formData.attachmentUrl = uploadResult.url
  }
  // ... 其他业务逻辑
  return apis.submit(formData)
}
```

#### 示例：`domains/shared/permission/index.js`

```javascript
// domains/shared/permission/index.js
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

#### 3.1.1 `constants.js` - 业务常量

```javascript
// domains/bidding/order/constants.js
import { createDict } from "@/utils/dict";

export const orderStatusDict = createDict({
  DRAFT: { value: 0, label: "草稿", color: "gray" },
  SUBMITTED: { value: 1, label: "已提交", color: "blue" },
  APPROVED: { value: 2, label: "已通过", color: "green" },
  REJECTED: { value: 3, label: "已驳回", color: "red" },
});
```

#### 3.1.2 `configs.js` - 平台默认配置

```javascript
// domains/bidding/order/configs.js
export const defaultFieldConfig = {
  supplier: { label: "供应商", visible: true, required: true },
  sampleRequired: { label: "是否需要样品", visible: false, required: false },
};
```

#### 3.1.3 `models.js` - 派生状态与业务规则

```javascript
// domains/bidding/order/models.js
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

#### 3.1.4 `apis.js` - 接口请求

```javascript
// domains/bidding/order/apis.js
import request from "@/utils/request";

export function getOrderDetail(id) {
  return request.get(`/bidding/order/${id}`);
}

export function submitOrder(data) {
  return request.post("/bidding/order/submit", data);
}
```

#### 3.1.5 `customers.js` - 客户策略

```javascript
// domains/bidding/order/customers.js
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

#### 3.1.6 `index.js` - services 定义与导出

```javascript
// domains/bidding/order/index.js
import * as apis from "./apis";
import * as models from "./models";
import * as configs from "./configs";
import { getCustomerLogic } from "./customers";

async function fetchRemoteConfig(context) {
  // configCenter 为全局配置中心单例，从外部导入
  const remote = await configCenter.get("bidding.order", context);
  return { ...configs.defaultFieldConfig, ...remote };
}

async function initForm(id, context) {
  const apiData = id ? await apis.getOrderDetail(id) : {};
  const formData = { id: apiData.id || "", items: apiData.items || [], remark: apiData.remark || "" };
  const modelContext = models.createFormContext(apiData);
  const uiContext = models.createUIContext(formData);
  // 组装完整 formContext：models 派生 + 服务层已知信息
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
- services 不能直接依赖其他领域的 services；需要跨领域数据时，通过 `context` 参数传入。
- **可以依赖 `domains/shared` 中的 services**（如 `uploadServices`）。

#### formData / formContext 分离

services 返回的数据必须区分**后端字段**和**交互状态**：

| 数据 | 用途 | 约束 |
| --- | --- | --- |
| `formData` | 100% 对应后端字段，可直接提交 | 不含 UI 状态、不含业务判断结果 |
| `formContext` | 业务派生的交互状态（编辑态、状态上下文、显隐联动等） | 不提交给后端，由 services 层返回 |
| 视图层 hook | 纯 UI 交互状态（`isSubmitting`、`loading` 等） | 由 `useOrderForm` 等 hook 管理，不进 services |

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
- 跨领域数据通过 `context` 传入，禁止 services 直接 import 其他领域

#### 3.1.7 TypeScript 类型声明

> 完整规范见 [typescript.md](./typescript.md)，此处为核心层要点。

- 类型定义应**就近声明**，与实现代码放在同一目录。
- 可使用 `.d.ts` 文件或 JSDoc 注释。
- 禁止将所有类型集中到单一的 `src/types/` 目录。
- **核心层（`domains/`）必须开启 strict 模式**，完整声明 interface，确保下游补全体验。
- 领域模型类型就近手写，API 响应类型就近声明（有 OpenAPI 工具链时可自动生成）。

```typescript
// domains/bidding/order/models.d.ts
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

#### 3.1.8 测试规范

`domains/` 层是纯函数，可独立测试。测试应遵循以下原则。

**测试文件位置**：与被测文件同目录，命名为 `*.test.js` 或 `*.test.ts`。
**测试工具**：Vitest（与 Vite 生态一致）。

```
domains/bidding/order/
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
// domains/bidding/order/models.test.ts
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

### 3.2 `views/` 视图层

#### 3.2.1 页面文件 (`index.vue`)

```vue
<!-- views/bidding/order-form/index.vue -->
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
import { orderServices } from "@/domains/bidding/order";
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
- 禁止导入 `domains` 内部的 `models.js` 或 `apis.js`，统一从 `index.js` 导入 services。
- 使用 scoped CSS 或 CSS Modules，避免全局样式污染。

#### 3.2.2 页面私有 `components/` 与 `hooks/`

页面私有组件和 hooks 仅在该页面内使用。

```javascript
// views/bidding/order-form/hooks/useOrderForm.js
import { ref } from "vue";

// 通过参数注入 services，保持 hook 通用性
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

#### 3.2.3 领域内共享 `components/` 与 `hooks/`

当同一领域内多个页面需要复用组件或 hook 时，提升到 `views/{domain}/components/` 或 `views/{domain}/hooks/`。

**领域内共享 hooks 只能调用本领域的 services**（不能跨领域直接调用）。

```javascript
// views/bidding/hooks/useBiddingPermission.js
import { permissionServices } from "@/domains/shared/permission";
export function useBiddingPermission() {
  return { hasPermission: permissionServices.hasPermission };
}
```

---

### 3.3 全局目录

#### 3.3.1 `components/common/` - 纯 UI 组件

无任何业务语义的组件（Button、Input、Modal 等）。

#### 3.3.2 `components/business/` - 跨领域业务组件

存放**不专属于某个具体领域**但含有业务逻辑的通用组件（如富文本编辑器、表单配置器、附件上传等）。这些组件可以依赖 `domains/shared` 中的服务，也可以依赖后端 API，但不应该直接依赖具体业务领域（如 `bidding`）。如果组件确实需要调用具体领域服务，应通过参数注入或插槽方式解耦。

**示例**：

```vue
<!-- components/business/RichTextEditor.vue -->
<template>
  <div>
    <div ref="editor"></div>
    <button @click="uploadImage">上传图片</button>
  </div>
</template>

<script setup>
import { uploadServices } from '@/domains/shared/upload';
const props = defineProps(['value', 'context']);
const emit = defineEmits(['update:value']);

async function uploadImage(file) {
  const res = await uploadServices.uploadFile(file, props.context || {});
  // 插入编辑器
}
</script>
```

#### 3.3.3 `hooks/` - 全局通用 hooks

与业务无关的通用组合式函数（如 `useDebounce`、`useLocalStorage`），**不依赖任何 `domains` 的 services**。需要通过业务能力时，采用参数注入方式。

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

#### 3.3.4 `stores/` - 全局状态

跨领域共享的全局状态（用户信息、主题等）。

#### 3.3.5 `utils/` - 工具函数

纯函数工具，不依赖业务逻辑。

---

## 四、组件与 Hooks 抽取路径

### 4.1 组件抽取原则

- 同一 UI 逻辑在 **2 处及以上** 出现时考虑提取。
- 优先提取到最小可用范围，不要提前抽象。

### 4.2 组件存放路径

| 复用范围 | 存放位置 | 示例 |
| --- | --- | --- |
| 单个页面内 | `views/{domain}/{page}/components/` | `views/bidding/order-form/components/ItemTable.vue` |
| 同一领域内多个页面 | `views/{domain}/components/` | `views/bidding/components/SupplierCard.vue` |
| 跨领域复用（通用业务） | `src/components/business/` | `src/components/business/RichTextEditor.vue` |
| 完全通用（无业务语义） | `src/components/common/` | `src/components/common/Button.vue` |

### 4.3 Hooks 抽取路径与调用规则

| 复用范围 | 存放位置 | 允许调用的 services | 示例 |
| --- | --- | --- | --- |
| 单个页面内 | `views/{domain}/{page}/hooks/` | ✅ 可调用任何领域 services | `views/bidding/order-form/hooks/useOrderFormWithContract.js` |
| 同一领域内多个页面 | `views/{domain}/hooks/` | ✅ 只能调用本领域 services | `views/bidding/hooks/useBiddingPermission.js` |
| 跨领域复用（无业务依赖） | `src/hooks/` | ❌ 不能调用 services，通过参数注入 | `src/hooks/useFetch.js` |
| 跨领域复用（有业务依赖） | 不应直接共享 Hook；应由页面级组合实现 | — | — |

**约束**：
- 页面私有 hooks 可以自由组合任意领域 services，用于处理该页面的复杂交互。
- 领域内共享 hooks 必须保持内聚，只能调用本领域 services，不得跨领域直接依赖。
- 全局 hooks 必须保持纯净，只能通过参数接收业务能力。

---

## 五、Services 与 Hooks 的分工

### 5.1 职责划分

| 类型 | 职责 | 位置 | 依赖规则 | 返回 |
| --- | --- | --- | --- | --- |
| **services** | 业务逻辑：API、数据转换、规则判断、客户策略 | `domains/{domain}/{sub-domain}/index.js` | 可依赖同领域其他 services（细化→基础），不可跨领域直接依赖；需要跨领域数据时通过 `context` 参数传入；**可依赖 `domains/shared`** | 纯对象，不含响应式 |
| **hooks（页面私有）** | 视图逻辑：响应式封装、状态管理、调用 services | `views/{domain}/{page}/hooks/` | **可调用任何领域 services** | 响应式数据 + 方法 |
| **hooks（领域共享）** | 视图逻辑：响应式封装、状态管理、调用 services | `views/{domain}/hooks/` | **只能调用本领域 services** | 响应式数据 + 方法 |
| **hooks（全局）** | 通用组合式函数，与业务无关 | `src/hooks/` | **不可调用 services**，只能通过参数注入 | 响应式数据 + 方法 |

### 5.2 详细说明

#### services

- 不跨领域直接依赖其他 services。如需其他领域的数据，应在 `context` 参数中声明，由调用方传入。
- 细化场景可依赖同一领域内的基础子域（如 `order-form` 依赖 `order`）。
- **可以依赖 `domains/shared` 中的 services**（如文件上传、表单模板服务）。
- 返回纯对象，供视图层包装。

#### 页面私有 hooks

- 可以直接调用任何领域的 services，用于处理该页面的特定组合逻辑（如同时加载 bidding 和 contract 的数据）。
- 可以包含 `loading`、`error` 等 UI 状态管理。
- 可调用全局 stores、其他 hooks。

#### 领域内共享 hooks

- 只能调用本领域的 services，保持领域内聚。
- 如果某个逻辑需要跨领域数据，应将该逻辑放在页面私有 hooks 中，而不是领域共享 hook。

#### 全局 hooks

- 必须保持业务无关，不能直接依赖任何 `domains` 下的 services。
- 如果需要业务能力，应通过参数注入（例如传入一个 `fetch` 函数）。
- 适用于 `useDebounce`、`useLocalStorage`、`useMediaQuery` 等。

### 5.3 示例

```javascript
// ✅ 页面私有 hooks 可调用任何领域 services
// views/bidding/order-form/hooks/useOrderWithContract.js
import { ref } from 'vue'
import { orderServices } from '@/domains/bidding/order'
import { contractServices } from '@/domains/contract/sign'
export function useOrderWithContract(orderId, contractId) {
  const loading = ref(false)
  const orderData = ref(null)
  const contractData = ref(null)
  const load = async () => {
    loading.value = true
    const orderRes = await orderServices.initForm(orderId, {})
    const contractRes = await contractServices.initForm(contractId, {})
    orderData.value = orderRes.formData
    contractData.value = contractRes.formData
    loading.value = false
  }
  return { loading, orderData, contractData, load }
}

// ✅ 领域内共享 hooks 只能调用本领域 services
// views/bidding/hooks/useBiddingPermission.js
import { permissionServices } from '@/domains/shared/permission'
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

## 六、客户策略（customers.js）设计规范

### 6.1 定位与职责

- 集中管理客户、灰度、租户等维度的业务差异。
- 提供 `defaultStrategy` 和 `getCustomerLogic(context)`。
- `context` 参数可包含任意扩展信息（如 `contractInfo`），用于策略判断。

### 6.2 文件结构

```javascript
// domains/bidding/order/customers.js
import { needApprove as defaultNeedApprove, calcTotal } from "./models";

export const defaultStrategy = { needApprove: defaultNeedApprove };
const companyAStrategy = {
  needApprove: (formData, context) => {
    const total = calcTotal(formData.items);
    // context 中可包含 contractInfo 等
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

### 6.3 在 services 中使用

```javascript
// domains/bidding/order/index.js
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

## 七、Code Review 检查清单

- [ ] 业务逻辑是否写在 `domains` 中？
- [ ] `views` 或 `components` 中是否有直接调用 `apis` 或写业务判断？
- [ ] `models.js` 是否只包含同步纯函数，无副作用？
- [ ] `models.js` 中是否有客户判断（`if customer === 'A'`）？
- [ ] 客户差异是否通过 `customers.js` 策略实现？
- [ ] services 是否返回纯对象（不含 `ref`）？
- [ ] 是否避免了跨领域直接依赖 services？需要跨领域数据时，是否通过 `context` 传入？
- [ ] 领域内共享 hooks 是否只调用了本领域的 services？
- [ ] 全局 hooks（`src/hooks/`）是否没有直接调用任何 services？
- [ ] 通用业务组件（如富文本编辑器）是否放在 `components/business/` 而不是具体领域内？
- [ ] 跨领域通用业务服务是否放在 `domains/shared/` 下？
- [ ] 组件/Hooks 是否按抽取路径放置？
- [ ] 跨领域复用组件是否放在 `components/business/`（无需领域前缀）？
- [ ] 枚举常量是否使用 `createDict` 工厂？
- [ ] `formData` 是否只包含后端字段？业务派生状态是否放在 `formContext`？纯 UI 状态（`isSubmitting`、`loading`）是否由 hook 管理？
- [ ] 模板中是否有可选链防御（`data?.a?.b`）？应由 models 兜底。
- [ ] 样式是否使用 scoped CSS 或 CSS Modules？

---

## 八、红线（禁止事项）

| 禁止事项 | 正确做法 |
| --- | --- |
| ❌ `views` 中直接写 `axios.get` 或业务逻辑 | 封装在 `domains` 的 services 中 |
| ❌ `models.js` 中写客户判断 | 移到 `customers.js` 策略 |
| ❌ services 返回 `ref`/`reactive` | 返回纯对象 |
| ❌ services 中直接 `import` 其他领域的 services | 通过 `context` 参数接收所需数据；**通用服务可依赖 `domains/shared`** |
| ❌ 基础子域依赖细化场景 | 只能反向依赖 |
| ❌ 领域内共享 hooks 中调用其他领域的 services | 只能调用本领域 services |
| ❌ 全局 hooks 中直接调用任何 services | 通过参数注入或保持在领域内 |
| ❌ 将领域内 Hooks 直接放入全局 `src/hooks` | 先放领域内，确定无业务依赖再提升 |
| ❌ 跨领域组件放在 `views/{domain}/components/` | 提升到 `components/business/`（无需领域前缀） |
| ❌ `constants.js` 中放可变配置 | 配置放 `configs.js` |
| ❌ 未出现重复就提前抽象 | 遵循”第三次重复再抽象” |
| ❌ 模板中写 `data?.a?.b?.c` 可选链防御 | 由 models 兜底返回默认值，模板直接取值 |
| ❌ UI 状态（`isEdit`、`canSave` 等）混入 `formData` | 交互状态放 `formContext`，`formData` 只对应后端字段 |
| ❌ 老接口返回 `null` 时不做防御 | `items = apiData.items \|\| []`，对 `null` 返回值兜底 |

---

## 九、快速参考卡

### 目录速查

```
src/
├── domains/
│   ├── shared/                     # 跨领域通用业务服务
│   │   ├── upload/
│   │   └── form-template/
│   └── {domain}/{sub-domain}/       # 具体领域子域/场景
│       ├── index.js                 # services
│       ├── models.js                # 派生状态、规则
│       ├── configs.js               # 默认配置
│       ├── constants.js             # 常量（createDict）
│       ├── apis.js                  # 接口
│       └── customers.js             # 客户策略
├── views/{domain}/{page}/
│   ├── index.vue
│   ├── components/
│   └── hooks/
├── components/{common,business}/
├── hooks/                           # 全局通用（无业务依赖）
├── stores/
└── utils/
```

### 决策速查

| 问题 | 答案 |
| --- | --- |
| 业务逻辑放哪？ | `domains/{domain}/{sub-domain}/` |
| 跨领域通用业务服务放哪？ | `domains/shared/` |
| 页面如何消费？ | 调用 services，用 `ref` 包装 |
| 客户差异放哪？ | `customers.js`，`getCustomerLogic(context)` 合并 |
| 组件放哪？ | 页面私有 → 领域共享 → `components/business/`（通用业务组件） |
| 页面私有 hooks 放哪？ | `views/{domain}/{page}/hooks/`，可调用任何 services |
| 领域内共享 hooks 放哪？ | `views/{domain}/hooks/`，只能调用本领域 services |
| 全局 hooks 放哪？ | `src/hooks/`，不能调用 services，只能参数注入 |
| 枚举常量放哪？ | `constants.js`，使用 `createDict` |
| 默认配置放哪？ | `configs.js` |

### 检查清单速记

1. **views** 只调 services，不写业务。
2. **models** 是纯函数，无客户判断。
3. **customers** 收口差异逻辑。
4. **services** 返回纯对象，不返回 ref；跨领域数据通过 context 传入。
5. **领域内共享 hooks** 只调本领域 services。
6. **全局 hooks** 不调任何 services，只能参数注入。
7. **通用业务组件**放 `components/business/`，**通用业务服务**放 `domains/shared/`。

---

## 十、路由组织规范（新增）

### 10.1 核心原则

1. **路由扁平定义**：所有路由在同一层级，不嵌套 `children`，适配菜单可配置架构。
2. **按领域拆分模块**：每个领域独立一个文件，位于 `routes/modules/` 下。
3. **与 `views` 目录对齐**：路由的 `name`、`path`、`component` 导入路径保持一致的命名规则。
4. **通过 `meta` 携带归属信息**：使用 `parentCode` 字段标识该路由归属的模块，便于运营配置菜单时关联。
5. **路由守卫与路由定义同级**：守卫逻辑写在 `routes/permission.js` 等文件中，无需创建 `guards/` 子目录。
6. **权限判断依赖领域服务**：守卫调用 `domains/shared/permission` 服务，不自行实现业务逻辑。

### 10.2 目录结构

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

### 10.3 路由定义示例

```javascript
// routes/modules/bidding.js
import { PARENT_CODE } from '../constants';

export default [
  {
    path: '/bidding/order-form/:id?',
    name: 'BiddingOrderForm',
    component: () => import('@/views/bidding/order-form/index.vue'),
    meta: {
      title: '订单表单',
      parentCode: PARENT_CODE.BIDDING_ORDER,
      permission: 'bidding:order:edit',
    },
  },
  {
    path: '/bidding/order-list',
    name: 'BiddingOrderList',
    component: () => import('@/views/bidding/order-list/index.vue'),
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

### 10.4 权限守卫示例

```javascript
// routes/permission.js
import { permissionServices } from '@/domains/shared/permission';

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

### 10.5 路由入口组装

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

### 10.6 菜单数据存储（store）

```javascript
// stores/menu.js
import { defineStore } from 'pinia';
import { permissionServices } from '@/domains/shared/permission';

export const useMenuStore = defineStore('menu', {
  state: () => ({
    rawMenus: [], // 从后端获取的原始菜单数据
  }),
  getters: {
    filteredMenus: (state) => {
      // 调用权限服务过滤菜单
      return permissionServices.filterMenusByPermission(state.rawMenus);
    },
  },
});
```

### 10.7 与老代码的过渡

- **新功能**：严格按照上述规范组织路由、守卫、菜单 store。
- **老功能**：逐步迁移，先将路由定义拆分到 `modules/`，再逐步替换守卫中的硬编码权限判断为调用 `permissionServices`。

---