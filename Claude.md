# 核心原则

1. 视图不包含业务逻辑
2. 显隐逻辑统一管理
3. 业务逻辑必须可测试

# 工作流程（VBW）

新功能开发使用 VBW 工作流程，通过 Skill 工具调用：

1. **规划**：`vbw-plan` — 需求访谈和任务拆分
2. **开发**：`vbw-dev` — 任务驱动开发

# Tools

代码搜索、符号查找、调用链追踪 → CodeGraph 可用时必须使用，不可用时回退到 Grep/Read。

# Rules

以下规则按需自动加载，无需手动读取：

- `project.md` — 目录结构、技术栈
- `coding.md` — domains编码规范
- `views.md` — 视图规范
- `workflow.md` — Git 提交、Code Review 清单
- `testing.md` — 测试规范
