---
paths:
  - "src/**/*"
  - "docs/**/*.md"
---

> 完整规范见 [docs/spec/project.md](../../docs/spec/project.md)，本文为自动加载的精简版。

# 项目规范（精简版）

## 技术栈

Vue 3 + TypeScript + Vite | 微前端：wujie | UI：Antdv Next | 包管理：pnpm

## 核心原则

1. **业务逻辑集中**：所有业务规则、API 调用、数据转换放在 `domains` 目录
2. **视图层薄薄一层**：页面只负责模板、交互和调用 services，不写业务判断
3. **客户差异隔离**：通过 `customers.js` 策略模式管理，禁止 `if (customer === 'A')`
4. **依赖方向单向**：`domains` 不依赖 `views`；细化场景可依赖基础子域，反之不行
5. **渐进式落地**：新功能按规范写，老代码不强求全量重构
6. **架构熔断**：极简页面允许跳过标准架构，增加联动后必须重构
7. **按需创建**：不创建空文件

## 目录结构

```
src/
├── domains/                  # 业务核心层（纯逻辑，可独立测试）
│   ├── shared/               # 跨领域通用业务服务（可被任何领域依赖）
│   └── {domain}/{sub-domain}/ # 具体领域子域/场景
├── views/{domain}/{page}/    # 页面视图
├── components/               # 全局组件（common/ + business/）
├── routes/                   # 路由层（纯配置）
├── stores/                   # 全局状态（用户、主题等）
├── hooks/                    # 全局通用 hooks（无业务依赖）
└── utils/                    # 工具函数
```

## 依赖方向（红线）

- ✅ `domains/{domain}` → `domains/shared/`
- ✅ `domains/{domain}` → `domains/{same-domain}/{base}`（细化→基础）
- ✅ `views` → `domains`
- ❌ `domains` → `views`
- ❌ `domains/{base}` → `domains/{scene}`（基础→细化）
- ❌ 跨领域 services 直接 import（通过 `context` 参数传入）

## 历史遗留坑点

1. 禁用 Mixins：Vue 2 页面禁止引入新 Mixins
2. 大客户定制代码：`if (isXxxCustomer)` 包裹的代码禁止删除或重构
3. 接口空数据：部分老接口返回 `null` 而非 `[]`，注意防御
