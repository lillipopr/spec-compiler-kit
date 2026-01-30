---
description: 聚合设计方法论
---

# 聚合设计方法论

## 概述

聚合（Aggregate）是 DDD 中一组相关对象的集合，作为数据修改的单元。聚合定义了事务的一致性边界，是 DDD 战术设计的核心。

## 核心概念

```
聚合 = 一致性边界 + 事务边界 + 并发边界

┌─────────────────────────────────────┐
│         Aggregate (聚合)             │
│  ┌───────────────────────────────┐  │
│  │   Aggregate Root (聚合根)      │  │
│  │   - 唯一入口                  │  │
│  │   - 维护一致性                │  │
│  │   - 发布事件                  │  │
│  └───────────────────────────────┘  │
│           │           │              │
│  ┌────────▼───┐  ┌───▼──────────┐  │
│  │  Entity    │  │  Value Object│  │
│  │  (实体)    │  │  (值对象)    │  │
│  └────────────┘  └──────────────┘  │
│                                     │
│  强一致性边界                       │
│  事务边界                           │
└─────────────────────────────────────┘
```

## 聚合设计原则

### 1. 聚合根是唯一入口

```typescript
// ✅ 正确：只能通过聚合根访问
const order = orderRepository.findById(orderId)
const orderItem = order.getItem(itemId) // 通过 order 访问

// ❌ 错误：直接访问实体
const orderItem = orderItemRepository.findById(itemId) // 不应该有实体仓储
```

### 2. 聚合尽量小

```typescript
// ❌ 错误：大聚合
class User {
  id: UserId
  profile: UserProfile
  orders: Order[]        // 不应该在 User 聚合中
  memberships: Membership[] // 不应该在 User 聚合中
  coupons: Coupon[]      // 不应该在 User 聚合中
}

// ✅ 正确：小聚合
class User {
  id: UserId
  profile: UserProfile   // 只包含紧密相关的数据
}
```

### 3. 强一致性边界

```typescript
// ✅ 正确：Order 和 OrderItem 强一致
class Order {
  addItem(product: Product, quantity: number): void {
    const item = new OrderItem(product, quantity)
    this.items.add(item)
    this.updateTotal() // 保持一致性
  }

  removeItem(itemId: ItemId): void {
    this.items.remove(itemId)
    this.updateTotal() // 保持一致性
  }

  private updateTotal(): void {
    this.total = this.items.sum(i => i.price)
  }
}
```

### 4. 引用通过 ID

```typescript
// ✅ 正确：只存储 ID
class Order {
  id: OrderId
  userId: UserId  // 只存储 ID，不存储整个 User
  items: OrderItem[]
}

// ❌ 错误：存储对象引用
class Order {
  id: OrderId
  user: User  // 不应该存储整个对象
  items: OrderItem[]
}
```

## 识别聚合根

### 聚合根判断三问法

| 问题 | 说明 | 示例 |
|------|------|------|
| **有全局唯一标识吗？** | 需要 ID 来区分身份 | Order 有 orderId |
| **有独立生命周期吗？** | 可独立创建、删除 | Order 可独立创建 |
| **维护一致性边界吗？** | 封装业务不变量 | Order 维护订单总额不变量 |

### 聚合根 vs 实体

| 维度 | 聚合根 | 实体 |
|------|--------|------|
| 标识 | 全局唯一 ID | 局部唯一 ID（通常无独立 ID） |
| 访问 | 外部可直接访问 | 只能通过聚合根访问 |
| 生命周期 | 独立 | 依赖聚合根 |
| 仓储 | 有专门仓储 | 无专门仓储 |
| 示例 | Order | OrderItem |

### 聚合根识别决策树

