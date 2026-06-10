# VBW 工作流程实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 替换旧的 vbp-create/vbp-execute 工作流，建立 vbw-plan/vbw-dev 两阶段工作流程，包含需求访谈、任务拆分、local 分支开发、squash merge、验证清单等机制。

**Architecture:** 删除旧 rules/plan.md 和 vbp skills，新建 scripts/vbw-init.sh 脚本负责目录和模板创建，新建 vbw-plan/vbw-dev 两个 skill 定义完整工作流程。CLAUDE.md 移除 plan.md 引用。

**Tech Stack:** Bash (脚本), Markdown (skill 定义和模板)

---

### Task 1: 创建 vbw-init.sh 脚本

**Files:**
- Create: `scripts/vbw-init.sh`

- [ ] **Step 1: 创建 scripts 目录**

```bash
mkdir -p scripts
```

- [ ] **Step 2: 编写 vbw-init.sh 脚本**

创建 `scripts/vbw-init.sh`，内容如下：

```bash
#!/bin/bash
# vbw-init.sh - 初始化 VBW 工作目录和模板文件
# 用法: vbw-init.sh [--quick] [分支名]
# 示例: vbw-init.sh feature/UAC-123-用户管理
#        vbw-init.sh --quick feature/UAC-123-用户管理

set -e

QUICK=false
BRANCH=""

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      QUICK=true
      shift
      ;;
    *)
      BRANCH="$1"
      shift
      ;;
  esac
done

# 如果未传入分支名，尝试从 git 获取
if [ -z "$BRANCH" ]; then
  BRANCH=$(git branch --show-current 2>/dev/null)
  if [ -z "$BRANCH" ]; then
    echo "错误: 无法获取当前分支名，请手动传入"
    echo "用法: vbw-init.sh [--quick] <分支名>"
    exit 1
  fi
fi

# 提取需求标识：去掉 feature/、fix/、hotfix/ 等前缀
REQ_ID=$(echo "$BRANCH" | sed -E 's|^(feature|fix|hotfix|release)/||')

if [ -z "$REQ_ID" ]; then
  echo "错误: 无法从分支名提取需求标识: $BRANCH"
  exit 1
fi

# 创建目录
DOCS_DIR="docs/${REQ_ID}"

if [ -d "$DOCS_DIR" ]; then
  echo "目录已存在: $DOCS_DIR"
  echo "如需重新初始化，请先删除该目录"
  exit 1
fi

mkdir -p "$DOCS_DIR"

# 生成 README.md
cat > "${DOCS_DIR}/README.md" << 'READMEEOF'
# {{REQ_ID}}

## 概览
<!-- 一句话描述本次需求的目标 -->

## 需求资源
- [需求文档](prd.md)

## 任务列表
<!-- < 3 个任务：直接在此编写任务内容 -->
<!-- >= 3 个任务：用引用格式 -->
<!-- - [task-1-xxx](task-1-xxx.md) -->

## 总结
<!-- 开发完成后填写成果提炼 -->
READMEEOF

# 替换占位符
sed -i "s/{{REQ_ID}}/${REQ_ID}/g" "${DOCS_DIR}/README.md"

# 快速通道模式：调整 README 模板
if [ "$QUICK" = true ]; then
  cat > "${DOCS_DIR}/README.md" << 'READMEEOF'
# {{REQ_ID}}

## 概览
<!-- 一句话描述本次需求的目标 -->

## 需求描述
<!-- 简要背景和具体内容 -->

## 任务列表
<!-- 内联任务，每个任务用 ### 标题 + Todo 列表 -->
<!-- ### 任务1：任务目标 -->
<!-- - [ ] 步骤1 -->
<!-- - [ ] 步骤2 -->

## 总结
<!-- 开发完成后填写成果提炼 -->
READMEEOF
  sed -i "s/{{REQ_ID}}/${REQ_ID}/g" "${DOCS_DIR}/README.md"
else
  # 完整模式：生成 prd.md
  cat > "${DOCS_DIR}/prd.md" << 'PRDEOF'
# 需求文档

## 需求背景
<!-- 为什么要做这个需求 -->

## 需求描述
<!-- 具体要做什么 -->

## 需求链接
<!-- 相关链接、设计稿、接口文档等 -->
PRDEOF
fi

echo "VBW 目录已创建: ${DOCS_DIR}/"
echo "模式: $([ "$QUICK" = true ] && echo "快速通道" || echo "完整流程")"
echo "文件:"
ls -1 "${DOCS_DIR}/"
```

