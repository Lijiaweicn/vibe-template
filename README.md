# Vibe Template

Claude Code 项目工作流配置试验项目。

## 用途

研究和优化 Claude Code 的 `.claude/` 配置，包括：

- `rules/` - 编码规范、视图规范、工作流程、测试规范
- `skills/` - 自动化工作流
- `samples/` - 参考示例代码

**注意：本仓库不含具体业务代码实现，仅用于工作流配置研究。**

## 配置结构

```
.claude/
├── rules/
│   ├── plan.md          # 规划文档规范
│   ├── project.md       # 项目信息（技术栈、目录规范、历史遗留坑点）
│   ├── coding.md        # 领域层编码规范（分层、命名、约束）
│   ├── view.md          # 视图层规范（组件存放、提取原则、模板约束）
│   ├── workflow.md      # 工作流规范（Git提交、行为红线、Code Review清单）
│   └── testing.md       # 单元测试规范（测试分级、示例）
├── skills/
│   ├── vbp-create/
│   │   └── SKILL.md     # 计划创建工作流
│   └── vbp-execute/
│       └── SKILL.md     # 计划执行工作流
├── commands/
│   └── codegraph.md     # /codegraph 命令（run|update|status）
└── samples/
    ├── quote-constants.ts
    ├── quote-common-models.ts
    ├── quote-form-models.ts
    └── quote-form-index.ts
```

## 配置说明

### CLAUDE.md

核心原则和规范索引：

- 视图不包含业务逻辑
- 显隐逻辑统一管理
- 业务逻辑必须可测试

### .clauderc

安全配置：

- 允许/禁止的命令
- 忽略的文件模式

### rules

| 文件        | 说明                                             | 适用范围                              |
| ----------- | ------------------------------------------------ | ------------------------------------- |
| plan.md     | 规划文档规范                                     | 所有文件                              |
| project.md  | 项目信息、目录规范、历史遗留坑点                 | 所有文件                              |
| coding.md   | 领域层编码规范（分层、命名、约束）               | domains/\*_/_.ts                      |
| view.md     | 视图层规范（组件存放、模板约束）                 | views/**/\*.vue、components/**/\*.vue |
| workflow.md | 工作流规范（Git提交、行为红线、Code Review清单） | 所有文件                              |
| testing.md  | 单元测试规范（测试分级、示例）                   | _.test.ts、_.spec.ts                  |

### skills

| 目录 | 说明 |
|------|------|
| vbp-create/ | 输入需求描述，自动分析并生成规划文档 |
| vbp-execute/ | 基于计划文档驱动本地开发（分支管理、状态更新、需求总结） |

### commands

Slash 命令：

| 文件 | 说明 |
|------|------|
| codegraph.md | `/codegraph [run\|update\|status]` - CodeGraph 操作 |

### samples

参考示例代码（报价模块）：

- `quote-constants.ts` - 常量层（as const、类型导出）
- `quote-common-models.ts` - 领域事实（纯函数、无依赖）
- `quote-form-models.ts` - 场景模型（组装 Context）
- `quote-form-index.ts` - 服务层（统一导出）

## 同步到其他项目

使用 `sync-vbw.sh` 将配置同步到其他项目：

```bash
# 在目标项目中运行
/path/to/vibe-template/sync-vbw.sh

# 或指定源目录
./sync-vbw.sh /path/to/vibe-template
```

### 添加到 PATH（可选）

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
alias sync-vbw="/path/to/vibe-template/sync-vbw.sh"
```

然后在任意项目中运行：

```bash
sync-vbw
```

## 工作流说明

### vbp-create（计划创建）

输入需求描述，自动分析并生成规划文档：

- 生成 `README.md`（总览：背景、目标、计划分解表格）
- 生成 `01-<计划名称>.md`（具体计划内容）

### vbp-execute（计划执行）

基于计划文档驱动本地开发：

1. 查找任务：读取 README.md，找到第一个非 done 任务
2. 准备分支：创建 `local/` 分支
3. 检查未解决的问题：有则询问是否继续，无则直接开始
4. 执行任务：按 Todo 列表逐项执行，每项完成后更新状态
5. 遇阻塞：填写未解决的问题，提示用户
6. 验收：用户确认通过后继续
7. 完成合并：squash merge 到 feature 分支
8. 更新状态：标记计划完成

### vbp-archive（计划归档）

处理已完成的需求计划：

1. 读取 `docs/plans/<需求编号>/README.md` 确认完成状态
2. 输出归档选项：删除/移动/保留
3. 执行用户选择
4. 输出结果
