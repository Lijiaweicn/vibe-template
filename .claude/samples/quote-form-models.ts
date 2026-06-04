import { quoteModels } from "./quote-common-models";
import type { StatusContext } from "./quote-common-models";

// ==========================================
// 1. 严格的 TypeScript 类型定义（数据与状态彻底二分）
// ==========================================

export interface ProductItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  type?: "standard" | "premium";
}

/**
 * 【分类一：formData】纯洁数据契约
 * 这个接口里的字段，100% 对应后端数据库，保存时无脑全量提交，不含任何 UI 交互状态。
 */
export interface QuoteFormData {
  id?: string | number;
  status?: string | number;
  remark?: string;
  products: ProductItem[];
}

/**
 * UI 页面专属的局部高频联动布尔事实（控制显隐、置灰等）
 */
export interface UiFacts {
  showRateInput: boolean;
  showApprovalPanel: boolean;
  canSave: boolean;
}

/**
 * 【分类二：formContext】页面交互总上下文
 * 负责管辖所有与“交互、生命周期、流程 facts”相关的运行时状态。
 */
export interface QuoteFormContext {
  isEdit: boolean; // 运行时事实：当前处于新建还是编辑态
  isSubmitting: boolean; // 运行时事实：控制全局提交按钮的 Loading 状态
  statusCtx: StatusContext; // 领域事实：调用全局通用模型清洗出来的流程状态大对象
  uiContext: UiFacts; // 场景事实：特定于当前表单的动态联动事实
}

// ==========================================
// 2. 局部原子纯函数（业务规则零件）
// ==========================================
function checkShowRateInput(data: QuoteFormData, isEdit: boolean): boolean {
  return isEdit && data.products.length > 0;
}

function checkShowApprovalPanel(
  data: QuoteFormData,
  statusCtx: StatusContext,
): boolean {
  const actualTotal = quoteModels.calculateStandardTotal(data.products);
  return statusCtx.canApprove && actualTotal > 10000;
}

function checkCanSave(data: QuoteFormData): boolean {
  if (data.products.length === 0) return false;
  const hasOverPrice = data.products.some((item) =>
    quoteModels.isPriceOverWarning(item),
  );
  if (hasOverPrice && !data.remark?.trim()) return false;
  return true;
}

// ==========================================
// 3. 终极双驱工厂（总装车间）
// ==========================================

/**
 * 表单初始化工厂：确保组件挂载第一秒，数据和状态骨架都是完备的
 */
function createInitialFormStructure(): {
  formData: QuoteFormData;
  formContext: QuoteFormContext;
} {
  const defaultData: QuoteFormData = {
    id: "",
    status: 0,
    remark: "",
    products: [],
  };
  return createFormModuleStructure(defaultData, { isEdit: false });
}

/**
 * 表单双驱核心转换器：吞噬任何原始数据与环境参数，输出绝对隔离的 formData 与 formContext
 */
function createFormModuleStructure(
  raw: Partial<QuoteFormData> = {},
  options: { isEdit?: boolean } = {},
): { formData: QuoteFormData; formContext: QuoteFormContext } {
  const isEdit = options.isEdit ?? true;

  // 1. 组装绝对纯净的 formData（干净利落，无脑用于 v-model 绑定）
  const formData: QuoteFormData = {
    id: raw.id || "",
    status: raw.status ?? 0,
    remark: raw.remark || "",
    products: raw.products || [],
  };

  // 2. 调度全局模型，清洗流程状态事实
  const statusCtx = quoteModels.createStatusContext(formData.status);

  // 3. 组装全系统隔离的 formContext（仅负责交互与控制）
  const formContext: QuoteFormContext = {
    isEdit,
    isSubmitting: false, // 初始为非提交态
    statusCtx,
    uiContext: {
      showRateInput: checkShowRateInput(formData, isEdit),
      showApprovalPanel: checkShowApprovalPanel(formData, statusCtx),
      canSave: checkCanSave(formData),
    },
  };

  // 4. 以清晰的双驱结构返回，拒绝混合
  return { formData, formContext };
}

const quoteFormModels = {
  createInitialFormStructure,
  createFormModuleStructure,
};

export { quoteFormModels };