- [ ] **Step 3: 添加执行权限**

```bash
chmod +x scripts/vbw-init.sh
```

- [ ] **Step 4: 验证脚本功能**

测试完整模式：

```bash
# 创建测试目录
mkdir -p /tmp/vbw-test && cd /tmp/vbw-test && git init
git checkout -b feature/TEST-001-测试需求

# 运行脚本（用项目中的版本）
bash /c/workspace/vibe-workspace/codes/vibe-template/scripts/vbw-init.sh feature/TEST-001-测试需求

# 验证输出
# 预期: docs/TEST-001-测试需求/ 目录包含 README.md 和 prd.md
```

测试快速通道：

```bash
bash /c/workspace/vibe-workspace/codes/vibe-template/scripts/vbw-init.sh --quick feature/TEST-002-简单需求

# 验证输出
# 预期: docs/TEST-002-简单需求/ 目录仅包含 README.md（无 prd.md）
# 预期: README.md 中"需求资源"替换为"需求描述"
```

- [ ] **Step 5: 提交**

```bash
git add scripts/vbw-init.sh
git commit -m "feat: 添加 vbw-init.sh 初始化脚本"
```

---

### Task 2: 创建 vbw-plan skill

**Files:**
- Create: `.claude/skills/vbw-plan/SKILL.md`

- [ ] **Step 1: 创建 skill 目录**

```bash
mkdir -p .claude/skills/vbw-plan
```

- [ ] **Step 2: 编写 vbw-plan SKILL.md**

创建 `.claude/skills/vbw-plan/SKILL.md`，内容如下：

```markdown
---
name: vbw-plan
description: 需求规划 - 通过访谈梳理需求并拆分任务
---

# VBW 需求规划

通过 AI 辅助访谈梳理需求，生成需求文档和任务拆分。

## 触发条件

用户输入需求描述时触发，或用户明确要求"开始规划"/"vbw-plan"。

## 流程

### 1. 判断模式

根据需求描述的复杂度判断使用哪种模式：

- **完整流程**：需求涉及多模块、需要设计决策、预期任务 >= 3 个
- **快速通道**：需求简单明确、改动范围小、预期任务 < 3 个

如果不确定，询问用户选择。

### 2A. 完整流程

#### 2A.1 需求访谈

通过提问梳理需求，每次只问一个问题：

- 这个需求要解决什么问题？
- 涉及哪些模块/页面？
- 有没有参考的设计稿或接口文档？
- 有哪些已知的约束或限制？
- 预期的验收标准是什么？

#### 2A.2 创建目录和文件

运行脚本创建目录结构：

```bash
bash scripts/vbw-init.sh $(git branch --show-current)
```

#### 2A.3 填充 prd.md

根据访谈结果填充 prd.md：
- 需求背景：为什么要做
- 需求描述：具体做什么
- 需求链接：相关资源

#### 2A.4 拆分任务

根据 prd 内容拆分任务，判断任务数量：

**任务数 < 3**：直接在 README.md 的任务列表区域编写，每个任务包含：
- 任务目标
- 待确认/待解决/已确认/限制（按需）
- Todo 列表

**任务数 >= 3**：生成 `task-N-标题.md` 文件，每个文件包含：
- 任务目标
- 待确认
- 待解决
- 已确认
- 限制
- Todo 列表

README.md 中用引用格式列出任务。

#### 2A.5 用户确认

展示拆分方案，用户可调整：
- 合并/拆分任务
- 调整 Todo 步骤
- 补充待确认/限制内容

### 2B. 快速通道

#### 2B.1 创建目录和文件

```bash
bash scripts/vbw-init.sh --quick $(git branch --show-current)
```

#### 2B.2 填充 README.md

在 README.md 中直接编写：
- 概览：一句话目标
- 需求描述：简要背景和内容
- 任务列表：内联 Todo 任务（### 任务N + Todo 列表）

#### 2B.3 用户确认

展示内容，用户确认后即可进入 vbw-dev。

### 3. 输出

告知用户规划完成，提示执行 vbw-dev 开始开发。
```

- [ ] **Step 3: 验证 skill 文件**

```bash
# 确认文件存在且 frontmatter 格式正确
head -5 .claude/skills/vbw-plan/SKILL.md
# 预期: 显示 --- name: vbw-plan --- 块
```

- [ ] **Step 4: 提交**

