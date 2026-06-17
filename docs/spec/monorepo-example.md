# Monorepo 示例：从零搭建 Todo 应用

> 本文档展示如何按照 [project-monorepo.md](./project-monorepo.md) 规范，从零搭建一个完整的 Todo 领域包和应用壳。
>
> **聚焦核心内容**：配置文件仅列出关键字段，完整配置参考主文档。

---

## 一、初始化

```bash
mkdir todo-monorepo && cd todo-monorepo
pnpm init

# 创建目录结构
mkdir -p packages/shared/src/{infra,types,utils,hooks}
mkdir -p packages/todo/src/task/{services,components,hooks}
mkdir -p apps/main/src/{views/todo/task,types,routes}
```

---

## 二、共享包（packages/shared）

> shared 是**系统级基础设施层**，不放业务能力。只包含技术基础、基础模型、工具函数。

### 2.1 核心代码

```typescript
// packages/shared/src/infra/request.ts
import axios from 'axios'
export const request = axios.create({ baseURL: '/api', timeout: 10000 })

// packages/shared/src/infra/logger.ts
export interface Logger {
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
  error(message: string, error?: unknown): void
}

export const defaultLogger: Logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
}

// packages/shared/src/infra/errors.ts
export class BusinessError extends Error {
  constructor(message: string, public code: string, public details?: unknown) {
    super(message)
    this.name = 'BusinessError'
  }
}

// packages/shared/src/types/user-context.ts
export interface BaseCrossDomainContext {
  userId: string
  userName: string
  customer?: string
  tenantId?: string
  permissions: string[]
}

// packages/shared/src/utils/dict.ts
export function createDict<T extends string>(definitions: Record<string, { value: T; label: string; color?: string }>) {
  const entries = Object.values(definitions)
  const getItem = (value: T) => entries.find(item => item.value === value)
  return { ...definitions, getItem, entries }
}

// packages/shared/src/index.ts
export { request } from './infra/request'
export { defaultLogger, type Logger } from './infra/logger'
export { BusinessError } from './infra/errors'
export { createDict } from './utils/dict'
export type { BaseCrossDomainContext } from './types/user-context'
```

### 2.2 配置要点

```json
// packages/shared/package.json（关键字段）
{
  "name": "@monorepo/shared",
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" } },
  "scripts": { "build": "vite build" },
  "dependencies": { "axios": "^1.6.0" }
}
```

---

## 三、Todo 领域包（packages/todo）

### 3.1 业务逻辑层（services）

```typescript
// packages/todo/src/task/services/constants.ts
import { createDict } from '@monorepo/shared'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export const taskStatusDict = createDict<TaskStatus>({
  TODO: { value: 'todo', label: '待办', color: 'gray' },
  IN_PROGRESS: { value: 'in_progress', label: '进行中', color: 'blue' },
  DONE: { value: 'done', label: '已完成', color: 'green' },
})

// packages/todo/src/task/services/models.ts
import { taskStatusDict, type TaskStatus } from './constants'
export interface Task { id: string; title: string; status: TaskStatus; createdAt: string }
export interface TaskFormData { title: string; status: TaskStatus }
export interface TaskFormContext { statusCtx: { value: string; label: string; color: string; isDone: boolean }; canSubmit: boolean }

export function createTaskFormContext(task: Task): TaskFormContext {
  const statusItem = taskStatusDict.getItem(task.status)
  return {
    statusCtx: { value: task.status, label: statusItem?.label ?? '未知', color: statusItem?.color ?? 'gray', isDone: task.status === 'done' },
    canSubmit: task.title.trim().length > 0,
  }
}

// packages/todo/src/task/services/apis.ts
import { request } from '@monorepo/shared'
import type { Task, TaskFormData } from './models'
export const getTaskList = (): Promise<Task[]> => request.get('/tasks').then(r => r.data)
export const createTask = (data: TaskFormData): Promise<Task> => request.post('/tasks', data).then(r => r.data)
export const deleteTask = (id: string): Promise<void> => request.delete(`/tasks/${id}`)

// packages/todo/src/task/services/index.ts
import * as apis from './apis'
import * as models from './models'

export const taskServices = {
  fetchTaskList: () => apis.getTaskList().then(tasks => tasks.map(t => ({ ...t, context: models.createTaskFormContext(t) }))),
  deleteTask: apis.deleteTask,
}
export const taskLogic = models
```

### 3.2 视图层

```vue
<!-- packages/todo/src/task/components/TaskItem.vue -->
<template>
  <div class="task-item" :class="{ 'is-done': task.context.statusCtx.isDone }">
    <span>{{ task.title }}</span>
    <span :style="{ color: task.context.statusCtx.color }">{{ task.context.statusCtx.label }}</span>
    <button @click.stop="handleDelete">删除</button>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskFormContext } from '../services/models'
type TaskWithContext = Task & { context: TaskFormContext }
const props = defineProps<{ task: TaskWithContext }>()
const emit = defineEmits<{ delete: [id: string] }>()
const handleDelete = () => { if (confirm('确定删除？')) emit('delete', props.task.id) }
</script>
```

