---
description: 聚合生命周期详解
---

# 聚合生命周期详解

## 概述

聚合（Aggregate）作为 DDD 的一致性边界和事务边界，有其完整的生命周期。理解聚合生命周期对于正确设计聚合至关重要。

## 聚合生命周期阶段

### 1. 创建（Creation）

#### 创建方式

```typescript
// 方式 1: 构造函数
const order = new Order(orderId, userId)

// 方式 2: 静态工厂方法
const order = Order.create(userId)

// 方式 3: Builder 模式
const order = Order.builder()
  .userId(userId)
  .items(items)
  .build()
```

#### 创建验证

```typescript
class Order {
  constructor(
    readonly id: OrderId,
    readonly userId: UserId
  ) {
    // 创建时验证不变量
    this.validate()
  }

  private validate(): void {
    if (!this.id) {
      throw new Error("Order ID is required")
    }
    if (!this.userId) {
      throw new Error("User ID is required")
    }
  }
}
```

### 2. 修改（Modification）

#### 修改原则

| 原则 | 说明 |
|------|------|
| **通过聚合根** | 只能通过聚合根修改 |
| **封装方法** | 通过方法封装修改逻辑 |
| **验证不变量** | 修改前验证不变量 |
| **发布事件** | 重要修改发布事件 |

#### 修改示例

```typescript
class Order {
  addItem(item: OrderItem): void {
    // 修改前验证
    this.validateItem(item)

    // 执行修改
    this.items.push(item)

    // 维护不变量
    this.recalculateTotal()

    // 发布事件
    this.addEvent(new OrderItemAdded(this.id, item.id))
  }

  private validateItem(item: OrderItem): void {
    if (this.items.length >= 10) {
      throw new Error("Cannot add more than 10 items")
    }
  }

  private recalculateTotal(): void {
    this.total = this.items.reduce(
      (sum, item) => sum.add(item.price),
      Money.ZERO
    )
  }
}
```

### 3. 查询（Query）

#### 查询原则

| 原则 | 说明 |
|------|------|
| **通过聚合根** | 只能通过聚合根查询 |
| **不暴露内部** | 不暴露内部集合 |
| **提供查询方法** | 提供语义化的查询方法 |

#### 查询示例

```typescript
class Order {
  private items: OrderItem[] = []

  // ✅ 正确：提供查询方法
  getItemCount(): number {
    return this.items.length
  }

  getTotal(): Money {
    return this.total
  }

  findItem(itemId: ItemId): OrderItem | undefined {
    return this.items.find(item => item.id.equals(itemId))
  }

  // ❌ 错误：直接暴露内部集合
  getItems(): OrderItem[] {
    return this.items  // 暴露了内部结构
  }
}
```

### 4. 删除（Deletion）

#### 删除原则

| 原则 | 说明 |
|------|------|
| **逻辑删除** | 优先使用逻辑删除 |
| **验证引用** | 删除前验证没有引用 |
| **发布事件** | 删除发布事件 |

#### 删除示例

```typescript
class Order {
  delete(): void {
    // 验证可以删除
    if (this.status !== OrderStatus.CANCELLED) {
      throw new Error("Only cancelled orders can be deleted")
    }

    // 逻辑删除
    this.deleted = true

    // 发布事件
    this.addEvent(new OrderDeleted(this.id))
  }
}
```

### 5. 持久化（Persistence）

#### 持久化流程

```
1. 修改聚合
   └─ 聚合根方法修改状态

2. 记录事件
   └─ 内部记录领域事件

3. 保存聚合
   └─ 仓储保存聚合状态

4. 发布事件
   └─ 保存后发布领域事件
```

#### 持久化示例

```typescript
// 应用服务
class OrderAppService {
  async addItem(orderId: string, item: OrderItem): Promise<void> {
    // 1. 加载聚合
    const order = await this.orderRepo.findById(new OrderId(orderId))

    // 2. 修改聚合
    order.addItem(item)

    // 3. 保存聚合（内部保存状态和事件）
    await this.orderRepo.save(order)

    // 4. 发布事件（由基础设施处理）
    this.eventBus.publish(order.getUncommittedEvents())

    // 5. 清理事件
    order.markEventsAsCommitted()
  }
}
```

## 聚合状态管理

### 状态机模式

```typescript
class Order {
  private status: OrderStatus

  confirm(): void {
    // 状态转移验证
    if (this.status !== OrderStatus.PENDING) {
      throw new Error("Only pending orders can be confirmed")
    }

    // 状态转移
    this.status = OrderStatus.CONFIRMED

    // 发布事件
    this.addEvent(new OrderConfirmed(this.id))
  }

  ship(): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new Error("Only confirmed orders can be shipped")
    }

    this.status = OrderStatus.SHIPPED
    this.addEvent(new OrderShipped(this.id))
  }
}
```

### 状态验证