```
这个对象是聚合根吗？
│
├─ 有全局唯一标识吗？
│   ├─ 否 → 非聚合根
│   └─ 是 → 继续
│
├─ 有独立生命周期吗？
│   ├─ 否 → 非聚合根
│   └─ 是 → 继续
│
├─ 需要维护一致性吗？
│   ├─ 否 → 可能是值对象
│   └─ 是 → 聚合根候选
│
└─ 会被其他对象直接引用吗？
    ├─ 是 → 聚合根
    └─ 否 → 可能是实体
```

## 聚合边界确定

### 边界确定原则

#### 原则 1: 事务一致性

```
问：这些数据需要在同一个事务中修改吗？

├─ 是 → 应该在同一个聚合中
└─ 否 → 应该在不同的聚合中

示例：
- Order 和 OrderItem → 需要一起修改 → 同一聚合
- Order 和 Payment → 不需要一起修改 → 不同聚合
```

#### 原则 2: 并发冲突

```
问：两个用户同时修改会冲突吗？

├─ 会冲突 → 考虑拆分聚合
└─ 不会冲突 → 边界合理

示例：
- User 和 Order → 修改 User 不会影响 Order → 不同聚合
- Order 和 OrderItem → 修改 Order 会影响 OrderItem → 同一聚合
```

#### 原则 3: 数据量

```
问：聚合会变得很大吗？

├─ 会很大 → 考虑拆分
└─ 大小合理 → 边界合理

建议：
- 聚合包含的实体数量 < 10 个
- 聚合的深度 < 3 层
```

### 聚合大小指导

| 聚合大小 | 实体数量 | 深度 | 建议 |
|----------|----------|------|------|
| 小 | 1-3 | 1-2 | ✅ 推荐 |
| 中 | 4-7 | 2-3 | ⚠️ 需要评估 |
| 大 | 8+ | 3+ | ❌ 需要拆分 |

## 聚合设计模式

### 模式 1: 单实体聚合

```typescript
// 聚合只包含聚合根，没有其他实体
class Membership {
  id: MembershipId
  userId: UserId
  status: MembershipStatus
  level: MembershipLevel
  period: SubscriptionPeriod

  activate(): void {
    this.status = MembershipStatus.ACTIVE
    this.addEvent(new MembershipActivated(this.id))
  }

  expire(): void {
    this.status = MembershipStatus.EXPIRED
    this.addEvent(new MembershipExpired(this.id))
  }
}
```

### 模式 2: 父子聚合

```typescript
// 聚合包含父子关系的实体
class Order {
  id: OrderId
  userId: UserId
  items: OrderItem[]  // 子实体
  total: Money

  addItem(product: Product, quantity: number): void {
    const item = new OrderItem(product, quantity)
    this.items.push(item)
    this.recalculateTotal()
  }

  removeItem(itemId: ItemId): void {
    this.items = this.items.filter(item => !item.id.equals(itemId))
    this.recalculateTotal()
  }

  private recalculateTotal(): void {
    this.total = this.items.reduce(
      (sum, item) => sum.add(item.price),
      Money.ZERO
    )
  }
}

class OrderItem {
  id: ItemId
  productId: ProductId
  quantity: number
  price: Money
}
```

### 模式 3: 引用其他聚合

```typescript
// 聚合通过 ID 引用其他聚合
class Order {
  id: OrderId
  userId: UserId        // 引用 User 聚合
  shippingAddressId: AddressId  // 引用 Address 聚合
  items: OrderItem[]

  // 不存储整个对象，只存储 ID
}
```

## 聚合不变量

### 不变量类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **状态约束** | 状态之间的排斥关系 | 过期的订单不能修改 |
| **数量约束** | 数量限制 | 一个用户只能有一个生效会员 |
| **值约束** | 属性值范围 | 订单总额必须 ≥ 0 |
| **引用约束** | 关联完整性 | 订单项必须关联有效产品 |

### 不变量实现

