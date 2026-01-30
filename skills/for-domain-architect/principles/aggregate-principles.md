---
description: 聚合设计原则
---

# 聚合设计原则

## 概述

聚合（Aggregate）是 DDD 中定义一致性边界和事务边界的核心概念。本文档总结聚合设计的核心原则。

## 黄金法则

> **让聚合尽可能小**

## 核心原则

### 1. 聚合根是唯一入口

**原则**：外部只能通过聚合根访问聚合内部对象。

```typescript
// ✅ 正确：只能通过聚合根访问
const order = orderRepository.findById(orderId)
const item = order.getItem(itemId)  // 通过 Order 访问

// ❌ 错误：直接访问实体
const item = orderItemRepository.findById(itemId)  // 不应该有实体仓储
```

### 2. 聚合尽量小

**原则**：一个聚合应该只包含必须一起修改的对象。

```typescript
// ❌ 错误：大聚合
class User {
  id: UserId
  orders: Order[]       // 不应该在 User 中
  memberships: Membership[]  // 不应该在 User 中
  coupons: Coupon[]     // 不应该在 User 中
}

// ✅ 正确：小聚合
class User {
  id: UserId
  profile: UserProfile  // 只包含紧密相关的数据
}
```

### 3. 强一致性边界

**原则**：聚合内部保证强一致性，聚合间接受最终一致性。

```typescript
// ✅ 正确：聚合内强一致
class Order {
  addItem(item: OrderItem): void {
    this.items.push(item)
    this.updateTotal()  // 保持总额一致
  }

  private updateTotal(): void {
    this.total = this.items.reduce(
      (sum, item) => sum.add(item.price),
      Money.ZERO
    )
  }
}

// 聚合间最终一致：通过领域事件
class Membership {
  activate(): void {
    this.status = MembershipStatus.ACTIVE
    // 发布事件，点券上下文异步处理
    this.addEvent(new MembershipActivated(this.id))
  }
}
```

### 4. 引用通过 ID

**原则**：聚合间引用只存储 ID，不存储对象引用。

```typescript
// ✅ 正确：只存储 ID
class Order {
  id: OrderId
  userId: UserId  // 只存储 ID
  items: OrderItem[]
}

// ❌ 错误：存储对象引用
class Order {
  id: OrderId
  user: User  // 不应该存储整个对象
  items: OrderItem[]
}
```

### 5. 一个事务修改一个聚合

**原则**：一个事务只修改一个聚合，保证一致性边界。

```typescript
// ✅ 正确：一个事务修改一个聚合
async function activateMembership(membershipId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const membership = await membershipRepo.findById(membershipId, tx)
    membership.activate()
    await membershipRepo.save(membership, tx)
  })
}

// ❌ 错误：一个事务修改多个聚合
async function activateMembershipAndGrantCoupon(membershipId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // 修改会员聚合
    const membership = await membershipRepo.findById(membershipId, tx)
    membership.activate()
    await membershipRepo.save(membership, tx)

    // 修改点券聚合（不应该在同一个事务）
    const coupon = await couponRepo.findByUserId(membership.userId, tx)
    coupon.addAmount(100)
    await couponRepo.save(coupon, tx)
  })
}
```

## 聚合大小指南

### 聚合大小评估

| 指标 | 小聚合 | 中聚合 | 大聚合 |
|------|--------|--------|--------|
| 实体数量 | 1-3 | 4-7 | 8+ |
| 深度 | 1-2 | 2-3 | 3+ |
| 建议 | ✅ 推荐 | ⚠️ 评估 | ❌ 拆分 |

### 聚合拆分决策树

```
这个对象应该在聚合内吗？
│
├─ 需要和聚合根一起修改吗？
│   ├─ 是 → 在聚合内
│   └─ 否 → 在聚合外
│
├─ 需要强一致吗？
│   ├─ 是 → 在聚合内
│   └─ 否 → 在聚合外
│
└─ 删除聚合根时需要删除吗？
    ├─ 是 → 在聚合内
    └─ 否 → 在聚合外
```

## 聚合不变量

### 不变量定义

**不变量（Invariant）**：聚合必须始终保持的业务规则。

### 不变量示例

```typescript
class Order {
  private items: OrderItem[] = []

  addItem(item: OrderItem): void {
    // 不变量：订单不能有 10 个以上的项目
    if (this.items.length >= 10) {
      throw new Error("Cannot add more than 10 items")
    }

    // 不变量：订单项价格不能为负
    if (item.price.isNegative()) {
      throw new Error("Item price cannot be negative")
    }

    this.items.push(item)
    this.recalculateTotal()
  }

  confirm(): void {
    // 不变量：确认时订单不能为空
    if (this.items.length === 0) {
      throw new Error("Cannot confirm empty order")
    }

    this.status = OrderStatus.CONFIRMED
  }

  private recalculateTotal(): void {
    // 不变量：订单总额等于所有项目之和
    this.total = this.items.reduce(
      (sum, item) => sum.add(item.price),
      Money.ZERO
    )
  }
}
```

