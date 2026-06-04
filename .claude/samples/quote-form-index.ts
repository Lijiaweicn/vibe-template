import { quoteFormModels } from "./quote-form-models";
import type { QuoteFormData, QuoteFormContext } from "./quote-form-models";

// ==========================================
// 1. 局部异步原子请求与服务（副作用零件，无 this 隐患）
// ==========================================

/**
 * 远程获取报价单原始数据（私有异步请求零件）
 * * 💡 架构要领：
 * 实际项目中，这里直接替换为 Axios、Fetch 或你封装的全局请求工具（如：return request.get(...)）
 * 打样中通过 Promise 模拟一个标准的后端响应契约。
 */
async function fetchRemoteQuoteDetail(
  id: string | number,
): Promise<Partial<QuoteFormData>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        status: 1, // 审批中
        remark: "大厂优质无烟煤采购，急需价格审批。",
        products: [
          {
            id: 101,
            name: "优质无烟煤",
            price: 350,
            qty: 100,
            type: "standard",
          },
          {
            id: 102,
            name: "特级进口航空煤",
            price: 600,
            qty: 50,
            type: "premium",
          },
        ],
      });
    }, 200);
  });
}

/**
 * 核心调度：获取详情并实现数据与状态的“双驱解构增强”
 */
async function getDetail(
  id: string | number,
): Promise<{ formData: QuoteFormData; formContext: QuoteFormContext }> {
  // a. 调用私有异步请求拿到后端原始数据
  const rawData = await fetchRemoteQuoteDetail(id);

  // b. 扔进 Form 专用的双驱工厂，将其彻底分拆为纯净数据（formData）与交互上下文（formContext）
  return quoteFormModels.createFormModuleStructure(rawData, { isEdit: true });
}

/**
 * 核心调度：提交表单数据（享受二分法的纯净传递）
 */
async function saveForm(formData: QuoteFormData): Promise<any> {
  // 💡 爽点：直接发送物理隔离后的 formData，不夹带任何 uiContext 杂质，后端收数据极度舒适
  return fetch("/api/quote/save", {
    method: "POST",
    body: JSON.stringify(formData),
  }).then((res) => res.json());
}

/**
 * 核心调度：表单初始响应式数据安全骨架工厂（挂在服务层下，供页面初次加载无参调用）
 */
function createInitialFormData(): {
  formData: QuoteFormData;
  formContext: QuoteFormContext;
} {
  return quoteFormModels.createInitialFormStructure();
}

// ==========================================
// 2. 局部封装服务对象（内部组件化包装）
// ==========================================
const quoteFormServices = {
  getDetail,
  saveForm,
  createInitialFormData,
};

// ==========================================
// 3. 终极门面大合一导出（模块唯一对外防火墙）
// ==========================================
export { quoteFormServices, quoteFormModels };

// 顺便将核心的数据、状态强类型顺着大门抛出去，供视图层直接解构消费
export type {
  QuoteFormData,
  QuoteFormContext,
  ProductItem,
  UiFacts,
} from "./quote-form-models";
