# Vue3 核心知识

## Composition API

### 响应式系统

```typescript
import { ref, reactive, computed, watch, watchEffect } from 'vue'

// ref - 基本类型响应式
const count = ref(0)
count.value++ // 修改值

// reactive - 对象类型响应式
const user = reactive({
  name: 'John',
  age: 30
})
user.name = 'Jane' // 修改属性

// computed - 计算属性（缓存）
const fullName = computed(() => `${user.firstName} ${user.lastName}`)

// watch - 监听变化
watch(count, (newValue, oldValue) => {
  console.log(`count changed from ${oldValue} to ${newValue}`)
})

// watchEffect - 副作用收集
watchEffect(() => {
  // 自动追踪依赖
  console.log(`count is ${count.value}`)
})
```

### 生命周期

```typescript
import { onMounted, onUnmounted, onUpdated } from 'vue'

export function useLifecycle() {
  onMounted(() => {
    console.log('组件已挂载')
  })

  onUpdated(() => {
    console.log('组件已更新')
  })

  onUnmounted(() => {
    console.log('组件已卸载')
  })
}
```

### 组件通信

**父传子（Props）**:

```vue
<!-- 父组件 -->
<script setup lang="ts">
import ChildView from './ChildView.vue'
const message = ref('Hello from parent')
</script>

<template>
  <ChildView :message="message" />
</template>
```

```vue
<!-- 子组件 -->
<script setup lang="ts">
const props = defineProps<{
  message: string
}>()
</script>

<template>
  <div>{{ message }}</div>
</template>
```

**子传父（Emits）**:

```vue
<!-- 子组件 -->
<script setup lang="ts">
const emit = defineEmits<{
  update: [value: string]
}>()

const handleClick = () => {
  emit('update', 'new value')
}
</script>

<template>
  <button @click="handleClick">Click</button>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import ChildView from './ChildView.vue'

const handleMessage = (value: string) => {
  console.log('Received:', value)
}
</script>

<template>
  <ChildView @update="handleMessage" />
</template>
```

**provide/inject**:

```typescript
// 祖先组件提供
import { provide, ref } from 'vue'

const user = ref({ name: 'John' })
provide('user', user)

// 后代组件注入
import { inject } from 'vue'

const user = inject<User>('user')
```

## 响应式原理

### Proxy vs Object.defineProperty

Vue3 使用 Proxy 实现响应式，相比 Vue2 的 Object.defineProperty：

```typescript
// Vue3 - Proxy
const reactive = (obj) => {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key) // 依赖收集
      return target[key]
    },
    set(target, key, value) {
      trigger(target, key) // 触发更新
      target[key] = value
      return true
    }
  })
}
```

### 响应式注意事项

```typescript
// ❌ 直接解构会丢失响应性
const { user } = useUserState()
user.value = 'new name' // 不会触发更新

// ✅ 保持响应式
const userState = useUserState()
userState.user.value = 'new name'

// ❌ 解构 props 再修改不会触发更新
const props = defineProps<{ user: User }>()
const { user } = toRefs(props)
user.value.name = 'new name' // 不会触发更新

// ✅ 直接修改 props（如果允许）
props.user.name = 'new name'
```

## 组件设计模式

### 组件拆分原则

- **单一职责**: 一个组件只做一件事
- **可复用性**: 提取可复用的 UI 组件
- **可测试性**: 组件逻辑与 UI 分离

### Composable 设计

```typescript
// ✅ 职责单一的 Composable
export function useLoading() {
  const loading = ref(false)

  const startLoading = () => {
    loading.value = true
  }

  const stopLoading = () => {
    loading.value = false
  }

  return { loading, startLoading, stopLoading }
}

// ✅ 业务逻辑 Composable
export function useUserList() {
  const userService = inject(UserService)
  const users = ref<User[]>([])
  const loading = ref(false)

  const fetchUsers = async () => {
    loading.value = true
    try {
      users.value = await userService.getUsers()
    } finally {
      loading.value = false
    }
  }

  return { users, loading, fetchUsers }
}
```

### 组件优化

```typescript
// ✅ 使用 v-memo 优化列表渲染
<script setup lang="ts">
const items = ref<Item[]>([])

const getItemId = (item: Item) => item.id
</script>

<template>
  <div v-for="item in items" :key="getItemId(item)">
    <ItemView :item="item" />
  </div>
</template>

// ✅ 使用 shallowRef 优化大对象
const largeObject = shallowRef({ /* 大对象数据 */ })

// ✅ 使用 markRaw 标记不需要响应式的对象
const staticConfig = markRaw({ /* 静态配置 */ })
```