### 不变量分类

| 类型 | 说明 | 示例 |
|------|------|------|
| **状态约束** | 状态之间的排斥关系 | 过期的订单不能修改 |
| **数量约束** | 数量限制 | 订单不能超过 10 个项目 |
| **值约束** | 属性值范围 | 金额不能为负 |
| **引用约束** | 关联完整性 | 订单项必须关联有效产品 |

## 聚合设计模式

### 模式 1: 单实体聚合

```typescript
// 聚合只包含聚合根
class Membership {
  id: MembershipId
  userId: UserId
  status: MembershipStatus
  level: MembershipLevel

  activate(): void {
    this.status = MembershipStatus.ACTIVE
    this.addEvent(new MembershipActivated(this.id))
  }
}
```

### 模式 2: 父子聚合

```typescript
// 聚合包含父子关系
class Order {
  id: OrderId
  items: OrderItem[]  // 子实体

  addItem(item: OrderItem): void {
    this.items.push(item)
    this.updateTotal()
  }

  private updateTotal(): void {
    this.total = this.items.reduce(
      (sum, item) => sum.add(item.price),
      Money.ZERO
    )
  }
}

class OrderItem {
  id: ItemId  // 局部 ID，无全局标识
  productId: ProductId
  quantity: number
  price: Money
}
```

### 模式 3: 聚合引用

```typescript
// 聚合通过 ID 引用其他聚合
class Order {
  id: OrderId
  userId: UserId  // 引用 User 聚合
  shippingAddressId: AddressId  // 引用 Address 聚合
  items: OrderItem[]
}
```

## 聚合与并发

### 并发冲突处理

```typescript
// 使用乐观锁处理并发
class OrderRepository {
  async save(order: Order): Promise<void> {
    const result = await this.db.update({
      table: "orders",
      where: {
        id: order.id.value,
        version: order.version  // 检查版本号
      },
      data: {
        status: order.status,
        total: order.total.amount,
        version: order.version + 1
      }
    })

    if (result.rowsAffected === 0) {
      throw new ConcurrentModificationError("Order was modified by another transaction")
    }
  }
}
```

### 并发冲突避免

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **乐观锁** | 读取时记录版本，更新时检查 | 冲突较少 |
| **悲观锁** | 读取时加锁 | 冲突频繁 |
| **聚合拆分** | 拆分聚合减少冲突 | 大聚合 |

## 聚合测试

### 聚合测试示例

```typescript
describe("Order", () => {
  it("should add item and update total", () => {
    const order = new Order(orderId, userId)
    const item = new OrderItem(productId, 2, new Money(200n, "CNY"))

    order.addItem(item)

    expect(order.total).toEqual(new Money(200n, "CNY"))
  })

  it("should not add more than 10 items", () => {
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

  it("should not confirm empty order", () => {
    const order = new Order(orderId, userId)

    expect(() => {
      order.confirm()
    }).toThrow("Cannot confirm empty order")
  })
})
```

## 聚合检查清单

聚合设计完成前，确认：

- [ ] 聚合根有全局唯一标识
- [ ] 聚合边界清晰，大小合理
- [ ] 聚合内强一致，聚合间最终一致
- [ ] 聚合根是唯一入口
- [ ] 聚合间引用只使用 ID
- [ ] 不变量已识别和实现
- [ ] 一个事务只修改一个聚合
- [ ] 考虑了并发冲突处理
- [ ] 编写了单元测试

## 常见错误

### 错误 1: 聚合太大

```typescript
// ❌ 错误：大聚合
class User {
  id: UserId
  orders: Order[]
  memberships: Membership[]
  coupons: Coupon[]
}

// ✅ 正确：拆分成独立聚合
class User {
  id: UserId
  profile: UserProfile
}
```

### 错误 2: 聚合间存储对象引用

```typescript
// ❌ 错误：存储整个对象
class Order {
  user: User
}

// ✅ 正确：只存储 ID
class Order {
  userId: UserId
}
```

### 错误 3: 实体有仓储

```typescript
// ❌ 错误：实体不应该有仓储
interface OrderItemRepository {
  findById(id: ItemId): OrderItem
}

// ✅ 正确：只有聚合根有仓储
interface OrderRepository {
  findById(id: OrderId): Order
}
```

## 参考资料

- Domain-Driven Design (Eric Evans) - Chapter 6
- Implementing Domain-Driven Design (Vaughn Vernon) - Chapter 10-11
- Effective Aggregate Design (Martin Fowler)