```typescript
class Membership {
  grantCoupon(): void {
    // 状态验证
    if (!this.isActive()) {
      throw new Error("只有生效中的会员才能发放点券")
    }

    // 执行操作
    this.couponService.grant(this.userId, 100)
  }

  isActive(): boolean {
    return this.status === MembershipStatus.ACTIVE
  }
}
```

## 聚合并发控制

### 乐观锁

```typescript
class Order {
  readonly version: number

  constructor() {
    this.version = 0
  }

  addItem(item: OrderItem): void {
    // 修改操作
    this.items.push(item)
    this.recalculateTotal()

    // 版本号递增
    this.version++
  }
}

// 仓储实现
class OrderRepository {
  async save(order: Order): Promise<void> {
    const result = await this.db.update({
      table: "orders",
      where: {
        id: order.id.value,
        version: order.version  // 检查版本号
      },
      data: {
        ...order.toDto(),
        version: order.version + 1
      }
    })

    if (result.rowsAffected === 0) {
      throw new ConcurrentModificationError("订单已被其他事务修改")
    }
  }
}
```

### 悲观锁

```typescript
class OrderRepository {
  async findByIdForUpdate(id: OrderId): Promise<Order> {
    // 使用 SELECT ... FOR UPDATE 加锁
    return await this.db.query(`
      SELECT * FROM orders
      WHERE id = $1
      FOR UPDATE
    `, [id.value])
  }
}

// 使用
async function updateOrder(id: OrderId): Promise<void> {
  const tx = await db.transaction()

  try {
    // 加锁加载
    const order = await orderRepo.findByIdForUpdate(id, tx)

    // 修改
    order.addItem(item)

    // 保存
    await orderRepo.save(order, tx)

    await tx.commit()
  } catch (error) {
    await tx.rollback()
    throw error
  }
}
```

## 聚合测试

### 生命周期测试

```typescript
describe("Order Lifecycle", () => {
  describe("Creation", () => {
    it("should create order with valid data", () => {
      const order = new Order(orderId, userId)
      expect(order.id).toEqual(orderId)
      expect(order.userId).toEqual(userId)
      expect(order.status).toEqual(OrderStatus.PENDING)
    })

    it("should reject order without id", () => {
      expect(() => {
        new Order(null, userId)
      }).toThrow("Order ID is required")
    })
  })

  describe("Modification", () => {
    it("should add item and update total", () => {
      const order = new Order(orderId, userId)
      const item = new OrderItem(productId, 2, new Money(200n, "CNY"))

      order.addItem(item)

      expect(order.itemCount).toBe(1)
      expect(order.total).toEqual(new Money(200n, "CNY"))
    })

    it("should reject adding more than 10 items", () => {
      const order = new Order(orderId, userId)

      // 添加 10 个项目
      for (let i = 0; i < 10; i++) {
        order.addItem(new OrderItem(`p-${i}`, 1, Money.ONE_HUNDRED))
      }

      // 第 11 个应该失败
      expect(() => {
        order.addItem(new OrderItem("p-11", 1, Money.ONE_HUNDRED))
      }).toThrow("Cannot add more than 10 items")
    })
  })

  describe("Deletion", () => {
    it("should delete cancelled order", () => {
      const order = new Order(orderId, userId)
      order.cancel()
      order.delete()

      expect(order.deleted).toBe(true)
    })

    it("should reject deleting active order", () => {
      const order = new Order(orderId, userId)

      expect(() => {
        order.delete()
      }).toThrow("Only cancelled orders can be deleted")
    })
  })
})
```

## 聚合生命周期管理最佳实践

### 1. 创建阶段

| 实践 | 说明 |
|------|------|
| **构造函数验证** | 创建时验证不变量 |
| **使用工厂方法** | 复杂创建使用工厂 |
| **封装创建逻辑** | 不暴露创建细节 |

### 2. 修改阶段

| 实践 | 说明 |
|------|------|
| **通过方法修改** | 不直接修改属性 |
| **修改前验证** | 验证不变量 |
| **维护一致性** | 维护聚合内一致性 |
| **发布事件** | 重要修改发布事件 |

### 3. 查询阶段

| 实践 | 说明 |
|------|------|
| **提供查询方法** | 不暴露内部结构 |
| **返回副本** | 避免直接暴露集合 |
| **语义化方法** | 方法名体现业务含义 |

### 4. 删除阶段

| 实践 | 说明 |
|------|------|
| **优先逻辑删除** | 不物理删除数据 |
| **验证引用** | 确保没有引用 |
| **发布事件** | 删除发布事件 |

### 5. 持久化阶段

| 实践 | 说明 |
|------|------|
| **事务边界** | 一个事务一个聚合 |
| **并发控制** | 使用乐观锁或悲观锁 |
| **事件发布** | 保存后发布事件 |

## 参考资料

- Domain-Driven Design (Eric Evans) - Chapter 6
- Implementing Domain-Driven Design (Vaughn Vernon) - Chapters 10-11
- Aggregate Lifecycle (Microsoft)
