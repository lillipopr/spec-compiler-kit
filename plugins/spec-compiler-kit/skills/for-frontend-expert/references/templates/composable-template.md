# Composable 模板

## 基础模板

```typescript
/**
 * @description Composable 描述
 * @author 作者
 */

import { ref, computed, watch } from 'vue'

// ==================== 类型定义 ====================
interface UseXxxOptions {
  // 选项定义
}

interface UseXxxReturn {
  // 返回值定义
}

// ==================== Composable ====================
export function useXxx(options?: UseXxxOptions): UseXxxReturn {
  // State
  const state = ref()

  // Computed
  const computedValue = computed(() => {
    return
  })

  // Methods
  const action = () => {
    // 操作
  }

  // Watch
  watch(
    () => state.value,
    (newVal) => {
      // 响应变化
    }
  )

  return {
    state,
    computedValue,
    action
  }
}
```

---

## 列表数据 Composable 模板

```typescript
/**
 * @description 用户列表 Composable
 * @author Your Name
 */

import { ref, computed } from 'vue'
import { inject } from '@vue/composition-api'
import type { UserService } from '@/services/userService'
import type { User, GetUserParams } from '@/models/user'

interface UseUserListReturn {
  // 数据
  users: Ref<User[]>
  loading: Ref<boolean>
  error: Ref<Error | null>
  pagination: Ref<{
    page: number
    limit: number
    total: number
  }>

  // 方法
  fetchUsers: (params?: GetUserParams) => Promise<void>
  refresh: () => Promise<void>
}

export function useUserList(): UseUserListReturn {
  // ==================== 依赖注入 ====================
  const userService = inject<UserService>('UserService')

  // ==================== 状态 ====================
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0
  })

  // ==================== 计算属性 ====================
  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.limit)
  )

  const hasMore = computed(() =>
    pagination.value.page < totalPages.value
  )

  // ==================== 方法 ====================
  const fetchUsers = async (params?: GetUserParams) => {
    loading.value = true
    error.value = null

    try {
      const response = await userService!.getUsers({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      })

      users.value = response.data
      pagination.value.total = response.meta.total
    } catch (e) {
      error.value = e as Error
      // 可以在这里添加错误上报
      console.error('获取用户列表失败:', e)
    } finally {
      loading.value = false
    }
  }

  const refresh = async () => {
    await fetchUsers()
  }

  const loadMore = async () => {
    if (hasMore.value && !loading.value) {
      pagination.value.page++
      await fetchUsers()
    }
  }

  return {
    users,
    loading,
    error,
    pagination,
    totalPages,
    hasMore,
    fetchUsers,
    refresh,
    loadMore
  }
}
```

---

## 详情数据 Composable 模板

```typescript
/**
 * @description 用户详情 Composable
 * @author Your Name
 */

import { ref } from 'vue'
import { inject } from '@vue/composition-api'
import type { UserService } from '@/services/userService'
import type { User, UpdateUserDTO } from '@/models/user'

interface UseUserDetailReturn {
  // 数据
  user: Ref<User | null>
  loading: Ref<boolean>
  error: Ref<Error | null>

  // 方法
  fetchUser: (userId: string) => Promise<void>
  updateUser: (userId: string, data: UpdateUserDTO) => Promise<User>
  deleteUser: (userId: string) => Promise<void>
}

export function useUserDetail(): UseUserDetailReturn {
  // ==================== 依赖注入 ====================
  const userService = inject<UserService>('UserService')

  // ==================== 状态 ====================
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // ==================== 方法 ====================
  const fetchUser = async (userId: string) => {
    loading.value = true
    error.value = null

    try {
      user.value = await userService!.getUserById(userId)
    } catch (e) {
      error.value = e as Error
      console.error('获取用户详情失败:', e)
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (userId: string, data: UpdateUserDTO) => {
    loading.value = true
    error.value = null

    try {
      const updated = await userService!.updateUser(userId, data)
      user.value = updated
      return updated
    } catch (e) {
      error.value = e as Error
      console.error('更新用户失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (userId: string) => {
    loading.value = true
    error.value = null

    try {
      await userService!.deleteUser(userId)
      user.value = null
    } catch (e) {
      error.value = e as Error
      console.error('删除用户失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    fetchUser,
    updateUser,
    deleteUser
  }
}
```

---

## 表单 Composable 模板

