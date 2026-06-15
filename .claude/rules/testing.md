---
paths:
  - "**/*.test.{js,ts}"
  - "**/*.spec.{js,ts}"
---

> 完整规范见 [docs/spec/project.md](../../docs/spec/project.md) 5.1，本文为自动加载的精简版。

# 单元测试规范（精简版）

## 测试分级

测试价值 = 逻辑复杂度 × 变更频率 × 影响范围。不追求覆盖率。

| 级别 | 范围 | 要求 |
| --- | --- | --- |
| P0（必须测） | 多字段聚合、`canSave`、`needApproval`、`uiContext` 显隐分支 | `test.each` 参数化 |
| P1（建议测） | 中等复杂的表单校验、customers 策略合并 | 按需覆盖 |
| P2/P3（不测） | 纯单项映射、常量枚举 | 无需测试 |

## 关键规则

- 测试文件与被测文件同目录（`models.test.ts` 与 `models.ts` 同级）
- BDD 风格：`describe/it` 描述贴近用户行为，非实现细节
- P0 必须用 `test.each` / `it.each` 参数化测试
- services 测试可 mock `apis`

## 示例

```typescript
describe("报价表单保存条件", () => {
  it.each([
    { desc: "有商品且金额>0", formData: { items: [{ price: 100, quantity: 1 }] }, expected: true },
    { desc: "无商品", formData: { items: [] }, expected: false },
  ])("$desc → $expected", ({ formData, expected }) => {
    expect(models.canSave(formData)).toBe(expected);
  });
});
```
