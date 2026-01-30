# Vue3 反模式和最佳实践

## 概述

本文档总结 Vue3 开发中常见的反模式（Anti-patterns）和对应的最佳实践，帮助识别和避免常见错误，提升代码质量。

---

## 组件设计

### ❌ 反模式 1: 上帝组件 (God Component)

**问题**: 一个组件承担过多职责，代码量超过 500 行

```vue
<!-- ❌ 错误：一个组件承担所有职责 -->
<script setup lang="ts">
// UserManagement.vue - 800+ 行代码
const users = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 20 })
const filters = ref({})
const selectedUsers = ref([])
const dialogVisible = ref(false)
const currentUser = ref(null)
// ... 50+ 个 ref

// 20+ 个函数
const fetchUsers = async () => { /* 100 行 */ }
const handleSearch = () => { /* 50 行 */ }
const handlePageChange = () => { /* 30 行 */ }
const handleSelect = () => { /* 40 行 */ }
const handleDelete = () => { /* 60 行 */ }
const handleEdit = () => { /* 80 行 */ }
// ... 更多函数
</script>

<template>
  <!-- 复杂的模板结构 -->
  <div class="user-management">
    <!-- 筛选器 -->
    <!-- 表格 -->
    <!-- 分页 -->
    <!-- 对话框 -->
    <!-- 更多内容 -->
  </div>
</template>
```

**问题**:
- 难以维护和测试
- 代码可读性差
- 违反单一职责原则

### ✅ 最佳实践: 组件拆分

```vue
<!-- ✅ 正确：按职责拆分组件 -->
<script setup lang="ts">
// UserManagement.vue - 作为容器组件
import UserFilterBar from './components/UserFilterBar.vue'
import UserTable from './components/UserTable.vue'
import UserPagination from './components/UserPagination.vue'
import UserDeleteDialog from './components/UserDeleteDialog.vue'
import { useUserManagement } from './composables/useUserManagement'

const {
  users,
  loading,
  pagination,
  fetchUsers,
  handleDelete
} = useUserManagement()
</script>

<template>
  <div class="user-management">
    <UserFilterBar @search="fetchUsers" />
    <UserTable :users="users" :loading="loading" @delete="handleDelete" />
    <UserPagination v-model="pagination" @change="fetchUsers" />
    <UserDeleteDialog @confirm="handleDelete" />
  </div>
</template>

<!-- UserFilterBar.vue - 负责筛选 -->
<script setup lang="ts">
interface Props {
  fields: FilterField[]
}

interface Emits {
  search: [filters: Record<string, any>]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFilters = ref<Record<string, any>>({})

const handleSearch = () => {
  emit('search', localFilters.value)
}
</script>

<template>
  <div class="filter-bar">
    <!-- 筛选器 UI -->
  </div>
</template>
```

---

## 响应式使用

### ❌ 反模式 2: 解构响应式对象

**问题**: 直接解构 reactive/ref 对象会丢失响应性

```typescript
// ❌ 错误：解构 reactive 会丢失响应性
const state = reactive({
  user: { name: 'John', age: 30 },
  loading: false
})

// 解构后丢失响应性
const { user, loading } = state

user.name = 'Jane' // 不会触发更新
loading.value = true // 报错
```

### ✅ 最佳实践: 使用 toRefs 或直接访问

```typescript
// ✅ 正确：使用 toRefs 保持响应性
const state = reactive({
  user: { name: 'John', age: 30 },
  loading: false
})

// 使用 toRefs
const { user, loading } = toRefs(state)

user.value.name = 'Jane' // ✅ 会触发更新
loading.value = true // ✅ 正常工作

// ✅ 正确：直接访问不解构
const state = reactive({
  user: { name: 'John', age: 30 },
  loading: false
})

state.user.name = 'Jane' // ✅ 会触发更新
state.loading = true // ✅ 正常工作
```

### ❌ 反模式 3: 直接修改 props

**问题**: 直接修改 props 会导致警告和不可预测的行为

