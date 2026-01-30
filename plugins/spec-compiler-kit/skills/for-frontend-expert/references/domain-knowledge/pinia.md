# Pinia 状态管理

## 概述

Pinia 是 Vue3 官方推荐的状态管理库，替代 Vuex。

## 定义 Store

### Options API

```typescript
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false
  }),

  getters: {
    userId: (state) => state.user?.id ?? '',
    displayName: (state) => state.user?.name ?? 'Guest'
  },

  actions: {
    setUser(user: User) {
      this.user = user
      this.isLoggedIn = true
    },

    logout() {
      this.user = null
      this.isLoggedIn = false
    }
  }
})
```

### Setup API

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // state
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)

  // getters
  const userId = computed(() => user.value?.id ?? '')
  const displayName = computed(() => user.value?.name ?? 'Guest')

  // actions
  const setUser = (newUser: User) => {
    user.value = newUser
    isLoggedIn.value = true
  }

  const logout = () => {
    user.value = null
    isLoggedIn.value = false
  }

  return {
    user,
    isLoggedIn,
    userId,
    displayName,
    setUser,
    logout
  }
})
```

## Store 使用

### 组件中使用

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <div>
    <p>{{ userStore.displayName }}</p>
    <button @click="userStore.logout()">Logout</button>
  </div>
</template>
```

### 组合式函数中使用

```typescript
import { useUserStore } from '@/stores/user'

export function useAuth() {
  const userStore = useUserStore()

  const login = async (email: string, password: string) => {
    const user = await authService.login(email, password)
    userStore.setUser(user)
  }

  const logout = () => {
    authService.logout()
    userStore.logout()
  }

  return {
    userStore,
    login,
    logout
  }
}
```

## Store 组合

```typescript
import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { useSettingsStore } from './settings'

export const useAppStore = defineStore('app', () => {
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()

  const isReady = computed(() => {
    return userStore.isLoggedIn && settingsStore.initialized
  })

  return {
    isReady
  }
})
```

## 持久化

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // 默认值
  const theme = ref<'light' | 'dark'>('light')
  const language = ref('zh-CN')

  // 从 localStorage 加载
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'light' || savedTheme === 'dark') {
    theme.value = savedTheme
  }

  // 监听变化并持久化
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newTheme)
  })

  return {
    theme,
    language
  }
})
```

## 类型安全

### 定义 State 类型

```typescript
import { defineStore } from 'pinia'

interface User {
  id: string
  name: string
  email: string
}

interface UserState {
  user: User | null
  isLoggedIn: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isLoggedIn: false
  })
})
```

### 类型推断最佳实践

```typescript
// ✅ 推断数组元素类型
const items = ref<string[]>([]) // Ref<string[]>

// ✅ 推断对象属性类型
const user = reactive<User>({
  id: '1',
  name: 'John',
  email: 'john@example.com'
})
```

## 最佳实践

1. **按领域拆分 Store**：用户、设置、业务数据等分开
2. **使用 Setup API**：更好的 TypeScript 支持
3. **避免嵌套过深**：保持状态结构扁平
4. ** getters 用于计算属性**：缓存计算结果
5. **actions 用于异步操作**：修改状态的异步逻辑
