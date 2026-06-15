# 核心原则

1. 视图不包含业务逻辑
2. 显隐逻辑统一管理
3. 业务逻辑必须可测试

# 工作流程（VBW）

新功能开发使用 VBW 工作流程，通过 Skill 工具调用：

- **完整流程**：`vbw` — 从需求规划到开发验收的完整编排
- **插槽扩展**：编辑 `.claude/skills/vbw/config.yaml` 可替换各阶段的执行 skill

# Tools

代码搜索、符号查找、调用链追踪 → CodeGraph 可用时必须使用，不可用时回退到 Grep/Read。

# Rules

以下规则按需自动加载，无需手动读取：

- `project.md` — 目录结构、技术栈
- `domains-code.md` — core 层编码规范
- `views.md` — 视图规范
- `git.md` — Git 提交规范、行为红线
- `code-review.md` — Code Review 清单
- `testing.md` — 测试规范
