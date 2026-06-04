---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
---

# testing.md - 修正版

# 单元测试规范

## 核心原则

测试价值 = 逻辑复杂度 × 变更频率 × 影响范围

## 测试分级

- **P0（必须测）**：多字段聚合、canSave、needApproval、uiContext 显隐分支
  - 必须使用参数化测试（`test.each`/`it.each`）
- **P1（建议测）**：中等复杂的表单校验
- **P2/P3（严禁测）**：纯单项映射、常量枚举

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
