# Vibe Template

AI 协作开发的前端项目模板，基于三层架构和 VBW 工作流，让 AI 深度参与需求规划、代码开发和质量保障。

**注意：本仓库是配置模板，不含具体业务代码。用于研究和优化 Claude Code 的 `.claude/` 配置。**

## 技术栈

- **框架**：Vue 3 + TypeScript + Vite
- **微前端**：wujie
- **UI 组件库**：Antdv Next
- **包管理**：pnpm
- **测试**：Vitest

## 核心原则

1. **视图不包含业务逻辑** — 页面只负责模板、交互和调用 services
2. **显隐逻辑统一管理** — 通过 `formContext` 集中管理业务派生状态
3. **业务逻辑必须可测试** — `domains/` 层纯函数，可独立验证

## 三层架构

```
变化频率：低 ──────────────────────────────────► 高

┌─────────────┬─────────────────┬─────────────────────────────┐
│  基础设施层   │   领域业务层     │          应用层              │
│  utils/      │   domains/      │  views/ components/ hooks/  │
│              │                 │  routes/ stores/            │
│  与框架无关   │  与框架无关      │  Vue 强相关                  │
│  极少变化     │  跟随业务变化    │  跟随需求频繁变化             │
└─────────────┴─────────────────┴─────────────────────────────┘
```

**底座**：`utils/` + `domains/` 构成与框架无关的项目底座，可独立测试。

## 配置结构

```
.claude/
├── rules/                          # 编码规范（按需自动加载）
│   ├── project.md                  # 项目信息、目录规范、技术栈
│   ├── domains-code.md             # 领域层编码规范
│   ├── views.md                    # 视图层规范
│   ├── typescript.md               # TypeScript 编码规范
│   ├── git.md                      # Git 提交规范、行为红线
│   ├── code-review.md              # Code Review 清单
│   └── testing.md                  # 单元测试规范
├── skills/
│   └── vbw/                        # VBW 工作流编排器
│       ├── SKILL.md                # 工作流定义
│       ├── config.yaml             # 插槽配置
│       ├── explore/                # 需求探索阶段
│       ├── specify/                # 需求产出阶段
│       ├── implement/              # 逐项开发阶段
│       ├── debug/                  # 日志优先诊断
│       └── accept/                 # 收尾验收阶段
├── commands/
│   └── codegraph.md                # /codegraph 命令
└── samples/                        # 参考示例代码
```

## VBW 工作流

VBW（Vibe-Based Workflow）是从需求规划到开发验收的完整编排流程。

### 使用方式

**完整流程**（新功能开发）：

```
/vbw
```

从阶段 1 开始，走完 explore → specify → implement → accept 全流程。

**单独调用某个阶段**：

```
/vbw-explore      # 需求探索
/vbw-specify      # 需求产出
/vbw-implement    # 逐项开发
/vbw-accept       # 收尾验收
/vbw-debug        # 日志优先诊断（验收发现问题时自动触发，也可手动调用）
```

单独调用适合跳过前序阶段直接进入某个环节，比如已有需求文档时直接 `/vbw-implement` 开始开发。

### 流程阶段

```
explore → specify → implement → accept
  需求探索   需求产出   逐项开发   人工验收
                       ↓ 问题
                      debug
                    日志优先诊断
```

| 阶段 | 目标 | 产出物 |
|------|------|--------|
| **explore** | 需求访谈，明确问题和验收标准 | 需求摘要 |
| **specify** | 生成任务骨架 | README.md + task 文件 |
| **implement** | 逐项开发、深化、自检 | 功能代码 + 测试 |
| **debug** | 验收发现问题时，先插桩收集日志再定位修复 | 诊断结果 + 修复 |
| **accept** | 一致性检查 + 总结 | 验收报告 |

### 插槽扩展

编辑 `.claude/skills/vbw/config.yaml` 可替换各阶段的执行 skill：

```yaml
slots:
  explore:
    skill: brainstorming   # 外部增强（可选）
    builtin: vbw/explore   # 内置兜底（必有）

  challenge:
    skill: grill-me        # 对抗式假设质疑
    builtin: vbw/explore

  implement:
    skill: vbw/implement
    builtin: vbw/implement

  # 设为 null 可跳过增强，直接用 builtin
  challenge-design:
    skill: null
    builtin: vbw/implement

  debug:
    skill: null            # 可挂载外部调试 skill
    builtin: vbw/debug
```

### 核心纪律

1. **流程顺序**：必须按阶段执行，不可跳过
2. **阶段转换确认**：每阶段完成后必须暂停，用户确认后方可继续
3. **依赖解析**：执行任务前检查 `depends`，前置任务未完成不能开始
4. **循环机制**：验收不通过 → 走 debug 诊断后回到 implement；需求变更 → 回到 explore
5. **日志优先**：验收发现问题时，禁止跳过诊断直接改代码

## 开发规范

### 依赖方向（红线）

- ✅ `views` → `domains` → `utils`
- ✅ `domains/{domain}` → `domains/shared/`
- ❌ `domains` → `views`、`components`
- ❌ 跨领域 services 直接 import（通过 `context` 参数传入）

### 关键约束

- **services** 返回纯对象，不含 `ref`/`reactive`
- **models.js** 只包含同步纯函数，无副作用
- **customers.js** 收口客户差异逻辑，禁止 `if (customer === 'A')`
- **页面 hooks** 可调用任何领域 services
- **场景共享 hooks** 只能调用本领域 services
- **全局 hooks** 不能调用 services，只能参数注入

### 测试分级

| 级别 | 范围 | 要求 |
|------|------|------|
| P0（必须测） | 多字段聚合、显隐分支 | `test.each` 参数化 |
| P1（建议测） | 表单校验、策略合并 | 按需覆盖 |
| P2/P3（不测） | 单项映射、常量枚举 | 无需测试 |

## Git 提交规范

**格式**：`<type>(需求编号): <subject>`

- type: `feat`/`fix`/`refactor`/`test`
- scope: 需求编号（从分支名提取）
- subject: 中文动宾结构

**示例**：`feat(REQ-8894): 建立价格校验模型及开发大客户显隐控制`

**红线**：禁止 AI 擅自执行 `git push`，必须由人类审查后手动推送。

## 工具

### CodeGraph

代码搜索、符号查找、调用链追踪。可用时优先使用，不可用时回退到 Grep/Read。

```
/codegraph run      # 运行分析
/codegraph update   # 更新图谱
/codegraph status   # 查看状态
```

### CLAUDE.md

项目核心指令文件，定义了：
- 核心原则
- VBW 工作流说明
- 工具使用优先级
- Rules 自动加载索引

## 文档

- [项目规范 v5.0](docs/spec/project.md) — 完整架构规范
- [TypeScript 规范](docs/spec/typescript.md) — 类型声明指南
- [CLAUDE.md](CLAUDE.md) — AI 协作指令

## 参考示例

`samples/` 目录包含报价模块的示例代码：

- `quote-constants.ts` — 常量层（`as const`、类型导出）
- `quote-common-models.ts` — 领域事实（纯函数、无依赖）
- `quote-form-models.ts` — 场景模型（组装 Context）
- `quote-form-index.ts` — 服务层（统一导出）