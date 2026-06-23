# 核心原则

1. 视图不包含业务逻辑
2. 显隐逻辑统一管理
3. 业务逻辑必须可测试

# 工作流程

## Skills（通过 Skill 工具调用）

- `/dev` — 新功能开发（需求理解 → 任务规划 → 逐项开发 → 需求归档）
- `/fix` — 问题修复（问题收集 → 定位分析 → 修复实现 → 验证）
- `/issue` — 需求捕获（快速记录需求想法，不启动开发流程）

# Tools

代码搜索、符号查找、调用链追踪 → CodeGraph 可用时必须使用，不可用时回退到 Grep/Read。

# Rules

以下规则按需自动加载，无需手动读取：

- `project.md` — 目录结构、技术栈
- `domains-code.md` — domains 编码规范
- `views.md` — 视图规范
- `git.md` — Git 提交规范、行为红线
- `code-review.md` — Code Review 清单
- `testing.md` — 测试规范