```vue
<!-- ❌ 错误：直接修改 props -->
<script setup lang="ts">
interface Props {
  count: number
}

const props = defineProps<Props>()

const increment = () => {
  props.count++ // ❌ 错误：不能直接修改 props
}
</script>
```

### ✅ 最佳实践: 通过 emit 通知父组件

```vue
<!-- ✅ 正确：通过 emit 通知父组件 -->
<script setup lang="ts">
interface Props {
  count: number
}

interface Emits {
  'update:count': [value: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const increment = () => {
  emit('update:count', props.count + 1)
}
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>

<!-- 父组件使用 v-model -->
<UserCount v-model:count="count" />
```

---

## 性能问题

### ❌ 反模式 4: 不必要的响应式

**问题**: 将不需要响应式的数据做成响应式，增加性能开销

```typescript
// ❌ 错误：静态配置不需要响应式
const config = reactive({
  apiBaseUrl: 'https://api.example.com',
  pageSize: 20,
  themes: ['light', 'dark']
})

// ❌ 错误：常量使用响应式
const MAX_ITEMS = ref(100)
```

### ✅ 最佳实践: 静态数据使用普通常量

```typescript
// ✅ 正确：静态配置使用普通对象
const config = {
  apiBaseUrl: 'https://api.example.com',
  pageSize: 20,
  themes: ['light', 'dark']
}

// ✅ 正确：常量使用 const
const MAX_ITEMS = 100

// ✅ 正确：需要响应式的才用 ref/reactive
const currentPage = ref(1)
const items = ref<Item[]>([])
```

### ❌ 反模式 5: 列表渲染缺少 key

**问题**: v-for 缺少 key 或使用 index 作为 key

```vue
<!-- ❌ 错误：缺少 key -->
<div v-for="item in items">
  {{ item.name }}
</div>

<!-- ❌ 错误：使用 index 作为 key -->
<div v-for="(item, index) in items" :key="index">
  {{ item.name }}
</div>
```

**问题**:
- 导致不必要的 DOM 操作
- 列表重排时状态可能错乱

### ✅ 最佳实践: 使用唯一 ID 作为 key

```vue
<!-- ✅ 正确：使用唯一 ID -->
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>

<!-- ✅ 正确：没有 ID 时使用唯一标识 -->
<div v-for="(item, index) in items" :key="`${item.type}-${index}`">
  {{ item.name }}
</div>
```

### ❌ 反模式 6: 大列表全量渲染

**问题**: 大列表直接全量渲染，性能差

```vue
<!-- ❌ 错误：大列表全量渲染 -->
<template>
  <div>
    <div v-for="item in 10000items" :key="item.id">
      <!-- 复杂的内容 -->
    </div>
  </div>
</template>
```

### ✅ 最佳实践: 使用虚拟滚动

```vue
<!-- ✅ 正确：使用虚拟滚动 -->
<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  largeList,
  { itemHeight: 50 }
)
</script>

<template>
  <div v-bind="containerProps" style="height: 500px; overflow: auto;">
    <div v-bind="wrapperProps">
      <div
        v-for="item in list"
        :key="item.index"
        style="height: 50px;"
      >
        {{ item.data }}
      </div>
    </div>
  </div>
</template>
```

---

## 状态管理

### ❌ 反模式 7: 过度使用全局状态

**问题**: 所有状态都放在 Pinia Store

```typescript
// ❌ 错误：组件内状态也放在 Store
export const useUserFormStore = defineStore('userForm', () => {
  const formName = ref('')
  const formEmail = ref('')
  const formAge = ref('')
  const formValid = ref(false)
  // ... 组件表单状态不应该在全局
})
```

**问题**:
- 全局状态污染
- 多实例问题
- 不必要的响应式开销

### ✅ 最佳实践: 区分本地和全局状态

```typescript
// ✅ 正确：组件内状态使用 ref
// UserForm.vue
<script setup lang="ts">
const formName = ref('')
const formEmail = ref('')
const formAge = ref('')
const formValid = ref(false)
</script>

// ✅ 正确：只有共享状态放 Store
export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const isLoggedIn = ref(false)

  const setUser = (user: User) => {
    currentUser.value = user
    isLoggedIn.value = true
  }

  return {
    currentUser,
    isLoggedIn,
    setUser
  }
})
```

