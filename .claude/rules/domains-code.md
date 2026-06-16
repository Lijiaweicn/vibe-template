---
paths:
  - "**/domains/**/*.{js,ts}"
  - "!**/*.test.{js,ts}"
---

> 完整规范见 [docs/spec/project.md](../../docs/spec/project.md) 第六章，本文为自动加载的精简版。

# 领域编码规范（精简版）

## 分层链路

```
constants → models → customers → services(index.js) → view
```

## 文件职责

| 文件 | 职责 | 关键约束 |
|------|------|---------|
| `constants.js` | 业务常量、枚举 | 使用 `createDict` 工厂 |
| `configs.js` | 平台默认配置 | 可被配置中心覆盖 |
| `models.js` | 派生状态、业务规则 | 纯函数，无副作用，不依赖 Vue |
| `apis.js` | 接口请求封装 | 只做网络调用，不处理数据 |
| `customers.js` | 客户差异策略 | 仅同步函数 |
| `index.js` | services 定义与导出 | 唯一异步层，返回纯对象 |

## formData / formContext 分离（红线）

- `formData`：100% 对应后端字段，可直接提交
- `formContext`：业务派生的交互状态（`isEdit`、`statusCtx`、`uiContext`）
- 视图层 hook 管理纯 UI 状态（`isSubmitting`、`loading`），不进 services
- ❌ 禁止将 UI 状态混入 `formData`

## 禁止事项

| ❌ 错误 | ✅ 正确 |
|---------|--------|
| `models.js` 中写客户判断 | 移到 `customers.js` 策略 |
| services 返回 `ref`/`reactive` | 返回纯对象 |
| services 直接 import 其他领域 services | 通过 `context` 参数传入 |
| 模板中写 `data?.a?.b?.c` 可选链防御 | 由 models 兜底返回默认值 |
| 基础场景依赖细化场景 | 只能反向依赖 |

## 跨领域依赖

领域之间禁止直接引用内部实现，必须通过接口声明依赖。通用服务放 `domains/shared/`，任何领域可依赖 `shared`，`shared` 不依赖具体领域。
