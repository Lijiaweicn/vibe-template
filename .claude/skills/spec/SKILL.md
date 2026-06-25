---
name: spec
description: 规格提取 — 从已归档需求中提取规格到 docs/spec/
---

# /spec — 规格提取

## When to Use

- 开发完成后想从归档需求中沉淀知识
- 用户说"提取规格"、"沉淀一下"
- 批量处理多个已归档需求
- 想把零散的需求知识系统化

## When NOT to Use

- 需求还在开发中 → 开发完成后再提取
- 想创建新需求 → 用 `/issue`
- 只是想查看已有规格 → 直接读文件

## 命令格式

```
/spec issue-062305                       ← 提取单个 issue
/spec issue-062301 issue-062305          ← 批量提取多个 issue
```

## 用途

从已归档的需求中提取规格到 `docs/spec/`，实现知识沉淀。适合：

- 开发完成后趁"热"提取规格
- 批量处理多个已归档需求
- 将零散的需求知识系统化

## docs/spec 目录结构

```
docs/spec/
├── README.md            ← 规格文档索引
├── business/            ← 业务规格（业务规则、行为契约）
│   ├── enterprise.md
│   ├── identity.md
│   └── ...
└── technical/           ← 技术规格（技术方案、架构规范）
    ├── code-review/
    ├── monorepo/
    └── ...
```

### 业务规格（business/）

记录系统的**业务规则**，按业务领域组织。

**内容原则：**

- ✅ 业务规则：「企业认证后才能发布采购需求」
- ✅ 业务约束：「采购金额不得超过预算限额」
- ✅ 状态流转：「订单状态：草稿 → 待审核 → 已通过/已拒绝」
- ✅ 权限规则：「只有企业管理员可以修改企业信息」

**避免代码事实：**

- ❌ 函数调用：「调用 companyServices.getCompanyInfo()」
- ❌ 字段名列举：「返回 companyId、companyName、companyType...」
- ❌ 代码实现：「使用 useState 管理表单状态」

**判断标准**：如果代码重构了（换框架、换 API），这条 spec 是否仍然有效？

### 技术规格（technical/）

记录系统的**技术方案和架构规范**，按技术领域组织。

**内容类型：**

- 技术方案：API Loading 方案、ViewAction 模式
- 架构规范：Monorepo 架构、领域包设计
- 开发规范：Code Review 规则、样式规范

**特点：**

- 可以包含代码示例
- 可以包含技术细节
- 关注"怎么实现"而非"做什么"

## Frontmatter 规范

### 业务规格

```yaml
---
title: 用户认证
tags: [认证, 权限]
keywords: [登录, 注册, OAuth, JWT]
summary: 用户登录、注册、权限校验相关的业务规则
---
```

### 技术规格

```yaml
---
title: API Loading 方案
tags: [请求, loading, 基础设施]
keywords: [request, silentRequest, 全局loading]
summary: API 请求的 loading 管理方案
---
```

**字段说明：**

- `title`：规格标题
- `tags`：分类标签
- `keywords`：搜索关键词
- `summary`：一句话摘要（放最后）

## 业务规格内容模板

```markdown
---
title: 用户认证
tags: [认证, 权限]
keywords: [登录, 注册, OAuth, JWT]
summary: 用户登录、注册、权限校验相关的业务规则
---

# 用户认证 业务规格

## Purpose

{模块的业务定位和职责边界}

---

## Requirement: {需求标识}

{需求描述，使用 RFC 2119 关键字（MUST/SHOULD/MAY）}

### Scenario: {场景名}

- **Given** {业务前置条件}
- **When** {业务动作}
- **Then** {业务结果}
```

## 流程

### 提取

1. 读取已归档的 issue 文件（`docs/archive/{year}/`）
2. 分析需求内容：
   - 需求描述
   - 验收标准
   - 开发总结
3. 识别涉及的业务领域
4. 判断提取类型：
   - 业务规则 → 提取到 `docs/spec/business/`
   - 技术方案 → 提取到 `docs/spec/technical/`

### 业务规格提取要求

**When 部分：**

- ✅ 业务动作：「用户获取当前企业信息」
- ❌ 代码调用：「调用 companyServices.getCompanyInfo()」

**Then 部分：**

- ✅ 业务结果：「返回企业的完整信息，包括基本信息、认证状态、身份类型等」
- ❌ 代码字段：「返回 CompanyModel，包含 companyId、companyName...」

**Given 部分：**

- ✅ 业务条件：「用户已进入某企业」
- ❌ 数据格式：「后端返回 isCertified 为 true」

### 更新 Spec 文档

1. 检查 `docs/spec/business/` 或 `docs/spec/technical/` 下是否已有相关 spec
   - 不存在：创建新 spec
   - 已存在：追加或更新相关内容
2. 更新 frontmatter（tags、keywords、summary）
3. 更新 issue 的 status 为 spec

### 索引维护

更新 `docs/spec/business/README.md` 或 `docs/spec/technical/README.md` 索引。

## 示例

**单个提取：**

```
/spec issue-062305
```

**批量提取：**

```
/spec issue-062301 issue-062305
```

**输出：**

- 读取 `docs/archive/2026/issue-062305-*.md`
- 提取规格（业务规则或技术方案）
- 更新 `docs/spec/business/` 或 `docs/spec/technical/` 下的相关文档
- 更新 issue 的 status 为 spec

## Anti-Rationalizations

| Agent 的借口 | 反驳 |
|-------------|------|
| "这个需求内容太少，提取不出什么" | 少也是知识，一句话的业务规则也是规格 |
| "开发总结里没有决策记录就跳过" | 没有决策记录本身就是一个事实，记录下来 |
| "已有 spec 内容差不多，不更新了" | "差不多"不是"一样"，差异就是需要更新的部分 |
| "批量提取太慢，先跳过几个" | 每个归档需求都值得被审视，否则当初为什么归档 |

## Red Flags

- 提取出的规格大量引用代码细节（函数名、字段名）→ 重新审视是否在提取业务规则
- 同一领域 spec 已存在但内容冲突 → 需要人工判断哪个是最新业务规则
- 连续 3 个需求提取出的 spec 内容高度重复 → 考虑合并

## Verification

完成的证据：

- [ ] 每个指定的 issue 都已处理（提取或跳过并说明原因）
- [ ] 提取的 spec 符合业务规格模板（Given/When/Then）
- [ ] spec 中不包含代码实现细节
- [ ] 相关 README 索引已更新
- [ ] issue status 已更新为 spec