```typescript
/**
 * @description 用户表单 Composable
 * @author Your Name
 */

import { ref, reactive } from 'vue'
import { inject } from '@vue/composition-api'
import type { UserService } from '@/services/userService'
import type { User, CreateUserDTO, UpdateUserDTO } from '@/models/user'

interface UseUserFormReturn {
  // 表单数据
  form: Ref<CreateUserDTO | UpdateUserDTO>
  rules: Record<string, any>

  // 状态
  loading: Ref<boolean>
  submitting: Ref<boolean>
  isEdit: Ref<boolean>

  // 方法
  initForm: (userId: string) => Promise<void>
  validateForm: () => Promise<boolean>
  submitForm: () => Promise<boolean>
  resetForm: () => void
}

export function useUserForm(): UseUserFormReturn {
  // ==================== 依赖注入 ====================
  const userService = inject<UserService>('UserService')

  // ==================== 状态 ====================
  const form = ref<CreateUserDTO>({
    name: '',
    email: '',
    role: 'USER'
  })
  const loading = ref(false)
  const submitting = ref(false)
  const isEdit = ref(false)
  const currentUserId = ref<string | null>(null)

  // ==================== 验证规则 ====================
  const rules = {
    name: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
      { min: 2, max: 20, message: '姓名长度在 2-20 之间', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    role: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ]
  }

  // ==================== 方法 ====================
  const initForm = async (userId: string) => {
    loading.value = true
    try {
      const user = await userService!.getUserById(userId)
      form.value = {
        name: user.name,
        email: user.email,
        role: user.role
      }
      currentUserId.value = userId
      isEdit.value = true
    } catch (e) {
      console.error('初始化表单失败:', e)
    } finally {
      loading.value = false
    }
  }

  const validateForm = async (): Promise<boolean> => {
    // 这里需要配合表单组件的验证方法
    // 实际实现取决于使用的 UI 框架
    return true
  }

  const submitForm = async (): Promise<boolean> => {
    submitting.value = true

    try {
      if (isEdit.value && currentUserId.value) {
        await userService!.updateUser(currentUserId.value, form.value as UpdateUserDTO)
      } else {
        await userService!.createUser(form.value as CreateUserDTO)
      }
      return true
    } catch (e) {
      console.error('提交表单失败:', e)
      return false
    } finally {
      submitting.value = false
    }
  }

  const resetForm = () => {
    form.value = {
      name: '',
      email: '',
      role: 'USER'
    }
    isEdit.value = false
    currentUserId.value = null
  }

  return {
    form,
    rules,
    loading,
    submitting,
    isEdit,
    initForm,
    validateForm,
    submitForm,
    resetForm
  }
}
```

---

## 通用功能 Composable 模板

```typescript
/**
 * @description 加载状态 Composable
 * @author Your Name
 */

import { ref } from 'vue'

interface UseLoadingReturn {
  loading: Ref<boolean>
  startLoading: () => void
  stopLoading: () => void
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>
}

export function useLoading(): UseLoadingReturn {
  const loading = ref(false)

  const startLoading = () => {
    loading.value = true
  }

  const stopLoading = () => {
    loading.value = false
  }

  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    startLoading,
    stopLoading,
    withLoading
  }
}
```

---

## 对话框 Composable 模板

```typescript
/**
 * @description 对话框 Composable
 * @author Your Name
 */

import { ref } from 'vue'

interface UseDialogReturn {
  visible: Ref<boolean>
  data: Ref<any>
  open: (data?: any) => void
  close: () => void
}

export function useDialog(): UseDialogReturn {
  const visible = ref(false)
  const data = ref<any>(null)

  const open = (payload?: any) => {
    data.value = payload
    visible.value = true
  }

  const close = () => {
    visible.value = false
    data.value = null
  }

  return {
    visible,
    data,
    open,
    close
  }
}
```

---

## 通知 Composable 模板

```typescript
/**
 * @description 通知 Composable
 * @author Your Name
 */

import { ref } from 'vue'

type NotificationType = 'success' | 'warning' | 'error' | 'info'

interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

interface UseNotificationReturn {
  notifications: Ref<Notification[]>
  show: (type: NotificationType, message: string, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  remove: (id: string) => void
  clear: () => void
}

export function useNotification(): UseNotificationReturn {
  const notifications = ref<Notification[]>([])

  const add = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    notifications.value.push({ ...notification, id })

    const duration = notification.duration ?? 3000
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
  }

  const show = (type: NotificationType, message: string, duration?: number) => {
    add({ type, message, duration })
  }

  const success = (message: string, duration?: number) => {
    show('success', message, duration)
  }

  const error = (message: string, duration?: number) => {
    show('error', message, duration)
  }

  const warning = (message: string, duration?: number) => {
    show('warning', message, duration)
  }

  const info = (message: string, duration?: number) => {
    show('info', message, duration)
  }

  const remove = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clear = () => {
    notifications.value = []
  }

  return {
    notifications,
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear
  }
}
```
