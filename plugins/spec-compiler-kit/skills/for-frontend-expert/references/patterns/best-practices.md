# Vue3 最佳实践

## 组件设计

### 单一职责组件

**概念**: 每个组件只负责一个功能

**示例**:

```vue
<!-- ✅ 正确：职责单一 -->
<script setup lang="ts">
// UserAvatar.vue - 只负责显示用户头像
interface Props {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const sizeClass = computed(() => `avatar-${props.size}`)
</script>

<template>
  <img
    :src="src || '/default-avatar.png'"
    :alt="alt"
    :class="['user-avatar', sizeClass]"
  />
</template>

<!-- ✅ 正确：职责单一 -->
<script setup lang="ts">
// UserProfileCard.vue - 组合多个小组件
import UserAvatar from './UserAvatar.vue'
import UserBadge from './UserBadge.vue'

interface Props {
  user: User
}

const props = defineProps<Props>()
</script>

<template>
  <div class="user-profile-card">
    <UserAvatar :src="user.avatar" :alt="user.name" size="lg" />
    <h3>{{ user.name }}</h3>
    <UserBadge :role="user.role" />
  </div>
</template>
```

---

## 响应式优化

### 使用 computed 缓存计算结果

**概念**: 使用 computed 缓存昂贵计算

**示例**:

```typescript
// ❌ 错误：每次访问都重新计算
const fullName = () => {
  return `${user.value.firstName} ${user.value.lastName}`
}

// ✅ 正确：使用 computed 缓存
const fullName = computed(() =>
  `${user.value.firstName} ${user.value.lastName}`
)
```

### 精细化响应式状态

**概念**: 只响应需要响应的数据

**示例**:

```typescript
// ❌ 错误：整个对象都是响应式的
const state = reactive({
  users: [],
  loading: false,
  config: { /* 大量静态配置 */ }
})

// ✅ 正确：静态配置不需要响应式
const staticConfig = {
  /* 配置 */
}
const state = reactive({
  users: [],
  loading: false
})
```

### 使用 shallowRef 优化大对象

**概念**: 大对象使用 shallowRef 避免深度响应式开销

**示例**:

```typescript
// ✅ 使用 shallowRef 优化大列表
const largeList = shallowRef<Item[]>([])
// 更新时整体替换
largeList.value = newItems
```

---

## 组件通信

### 使用 provide/inject 避免 Props 透传

**概念**: 跨层级传递数据使用 provide/inject

**示例**:

```vue
<!-- ❌ 错误：Props 透传 -->
<script setup lang="ts">
// GrandParent.vue
const theme = ref('dark')
</script>
<template>
  <Parent :theme="theme" />
</template>

<!-- Parent.vue -->
<script setup lang="ts">
interface Props { theme: Ref<string> }
defineProps<Props>()
</script>
<template>
  <Child :theme="theme" />
</template>

<!-- ✅ 正确：使用 provide/inject -->
<script setup lang="ts">
// GrandParent.vue
const theme = ref('dark')
provide('theme', theme)
</script>
<template>
  <Parent />
</template>

<!-- Child.vue -->
<script setup lang="ts">
const theme = inject<Ref<string>>('theme')
</script>
```

### 使用 defineModel 简化 v-model

**概念**: Vue3.4+ 使用 defineModel

**示例**:

```vue
<!-- ✅ 使用 defineModel -->
<script setup lang="ts">
interface Props {
  modelValue: string
}

interface Emits {
  'update:modelValue': [value: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Vue3.4+ 简写
const modelValue = defineModel<string>()
</script>

<template>
  <input v-model="modelValue" />
</template>
```

---

## 性能优化

### 虚拟滚动

**概念**: 大列表使用虚拟滚动

**示例**:

```vue
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

### 防抖和节流

**概念**: 使用 @vueuse/core 的防抖节流

**示例**:

```typescript
import { useDebounceFn, useThrottleFn } from '@vueuse/core'

// 防抖
const debouncedSearch = useDebounceFn((value: string) => {
  performSearch(value)
}, 300)

