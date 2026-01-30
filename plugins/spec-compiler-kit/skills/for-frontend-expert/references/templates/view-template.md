# Vue3 View 组件模板

## 基础模板

```vue
<script setup lang="ts">
/**
 * @description 组件描述
 * @author 作者
 */

// ==================== 导入 ====================
import { ref, computed, onMounted } from 'vue'
import { useXxx } from '@/composables/useXxx'

// ==================== 类型定义 ====================
interface Props {
  // Props 定义
}

interface Emits {
  // Events 定义
}

// ==================== Props & Emits ====================
const props = withDefaults(defineProps<Props>(), {
  // 默认值
})

const emit = defineEmits<Emits>()

// ==================== Composable ====================
const { state, action } = useXxx()

// ==================== 本地状态 ====================
const localState = ref()

// ==================== 计算属性 ====================
const computedValue = computed(() => {
  return
})

// ==================== 生命周期 ====================
onMounted(() => {
  // 初始化
})

// ==================== 方法 ====================
const handleClick = () => {
  // 处理
}
</script>

<template>
  <div class="xxx-view">
    <!-- 模板内容 -->
  </div>
</template>

<style scoped lang="scss">
.xxx-view {
  // 样式
}
</style>
```

---

## 列表页面模板

```vue
<script setup lang="ts">
/**
 * @description 用户列表页面
 * @author Your Name
 */

import { ref, computed, onMounted } from 'vue'
import { useUserList } from '@/composables/useUserList'
import UserFilterBar from '@/components/users/UserFilterBar.vue'
import UserTable from '@/components/users/UserTable.vue'
import UserPagination from '@/components/users/UserPagination.vue'

// ==================== Composable ====================
const {
  users,
  loading,
  pagination,
  filters,
  fetchUsers,
  deleteUser
} = useUserList()

// ==================== 本地状态 ====================
const selectedUserIds = ref<string[]>([])

// ==================== 计算属性 ====================
const hasSelection = computed(() => selectedUserIds.value.length > 0)

// ==================== 生命周期 ====================
onMounted(() => {
  fetchUsers()
})

// ==================== 方法 ====================
const handleSearch = (params: GetUserParams) => {
  filters.value = params
  pagination.value.page = 1
  fetchUsers()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchUsers()
}

const handleSelect = (userIds: string[]) => {
  selectedUserIds.value = userIds
}

const handleDelete = async (userId: string) => {
  await deleteUser(userId)
  await fetchUsers()
}
</script>

<template>
  <div class="user-list-view">
    <!-- 筛选器 -->
    <UserFilterBar
      v-model:filters="filters"
      @search="handleSearch"
    />

    <!-- 工具栏 -->
    <div v-if="hasSelection" class="toolbar">
      <span>已选择 {{ selectedUserIds.length }} 项</span>
      <button @click="handleBatchDelete">批量删除</button>
    </div>

    <!-- 表格 -->
    <UserTable
      :users="users"
      :loading="loading"
      :selected-ids="selectedUserIds"
      @select="handleSelect"
      @delete="handleDelete"
    />

    <!-- 分页 -->
    <UserPagination
      v-model:page="pagination.page"
      v-model:limit="pagination.limit"
      :total="pagination.total"
      @update:page="handlePageChange"
    />
  </div>
</template>

<style scoped lang="scss">
.user-list-view {
  padding: 24px;

  .toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px;
    background: var(--color-bg-light);
    border-radius: 8px;
  }
}
</style>
```

---

## 详情页面模板

```vue
<script setup lang="ts">
/**
 * @description 用户详情页面
 * @author Your Name
 */

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserDetail } from '@/composables/useUserDetail'
import UserBasicInfo from '@/components/users/UserBasicInfo.vue'
import UserActivities from '@/components/users/UserActivities.vue'

// ==================== 路由 ====================
const route = useRoute()
const router = useRouter()

const userId = route.params.id as string

// ==================== Composable ====================
const {
  user,
  loading,
  fetchUser,
  updateUser,
  deleteUser
} = useUserDetail()

// ==================== 本地状态 ====================
const isEditing = ref(false)
const deleteDialogVisible = ref(false)

// ==================== 生命周期 ====================
onMounted(() => {
  fetchUser(userId)
})

// ==================== 方法 ====================
const handleEdit = () => {
  isEditing.value = true
}

const handleSave = async (data: UpdateUserDTO) => {
  await updateUser(userId, data)
  isEditing.value = false
}

const handleDelete = () => {
  deleteDialogVisible.value = true
}

const handleConfirmDelete = async () => {
  await deleteUser(userId)
  router.push('/users')
}
</script>

<template>
  <div class="user-detail-view">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 内容 -->
    <div v-else-if="user" class="content">
      <!-- 头部操作栏 -->
      <div class="header">
        <h1>用户详情</h1>
        <div class="actions">
          <button v-if="!isEditing" @click="handleEdit">编辑</button>
          <button @click="handleDelete">删除</button>
        </div>
      </div>

      <!-- 基本信息 -->
      <UserBasicInfo
        :user="user"
        :editing="isEditing"
        @save="handleSave"
        @cancel="isEditing = false"
      />

      <!-- 活动记录 -->
      <UserActivities :user-id="user.id" />
    </div>

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-model:visible="deleteDialogVisible"
      title="确认删除"
      @confirm="handleConfirmDelete"
    >
      确定要删除该用户吗？此操作不可恢复。
    </ConfirmDialog>
  </div>
</template>

<style scoped lang="scss">
.user-detail-view {
  padding: 24px;

  .loading {
    text-align: center;
    padding: 48px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      margin: 0;
      font-size: 24px;
    }

    .actions {
      display: flex;
      gap: 12px;
    }
  }
}
</style>
```

---

## 表单页面模板

```vue
<script setup lang="ts">
/**
 * @description 用户表单页面
 * @author Your Name
 */

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserForm } from '@/composables/useUserForm'
import UserForm from '@/components/users/UserForm.vue'

// ==================== 路由 ====================
const router = useRouter()

// ==================== Composable ====================
const {
  form,
  rules,
  loading,
  submitting,
  isEdit,
  initForm,
  validateForm,
  submitForm
} = useUserForm()

// ==================== 本地状态 ====================
const formRef = ref<InstanceType<typeof UserForm>>()
const dirty = ref(false)

// ==================== 生命周期 ====================
onMounted(() => {
  const userId = router.currentRoute.value.params.id as string
  if (userId) {
    initForm(userId)
  }
})

// ==================== 方法 ====================
const handleFieldChange = () => {
  dirty.value = true
}

const handleSubmit = async () => {
  const valid = await validateForm()
  if (!valid) return

  const success = await submitForm()
  if (success) {
    router.push('/users')
  }
}

const handleCancel = () => {
  if (dirty.value) {
    const confirmed = confirm('有未保存的修改，确定要离开吗？')
    if (!confirmed) return
  }
  router.back()
}
</script>

<template>
  <div class="user-form-page">
    <div class="header">
      <h1>{{ isEdit ? '编辑用户' : '创建用户' }}</h1>
    </div>

    <UserForm
      ref="formRef"
      :model="form"
      :rules="rules"
      :loading="loading"
      :submitting="submitting"
      @field-change="handleFieldChange"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped lang="scss">
.user-form-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;

  .header {
    margin-bottom: 24px;

    h1 {
      margin: 0;
      font-size: 24px;
    }
  }
}
</style>
```
