# TypeScript 编码规范

> **版本**：v1.1
> **配套文档**：[project.md](./project.md)（业务架构规范，v4.0 统一垂直结构）

---

## 一、核心原则

TS 在本项目中的核心使命：**增强核心资产的健壮性、提供高准确度的编辑器代码补全、提升 AI 辅助编程的产出质量**。

核心策略：**核心从严、视图从宽**。严禁脱离业务价值追求极端的类型覆盖率。

---

## 二、分层类型策略

```
┌────────────────────────────────────────────────────────┐
│  核心架构层 = views/**/core/ + components/shared/**/core/│
│            + utils/ + stores/                            │
│  - 策略：严格类型，开启 strict 模式                      │
│  - 必须声明完整的 interface，确保下游补全体验              │
└───────────────────────────┬────────────────────────────┘
                            │ 驱动
                            ▼
┌────────────────────────────────────────────────────────┐
│  业务视图层 = views/（core 以外）+ components/common/    │
│            + components/shared/（core 以外）+ routes/    │
│  - 策略：弱化类型，依赖自动推导，禁止手写复杂体操          │
│  - 有初始值的状态信任编译器推导，不加冗余泛型              │
└────────────────────────────────────────────────────────┘
```

### tsconfig 分层配置

TypeScript 的 tsconfig 是**编译单元**，一个 `tsc` 进程只读一个配置。因此通过两套独立的 tsconfig + 不同编译脚本实现分层：

**`tsconfig.json`**（根配置，`vue-tsc` 默认读取，日常开发用）：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "noImplicitAny": false,
    "strictNullChecks": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
```

**`tsconfig.strict.json`**（独立配置，CI 严格门禁，仅检查核心层）：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/views/**/core/**/*.ts", "src/components/shared/**/core/**/*.ts", "src/utils/**/*.ts", "src/stores/**/*.ts"]
}
```

> 两套配置**互相独立**，不使用 `extends`。`tsconfig.json` 用于日常开发（宽松），`tsconfig.strict.json` 用于 CI 门禁（严格，仅覆盖核心层）。修改公共选项（`target`、`module`、`paths` 等）时需手动同步两份配置。
>
> `module: "NodeNext"` 配合 CI 环境的 Node 运行时。若 Vite 本地开发报模块解析错误，可改为 `"ESNext"`。

**`package.json` 中的检查脚本**：

```json
{
  "scripts": {
    "typecheck": "vue-tsc --noEmit",
    "typecheck:strict": "tsc -p tsconfig.strict.json --noEmit"
  }
}
```

| 命令 | 用途 | 检查范围 |
|------|------|---------|
| `pnpm typecheck` | 开发时宽松检查 | 全项目，放宽 `noImplicitAny` 和 `strictNullChecks` |
| `pnpm typecheck:strict` | CI 严格门禁 | 仅 `views/**/core/`、`components/shared/**/core/`、`utils/`、`stores/`，strict 全家桶 |

> 日常开发用 `typecheck`（宽松，不阻断心流），CI 流水线用 `typecheck:strict`（严格，保护核心层质量）。

---

## 三、类型声明原则

### 3.1 就近声明

类型定义应与实现代码放在同一目录，禁止将所有类型集中到单一的 `src/types/` 目录。

```typescript
// ✅ 就近：types 和实现放在一起
// views/bidding/order/core/models.ts
export interface StatusContext {
  value: number;
  label: string;
  isDraft: boolean;
  canEdit: boolean;
}

export function createStatusContext(status: number): StatusContext {
  // 实现详见 project.md 3.1.3
}
```

### 3.2 API 响应类型

有 OpenAPI 工具链时，优先自动生成。没有时手写即可，关键是**就近存放**，不要集中在 `src/types/`。

### 3.3 领域模型类型

core 层的领域模型（如 `StatusContext`、`FormContext`）不是 API 响应的直接映射，需要手写 interface，放在对应的 `models.ts` 中。

### 3.4 customers.js 与 context 类型

```typescript
// views/bidding/order/core/customers.ts
import type { OrderFormData } from './models'
import type { FieldConfig } from './configs'

export interface ServiceContext {
  customer?: string;
  [key: string]: unknown;
}

export interface OrderStrategy {
  needApprove: (formData: OrderFormData, context: ServiceContext) => boolean;
  modifyConfig: (config: FieldConfig, formData: OrderFormData, context: ServiceContext) => FieldConfig;
}
```

---

## 四、编码实践

### 4.1 推导优先，显式补充

有初始值的状态，信任编译器推导，不加冗余泛型：

```typescript
// ✅ 推导：简单对象有初始值，编译器能推导出完整类型
const filter = ref({ keyword: '', page: 1 })

// ✅ 显式：含空数组或复杂嵌套，需要显式声明以保留语义
// OrderFormData 需就近定义在 domains/bidding/order/models.ts 中
const formData = ref<OrderFormData>({ id: '', items: [], remark: '' })

// ❌ 冗余：初始值已足够推导，显式声明是噪音
const loading = ref<boolean>(false)
```

**边界规则**：
- 初始值为字面量（`''`、`0`、`false`、`{}`）且结构简单 → 推导
- 含空数组 `[]`、`null` 初始值、或需要语义约束 → 显式声明
- 函数参数和返回值 → 显式声明（提升可读性和补全体验）

### 4.2 逃生通道：规范化使用渐进式类型

面对不规范的第三方插件、历史遗留 JS 资产、或极度动态的业务场景时：

```typescript
// ✅ 优先用 unknown（不是 any）
const rawData: unknown = await fetchLegacyApi()

// ✅ 确定上下文后，允许类型断言
const order = rawData as OrderDetail

// ❌ 禁止滥用 any
const rawData: any = await fetchLegacyApi()  // 丢失所有类型信息
```

- 禁止全局 `any`，优先使用 `unknown`
- 允许在完全确定业务逻辑的前提下使用 `as Type` 或非空断言 `!`
- 严禁为了适配编译器而重构本身无误的业务代码

### 4.3 类型体操禁令

视图层禁止手写复杂的高级类型语法：

```typescript
// ❌ 禁止：超过3层的条件类型
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// ❌ 禁止：嵌套映射 + 条件类型组合
type Merged<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U ? U[K] : K extends keyof T ? T[K] : never
}

// ✅ 允许：常见工具类型是正常的
type CreateUser = Omit<User, 'id' | 'createdAt'>
type UserPreview = Pick<User, 'id' | 'name'>
```

**判断标准**：单层 `Omit`、`Pick`、`Partial`、`Required` 是正常用法；嵌套组合或超过3层的条件类型是体操。

---

## 五、Code Review 红线检查表

- [ ] **体操禁令**：视图层是否存在超过3层的条件类型或嵌套映射类型？（必须打平为扁平类型）
- [ ] **推导优先**：有初始值的 `ref`/`reactive` 是否被加了冗余泛型？
- [ ] **核心层严格**：`core/` 下的代码是否具备完整的类型声明？是否有隐式 `any`？
- [ ] **unknown 优先**：不确定类型时是否用了 `unknown` 而非 `any`？

---

## 六、快速参考

| 场景 | 做法 |
|------|------|
| API 响应类型 | 有工具链时自动生成，否则就近手写 |
| 领域模型类型 | 就近手写，在 `core/` 内 |
| 简单 ref 有初始值 | 信任推导，不加泛型 |
| 含空数组/复杂对象 | 显式声明泛型 |
| 不确定的类型 | `unknown`，不是 `any` |
| 视图层复杂类型 | 禁止体操，打平为简单 interface |
| 核心层 | strict 模式，完整类型声明 |
