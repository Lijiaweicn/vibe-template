---
paths:
  - "**/*"
---

# 核心原则

1. 视图不包含业务逻辑
2. 显隐逻辑统一管理
3. 业务逻辑必须可测试

# 工作流程（VBW）

新功能开发使用 VBW 工作流程：

1. **规划**：使用 `vbw-plan` skill 进行需求访谈和任务拆分
2. **开发**：使用 `vbw-dev` skill 按任务驱动开发

详见 `.claude/skills/vbw-plan/SKILL.md` 和 `.claude/skills/vbw-dev/SKILL.md`

# 目录结构

详见 `.claude/rules/project.md`

# 编码规范

详见 `.claude/rules/coding.md`

# 视图规范

详见 `.claude/rules/views.md`

# 工作流程

详见 `.claude/rules/workflow.md`

# 测试规范

详见 `.claude/rules/testing.md`
