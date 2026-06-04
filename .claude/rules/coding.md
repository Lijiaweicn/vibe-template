---
paths:
  - "**/domains/**/*.ts"
  - "**/common/**/*.ts"
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

**参考：** `@.claude/samples/quote-form-models.ts`

## 四、领域事实约束

- 输入原子值，输出增强值
- 只能导入 `{domain}Constants`
- ❌ 禁止依赖接口结构
- ❌ 禁止 `this`、禁止响应式 API

**参考：** `@.claude/samples/quote-common-models.ts`

## 五、场景模型约束

- 调用领域事实组装 Context
- ❌ 禁止重写底层通用逻辑

**参考：** `@.claude/samples/quote-form-models.ts`

## 六、常量层约束

- 对象字典必须加 `as const`
- 同时导出类型和选项数组
- ❌ 禁止缺少 `as const`

**参考：** `@.claude/samples/quote-constants.ts`

## 七、服务层约束

- 服务层位于 `index.ts`
- `index.ts` 底部统一导出 services 和 models
- ❌ 禁止单独创建 `services.ts`

**参考：** `@.claude/samples/quote-form-index.ts`

## 八、视图层消费规范

- **表单场景**：解构 `{ formData, formContext }`
- **其他场景**：直接使用返回的 Context
- ❌ 禁止模板中写业务判断
- ❌ 禁止可选链防御链

## 九、架构熔断

极简页面允许熔断标准架构，但增加显隐/联动后必须重构。

## 参考样板

- `@.claude/samples/quote-constants.ts`
- `@.claude/samples/quote-common-models.ts`
- `@.claude/samples/quote-form-models.ts`
- `@.claude/samples/quote-form-index.ts`
