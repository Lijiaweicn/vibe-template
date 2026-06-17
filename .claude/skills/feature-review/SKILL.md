---
name: feature-review
description: 功能 Code Review — 需求阶段性开发完成后，对代码进行健壮性检查，输出问题清单
---

# Feature Review

需求阶段性开发完成后，对代码进行健壮性检查，对照编码规范输出问题清单。

## 触发条件

通过 Skill 工具调用（`feature-review`）。支持参数：

- **无参数**（`/feature-review`）：review 当前分支相对于 main 的改动
- **指定路径**（`/feature-review src/domains/user`）：review 指定目录或文件
- **指定文件**（`/feature-review src/domains/user/models.ts src/domains/user/services.ts`）：review 多个文件

## 流程

### 1. 确定 Review 范围

根据参数确定要 review 的文件列表：

- **无参数**：执行 `git diff main --name-only --diff-filter=ACMR` 获取当前分支改动的文件，过滤出 `src/**/*` 下的非测试文件
- **指定路径**：扫描该路径下的所有 `.ts`/`.vue` 文件，排除测试文件
- **指定文件**：直接使用指定的文件列表

向用户展示文件列表，确认 review 范围。

### 2. 加载 Review 规则

读取以下规则文件：

- `.claude/rules/code-review.md` — 自动加载的精简版清单
- `docs/spec/project.md` 第七章 — 完整清单（如有需要深入检查）

### 3. 逐文件 Review

对每个文件执行以下检查：

#### 3a. 结构性检查

- 文件是否在正确的目录结构中（domains 分层）
- 是否有不必要的代码重复

#### 3b. 规范性检查

对照 code-review.md 清单逐项检查：

- models 是否纯函数
- 常量是否使用 `createDict` 工厂
- formData 是否只含后端字段
- 视图模板是否有复杂表达式
- services 是否返回纯对象
- 跨领域数据是否通过 context 传入
- 样式是否使用 scoped CSS 或 CSS Modules
- 类型是否使用 `unknown` 而非 `any`
- P0 逻辑是否有参数化单元测试

#### 3c. 健壮性检查

- 边界条件处理（空值、空数组、空对象）
- 错误处理（try-catch、错误状态）
- 异步操作（loading 状态、竞态条件）
- 类型安全（是否有 `as any`、类型断言滥用）

### 4. 输出 Review 报告

按严重程度分类输出问题：

```
## Code Review 报告

### 🔴 必须修复（阻断性问题）
- [文件:行号] 问题描述
  - 当前代码：...
  - 建议修改：...

### 🟡 建议修复（影响健壮性）
- [文件:行号] 问题描述
  - 当前代码：...
  - 建议修改：...

### 🟢 可选优化（代码质量）
- [文件:行号] 问题描述
  - 当前代码：...
  - 建议修改：...

### ✅ 通过项
- [检查项] 通过
```

### 5. 交互修复

- 用户确认问题后，可逐项修复
- 修复后重新 review 该文件
- 所有 🔴 问题必须修复后才能结束

## 门禁条件

- [ ] 所有 🔴 问题已修复
- [ ] 用户确认 review 完成
