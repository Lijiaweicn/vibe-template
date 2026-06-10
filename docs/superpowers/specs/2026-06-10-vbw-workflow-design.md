# VBW 工作流程设计

## 背景

当前 `.claude/rules/plan.md` 和 `vbp-create`/`vbp-execute` skills 的工作流程存在以下问题：

1. 规划文档结构不够清晰，需求文档和任务文档混在一起
2. 任务状态管理方式僵硬（状态列），不如 Todo 列表灵活
3. 没有独立的需求访谈流程，需求描述直接生成规划文档
4. rules 文件作为模板来源，AI 读取后手动创建文件容易格式不一致
5. feature 分支上中间 commit 过多，git 信息可读性差

## 目标

重新设计 VBW（Vibe Work）工作流程，实现：

1. 需求文档（prd）与任务文档分离
2. 用 Todo 列表替代状态列管理任务进度
3. AI 辅助访谈梳理需求
4. 用脚本自动创建目录和模板文件
5. local 分支开发 + squash merge 保持 feature 分支历史干净

## 决策

| 问题 | 决策 | 理由 |
|------|------|------|
| 需求名称 | 直接用分支名 | 分支名已含需求编号+标题，回溯时需求编号是关键信息 |
| dev/review | 合并为 vbw-dev | 共享任务上下文，自然循环更顺畅，避免手动切换 |
| rules 替代 | 脚本 `scripts/vbw-init.sh` | 模板只维护一份，格式一致性有保障 |
| 任务状态 | 用 Todo 列表 | 比状态列更灵活，可随时调整，进度更直观 |
| 任务拆分 | AI 自动拆分 + 用户审核 | 效率高，有具体方案比从零讨论更容易判断 |
| 总结内容 | 成果提炼，非 git log 副本 | commit 信息已在 git 中，总结应记录"达成了什么" |
| 小型需求 | 快速通道，跳过访谈 | 减少流程开销，小需求不被流程拖累 |

## 设计

### 目录结构

目录名从分支名提取需求标识：`feature/UAC-123-用户管理` → `docs/UAC-123-用户管理/`

**完整流程**（中大型需求）：

```
docs/<需求标识>/
├── README.md
├── prd.md
├── task-1-xxx.md      # >= 3 个任务时
└── task-2-xxx.md
```

**快速通道**（小型需求）：

```
docs/<需求标识>/
└── README.md            # 包含简要需求描述 + 内联任务
```

### 文件模板

**README.md（完整流程）**

```markdown
# <需求标识>

## 概览
<一句话描述本次需求的目标>

## 需求资源
- [需求文档](prd.md)

## 任务列表
<!-- < 3 个任务：直接在此编写任务内容 -->
<!-- >= 3 个任务：用引用格式 -->
- [task-1-xxx](task-1-xxx.md)
- [task-2-xxx](task-2-xxx.md)

## 总结
（开发完成后填写成果提炼）
```

**README.md（快速通道）**

```markdown
# <需求标识>

## 概览
<一句话描述本次需求的目标>

## 需求描述
<简要背景和具体内容>

## 任务列表
### 任务1：<任务目标>
- [ ] 步骤1
- [ ] 步骤2

### 任务2：<任务目标>
- [ ] 步骤1
- [ ] 步骤2

## 总结
（开发完成后填写成果提炼）
```

**prd.md**

```markdown
# 需求文档

## 需求背景
<为什么要做这个需求>

## 需求描述
<具体要做什么>

## 需求链接
<相关链接、设计稿、接口文档等>
```

**task-N-xxx.md**

```markdown
# 任务目标
<这个任务要达成什么效果>

## 待确认
<需讨论的内容，无则留空>

## 待解决
<阻塞问题，无则留空>

## 已确认
<已确定的决策/接口/数据结构>

## 限制
<约束条件>

## Todo
- [ ] 步骤1
- [ ] 步骤2
```

### 工作流程

#### vbw-plan（需求规划）

**判断模式**：AI 根据需求描述判断使用完整流程还是快速通道。

**完整流程**（中大型需求）：

1. 用户输入需求描述
2. AI 通过访谈提问梳理需求
3. 调用 `vbw-init.sh` 创建目录和模板文件（README.md + prd.md）
4. AI 填充 prd.md（需求背景、需求描述、需求链接）
5. AI 根据 prd 自动拆分任务：
   - 任务数 < 3：直接在 README 的任务列表区域编写
   - 任务数 >= 3：生成 `task-N-标题.md` 文件，README 中用引用
6. 用户审核确认，可调整任务拆分和内容

**快速通道**（小型需求，任务数 < 3）：

