# Vue3 完整开发工作流

## 概述

本文档描述 Vue3 前端开发的完整工作流程，从需求分析到代码审查，涵盖组件设计、状态管理、API 集成等所有关键环节。

---

## 步骤 1: 需求分析

**目标**: 充分理解业务需求，为组件设计奠定基础。

### 1.1 理解业务需求

```
问题清单:
- 这个功能解决什么业务问题？
- 涉及哪些用户角色？
- 主要的用户流程是什么？
- 有什么约束条件或规则？
```

**示例**:
```
功能：用户列表管理
业务问题：管理员需要查看和管理系统用户
角色：管理员
流程：
  1. 显示用户列表
  2. 筛选和搜索用户
  3. 查看用户详情
  4. 编辑用户信息
  5. 删除用户
约束：
  - 列表分页显示，每页 20 条
  - 支持按姓名、邮箱搜索
  - 删除需要二次确认
```

### 1.2 确定功能范围

```
MVP（最小可行产品）:
- 用户列表展示
- 用户搜索
- 用户详情查看
- 用户编辑
- 用户删除

未来扩展:
- 批量操作
- 用户导入导出
- 用户行为日志
```

### 1.3 评估技术可行性

```
风险评估:
- 性能：列表数据量可能很大，需要虚拟滚动
- 兼容性：需要支持 IE11，考虑使用 @vitejs/plugin-legacy
- 状态：多页面共享用户状态，需要 Pinia
```

---

## 步骤 2: 组件设计

**目标**: 设计清晰的组件结构和接口。

### 2.1 识别组件

```
页面组件:
- UserListView.vue (页面容器)
  ├── UserFilterBar.vue (筛选器)
  ├── UserTable.vue (表格)
  │   └── UserTableRow.vue (表格行)
  ├── UserPagination.vue (分页)
  └── UserDeleteDialog.vue (删除确认)

可复用组件:
- DataTable.vue (通用表格)
- SearchInput.vue (搜索框)
- ConfirmDialog.vue (确认对话框)
```

### 2.2 设计组件接口

**Props 接口**:
```typescript
// UserTableRow.vue
interface Props {
  user: User
  selectable?: boolean
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  selected: false
})
```

**Emits 接口**:
```typescript
// UserTableRow.vue
interface Emits {
  select: [user: User]
  deselect: [user: User]
  edit: [user: User]
  delete: [user: User]
}

const emit = defineEmits<Emits>()
```

### 2.3 组件通信方案

```
父传子: Props
子传父: Emits
跨层级: provide/inject
全局状态: Pinia Store
```

---

## 步骤 3: 状态管理设计

**目标**: 设计清晰的状态管理方案。

### 3.1 确定状态边界

```
本地状态 (组件内):
- 表格 loading 状态
- 分页当前页码
- 筛选条件展开状态

全局状态 (Pinia):
- 当前用户信息
- 用户列表数据
- 权限信息
```

### 3.2 设计 Store

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([])
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0
  })

  // Getters
  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.limit)
  )

  // Actions
  const fetchUsers = async (params?: GetUserParams) => {
    loading.value = true
    try {
      const response = await userApi.getUsers(params)
      users.value = response.data
      pagination.value.total = response.meta.total
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    pagination,
    totalPages,
    fetchUsers
  }
})
```

---

## 步骤 4: 编写测试 (TDD)

**目标**: 先编写测试，驱动代码设计。

### 4.1 Composable 测试

```typescript
// composables/__tests__/useUserList.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { useUserList } from '../useUserList'

describe('useUserList', () => {
  it('should fetch users successfully', async () => {
    // Given
    const mockUsers = [{ id: '1', name: 'John' }]
    vi.mocked(userApi.getUsers).mockResolvedValue({
      data: mockUsers,
      meta: { total: 1 }
    })

    // When
    const { users, fetchUsers } = useUserList()
    await fetchUsers()

    // Then
    expect(users.value).toEqual(mockUsers)
  })

  it('should handle fetch error', async () => {
    // Given
    vi.mocked(userApi.getUsers).mockRejectedValue(
      new Error('Network error')
    )

    // When & Then
    const { error, fetchUsers } = useUserList()
    await fetchUsers()

    expect(error.value).toBeTruthy()
  })
})
```

### 4.2 组件测试

```typescript
// components/__tests__/UserTableRow.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserTableRow from '../UserTableRow.vue'

describe('UserTableRow', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com'
  }

  it('should render user info', () => {
    const wrapper = mount(UserTableRow, {
      props: { user: mockUser }
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
  })

  it('should emit delete event when delete button clicked', async () => {
    const wrapper = mount(UserTableRow, {
      props: { user: mockUser }
    })

    await wrapper.find('[data-testid="delete-button"]').trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual([mockUser])
  })
})
```

---

## 步骤 5: 实现代码

**目标**: 按照分层架构实现代码。

### 5.1 View 层 (UserListView.vue)

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserList } from '@/composables/useUserList'
import UserFilterBar from '@/components/users/UserFilterBar.vue'
import UserTable from '@/components/users/UserTable.vue'
import UserPagination from '@/components/users/UserPagination.vue'

const {
  users,
  loading,
  pagination,
  fetchUsers,
  deleteUser
} = useUserList()

const filters = ref<GetUserParams>({})

onMounted(() => {
  fetchUsers(filters.value)
})

const handleSearch = (params: GetUserParams) => {
  filters.value = params
  pagination.value.page = 1
  fetchUsers(filters.value)
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchUsers(filters.value)
}

const handleDelete = async (user: User) => {
  await deleteUser(user.id)
  await fetchUsers(filters.value)
}
</script>

<template>
  <div class="user-list-view">
    <UserFilterBar @search="handleSearch" />
    <UserTable
      :users="users"
      :loading="loading"
      @delete="handleDelete"
    />
    <UserPagination
      v-model:page="pagination.page"
      :total="pagination.total"
      @update:page="handlePageChange"
    />
  </div>
</template>
```