// 节流
const throttledScroll = useThrottleFn(() => {
  handleScroll()
}, 100)
```

### 异步组件

**概念**: 大组件使用异步加载

**示例**:

```typescript
// ✅ 路由懒加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardView.vue')
  }
]

// ✅ 条件异步组件
const AdminPanel = defineAsyncComponent(() =>
  import('@/components/AdminPanel.vue')
)
```

---

## 错误处理

### 统一错误处理

**概念**: 在请求拦截器统一处理错误

**示例**:

```typescript
// utils/request.ts
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 未授权，跳转登录
      router.push('/login')
    } else if (error.response?.status === 500) {
      // 服务器错误
      ElMessage.error('服务器错误，请稍后再试')
    }
    return Promise.reject(error)
  }
)
```

### 业务异常处理

**概念**: Composable 中处理业务异常

**示例**:

```typescript
export function useUserList() {
  const error = ref<Error | null>(null)
  const errorCode = ref<string | null>(null)

  const fetchUsers = async () => {
    try {
      const response = await userApi.getUsers()
      // ...
    } catch (e) {
      if (e instanceof ApiError) {
        errorCode.value = e.code
        error.value = new Error(e.message)
      } else {
        error.value = e as Error
      }
    }
  }

  return {
    error,
    errorCode,
    fetchUsers
  }
}
```

---

## 类型安全

### 严格的 Props 类型

**概念**: 使用 TypeScript 接口定义 Props

**示例**:

```typescript
// ✅ 严格的 Props 类型
interface Props {
  user: User
  editable?: boolean
  onUpdate?: (user: User) => void
  onDelete?: (userId: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
})
```

### 类型安全的 Emits

**概念**: 使用 TypeScript 接口定义 Emits

**示例**:

```typescript
// ✅ 类型安全的 Emits
interface Emits {
  update: [value: string]
  change: [id: string, value: number]
  delete: [user: User]
}

const emit = defineEmits<Emits>()

// 使用时有类型检查
emit('update', 'new value')
emit('change', '123', 42)
emit('delete', user)
```

### API 响应类型

**概念**: 定义 API 响应类型

**示例**:

```typescript
// types/api.ts
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

// 使用
const response = await request.get<ApiResponse<User[]>>('/users')
```

---

## 安全防护

### XSS 防护

**概念**: Vue 默认转义 HTML，谨慎使用 v-html

**示例**:

```vue
<!-- ❌ 危险：直接渲染用户输入 -->
<div v-html="userInput" />

<!-- ✅ 安全：使用 DOMPurify 清理 -->
<script setup lang="ts">
import DOMPurify from 'dompurify'

const sanitizedHtml = computed(() =>
  DOMPurify.sanitize(userInput.value)
)
</script>
<template>
  <div v-html="sanitizedHtml" />
</template>
```

### 环境变量管理

**概念**: 使用环境变量管理敏感配置

**示例**:

```typescript
// ❌ 错误：硬编码敏感信息
const apiKey = 'sk-proj-xxxxx'

// ✅ 正确：使用环境变量
const apiKey = import.meta.env.VITE_API_KEY

if (!apiKey) {
  throw new Error('VITE_API_KEY 未配置')
}
```

---

## 代码组织

### 按功能组织文件

**概念**: 按业务功能而非类型组织

**示例**:

```
✅ 正确：按功能组织
src/
├── features/
│   ├── users/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── api/
│   │   └── types/
│   └── products/
│       ├── components/
│       ├── composables/
│       ├── api/
│       └── types/

❌ 错误：按类型组织
src/
├── components/
│   ├── UserCard.vue
│   ├── ProductCard.vue
├── composables/
│   ├── useUser.ts
│   └── useProduct.ts
```

### Barrels 导出

**概念**: 使用 index.ts 统一导出

**示例**:

```typescript
// features/users/index.ts
export { default as UserListView } from './UserListView.vue'
export { default as UserCard } from './components/UserCard.vue'
export { useUserList } from './composables/useUserList'
export * from './types'

// 使用
import { UserListView, UserCard, useUserList } from '@/features/users'
```
