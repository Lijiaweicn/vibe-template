---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
---

# 单元测试规范

## 核心原则

测试价值 = 逻辑复杂度 × 变更频率 × 影响范围

## 测试分级

- **P0（必须测）**：多字段聚合、canSave、needApproval、uiContext 显隐分支
  - 必须使用参数化测试（`test.each`/`it.each`）
- **P1（建议测）**：中等复杂的表单校验
- **P2/P3（严禁测）**：纯单项映射、常量枚举

## BDD 风格

`describe/it` 的描述应贴近用户行为语言，而非纯实现细节。测试既是开发的反馈循环，也是验收的自动化映射。

```typescript
// 好 — 贴近验收清单的行为描述
describe("报价表单", () => {
  it("输入非法邮箱后点击保存，应显示红色错误提示", () => { ... })
})

// 差 — 纯实现细节，看不出在测什么行为
describe("validateEmail", () => {
  it("should return false for invalid email", () => { ... })
})
```

## 示例

```typescript
describe("canSave", () => {
  it.each([
    { form: { items: [{}], total: 100 }, expected: true },
    { form: { items: [], total: 100 }, expected: false },
  ])("应返回 $expected", ({ form, expected }) => {
    expect(models.canSave(form)).toBe(expected);
  });
});
```
