---
paths:
  - "**/packages/**/*.ts"
  - "!**/*.test.ts"
---

# 编码规范 - 领域层

## 一、核心分层与数据流向

`constants → domainModels → sceneModels → index.ts (sceneServices) → view`

## 二、命名规范

| 类型     | 命名                      | 示例                |
| -------- | ------------------------- | ------------------- |
| 常量     | `{domain}Constants`       | `quoteConstants`    |
| 领域事实 | `{domain}Models`          | `quoteModels`       |
| 场景模型 | `{domain}{Scene}Models`   | `quoteFormModels`   |
| 场景服务 | `{domain}{Scene}Services` | `quoteFormServices` |

## 三、表单场景约束

- `formData`：100% 对应后端字段
- `formContext`：交互状态（`statusCtx`、`uiContext`）
- ❌ 禁止将 UI 状态混入 `formData`

```typescript
// formData — 纯净数据，直接对应后端字段
export interface QuoteFormData {
  id?: string | number;
  status?: string | number;
  remark?: string;
  products: ProductItem[];
}

// formContext — 交互状态，不提交给后端
export interface QuoteFormContext {
  isEdit: boolean;
  isSubmitting: boolean;
  statusCtx: StatusContext;
  uiContext: UiFacts;  // 显隐、置灰等联动布尔值
}
```

## 四、领域事实约束

- 输入原子值，输出增强值
- 只能导入 `{domain}Constants`
- ❌ 禁止依赖接口结构
- ❌ 禁止 `this`、禁止响应式 API

```typescript
import { quoteStatusDict } from "./quote-constants";

function createStatusContext(statusValue: string | number | undefined | null) {
  const matchedItem = Object.values(quoteStatusDict).find(
    (item) => item.value === statusValue,
  );
  const val = matchedItem ? matchedItem.value : "";
  return {
    value: val,
    label: matchedItem ? matchedItem.label : "未知状态",
    isDraft: val === quoteStatusDict.DRAFT.value || val === quoteStatusDict.REJECTED.value,
    isPublished: val === quoteStatusDict.PUBLISHED.value,
  };
}

export const quoteModels = { createStatusContext };
```

## 五、场景模型约束

- 调用领域事实组装 Context
- ❌ 禁止重写底层通用逻辑

```typescript
import { quoteModels } from "./quote-common-models";

function createFormData(raw, options) {
  const formData = { id: raw.id || "", products: raw.products || [] };
  const statusCtx = quoteModels.createStatusContext(formData.status);  // 调用领域事实
  const formContext = {
    isEdit: options.isEdit ?? true,
    statusCtx,
    uiContext: { canSave: formData.products.length > 0 },
  };
  return { formData, formContext };
}
```

## 六、常量层约束

- 对象字典必须加 `as const`，同时导出类型和选项数组

```typescript
export const quoteStatusDict = {
  DRAFT: { value: 0, label: "草稿" },
  PENDING_APPROVAL: { value: 1, label: "审批中" },
  PUBLISHED: { value: 2, label: "已发布" },
} as const;

export type QuoteStatusValue = (typeof quoteStatusDict)[keyof typeof quoteStatusDict]["value"];
export const QUOTE_STATUS_OPTIONS = Object.values(quoteStatusDict);  // 视图层直接用
```

## 七、服务层约束

- 服务层位于 `index.ts`
- `index.ts` 底部统一导出 services 和 models
- ❌ 禁止单独创建 `services.ts`

```typescript
// index.ts
import { quoteFormModels } from "./quote-form-models";

async function getDetail(id) {
  const rawData = await fetchRemoteQuoteDetail(id);
  return quoteFormModels.createFormData(rawData, { isEdit: true });
}

const quoteFormServices = { getDetail };

// 底部统一导出
export { quoteFormServices, quoteFormModels };
export type { QuoteFormData, QuoteFormContext } from "./quote-form-models";
```

## 八、视图层消费规范

- **表单场景**：解构 `{ formData, formContext }`
- **其他场景**：直接使用返回的 Context
- ❌ 禁止模板中写业务判断
- ❌ 禁止可选链防御链

## 九、架构熔断

极简页面允许熔断标准架构，但增加显隐/联动后必须重构。

## 十、跨领域依赖

领域之间**禁止直接引用内部实现**，必须通过接口声明依赖。

**❌ 直接依赖**：
```typescript
// packages/quote/domains/models.ts
import { userModels } from '@/packages/user/domains/models'  // 引用 user 内部实现
export const quoteModels = {
  canEdit(quote, user) {
    return userModels.isAdmin(user)  // user 内部改了 quote 就挂
  }
}
```

**✅ 通过接口**：
```typescript
// packages/quote/domains/types.ts
export interface UserAccessor {
  isAdmin(user: unknown): boolean  // quote 自己定义需要什么能力
}

// packages/quote/domains/models.ts
export const quoteModels = {
  canEdit(quote, user: UserAccessor) {
    return user.isAdmin(user)  // 只依赖接口，不依赖 user 的实现
  }
}

// 组装层（views 或路由层）负责注入
import { userModels } from '@/packages/user/domains/models'
const userAccessor: UserAccessor = { isAdmin: userModels.isAdmin }
```

**原则**：每个领域声明自己需要什么（接口），而不是自己去拿什么（直接 import）。

