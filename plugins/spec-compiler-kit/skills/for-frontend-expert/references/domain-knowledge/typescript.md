# TypeScript 类型系统

## 类型基础

### 基础类型

```typescript
// 原始类型
let str: string = 'hello'
let num: number = 42
let bool: boolean = true
let un: unknown = undefined
let nul: null = null

// 引用类型
let obj: object = {}
let arr: string[] = []
```

### 类型注解

```typescript
// 变量注解
const name: string = 'John'

// 函数注解
function greet(name: string): string {
  return `Hello, ${name}`
}

// 箭头函数注解
type Greeter = (name: string) => string
const greeter: Greeter = (name) => `Hello, ${name}`
```

## 泛型

### 泛型函数

```typescript
function identity<T>(arg: T): T {
  return arg
}

const num = identity<number>(42)
const str = identity<string>('hello')
```

### �型接口

```typescript
interface Box<T> {
  value: T
}

const numBox: Box<number> = { value: 42 }
const strBox: Box<string> = { value: 'hello' }
```

### �型约束

```typescript
interface Lengthwise {
  length: number
}

function logLength<T extends Lengthwise>(arg: T): void {
  console.log(arg.length)
}

logLength({ length: 10 }) // OK
// logLength('hello') // Error
```

## 工具类型

### ReturnType

```typescript
type ReturnType<T> = T extends (...args: any) => any ? infer R : any

function getUser() {
  return { id: '1', name: 'John' }
}

type UserReturn = ReturnType<typeof getUser> // { id: string; name: string }
```

### Parameters

```typescript
type Parameters<T> = T extends (...args: any) => any ? infer P : any

function fetchUser(id: string, includeProfile: boolean) {
  // ...
}

type FetchUserParams = Parameters<typeof fetchUser>
// [id: string, includeProfile: boolean]
```

### Partial

```typescript
interface User {
  id: string
  name: string
  email: string
}

const partialUser: Partial<User> = {
  name: 'John'
}
```

### Required

```typescript
interface User {
  id?: string
  name: string
  email?: string
}

const requiredUser: Required<User> = {
  id: '1',
  name: 'John',
  email: 'john@example.com'
}
```

### Readonly

```typescript
interface User {
  readonly id: string
  readonly name: string
}

const readonlyUser: Readonly<User> = {
  id: '1',
  name: 'John'
}

// readonlyUser.name = 'Jane' // Error
```

## Vue3 类型最佳实践

### defineComponent 类型

```typescript
import { defineComponent } from 'vue'

interface Props {
  title: string
  count?: number
}

export const MyComponent = defineComponent({
  name: 'MyComponent',
  props: {
    title: { type: String, required: true },
    count: { type: Number, default: 0 }
  },
  setup(props: Props) {
    // props.title 类型为 string
    return () => h('div', props.title)
  }
})
```

### Composable 类型

```typescript
import { Ref } from 'vue'

interface User {
  id: string
  name: string
}

export function useUser(): {
  user: Ref<User | null>
  loading: Ref<boolean>

  fetchUser: (id: string) => Promise<void>
}
```

### provide/inject 类型

```typescript
import { InjectionKey } from 'vue'

interface User {
  id: string
  name: string
}

const userKey: InjectionKey<User> = Symbol('user')

// 提供者
provide(userKey, {
  id: '1',
  name: 'John'
})

// 注入者
const user = inject(userKey)
```

## 类型推断技巧

### reactive 类型推断

```typescript
// ✅ 类型会被正确推断
const user = reactive({
  id: '1',
  name: 'John'
})
user.name // string 类型

// ❌ 失去类型推断
import { ref } from 'vue'
const user = ref({ id: '1', name: 'John' })
user.value.name // any 类型
```

### computed 类型推断

```typescript
const count = ref(0)
const doubled = computed(() => count.value * 2)
doubled.value // number 类型
```

### watch 类型推断

```typescript
// ✅ 正确的 watch 类型推断
watch(
  () => count.value,
  (newVal, oldVal) => {
    // newVal 和 oldVal 类型都是 number
  }
)

// ❌ 错误：watch ref 而的不是值
watch(count, (newVal) => {
  // newVal 是 Ref<number>，不是 number
  // 应该使用 watch(() => count.value, ...)
})
```