```bash
git add .claude/skills/vbw-plan/SKILL.md
git commit -m "feat: 添加 vbw-plan skill"
```

---

### Task 3: 创建 vbw-dev skill

**Files:**
- Create: `.claude/skills/vbw-dev/SKILL.md`

- [ ] **Step 1: 创建 skill 目录**

```bash
mkdir -p .claude/skills/vbw-dev
```

- [ ] **Step 2: 编写 vbw-dev SKILL.md**

创建 `.claude/skills/vbw-dev/SKILL.md`，内容如下：

```markdown
---
name: vbw-dev
description: 开发执行 - 基于任务文档驱动开发，含 review 循环
---

# VBW 开发执行

基于 VBW 任务文档驱动开发流程，包含 local 分支开发、验证清单、review 循环、squash merge。

## 触发条件

用户要求开始开发时触发，或用户明确要求"vbw-dev"。

## 前置条件

`docs/` 目录下存在已规划的需求文档（由 vbw-plan 生成）。

## 流程

### 1. 定位任务

读取 `docs/<需求标识>/README.md`，找到第一个未完成的任务：
- 快速通道：查找 README 中未完成的 Todo 项（`- [ ]`）
- 完整流程：查找任务引用或 task 文件中未完成的 Todo 项

### 2. 检查待确认/待解决

读取任务文件（快速通道则检查 README 中是否有待确认/待解决内容）：

- **有待确认内容**：列出待确认项，与用户逐一确认，确认后归档到已确认
- **有待解决内容**：列出待解决项，先解决问题或与用户讨论解决方案
- **无待处理内容**：直接进入步骤 3

### 3. 创建 local 分支

从当前 feature 分支创建 local 分支：

```bash
git checkout -b local/<需求标识>-task-N
```

命名规则：
- 快速通道：`local/<需求标识>-task-1`、`local/<需求标识>-task-2`
- 完整流程：使用 task 文件编号，如 `local/UAC-123-用户管理-task-1`

### 4. 逐项开发

按 Todo 列表逐项执行：

1. 读取当前任务的 Todo 列表
2. 执行第一个未完成的 `- [ ]` 项
3. 完成后更新为 `- [x]`
4. 继续下一项，直到全部完成

开发过程中：
- 可随时 `git commit`（WIP 提交）
- 可调整 Todo 列表（添加/删除/修改步骤）
- 遇到新问题可添加到待确认/待解决

### 5. 验证清单自检

所有 Todo 完成后，squash merge 前进行自检：

- [ ] 所有 Todo 项已标记 `[x]`
- [ ] 待确认/待解决已清空或归档到已确认
- [ ] 符合 `workflow.md` Code Review 清单：
  - [ ] models 是纯函数（无 `this`、无响应式 API）
  - [ ] 常量已收拢到 `constants.ts` 并加了 `as const`
  - [ ] 表单场景：`formData` 不含 UI 属性（UI 属性已放 `uiContext`）
  - [ ] 视图模板：无复杂表达式（如 `v-if="a && b"`）
  - [ ] 视图模板：无可选链防御链（如 `data?.xxx`）

**所有项必须通过，否则修复后再继续。**

### 6. 用户人工验收

向用户展示任务完成情况：
- 列出本次任务做了什么
- 展示关键变更
- 等待用户验收

验收循环：
- 用户发现问题 → 修复 → 重新验收
- 用户确认通过 → 继续步骤 7

### 7. Squash Merge

```bash
# 回到 feature 分支
git checkout feature/<需求标识>

# squash merge local 分支
git merge --squash local/<需求标识>-task-N

# 提交（遵循 workflow.md 的 commit 规范）
git commit -m "feat(<需求编号>): <任务描述>"

# 删除 local 分支
git branch -D local/<需求标识>-task-N
```

### 8. 更新 README 状态

在 README.md 中标记任务完成：
- 快速通道：Todo 已在步骤 4 中更新，无需额外操作
- 完整流程（引用格式）：`- [task-1-xxx](task-1-xxx.md)` → `- [x] [task-1-xxx](task-1-xxx.md)`

### 9. 循环或收尾

- **还有未完成任务**：回到步骤 1，继续下一个任务
- **所有任务完成**：进入步骤 10

### 10. 需求级一致性检查

写总结前进行最终检查：

- [ ] 每个 task 的已确认内容与实际代码一致
- [ ] README 任务列表全部标记完成（所有 `- [x]`）
- [ ] prd.md 描述的需求全部覆盖（快速通道检查 README 中的需求描述）

**所有项必须通过，否则修复后再继续。**

### 11. 填写总结

在 README.md 的总结区域填写成果提炼：

- 实现了什么功能
- 关键技术决策
- 值得注意的问题或发现

**注意：总结是成果提炼，不是 git log 副本。**

## 异常处理

- **中途中断**：保留 local 分支和当前进度，下次继续时从步骤 1 重新定位
- **合并冲突**：手动解决后 `git add` + `git commit`
- **需求变更**：回到 vbw-plan 更新任务文档，再继续 vbw-dev
```

