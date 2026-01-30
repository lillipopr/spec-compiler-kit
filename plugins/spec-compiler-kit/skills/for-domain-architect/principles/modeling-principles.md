---
description: 领域建模原则
---

# 领域建模原则

## 概述

领域建模是将业务需求转化为可执行模型的过程。本文档总结领域建模的核心原则。

## 核心原则

### 1. 以业务为中心（Business-Centric）

**原则**：模型应该反映业务现实，而不是技术实现。

```typescript
// ✅ 正确：反映业务概念
class Membership {
  activate(): void {
    this.status = MembershipStatus.ACTIVE
  }
}

// ❌ 错误：反映技术实现
class Membership {
  updateStatus(status: string): void {  // 太技术化
    this.status = status
  }
}
```

### 2. 通用语言（Ubiquitous Language）

**原则**：团队（业务+技术）使用统一的语言。

| 场景 | ✅ 正确 | ❌ 错误 |
|------|---------|---------|
| 代码 | `membership.activate()` | `membership.updateStatus("ACTIVE")` |
| 文档 | "会员激活" | "更新状态为生效中" |
| 讨论 | "激活会员" | "把状态改成 active" |

### 3. 显式业务规则（Explicit Business Rules）

**原则**：业务规则应该显式编码，不隐藏。

```typescript
// ✅ 正确：显式业务规则
class Membership {
  grantCoupon(): void {
    if (!this.isActive()) {
      throw new Error("只有生效中的会员才能发放点券")
    }
    // ...
  }
}

// ❌ 错误：规则隐藏
class Membership {
  grantCoupon(): void {
    if (this.status === 1) {  // 魔法数字
      // ...
    }
  }
}
```

### 4. 富领域模型（Rich Domain Model）

**原则**：将行为放在领域对象中，而不是贫瘠的数据结构。

```typescript
// ✅ 正确：富领域模型
class Order {
  addItem(item: OrderItem): void {
    this.validateItem(item)
    this.items.push(item)
    this.recalculateTotal()
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

// ❌ 错误：贫血模型
class Order {
  items: OrderItem[]
  total: Money
}

class OrderService {
  addItem(order: Order, item: OrderItem): void {
    // 业务逻辑在服务中
    order.items.push(item)
    order.total = this.calculateTotal(order.items)
  }
}
```

## 建模原则

### 1. 命令查询分离（CQRS）

**原则**：分离命令（修改）和查询（读取）的模型。

```typescript
// 命令模型：用于修改
class Order {
  addItem(item: OrderItem): void {
    this.items.push(item)
    this.recalculateTotal()
  }
}

// 查询模型：用于查询
interface OrderQueryModel {
  orderId: string
  userId: string
  itemCount: number
  totalAmount: number
  status: string
}
```

### 2. 行为归属判断

**原则**：根据行为的性质决定归属。

| 行为特征 | 归属 | 示例 |
|----------|------|------|
| 单聚合状态变更 | 实体方法 | `order.addItem()` |
| 多聚合协作 | 领域服务 | `transferService.transfer()` |
| 流程编排 | 应用服务 | `orderAppService.placeOrder()` |

### 3. 值对象优先（Prefer Value Objects）

**原则**：优先使用值对象，避免原语偏执。

```typescript
// ✅ 正确：使用值对象
class Order {
  total: Money  // 值对象
  shippingAddress: Address  // 值对象
}

// ❌ 错误：原语偏执
class Order {
  totalAmount: number  // 原始类型
  totalCurrency: string
  shippingStreet: string
  shippingCity: string
  shippingState: string
}
```

### 4. 不变量封装（Encapsulate Invariants）

**原则**：不变量应该在对象内部强制执行。

```typescript
// ✅ 正确：不变量在对象内
class Order {
  private items: OrderItem[] = []

  addItem(item: OrderItem): void {
    if (this.items.length >= 10) {
      throw new Error("Cannot add more than 10 items")
    }
    this.items.push(item)
  }
}

// ❌ 错误：不变量在对象外
class Order {
  items: OrderItem[] = []
}

class OrderService {
  addItem(order: Order, item: OrderItem): void {
    if (order.items.length >= 10) {  // 不变量在服务中
      throw new Error("Cannot add more than 10 items")
    }
    order.items.push(item)
  }
}
```

