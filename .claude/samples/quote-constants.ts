/**
 * 报价单状态全局对象字典
 *
 * 💡 架构要领：
 * 必须在结尾显式使用 `as const` 锁定字面量类型。
 * 这能确保底层 value 的类型不退化为普通的 number，而是精准的字面量数字。
 */
export const quoteStatusDict = {
  DRAFT: { value: 0, label: "草稿" },
  PENDING_APPROVAL: { value: 1, label: "审批中" },
  PUBLISHED: { value: 2, label: "已发布" },
  REJECTED: { value: 3, label: "已驳回" },
  CLOSED: { value: 4, label: "已关闭" },
} as const;

/**
 * 逆向自动推导状态值联合类型：0 | 1 | 2 | 3 | 4
 * 供全项目（模型层、组件层）进行精准的强类型限定
 */
export type QuoteStatusValue =
  (typeof quoteStatusDict)[keyof typeof quoteStatusDict]["value"];

/**
 * 💡 视图层福利（单点复用示范）：
 * 视图层的 el-select 下拉框、或者表格筛选列直接引入本数组，彻底杜绝在组件内重复手写字典
 * 输出格式：[{ value: 0, label: '草稿' }, { value: 1, label: '审批中' }, ...]
 */
export const QUOTE_STATUS_OPTIONS = Object.values(quoteStatusDict);
