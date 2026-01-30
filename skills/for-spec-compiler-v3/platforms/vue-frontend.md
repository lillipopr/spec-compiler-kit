# Vue 3 前端分层架构指南

> **注意**：本文档只描述分层架构，不包含独立建模。
> 问题建模、约束定义、用例设计请参考 Phase 1-3 文档（跨端统一）。

## 分层架构

### 标准分层

```
View → Composable → Service → API → Request
```

### 层级职责

| 层级 | 职责 | 技术选型 |
|------|------|---------|
| **View** | UI 展示和用户交互 | Vue SFC |
| **Composable** | 状态管理、业务协调 | Composition API |
| **Service** | 业务逻辑、不变量校验 | TypeScript Class/Function |
| **API** | API 封装 | TypeScript Function |
| **Request** | HTTP 请求 | Axios |

### 依赖方向

```
View → Composable → Service → API → Request
 ↑                                      ↓
 └──────────────── 不依赖 ──────────────┘
```

---

## View 层

### 职责

- UI 布局和渲染
- 用户交互事件传递
- 绑定 Composable 状态

### 示例

```vue
<template>
  <div class="order-view">
    <LoadingView v-if="isLoading" />
    <ErrorView v-else-if="error" :message="error" @retry="createOrder" />
    <OrderContent v-else-if="order" :order="order" />
  </div>
</template>

<script setup lang="ts">
import { useOrder } from '@/composables/useOrder'

const { order, isLoading, error, createOrder } = useOrder()
</script>
```

---

## Composable 层

### 职责

- 管理 UI 状态
- 提供用户意图接口
- 协调 Service 层调用

### 示例

```typescript
// composables/useOrder.ts
import { ref, computed } from 'vue'
import { orderService } from '@/services/orderService'
import type { Order, OrderItem } from '@/types/order'

export function useOrder() {
  const order = ref<Order | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const createOrder = async (items: OrderItem[]) => {
    isLoading.value = true
    error.value = null

    try {
      order.value = await orderService.createOrder(items)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }

  return {
    order: computed(() => order.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    createOrder,
  }
}
```

---

## Service 层

### 职责

- 实现业务逻辑
- **不变量校验**（核心）
- 数据转换

### 示例

```typescript
// services/orderService.ts
import { orderApi } from '@/api/orderApi'
import type { Order, OrderItem } from '@/types/order'

class OrderService {
  async createOrder(items: OrderItem[]): Promise<Order> {
    // 不变量校验：INV-01 订单金额计算
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    const order = await orderApi.postOrder(items)

    // 验证返回结果
    if (order.totalAmount !== totalAmount) {
      throw new Error('INV-01: 订单金额计算错误')
    }

    return order
  }
}

export const orderService = new OrderService()
```

---

## API 层

### 职责

- API 封装
- 请求参数构造
- 响应数据解析

### 示例

```typescript
// api/orderApi.ts
import { request } from '@/utils/request'
import type { Order, OrderItem } from '@/types/order'

export const orderApi = {
  postOrder: (items: OrderItem[]): Promise<Order> => {
    return request.post('/api/v1/orders/create', { items })
  },

  getOrder: (orderId: string): Promise<Order> => {
    return request.post('/api/v1/orders/detail', { orderId })
  },
}
```

---

## Request 层

### 职责

- HTTP 请求封装
- 认证管理
- 错误处理

### 示例

```typescript
// utils/request.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

instance.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    const message = error.response?.data?.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export const request = instance
```

---

## 与端到端设计的关系

在端到端接口设计文档中，前端部分应包含：

1. **分层设计表**：明确各层的文件和方法
2. **类型定义**：明确 TypeScript 类型与后端 DTO 的对应关系
3. **代码结构**：明确文件组织方式

详见 [Phase 4: 端到端接口设计](../02-compilation-phases/phase-4-e2e-design.md)
