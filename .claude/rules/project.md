---
paths:
  - "src/**/*"
  - "docs/**/*.md"
---

> 完整规范见 [docs/spec/project.md](../../docs/spec/project.md)，本文为自动加载的精简版。

# 项目规范（精简版）

## 技术栈

Vue 3 + TypeScript + Vite | 微前端：wujie | UI：Antdv Next | 包管理：pnpm

## 三层架构（按变化频率分层）

| 层级 | 目录 | 职责 | 框架依赖 |
|------|------|------|---------|
| 基础设施层 | `utils/` | 纯工具函数 | 无 |
| 领域业务层 | `domains/` | 业务规则、API、数据转换 | 无 |
| 应用层 | `views/`、`components/`、`hooks/`、`routes/`、`stores/` | 页面视图、UI 组件、路由 | Vue |

**底座**：`utils/` + `domains/` 构成与框架无关的项目底座。

## 核心原则

1. **按变化频率分层**：基础设施层、领域业务层、应用层隔离，各自演进
2. **领域逻辑框架无关**：`domains/` 是纯 JS/TS，不依赖 Vue
3. **视图层薄薄一层**：页面只负责模板、交互和调用 services，不写业务判断
4. **客户差异隔离**：通过 `customers.js` 策略模式管理，禁止 `if (customer === 'A')`
5. **渐进式提取**：页面 → components → hooks → domains，先有血肉再长骨架
6. **依赖方向**：应用层 → 领域层 → 基础设施层，反向禁止
7. **渐进式落地**：新功能按规范写，老代码不强求全量重构
8. **架构熔断**：极简页面允许跳过标准架构，增加联动后必须重构
9. **按需创建**：不创建空文件

## 领域层级

- **domain**（业务领域）：bidding、contract、supplier
- **scene**（业务场景）：order、sign
- **page**（具体页面）：order-form、order-list、order-detail

## 目录结构

```
src/
├── domains/{domain}/{scene}/     # 领域业务逻辑
│   ├── index.js                  # services
│   ├── models.js                 # 派生状态、规则
│   ├── configs.js                # 默认配置
│   ├── constants.js              # 常量（createDict）
│   ├── apis.js                   # 接口
│   └── customers.js              # 客户策略
├── views/{domain}/{scene}/
│   ├── {page}.vue                # 页面文件
│   ├── components/               # scene 共享组件
│   └── hooks/                    # scene 共享 hooks
├── components/                   # 跨领域复用组件
├── hooks/                        # 全局通用（无业务依赖）
├── routes/
├── stores/
└── utils/
```

## 依赖方向（红线）

- ✅ `views` → `domains` → `utils`
- ✅ `domains/{domain}` → `domains/shared/`
- ✅ `domains/{domain}/{scene}` → `domains/{domain}/{base-scene}`（细化→基础）
- ❌ `domains` → `views`、`components`
- ❌ `domains/{base}` → `domains/{scene}`（基础→细化）
- ❌ 跨领域 services 直接 import（通过 `context` 参数传入）

## 历史遗留坑点

1. 禁用 Mixins：Vue 2 页面禁止引入新 Mixins
2. 大客户定制代码：`if (isXxxCustomer)` 包裹的代码禁止删除或重构
3. 接口空数据：部分老接口返回 `null` 而非 `[]`，注意防御
