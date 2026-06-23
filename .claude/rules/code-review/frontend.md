# 前端规则

## 严重等级

| severity    | 含义                     |
| ----------- | ------------------------ |
| blocker     | 确定会造成问题           |
| risk        | 高概率产生维护/运行风险  |
| improvement | 优化建议                 |
| uncertain   | 上下文不足，需要人工判断 |

## 2.1 消除魔法值

以下情况必须用命名常量：

| 场景       | 违规                        | 例外 |
| ---------- | --------------------------- | ---- |
| 状态枚举   | `if (status === 1)`         |      |
| 业务阈值   | `if (amount > 5000)`        |      |
| 字符串标识 | `type === 'purchase_order'` |      |

允许的字面量：基础初始化（`''`、`0`、`false`）、数组下标、分页默认值。

未命名常量 → severity: improvement。

## 2.2 异步错误处理

- `await` 无 try/catch → severity: blocker
- `.catch(() => {})` 空捕获 → severity: blocker

## 2.3 响应式数据解构

`ref`/`reactive` 解构丢失响应性 → severity: blocker。

## 2.4 Props 解构

`defineProps` 解构丢失响应性 → severity: blocker。应使用 `toRefs` 或 getter。

## 2.5 表单状态

- 操作型表单缺少重置逻辑 → severity: blocker
- 提交失败后状态未恢复 → severity: blocker

## 2.6 视图模板

### 红线

- 模板中写业务判断（`v-if="a && b || c"`）→ severity: blocker
- 可选链防御（`data?.a?.b?.c`）→ severity: blocker，应由 models 兜底

### 检查项

模板调用函数，检查：

- 是否有副作用
- 是否高开销
- 是否依赖复杂状态

纯函数调用（如 `formatDate(time)`）允许。

## 2.7 跨领域依赖

检查领域/模块之间的依赖是否符合项目架构规范。

- 领域 A 核心层 → 领域 B 核心层内部文件 → severity: blocker
- 同领域内引用 → 允许
- 通过包入口导入 → 允许

## 2.8 样式

- 非 scoped 样式 → severity: uncertain（项目策略，非工程风险）
- 模板写内联样式 → severity: uncertain

## 2.9 类型安全

重点关注公共边界：

| 场景                         | severity  |
| ---------------------------- | --------- |
| API 返回值未定义类型         | blocker   |
| export 函数参数/返回值无类型 | blocker   |
| composable 参数无类型        | blocker   |
| 第三方库类型缺失用 any       | uncertain |
| 临时适配层用 any             | uncertain |

`any` 出现在公共边界（export、API、composable）→ severity: blocker。
`any` 出现在内部实现 → severity: uncertain。

## 2.10 嵌套层级

if/for/map 回调超过 3 层 → severity: improvement。

## 2.11 函数职责

检查一个函数是否包含多个变化来源、是否同时处理多个业务概念、是否隐藏核心业务判断。

- 超过 50 行 → severity: risk
- 超过 30 行 → severity: improvement
- 混合多个业务概念（校验 + 状态计算 + 权限判断 + UI 处理 + 请求发送）→ severity: risk

纯配置/映射函数例外。

允许：职责明确的编排函数（`submitOrder` 内部调用 `validate` + `create` + `notify`）。

## 2.12 布尔传参

参数含义无法从调用处推断（如 `doSomething(true)`）→ severity: improvement。

对象属性语义明确时允许：`{ enabled: true }`、`setLoading(true)`。

## 2.13 双重否定

`!isNotValid`、`if (!cannotEdit)` → severity: blocker，使用正向命名。

## 2.14 SLAP

一个函数混合 2 种以上抽象层级（请求 + 转换 + 格式化）→ severity: improvement。