---

## 代码风格

### ❌ 反模式 8: 魔法数字和字符串

**问题**: 代码中直接使用数字和字符串

```vue
<!-- ❌ 错误：魔法数字 -->
<script setup lang="ts">
if (user.status === 1) {
  // 待处理
} else if (user.status === 2) {
  // 已完成
}

const maxItems = 20
</script>

<template>
  <div :class="type === 'primary' ? 'blue' : 'gray'">
    <!-- 魔法字符串 -->
  </div>
</template>
```

### ✅ 最佳实践: 使用常量和枚举

```typescript
// ✅ 正确：使用枚举
enum UserStatus {
  PENDING = 1,
  COMPLETED = 2,
  CANCELLED = 3
}

if (user.status === UserStatus.PENDING) {
  // 待处理
}

// ✅ 正确：使用常量
const CONFIG = {
  MAX_ITEMS: 20,
  PAGE_SIZE: 20,
  DEFAULT_THEME: 'light' as const
}

// ✅ 正确：类型安全
enum ButtonType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary'
}

const buttonClass = computed(() =>
  props.type === ButtonType.PRIMARY ? 'blue' : 'gray'
)
```

---

## 类型安全

### ❌ 反模式 9: 使用 any

**问题**: 到处使用 any 类型

```typescript
// ❌ 错误：使用 any
const fetchData = async (params: any) => {
  const response: any = await api.get('/data', params)
  return response.data
}

const handleClick = (event: any) => {
  console.log(event.target.value)
}
```

### ✅ 最佳实践: 明确定义类型

```typescript
// ✅ 正确：定义明确的类型
interface GetDataParams {
  page: number
  limit: number
  filter?: {
    status?: string
    keyword?: string
  }
}

interface ApiResponse<T> {
  data: T
  meta: { total: number }
}

const fetchData = async (params: GetDataParams) => {
  const response = await api.get<ApiResponse<Data[]>>('/data', params)
  return response.data
}

// ✅ 正确：使用事件类型
const handleClick = (event: MouseEvent) => {
  console.log((event.target as HTMLButtonElement).value)
}
```

---

## 异步处理

### ❌ 反模式 10: 不处理错误

**问题**: 异步操作没有错误处理

```typescript
// ❌ 错误：没有错误处理
const fetchData = async () => {
  const response = await api.get('/data')
  data.value = response.data
}

// ❌ 错误：只打印日志
const fetchData = async () => {
  try {
    const response = await api.get('/data')
    data.value = response.data
  } catch (e) {
    console.error(e) // 只打印，用户不知道
  }
}
```

### ✅ 最佳实践: 完整的错误处理

```typescript
// ✅ 正确：完整的错误处理
const fetchData = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/data')
    data.value = response.data
  } catch (e) {
    error.value = e as Error
    // 显示用户友好的错误消息
    ElMessage.error('加载数据失败，请稍后再试')
    // 上报错误
    errorTracker.capture(e)
  } finally {
    loading.value = false
  }
}
```

---

## 检查清单

### 组件设计
- [ ] 组件职责是否单一？
- [ ] 是否拆分了上帝组件？
- [ ] 组件接口是否清晰？

### 响应式使用
- [ ] 是否正确使用 ref/reactive？
- [ ] 是否避免了解构响应式对象？
- [ ] 是否没有直接修改 props？

### 性能
- [ ] 列表渲染是否使用了正确的 key？
- [ ] 大列表是否使用了虚拟滚动？
- [ ] 是否避免了不必要的响应式？

### 状态管理
- [ ] 是否区分了本地和全局状态？
- [ ] Store 是否按领域拆分？
- [ ] 是否避免了过度使用全局状态？

### 代码质量
- [ ] 是否使用枚举替代魔法数字？
- [ ] 是否明确定义类型而非使用 any？
- [ ] 异步操作是否有错误处理？