1. 用户输入需求描述
2. AI 判断需求简单，直接进入快速通道
3. 调用 `vbw-init.sh --quick` 创建目录和 README.md（不创建 prd.md）
4. AI 在 README 中直接编写：
   - 概览：一句话目标
   - 需求描述：简要背景和内容（替代独立 prd.md）
   - 任务列表：内联 Todo 任务
5. 用户确认后即可进入 vbw-dev

#### vbw-dev（开发执行）

1. 读取 README 定位第一个未完成任务（通过 Todo 勾选状态判断）
2. 读取任务文件，检查待确认/待解决内容：
   - 有待确认：先与用户确认
   - 有待解决：先解决问题
3. 从 feature 分支拉 local 分支（`local/<需求标识>-task-N`）
4. 按 Todo 逐项开发，每完成一项更新 Todo 勾选
5. **验证清单自检**（squash merge 前）：
   - [ ] 所有 Todo 项已完成
   - [ ] 待确认/待解决已清空或归档到已确认
   - [ ] 符合 `workflow.md` Code Review 清单（models 纯函数、常量收拢、表单分离等）
6. 用户人工验收（review 循环）：
   - 用户检查结果
   - 发现问题 → 修复 → 重新验收
   - 通过 → 继续步骤 7
7. squash merge 回 feature 分支，删除 local 分支
8. 更新 README 任务列表状态（任务引用前加 `[x]` 标记）
9. 重复步骤 1-8 直到所有任务完成
10. **需求级一致性检查**（写总结前）：
    - [ ] 每个 task 的已确认内容与实际代码一致
    - [ ] README 任务列表全部标记完成
    - [ ] prd.md 描述的需求全部覆盖
11. 填写 README 总结（成果提炼）

#### 分支策略

```
remote/feature/<需求标识>    ← 远端 feature 分支
  └── local/<需求标识>-task-N    ← 本地开发分支（多次 commit）
        ↓ squash merge
feature/<需求标识>               ← 合并后只保留规范 commit
```

- local 分支：自由 commit，包括 WIP 提交
- squash merge：每个任务压缩为一条规范 commit
- feature 分支历史：只有开发记录和 bug 修复记录

### 脚本设计

`scripts/vbw-init.sh`：

- 输入：分支名（如 `feature/UAC-123-用户管理`），可选 `--quick` 参数
- 提取需求标识：去掉 `feature/`、`fix/` 等前缀（如 `feature/UAC-123-用户管理` → `UAC-123-用户管理`）
- 创建 `docs/<需求标识>/` 目录
- 生成模板文件：
  - 默认模式：README.md + prd.md
  - `--quick` 模式：仅 README.md（快速通道模板）
- 输出创建的目录路径

### 变更范围

| 文件 | 操作 | 说明 |
|------|------|------|
| `.claude/rules/plan.md` | 删除 | 触发条件移入 skill，模板由脚本生成 |
| `scripts/vbw-init.sh` | 新建 | 创建目录和模板文件 |
| `.claude/skills/vbw-plan/SKILL.md` | 新建 | 需求访谈 + 任务拆分 |
| `.claude/skills/vbw-dev/SKILL.md` | 新建 | 开发 + review 循环 + squash merge |
| `.claude/skills/vbp-create/SKILL.md` | 删除 | 被 vbw-plan 替代 |
| `.claude/skills/vbp-execute/SKILL.md` | 删除 | 被 vbw-dev 替代 |
| `CLAUDE.md` | 更新 | 移除 plan.md 的引用 |

## 约束

1. 脚本使用 bash，保持简单，不引入额外依赖
2. skill 定义中包含触发条件，不再需要独立的 rules 文件
3. 总结只记录成果提炼，不重复 git log 信息
4. local 分支禁止推送到远端
5. 验证清单所有项必须通过才能 squash merge
6. 一致性检查所有项必须通过才能写总结

## 涉及文件

| 文件/目录 | 操作 | 说明 |
| --------- | ---- |------|
| `.claude/rules/plan.md` | 删除 | 被 skill + 脚本替代 |
| `scripts/vbw-init.sh` | 新建 | 目录和模板初始化脚本 |
| `.claude/skills/vbw-plan/SKILL.md` | 新建 | 需求规划 skill |
| `.claude/skills/vbw-dev/SKILL.md` | 新建 | 开发执行 skill |
| `.claude/skills/vbp-create/SKILL.md` | 删除 | 被 vbw-plan 替代 |
| `.claude/skills/vbp-execute/SKILL.md` | 删除 | 被 vbw-dev 替代 |
| `CLAUDE.md` | 更新 | 移除 plan.md 引用 |