```typescript
class Order {
  private items: OrderItem[] = []

  addItem(item: OrderItem): void {
    // 不变量：订单总额必须 ≥ 0
    if (item.price.isNegative()) {
      throw new Error("Item price cannot be negative")
    }

    // 不变量：订单不能有 10 个以上的项目
    if (this.items.length >= 10) {
      throw new Error("Cannot add more than 10 items")
    }

    this.items.push(item)
    this.recalculateTotal()
  }

  confirm(): void {
    // 不变量：确认时订单不能为空
    if (this.items.length === 0) {
      throw new Error("Cannot confirm empty order")
    }

    // 不变量：确认时订单必须有效
    if (!this.isValid()) {
      throw new Error("Cannot confirm invalid order")
    }

    this.status = OrderStatus.CONFIRMED
  }
}
```

## 聚合间协作

### 协作方式

| 方式 | 适用场景 | 示例 |
|------|----------|------|
| **领域事件** | 异步通知 | OrderCreated → 触发发货 |
| **领域服务** | 多聚合协作 | 转账（两个 Account） |
| **应用服务** | 流程编排 | 下单流程 |

### 领域事件协作

```typescript
// 发布方：会员上下文
class Membership {
  activate(): void {
    this.status = MembershipStatus.ACTIVE
    this.addEvent(new MembershipActivated(
      this.id,
      this.userId,
      this.level
    ))
  }
}

// 订阅方：点券上下文
class CouponService {
  onMembershipActivated(event: MembershipActivated): void {
    // 开始每日点券发放
    this.scheduleDailyGrant(event.membershipId)
  }
}
```

### 领域服务协作

```typescript
// 涉及两个聚合的领域服务
class TransferService {
  transfer(
    fromAccountId: AccountId,
    toAccountId: AccountId,
    amount: Money
  ): void {
    // 加锁防止并发
    const from = this.accountRepo.findById(fromAccountId, FOR_UPDATE)
    const to = this.accountRepo.findById(toAccountId, FOR_UPDATE)

    // 业务验证
    if (from.balance.lessThan(amount)) {
      throw new Error("Insufficient balance")
    }

    // 执行转账
    from.withdraw(amount)
    to.deposit(amount)

    // 保存
    this.accountRepo.save(from)
    this.accountRepo.save(to)
  }
}
```

## 聚合与持久化

### 持久化策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **单表** | 整个聚合存一张表 | 小聚合、简单结构 |
| **主从表** | 聚合根主表 + 实体从表 | 父子聚合 |
| **JSON 列** | 复杂结构用 JSON | 值对象较多 |
| **聚合表** | 一个聚合一张表 | 大聚合拆分存储 |

### 单表策略示例

```sql
-- Membership 聚合单表存储
CREATE TABLE memberships (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL,
  level VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### 主从表策略示例

```sql
-- Order 聚合根表
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  total_amount BIGINT NOT NULL,
  total_currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- OrderItem 实体从表
CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL REFERENCES orders(id),
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  price_amount BIGINT NOT NULL,
  price_currency VARCHAR(3) NOT NULL
);
```

## 检查清单

聚合设计完成前，确认：

- [ ] 聚合根有全局唯一标识
- [ ] 聚合边界清晰，大小合理
- [ ] 聚合内强一致，聚合间最终一致
- [ ] 聚合根是唯一入口
- [ ] 聚合间引用只使用 ID
- [ ] 不变量已识别和实现
- [ ] 考虑了并发冲突场景
- [ ] 选择了合适的持久化策略

## 常见错误

### 错误 1: 聚合太大

```typescript
// ❌ 错误：User 聚合包含太多内容
class User {
  id: UserId
  orders: Order[]
  memberships: Membership[]
  coupons: Coupon[]
  preferences: UserPreferences
  // ... 太多内容
}

// ✅ 正确：拆分成独立聚合
class User {
  id: UserId
  profile: UserProfile
  preferences: UserPreferences
}
```

### 错误 2: 聚合间存储对象引用

```typescript
// ❌ 错误：存储整个对象
class Order {
  user: User  // 不应该存储整个 User
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
