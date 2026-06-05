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
│   ├── vbw-plan.md      # 需求规划工作流
│   └── vbw-task.md      # 任务执行工作流
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

| 文件     | 说明                                                     |
| -------- | -------------------------------------------------------- |
| vbw-plan | 输入需求描述，自动分析并生成规划文档                     |
| vbw-task | 基于计划文档驱动本地开发（分支管理、状态更新、需求总结） |

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

### vbw-plan（需求规划）

输入需求描述，自动分析并生成规划文档：

- 单任务需求：生成 `README.md`
- 多任务需求：生成 `README.md`（总览）+ 多个计划文档

### vbw-task（任务执行）

基于计划文档驱动本地开发：

1. 准备分支：创建 `local/` 分支
2. 执行任务：开发 + 验收
3. 完成合并：squash merge 到 feature 分支
4. 更新状态：标记计划完成
5. 需求总结：所有计划完成后生成 PR commit 信息