- [ ] **Step 3: 验证 skill 文件**

```bash
head -5 .claude/skills/vbw-dev/SKILL.md
# 预期: 显示 --- name: vbw-dev --- 块
```

- [ ] **Step 4: 提交**

```bash
git add .claude/skills/vbw-dev/SKILL.md
git commit -m "feat: 添加 vbw-dev skill"
```

---

### Task 4: 更新 CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 移除 plan.md 引用**

将 CLAUDE.md 中的"规划规范"部分：

```markdown
# 规划规范

涉及以下情况时，必须先阅读 `.claude/rules/plan.md`：

- 新功能开发
- 架构调整
- 跨模块改造
- 大规模重构
- 数据结构变更
```

替换为：

```markdown
# 工作流程

新功能开发使用 VBW 工作流程：

1. **规划**：使用 `vbw-plan` skill 进行需求访谈和任务拆分
2. **开发**：使用 `vbw-dev` skill 按任务驱动开发

详见 `.claude/skills/vbw-plan/SKILL.md` 和 `.claude/skills/vbw-dev/SKILL.md`
```

- [ ] **Step 2: 验证 CLAUDE.md**

```bash
# 确认不再包含 plan.md 引用
grep -n "plan.md" CLAUDE.md
# 预期: 无输出

# 确认包含 vbw 引用
grep -n "vbw" CLAUDE.md
# 预期: 显示 vbw-plan 和 vbw-dev 相关行
```

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "refactor: CLAUDE.md 引用从 plan.md 迁移到 vbw skills"
```

---

### Task 5: 删除旧文件

**Files:**
- Delete: `.claude/rules/plan.md`
- Delete: `.claude/skills/vbp-create/SKILL.md`
- Delete: `.claude/skills/vbp-execute/SKILL.md`

- [ ] **Step 1: 删除旧 plan.md 规则**

```bash
git rm .claude/rules/plan.md
```

- [ ] **Step 2: 删除旧 vbp-create skill**

```bash
git rm .claude/skills/vbp-create/SKILL.md
rmdir .claude/skills/vbp-create 2>/dev/null || true
```

- [ ] **Step 3: 删除旧 vbp-execute skill**

```bash
git rm .claude/skills/vbp-execute/SKILL.md
rmdir .claude/skills/vbp-execute 2>/dev/null || true
```

- [ ] **Step 4: 验证删除**

```bash
# 确认文件已删除
ls .claude/rules/plan.md 2>&1 | grep "No such file"
ls .claude/skills/vbp-create/SKILL.md 2>&1 | grep "No such file"
ls .claude/skills/vbp-execute/SKILL.md 2>&1 | grep "No such file"
```

- [ ] **Step 5: 提交**

```bash
git commit -m "refactor: 删除旧 vbp-create/vbp-execute skills 和 plan.md 规则"
```

---

### Task 6: 端到端验证

- [ ] **Step 1: 验证脚本可执行**

```bash
bash scripts/vbw-init.sh --help 2>&1 || true
# 预期: 显示用法说明或脚本正常运行
```

- [ ] **Step 2: 验证 skill 文件格式**

```bash
# 检查 frontmatter 格式
head -3 .claude/skills/vbw-plan/SKILL.md
head -3 .claude/skills/vbw-dev/SKILL.md
# 预期: 都显示正确的 --- name/description --- 块
```

- [ ] **Step 3: 验证 CLAUDE.md 无残留引用**

```bash
grep -c "plan.md\|vbp-create\|vbp-execute" CLAUDE.md
# 预期: 0
```

- [ ] **Step 4: 验证目录结构**

```bash
find .claude/skills -name "SKILL.md" | sort
# 预期: 列出 vbw-plan 和 vbw-dev（以及其他已有 skills）

ls scripts/vbw-init.sh
# 预期: 文件存在且有执行权限
```
