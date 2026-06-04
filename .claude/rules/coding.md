---
paths:
  - "**/domains/**/*.ts"
  - "**/common/**/*.ts"
  - "!**/*.test.ts"
---

# 编码规范 - 核心架构层

## 一、核心分层与数据流向

`constants → api → services(index.ts) → models → view`

- **constants**：业务字典，无逻辑
- **models**：纯函数，语义增强，不发请求，不改原数据
- **services**：异步请求 + 调用 models 组合 + 上抛
- **views**：仅渲染，无业务判定

## 二、模型层与服务层约束

1. **无 `this`**：models 和 services 中的函数必须是纯函数，禁止使用 `this`
2. **零响应式依赖**：领域层禁止引入 `ref/reactive/useState` 等响应式 API
3. **动态联动**：高频联动通过视图层的 computed 动态调用模型工厂

## 三、常量字典约束

- 中文字符串/状态映射必须收拢到 `constants.ts`
- 对象字典结尾加 `as const`，同时推导类型和 Options 数组

## 四、模型分级

- **领域事实（common/models）**：跨页面通用的基础计算、状态翻译
- **场景事实（local/models）**：特定页面的显隐、禁用、保存判定
- 场景事实调用通用模型，禁止重写底层逻辑

## 五、命名与导出

- 主工厂统一命名：`createXxxContext`（如 `createFormContext`）
- 主工厂返回完整上下文（业务数据 + uiContext 合一）
- `index.ts` 底部统一导出：`export { xxxServices, xxxModels }`

## 六、架构熔断（防止过度设计）

极简页面（纯静态、无显隐、无联动、无计算）允许：

1. 不创建 `models.ts`
2. services 直接返回 API 的 rawData
3. 视图层使用可选链防御

⚠️ **一旦增加任何显隐或联动，立即重构为标准三级架构**

## 参考样板

- `@.claude/samples/quote-constants.ts`
- `@.claude/samples/quote-common-models.ts`
- `@.claude/samples/quote-form-models.ts`
- `@.claude/samples/quote-form-index.ts`