## 建模决策

### 实体 vs 值对象

| 判断标准 | 实体 | 值对象 |
|----------|------|--------|
| 有唯一标识？ | ✅ | ❌ |
| 有生命周期？ | ✅ | ❌ |
| 可变？ | ✅ | ❌ |
| 按 ID 相等？ | ✅ | ❌ |
| 按属性相等？ | ❌ | ✅ |

### 聚合根 vs 实体

| 判断标准 | 聚合根 | 实体 |
|----------|--------|------|
| 全局唯一标识？ | ✅ | ❌ |
| 独立生命周期？ | ✅ | ❌ |
| 外部直接访问？ | ✅ | ❌ |
| 有专门仓储？ | ✅ | ❌ |
| 示例 | Order | OrderItem |

### 领域服务 vs 应用服务

| 判断标准 | 领域服务 | 应用服务 |
|----------|----------|----------|
| 包含业务逻辑？ | ✅ | ❌ |
| 跨聚合协作？ | ✅ | ❌ |
| 编排流程？ | ❌ | ✅ |
| 处理基础设施？ | ❌ | ✅ |
| 示例 | TransferService | PlaceOrderAppService |

## 建模反模式

### 反模式 1: 贫血模型

**问题**：领域对象只有数据，没有行为。

```typescript
// ❌ 贫血模型
class Order {
  id: string
  items: OrderItem[]
  total: number
}

// ✅ 富模型
class Order {
  addItem(item: OrderItem): void {
    this.items.push(item)
    this.recalculateTotal()
  }
}
```

### 反模式 2: 原语偏执

**问题**：过度使用基础类型。

```typescript
// ❌ 原语偏执
class Order {
  totalAmount: number
  totalCurrency: string
}

// ✅ 值对象
class Order {
  total: Money
}
```

### 反模式 3: 上帝对象

**问题**：一个对象承担太多职责。

```typescript
// ❌ 上帝对象
class User {
  orders: Order[]
  memberships: Membership[]
  coupons: Coupon[]
  // ... 太多职责
}

// ✅ 职责分离
class User {
  id: UserId
  profile: UserProfile
}
```

### 反模式 4: 数据袋（Data Bag）

**问题**：对象只是数据的容器，没有行为和不变量。

```typescript
// ❌ 数据袋
class Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: string
  // 没有任何行为
}

// ✅ 领域对象
class Order {
  addItem(item: OrderItem): void {
    this.validate(item)
    this.items.push(item)
    this.recalculateTotal()
  }
}
```

## 建模流程

### Step 1: 识别领域概念

```
从需求中提取名词和动词：
- 名词 → 候选实体/值对象
- 动词 → 候选行为
```

### Step 2: 区分实体和值对象

```
对每个候选对象，问：
1. 需要唯一标识吗？ → 实体
2. 属性相等即相等？ → 值对象
```

### Step 3: 确定聚合边界

```
确定哪些对象需要在同一个聚合中：
- 需要一起修改 → 同一聚合
- 需要强一致 → 同一聚合
- 其他 → 不同聚合
```

### Step 4: 分配行为

```
决定行为归属：
- 单聚合状态变更 → 实体方法
- 多聚合协作 → 领域服务
- 流程编排 → 应用服务
```

### Step 5: 验证不变量

```
确保不变量被正确强制：
- 不变量在对象内
- 不变量在构造时验证
- 不变量在操作时验证
```

## 模型验证

### 验证清单

```markdown
## 模型验证清单

### 通用语言
- [ ] 术语统一
- [ ] 代码和文档一致
- [ ] 团队使用相同语言

### 模型设计
- [ ] 实体和值对象正确区分
- [ ] 聚合边界合理
- [ ] 行为归属正确
- [ ] 不变量已封装

### 富模型
- [ ] 避免贫血模型
- [ ] 避免原语偏执
- [ ] 避免上帝对象
- [ ] 避免数据袋
```

## 参考资料

- Domain-Driven Design (Eric Evans)
- Implementing Domain-Driven Design (Vaughn Vernon)
- Anemic Domain Model (Martin Fowler)
