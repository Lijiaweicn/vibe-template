# 质量规则

## 严重等级

| severity    | 含义                     |
| ----------- | ------------------------ |
| blocker     | 确定会造成问题           |
| risk        | 高概率产生维护/运行风险  |
| improvement | 优化建议                 |
| uncertain   | 上下文不足，需要人工判断 |

## confidence 等级

| confidence | 含义                   |
| ---------- | ---------------------- |
| high       | 从代码上下文可确定     |
| medium     | 推断合理但存在例外可能 |
| low        | 上下文不足，需人工确认 |

## 优先级

业务正确性 > 业务意图清晰 > 架构边界 > 维护成本 > 代码形式

## 不检查内容

以下情况不输出：

- 个人编码偏好（命名风格、空行习惯）
- 没有明确收益的重构
- 未来可能发生但当前没有证据的问题
- 仅减少代码行数的抽象
- 设计模式替换建议
- 纯代码风格问题（已有 lint 覆盖）

---

## 一、业务意图保真度

检查代码是否直接表达业务含义，而非通过多层转换隐藏业务意图。

### 1.1 隐式逻辑展开

违规条件：最终结果是简单业务判断，但实现经过多个无业务价值的数据转换，中间步骤只是为了绕开直接表达。

severity: risk

典型违规：

```ts
// 实际含义：wb === 'purchaser'
(wb) => identity[WORKBENCH_META[wb].identityKey];
```

建议改为：

```ts
(wb) => wb === WORKBENCH.PURCHASER;
```

判断原则：不是禁止映射。如果映射本身表达业务模型，则允许。

允许：

```ts
// 权限映射本身是领域模型
permissionMap[user.role];
```

不推荐：

```ts
// 最终只是 type === xxx
statusConfig[type].enabledMap[key].value;
```

### 1.2 认知路径长度

检查理解一段业务行为需要跳转多少层。

违规条件：理解一个业务行为需要查看多个常量文件、跟踪多个对象转换、进入多个 helper、反推变量来源，且最终逻辑简单。

severity: improvement（路径长但逻辑复杂）/ risk（路径长且逻辑简单）

### 1.3 无价值抽象

检查是否存在只有一个调用方、没有变化来源、只是包裹已有函数的抽象。

severity: improvement

典型违规：

```ts
const isTrue = () => true;
const checkPermission = () => hasPermission(user, 'edit');
```

---

## 二、前端专项检查

### 状态同步

`watch(props, sync state)` 是否覆盖用户输入场景 → severity: blocker。

### 异步竞态

连续请求 A、B，A 返回后是否覆盖 B 的结果 → severity: risk。

### 生命周期

`addEventListener` 无对应 `removeEventListener` → severity: blocker。
`setInterval` 无对应 `clearInterval` → severity: blocker。

### 请求状态

```
loading = true
await request
loading = false
```

异常路径是否恢复 loading → severity: blocker。

---

## 三、输出格式

每条 issue 的结构：

```json
{
  "file": "src/store.ts",
  "line": 35,
  "rule": "1.5 store-boundary",
  "severity": "risk",
  "confidence": "high",
  "category": "architecture",
  "problem": "store 直接调用业务 service",
  "reasoning": "状态层承担流程编排职责",
  "suggestion": "移动到 service 层"
}
```

### 业务意图问题输出

对于业务意图类问题，必须展示从实现到业务含义的路径：

```json
{
  "file": "src/stores/workbench.ts",
  "line": 12,
  "rule": "1.1 隐式逻辑展开",
  "severity": "risk",
  "confidence": "high",
  "category": "quality",
  "problem": "通过多层映射隐藏简单业务判断",
  "current": "(wb) => identity[WORKBENCH_META[wb].identityKey]",
  "meaning": "wb === 'purchaser'",
  "reasoning": "WORKBENCH_META[wb].identityKey 最终返回的只是 workbench 类型标识",
  "suggestion": "直接表达业务判断"
}
```

### 不确定项输出

当 severity 为 uncertain 时，必须附带：

```json
{
  "severity": "uncertain",
  "confidence": "low",
  "reasoning": "无法确定该 if/else 是业务逻辑还是状态切换",
  "ask": "请确认此处是否需要调整"
}
```
