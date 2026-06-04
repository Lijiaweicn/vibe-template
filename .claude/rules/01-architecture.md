# 01 - 前端核心架构与分层规范

## 一、 核心分层与数据流向

项目严格禁止在组件/视图层中内嵌任何复杂的业务判定与联动逻辑。数据流必须保持单向、清晰且闭环：
`constants (元数据层) ➔ api (接口层) ➔ services (服务层/index.ts) ➔ models (模型层) ➔ view (视图层/组件)`
↑
settings (UI静态配置)

1. **constants (常量/元数据层)**：纯粹的业务字典声明。**严格禁止**编写业务逻辑。
2. **models (模型层)**：纯函数环境。只负责后端数据的业务语义增强与场景事实推导。**绝对禁止**在此发起网络请求，**绝对禁止**直接修改后端原始数据（必须返回全新对象）。
3. **services (服务层)**：业务场景调度总官（物理文件为 `index.ts`）。负责：触发异步请求 ➔ 调用 models 组合并增强数据 ➔ 完整解构上抛。

## 二、 模型层与服务层红线（AI 绝对禁止违规）

- ❌ **严禁使用 this 关键字**：`models.ts` 和 `index.ts` 内的所有局部函数必须是无副作用的纯函数。如需复用内部逻辑，必须显式通过直接调用函数名（如 `checkCanSave(raw)`），严禁使用 `this.xxx`。
- ❌ **零响应式依赖（剥离响应式外壳）**：领域层必须保持纯净的 TS 环境，**严禁**引入 Vue 的 `ref/reactive` 或 React 的 `useState/hooks`。
- 💡 **动态联动机制**：领域层只输出静态的业务截屏（Snapshot）。视图层的联动必须通过外壳层的计算属性（如 Vue 3 的 `computed`），通过动态调用模型的工厂函数来实现高频变化。

## 三、 常量字典与元数据红线

- ❌ **严禁使用裸奔的行内字典映射**：任何涉及业务状态的中文字符串（如 `labelMap`），**绝对禁止**散落在 `models.ts` 函数体内，必须全量收拢至对应的 `constants.ts` 中。
- ❌ **严禁使用常规对象声明**：所有对象字典（Object Dictionary）在声明时，必须在结尾显式追加 `as const` 断言，防止字面量类型退化为宽泛的 `number/string`。
- 💡 **一源多用原则**：常量字典必须同时推导出强类型定义（给领域层做断言）和 Options 数组（给视图层渲染下拉菜单/表格筛选），坚决杜绝二次硬编码。

## 四、 物理组织与大合一导出规范

1. **主工厂入口命名**：具体模块的 `models.ts` 必须导出一个主工厂函数，统一命名为 `createXxxContext`（表单叫 `createFormContext`，详情叫 `createDetailContext`）。
2. **场景事实完整挂载**：主工厂函数**必须返回一个完整的、被业务语义增强后的实体上下文对象**。**绝对禁止**将业务数据和 `uiContext` 作为两个独立对象分开返回给上层。
3. **统一大合一出口（门面模式）**：具体模块的 `index.ts` 底部必须使用 `export { xxxServices, xxxModels };` 进行大合一纯解构导出。视图层组件引入时，统一从该 `index` 单点解构引入。
4. **复杂表单双驱二分红线**：
   对于存在网络提交行为的复杂表单模块（Form），主工厂函数**必须将输出解构为独立的 `formData` 与 `formContext` 两大域**并返回。
   - `formData`：只包含需要双向绑定、且在保存时完整提交给后端的纯净数据。
   - `formContext`：包含 `isEdit`、`isSubmitting`、`statusCtx` 以及页面高频联动的 `uiContext`事实，仅供页面交互逻辑消费。
   - ❌ **红线**：严禁在 `formData` 对象内部塞入任何控制 UI 的临时布尔值，服务层向后端发送保存请求时，只允许传输 `formData`。

---

## 五、 模型分级与复用机制

项目中的模型（models）严格划分为两个层级，以此避免组件间的业务逻辑传染：

- ➔ **通用领域事实（Common Models）标准写法**：
  文件路径：`.claude/samples/quote-common-models.ts`
  _心智重点：纯粹基础算力、消费常量字典、最终打包统一命名为 `quoteModels` 命名空间导出。_

- ➔ **具体场景模型（Local Models）标准写法**：
  文件路径：`.claude/samples/quote-form-models.ts`
  _心智重点：局部闭包平铺、高度组合通用层 `quoteModels`、自身统一带场景后缀（如 `quoteFormModels`）导出。_

---

## 六、 像素级标准打样索引（TS 强类型规范）

当前项目为现代 TypeScript 强类型环境。你（AI）在生成、重构任何模块的代码时，**必须无条件像素级模仿和对齐**以下四个存放在打样目录下的活代码结构、类型定义与依赖消费设计：

- ➔ **全局常量字典标准写法（一源多用与 as const 锁定）**：
  文件路径：`.claude/samples/quote-constants.ts`
  _心智重点：字面量锁定、逆向联合类型推导、视图层 Options 数组输出。_

- ➔ **通用领域事实（Common Models）标准写法**：
  文件路径：`.claude/samples/quote-common-models.ts`
  _心智重点：纯粹基础算力、消费常量字典、输出无魔法数字的状态上下文。_

- ➔ **具体场景模型（Local Models）标准写法**：
  文件路径：`.claude/samples/quote-form-models.ts`
  _心智重点：局部闭包平铺、高度组合通用模型、顶层挂载只读 uiContext 场景事实。_

- ➔ **服务聚合调度（Services / Gate）标准写法**：
  文件路径：`.claude/samples/quote-form-index.ts`
  _心智重点：异步请求捕获与转发、大门面解构导出、无脑调用模型组合。_

---

## 七、 视图层防错红线

- 1. 视图层组件在使用数据前，必须在初始化时调用 Services 层的 `createInitialFormData()` 获取完备的骨架对象。
- 2. 视图层（模板或 JSX）中**严禁**出现复杂的业务条件表达式（如 `v-if="status === 1 || status === 3"` 属于严重违规），必须直接读取 `formData.uiContext.xxxVisible` 或 `formData.statusCtx.isDraft`。
- 3. 视图层读取派生属性时，**严禁**编写 `&&` 存在性防御代码（如 `formData && formData.uiContext && ...`），必须直接访问属性，确保底层模型的防御性空值兜底已彻底生效。

---

## 八、 架构熔断与精简降级（防止过度设计）

如果当前模块属于“纯静态展示”、“无任何动态显隐、无跨字段高频联动、无任何业务计算判定”的极简页面（例如：纯静态的系统公告查看页）：

1. **允许熔断 models.ts**：该模块可以**不创建** `models.ts` 文件。
2. **Services 直通降级**：在模块的 `index.ts` 中，`getDetail` 函数允许直接返回 API 的 `rawData`，无需包裹 `createFormContext`。
3. **视图层防御兜底**：此时视图层若需要防错，允许使用 TS 5.x 的可选链（`formData?.title`）直接读取数据。

⚠️ **熔断红线**：一旦该模块在后续迭代中，增加了**哪怕一个**动态显隐、或者是**哪怕一项**布尔值联动判定，必须**立刻终止熔断**，老老实实重构为标准三级打样架构，坚决不给屎山留任何缺口。