### 5.2 Composable 层 (useUserList.ts)

```typescript
// composables/useUserList.ts
import { ref } from 'vue'
import { inject } from '@vue/composition-api'
import type { UserService } from '@/services/userService'

export function useUserList() {
  const userService = inject<UserService>('UserService')

  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0
  })

  const fetchUsers = async (params?: GetUserParams) => {
    loading.value = true
    error.value = null
    try {
      const result = await userService!.getUsers({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      })
      users.value = result.data
      pagination.value.total = result.meta.total
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (userId: string) => {
    loading.value = true
    try {
      await userService!.deleteUser(userId)
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    deleteUser
  }
}
```

### 5.3 Service 层 (userService.ts)

```typescript
// services/userService.ts
import { injectable } from 'tsyringe'
import type { UserAPI } from '@/api/userApi'
import type { User, GetUserParams, CreateUserDTO, UpdateUserDTO } from '@/models/user'

@injectable()
export class UserService {
  constructor(
    private readonly userAPI: UserAPI
  ) {}

  async getUsers(params: GetUserParams): Promise<{
    data: User[]
    meta: { total: number }
  }> {
    const response = await this.userAPI.getUsers(params)
    return {
      data: response.data.map(this.toDomain),
      meta: response.meta
    }
  }

  async deleteUser(userId: string): Promise<void> {
    await this.userAPI.deleteUser(userId)
  }

  private toDomain(dto: UserDTO): User {
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      createdAt: new Date(dto.created_at)
    }
  }
}
```

### 5.4 API 层 (userApi.ts)

```typescript
// api/userApi.ts
import { request } from '@/utils/request'

export const userApi = {
  getUsers(params?: GetUserParams) {
    return request.get<ApiResponse<UserDTO[], Meta>>('/users', { params })
  },

  getUserById(id: string) {
    return request.get<ApiResponse<UserDTO>>(`/users/${id}`)
  },

  createUser(data: CreateUserDTO) {
    return request.post<ApiResponse<UserDTO>>('/users', data)
  },

  updateUser(id: string, data: UpdateUserDTO) {
    return request.put<ApiResponse<UserDTO>>(`/users/${id}`, data)
  },

  deleteUser(id: string) {
    return request.delete<ApiResponse<void>>(`/users/${id}`)
  }
}
```

---

## 步骤 6: 重构优化

**目标**: 改进代码质量和性能。

### 6.1 代码质量优化

```
检查清单:
- [ ] 是否有重复代码可以提取？
- [ ] 是否有长组件需要拆分？
- [ ] 命名是否清晰？
- [ ] 是否遵循 SOLID 原则？
```

### 6.2 性能优化

```
常见优化:
1. 大列表 → 虚拟滚动
2. 频繁渲染 → computed 缓存
3. 大组件 → 异步组件
4. 首屏慢 → 路由懒加载
```

**示例**:
```typescript
// ✅ 使用 computed 缓存计算结果
const filteredUsers = computed(() =>
  users.value.filter(user =>
    user.name.includes(searchQuery.value)
  )
)

// ✅ 使用异步组件
const UserDetailModal = defineAsyncComponent(() =>
  import('@/components/users/UserDetailModal.vue')
)

// ✅ 路由懒加载
const routes = [
  {
    path: '/users',
    component: () => import('@/views/users/UserListView.vue')
  }
]
```

---

## 步骤 7: 代码审查

**目标**: 确保代码质量和一致性。

### 7.1 审查清单

```
业务正确性:
- [ ] 功能是否符合需求？
- [ ] 是否处理了所有边界情况？
- [ ] 异常处理是否完善？

SOLID 原则:
- [ ] 组件职责是否单一？
- [ ] 是否易于扩展？
- [ ] 是否依赖抽象？

性能考虑:
- [ ] 是否有不必要的重渲染？
- [ ] 是否使用了 computed 缓存？
- [ ] 是否实现了懒加载？

代码质量:
- [ ] 命名是否清晰？
- [ ] 代码是否可读？
- [ ] 是否有过度设计？
```

---

## 开发工作流总结

```
需求分析
    ↓
组件设计
    ↓
状态管理设计
    ↓
编写测试 (TDD) ← 先写测试！
    ↓
实现代码
    ↓
重构优化
    ↓
代码审查
    ↓
完成 ✓
```

**关键原则**:
1. **以需求为驱动**: 充分理解业务后再设计
2. **组件化设计**: 组件职责单一，接口清晰
3. **测试先行**: 先写测试，驱动代码设计
4. **持续重构**: 保持代码整洁，消除坏味道
5. **同行评审**: 保证质量一致性
