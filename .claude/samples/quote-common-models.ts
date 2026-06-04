// ==========================================
// 0. 外部常量引入
// ==========================================
import { quoteStatusDict, type QuoteStatusValue } from "./quote-constants";

// ==========================================
// 1. 严格的 TypeScript 类型声明（给 AI 的类型打样）
// ==========================================

export interface BaseProduct {
  price: number;
  qty: number;
  type?: "standard" | "premium";
  [key: string]: any;
}

/**
 * 全链路通用的状态事实上下文
 */
export interface StatusContext {
  value: QuoteStatusValue | ""; // 被清洗后的强类型状态值，未匹配到时为 ''
  label: string; // 全局统一的中文状态文案
  isDraft: boolean; // 是否为草稿/待提交状态（决定单据是否允许被修改）
  isPublished: boolean; // 是否已发布/已公示（控制公共可见性）
  isClosed: boolean; // 是否已关闭/已完结/已归档
  canApprove: boolean; // 是否处于审批流卡槽中（控制审批动作按钮的显隐）
}

// ==========================================
// 2. 局部原子纯函数（领域通用规则零件，绝对禁止使用 this）
// ==========================================

/**
 * 核心状态工厂：消费外部只读字典，将后端的数字状态安全洗成完备的“状态业务布尔值”
 * @param statusValue 后端返回的原始状态码
 */
function createStatusContext(
  statusValue: string | number | undefined | null,
): StatusContext {
  // 1. 无脑在只读字典数组中寻找匹配项，天然完成安全性防错
  const matchedItem = Object.values(quoteStatusDict).find(
    (item) => item.value === statusValue,
  );

  // 2. 提取安全值与文案，未匹配到时进行安全降级兜底
  const val = matchedItem ? matchedItem.value : "";
  const label = matchedItem ? matchedItem.label : "未知状态";

  return {
    value: val,
    label,

    // 3. 消费 constants 里的具体字面量 value，派生出纯粹的语义布尔值
    // 供应链核心业务：草稿态与被驳回态，在修改、删除的心智上完全属于同一种“草稿可改状态”
    isDraft:
      val === quoteStatusDict.DRAFT.value ||
      val === quoteStatusDict.REJECTED.value,
    canApprove: val === quoteStatusDict.PENDING_APPROVAL.value,
    isPublished: val === quoteStatusDict.PUBLISHED.value,
    isClosed: val === quoteStatusDict.CLOSED.value,
  };
}

/**
 * 风控核心规则：判定单项商品单价是否越过了全局风控安全红线
 */
function isPriceOverWarning(item: BaseProduct): boolean {
  if (!item) return false;
  const price = item.price || 0;
  const limitPrice = item.type === "premium" ? 500 : 300;
  return price > limitPrice;
}

/**
 * 计价核心规则：全系统通用的标准总价聚合算法
 */
function calculateStandardTotal(products: BaseProduct[] = []): number {
  if (!Array.isArray(products)) return 0;

  return products.reduce((sum, item) => {
    const price = item.price || 0;
    const qty = item.qty || 0;
    const ratio = item.type === "premium" ? 1.05 : 1.0;

    return sum + price * qty * ratio;
  }, 0);
}

// ==========================================
// 3. 统一命名空间打包导出
// ==========================================
export const quoteModels = {
  createStatusContext,
  isPriceOverWarning,
  calculateStandardTotal,
};
