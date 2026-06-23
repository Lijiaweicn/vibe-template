# 架构规则

## 严重等级

| severity    | 含义                     |
| ----------- | ------------------------ |
| blocker     | 确定会造成问题           |
| risk        | 高概率产生维护/运行风险  |
| improvement | 优化建议                 |
| uncertain   | 上下文不足，需要人工判断 |

## 1.1 放置位置

共享判断优先级：业务语义 > 变化来源 > 复用范围。引用次数仅作辅助。

> 当共享判断与就近放置冲突时，以业务语义为准，另一方标记 uncertain。

## 1.2 依赖方向

检查依赖是否符合项目分层架构（如 monorepo 的 packages/libs/projects 分层）。

反向依赖 → severity: blocker。

## 1.3 编排 vs 执行

| 层        | 职责               | 禁止                   |
| --------- | ------------------ | ---------------------- |
| 页面/路由 | 调用、组合、时序   | 业务规则判断、数据转换 |
| service   | 流程编排           | 直接修改响应式状态     |
| model     | 数据转换、领域规则 | 访问基础设施           |
| api       | 请求配置、序列化   | 业务规则判断           |

编排层出现 if/else 业务判断 → severity: blocker。
执行层出现 await 同级响应式赋值 → severity: blocker。

## 1.4 单一职责

一个文件承担 2 种以上不相关职责 → severity: improvement。

## 1.5 store/ 薄层

store 只做：

- 调用 service
- 持有状态
- 派生状态（computed，如 canEdit、isAdmin）

store 中出现业务计算/流程决策 → severity: blocker。

## 1.6 幻觉门禁

- import 的路径/名称不存在 → severity: blocker
- export 的标识符在源文件中未定义 → severity: blocker
- 类型标注引用不存在的类型 → severity: blocker

尽力检查范围：仅检查简单类型（`obj.prop`，`obj` 有明确定义）。泛型、联合类型、`any`/`unknown` 类型跳过，标记 severity: uncertain。

## 1.7 死代码

- 文件级：无任何 import 引用 → severity: blocker
- 函数级：项目内无调用 → severity: improvement
- 变量级：声明后未使用 → severity: uncertain

## 1.8 业务语义判断

当规则依赖"业务语义"判断时：

- 如果能从代码上下文（命名、注释、调用链）确定 → 按规则判定
- 如果无法确定 → severity: uncertain，附上推理过程，请人工判断