```typescript
// packages/todo/src/task/hooks/useOrderForm.ts（领域 hooks：关注业务对象）
import { ref, onMounted } from 'vue'
import { taskServices } from '../services'
import type { Task, TaskFormContext } from '../services/models'

type TaskWithContext = Task & { context: TaskFormContext }

export function useTaskList() {
  const loading = ref(false)
  const tasks = ref<TaskWithContext[]>([])
  const load = async () => { loading.value = true; tasks.value = await taskServices.fetchTaskList(); loading.value = false }
  const deleteTask = async (id: string) => { await taskServices.deleteTask(id); await load() }
  onMounted(load)
  return { loading, tasks, deleteTask }
}
```

### 3.3 导出

```typescript
// packages/todo/src/task/index.ts
export { taskServices, taskLogic } from './services'
export { default as TaskItem } from './components/TaskItem.vue'
export { useTaskList } from './hooks/useTaskList'
export type { Task, TaskFormData, TaskFormContext } from './services/models'

// packages/todo/src/index.ts
export { taskServices, taskLogic, TaskItem, useTaskList } from './task'
export type { Task, TaskFormData, TaskFormContext } from './task'
```

### 3.4 配置要点

```json
// packages/todo/package.json（关键字段）
{
  "name": "@monorepo/todo",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./style.css": "./dist/style.css"
  },
  "dependencies": { "@monorepo/shared": "workspace:*" },
  "peerDependencies": { "vue": "^3.4.0" },
  "peerDependenciesMeta": { "vue": { "optional": true } }
}
```

---

## 四、应用壳（apps/main）

### 4.1 Context 类型

```typescript
// apps/main/src/types/context.ts
import type { BaseCrossDomainContext } from '@monorepo/shared'
export interface AppCrossDomainContext extends BaseCrossDomainContext {
  module: 'todo' | 'bidding' | 'contract' | 'supplier'
}
```

### 4.2 页面壳

```vue
<!-- apps/main/src/views/todo/task/task-list.vue -->
<template>
  <div class="task-list-page">
    <h1>任务列表</h1>
    <div v-if="loading">加载中...</div>
    <TaskItem v-for="task in tasks" :key="task.id" :task="task" @delete="deleteTask" />
  </div>
</template>

<script setup lang="ts">
import { TaskItem, useTaskList } from '@monorepo/todo'
const { loading, tasks, deleteTask } = useTaskList()
</script>
```

### 4.3 页面组合 hooks（应用层）

```typescript
// apps/main/src/views/todo/task/hooks/useTaskListPage.ts（页面组合 hooks）
import { useTaskList } from '@monorepo/todo'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { usePagination } from '@/hooks/usePagination'

export function useTaskListPage() {
  // 组合多个关注点
  const { query } = useRouteQuery()
  const { pagination } = usePagination()
  const { loading, tasks, deleteTask } = useTaskList()

  return { query, pagination, loading, tasks, deleteTask }
}
```

> **判断标准**：hook 名字包含 Page/Route/Query → 应用层；包含业务对象名 → 领域层。

### 4.4 路由与入口

```typescript
// apps/main/src/routes/index.ts
import { createRouter, createWebHistory } from 'vue-router'
export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/todo/tasks' },
    { path: '/todo/tasks', component: () => import('@/views/todo/task/task-list.vue') },
  ],
})

// apps/main/src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './routes'
createApp(App).use(router).mount('#app')
```

### 4.5 配置要点

```json
// apps/main/package.json（关键字段）
{
  "name": "@monorepo/main",
  "private": true,
  "dependencies": {
    "@monorepo/shared": "workspace:*",
    "@monorepo/todo": "workspace:*",
    "vue": "^3.4.0",
    "vue-router": "^4.3.0"
  }
}
```

---

## 五、根配置

```json
// package.json
{
  "name": "todo-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @monorepo/main dev",
    "build": "turbo run build",
    "test": "turbo run test"
  },
  "devDependencies": { "turbo": "^2.0.0", "typescript": "^5.5.0", "vue-tsc": "^2.0.0" }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

---

## 六、目录结构

```
todo-monorepo/
├── packages/
│   ├── shared/                    # 系统级基础设施
│   │   └── src/
│   │       ├── infra/    # request, logger, errors
│   │       ├── types/ # BaseCrossDomainContext
│   │       ├── hooks/             # UI 交互 hooks（useTable 等）
│   │       ├── utils/             # dict, format
│   │       └── index.ts
│   └── todo/                      # Todo 领域包
│       └── src/
│           └── task/
│               ├── services/      # 业务逻辑（models, apis, constants）
│               ├── components/    # TaskItem.vue
│               ├── hooks/         # useTaskList.ts（领域 hooks）
│               └── index.ts
├── apps/
│   └── main/                      # 应用壳
│       └── src/
│           ├── views/todo/task/
│           │   ├── task-list.vue
│           │   └── hooks/         # useTaskListPage.ts（页面组合 hooks）
│           ├── types/             # AppCrossDomainContext
│           └── routes/
├── package.json
└── pnpm-workspace.yaml
```

---

## 七、运行

```bash
pnpm install
pnpm dev                          # 启动开发服务器
pnpm build                        # 构建所有包
pnpm --filter @monorepo/todo build  # 单独构建 Todo 领域包
```
