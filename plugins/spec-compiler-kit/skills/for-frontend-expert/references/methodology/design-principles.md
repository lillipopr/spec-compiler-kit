# 设计原则

## DRY 原则（Don't Repeat Yourself）

每一块知识都必须在系统中只有一个单一、明确的表示。

### Vue3 应用

```typescript
// ❌ 重复的获取用户逻辑
// composables/useUserProfile.ts
export function useUserProfile() {
  const user = ref<User | null>(null)
  const fetchProfile = async () => {
    const { data } = await userApi.getProfile()
    user.value = data
  }
  return { user, fetchProfile }
}

// composables/useUserSettings.ts
export function useUserSettings() {
  const user = ref<User | null>(null)
  const fetchProfile = async () => {
    const { data } = await userApi.getProfile() // 重复代码
    user.value = data
  }
  return { user, fetchProfile }
}

// ✅ 提取为可复用的 Service
class UserService {
  async getProfile(): Promise<User> {
    const { data } = await userApi.getProfile()
    return data
  }
}

// 各处复用 Service
export function useUserProfile() {
  const userService = inject(UserService)
  const user = computed(() => userService.user)

  const fetchProfile = async () => {
    await userService.fetchProfile()
  }

  return { user, fetchProfile }
}
```

## KISS 原则（Keep It Simple, Stupid）

保持代码简单、直接、易读。简单的设计比复杂的设计更优越。

### Vue3 应用

```typescript
// ❌ 过度复杂的抽象
interface AbstractState<T> {
  getValue(): T
  setValue(value: T): void
}

class ReactiveState<T> implements AbstractState<T> {
  private _state: Ref<T>

  constructor(initialValue: T) {
    this._state = ref(initialValue)
  }

  getValue(): T {
    return this._state.value
  }

  setValue(value: T): void {
    this._state.value = value
  }
}

// ✅ 直接使用 ref
const user = ref<User | null>(null)
```

## YAGNI 原则（You Aren't Gonna Need It）

不要为可能不会出现的需求做设计。

### Vue3 应用

```typescript
// ❌ 为未来可能的需求设计过度复杂的结构
interface User {
  id: string
  name: string
  email: string
  phone?: string
  address?: Address
  preferences?: UserPreferences
  socialAccounts?: SocialAccount[]
  // ... 20+ 个属性
}

// ✅ 从当前需求出发，按需设计
interface User {
  id: string
  name: string
  email: string
}

// 需要时再扩展
interface UserWithProfile extends User {
  avatar?: string
  bio?: string
}
```

## 性能优先原则

在编写代码和 Code Review 时，必须优先考虑渲染性能，其次考虑打包体积。

### 优化优先级

1. **渲染性能优先** - 减少组件更新次数、精细化响应式状态、使用 computed
2. **内存优化次之** - 及时清理副作用、避免内存泄漏、使用 weakRef
3. **首屏优化** - 路由懒加载、组件懒加载、异步组件、预加载
4. **打包优化** - Tree Shaking、代码分割、Gzip 压缩、CDN 加速

### 性能优化示例

```typescript
// ✅ 使用 computed 缓存计算结果
const fullName = computed(() => `${user.value.firstName} ${user.value.lastName}`)

// ✅ 精细化响应式状态
const { items, loading } = useItemList() // 而不是引入整个大状态

// ✅ 使用 v-once 只执行一次
<div v-once:loadData">
```

## 组件通信原则

### 单向数据流

- 父组件 → 子组件：通过 props 传递
- 子组件 → 父组件：通过 emits 通知
- 兄弟组件：通过父组件中转或状态管理

### 避免 Props 透传

```typescript
// ❌ Props 透传
const GrandParent = { template: '<Parent :user="user" />' }
const Parent = { props: ['user'], template: '<Child :user="user" />' }

// ✅ 使用 provide/inject
const GrandParent = {
  provide() {
    return { user }
  }
}

const Child = {
  inject: ['user']
}
```

### 避免直接修改 Props

```typescript
// ❌ 直接修改 props
const props = defineProps<{ count: number }>()
props.count++ // 错误：不能直接修改 props

// ✅ 通过 emit 通知父组件
const emit = defineEmits<{ update: (count: number) => void }>()
emit('update', props.count + 1)
```
