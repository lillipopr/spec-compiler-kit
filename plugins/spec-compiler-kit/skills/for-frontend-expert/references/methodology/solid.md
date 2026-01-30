# SOLID 设计原则

## 概述

SOLID 是面向对象设计的五大原则，同样适用于 Vue3 组件和 Composable 的设计。

## 原则详解

### S - 单一职责原则 (Single Responsibility Principle)

**定义**: 一个模块应该只有一个改变的理由。

**Vue3 应用**:

```typescript
// ❌ 违反单一职责 - Composable 既管状态又管网络请求
export function useUser() {
  const users = ref<User[]>([])
  const loading = ref(false)

  const fetchUsers = async () => {
    loading.value = true
    const { data } = await userApi.getUsers()
    users.value = data
    loading.value = false
  }

  return { users, loading, fetchUsers }
}

// ✅ 遵循单一职责
// Composable 只负责状态管理
export function useUserState() {
  const users = ref<User[]>([])
  const loading = ref(false)

  const setUsers = (data: User[]) => {
    users.value = data
  }

  return { users, loading, setUsers }
}

// Service 负责网络请求
class UserService {
  async getUsers(): Promise<User[]> {
    const { data } = await userApi.getUsers()
    return data
  }
}
```

### O - 开闭原则 (Open/Closed Principle)

**定义**: 对扩展开放，对修改关闭。

**Vue3 应用**:

```typescript
// ✅ 使用策略模式，扩展新支付方式无需修改现有代码
interface PaymentStrategy {
  process(amount: number): Promise<void>
}

class AlipayStrategy implements PaymentStrategy {
  async process(amount: number): Promise<void> {
    // 支付宝支付逻辑
  }
}

class WechatPayStrategy implements PaymentStrategy {
  async process(amount: number): Promise<void> {
    // 微信支付逻辑
  }
}

// 通过依赖注入切换实现
const paymentStrategy = inject<PaymentStrategy>('paymentStrategy')
```

### L - 里氏替换原则 (Liskov Substitution Principle)

**定义**: 子组件可以替换父组件。

**Vue3 应用**:

```typescript
// ✅ 子组件遵循父组件的 props 契约
interface BaseButtonProps {
  label: string
  onClick: () => void
}

const PrimaryButton = defineComponent<BaseButtonProps>({
  name: 'PrimaryButton',
  props: {
    label: { type: String, required: true },
    onClick: { type: Function, required: true }
  },
  setup(props) {
    // 不破坏父组件的 props 约束
    return () => h('button', { onClick: props.onClick }, props.label)
  }
})
```

### I - 接口隔离原则 (Interface Segregation Principle)

**定义**: 客户端不依赖不需要的方法。

**Vue3 应用**:

```typescript
// ❌ 大而全的接口
interface UserService {
  getUsers(): Promise<User[]>
  getUserById(id: string): Promise<User>
  createUser(user: User): Promise<User>
  updateUser(id: string, user: Partial<User>): Promise<User>
  deleteUser(id: string): Promise<void>
  sendVerificationEmail(email: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
}

// ✅ 按职责拆分
interface UserQueryService {
  getUsers(): Promise<User[]>
  getUserById(id: string): Promise<User>
}

interface UserMutationService {
  createUser(user: User): Promise<User>
  updateUser(id: string, user: Partial<User>): Promise<User>
  deleteUser(id: string): Promise<void>
}

interface UserAuthService {
  sendVerificationEmail(email: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
}
```

### D - 依赖倒置原则 (Dependency Inversion Principle)

**定义**: 依赖抽象，不依赖具体实现。

**Vue3 应用**:

```typescript
// ✅ 依赖协议，不依赖具体实现
interface IUserService {
  getUsers(): Promise<User[]>
}

class UserService implements IUserService {
  async getUsers(): Promise<User[]> {
    // 具体实现
  }
}

// Composable 通过依赖注入获取 Service
export function useUser() {
  const userService = inject<IUserService>('userService')
  // ...
}
```

## 编码实践表格

| 原则                   | 核心思想                 | 编码实践                                                                      |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| **S** - 单一职责 | 每个模块只有一个改变的理由 | View 只负责 UI 展示、Composable 只负责状态管理、Service 只负责业务逻辑 |
| **O** - 开闭原则 | 对扩展开放，对修改关闭   | 使用 provide/inject 替换硬编码、使用组合式函数复用逻辑                 |
| **L** - 里氏替换 | 子组件可以替换父组件     | 不破坏父组件的 props 约束、遵循组件约定                            |
| **I** - 接口隔离 | 组件不依赖不需要的 props | 按职责拆分大组件、组件 props < 10 个                                |
| **D** - 依赖倒置 | 依赖抽象，不依赖具体实现 | 通过依赖注入获取 Service、依赖接口而非具体类                       |
