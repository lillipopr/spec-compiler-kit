---
description: DDD 战术设计模式
---

# DDD 战术设计模式

## 概述

DDD 战术设计模式用于构建具体的领域模型。本文档介绍 DDD 的战术设计模式。

## 核心模式

### 1. 聚合（Aggregate）

#### 定义

聚合是一组相关对象的集合，作为数据修改的单元。

#### 结构

```
┌─────────────────────────────────────┐
│         Aggregate                   │
│  ┌───────────────────────────────┐  │
│  │   Aggregate Root              │  │
│  │   (聚合根 - 唯一入口)          │  │
│  └───────────────────────────────┘  │
│           │           │              │
│  ┌────────▼───┐  ┌───▼──────────┐  │
│  │  Entity    │  │  Value Object│  │
│  └────────────┘  └──────────────┘  │
│                                     │
│  一致性边界                         │
│  事务边界                           │
└─────────────────────────────────────┘
```

#### 示例

```typescript
class Order extends AggregateRoot {
  private items: OrderItem[] = []

  addItem(item: OrderItem): void {
    if (this.items.length >= 10) {
      throw new Error("Cannot add more than 10 items")
    }
    this.items.push(item)
    this.recalculateTotal()
  }

  private recalculateTotal(): void {
    this.total = this.items.reduce(
      (sum, item) => sum.add(item.price),
      Money.ZERO
    )
  }
}
```

### 2. 实体（Entity）

#### 定义

实体是有唯一标识、有生命周期、可变的对象。

#### 特征

| 特征 | 说明 |
|------|------|
| 唯一标识 | 有 ID 来区分身份 |
| 生命周期 | 有创建、变化、终结的过程 |
| 可变性 | 属性会变化 |
| 相等性 | 按 ID 判断相等 |

#### 示例

```typescript
class Membership {
  readonly id: MembershipId
  userId: UserId
  status: MembershipStatus
  createdAt: Date

  activate(): void {
    this.status = MembershipStatus.ACTIVE
    this.addEvent(new MembershipActivated(this.id))
  }

  equals(other: Membership): boolean {
    return this.id.equals(other.id)
  }
}
```

### 3. 值对象（Value Object）

#### 定义

值对象是没有唯一标识、不可变、可替换的对象。

#### 特征

| 特征 | 说明 |
|------|------|
| 无标识 | 不需要 ID |
| 不可变 | 创建后不能修改 |
| 可替换 | 属性相同即为相等 |
| 相等性 | 按属性值判断 |

#### 示例

```typescript
class Money {
  constructor(
    readonly amount: bigint,
    readonly currency: string
  ) {
    this.validate()
  }

  private validate(): void {
    if (this.amount < 0n) {
      throw new Error("Amount cannot be negative")
    }
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error("Cannot add different currencies")
    }
    return new Money(this.amount + other.amount, this.currency)
  }

  equals(other: Money): boolean {
    return this.amount === other.amount &&
           this.currency === other.currency
  }
}
```

### 4. 领域事件（Domain Event）

#### 定义

领域事件表示领域中已经发生的重要事情。

#### 结构

```typescript
interface DomainEvent {
  eventId: string
  eventType: string
  occurredAt: Date
  aggregateId: string
  data: Record<string, any>
}
```

#### 示例

```typescript
class MembershipActivated implements DomainEvent {
  readonly eventId: string
  readonly eventType = "MembershipActivated"
  readonly occurredAt: Date

  constructor(
    readonly membershipId: string,
    readonly userId: string,
    readonly level: string
  ) {
    this.eventId = uuid()
    this.occurredAt = new Date()
  }
}

// 发布事件
class Membership extends AggregateRoot {
  activate(): void {
    this.status = MembershipStatus.ACTIVE
    this.addEvent(new MembershipActivated(
      this.id.value,
      this.userId.value,
      this.level.code
    ))
  }
}
```

### 5. 领域服务（Domain Service）

#### 定义

领域服务处理涉及多个聚合的协作或属于领域但不属于任何实体的操作。

#### 使用场景

| 场景 | 说明 | 示例 |
|------|------|------|
| 跨聚合操作 | 涉及多个聚合的协作 | 转账（两个账户） |
| 无归属行为 | 不属于任何实体 | 计算会员等级 |
| 领域规则计算 | 复杂的业务规则 | 根据历史计算折扣 |

#### 示例

```typescript
class TransferService {
  constructor(
    private accountRepo: AccountRepository,
    private transactionLog: TransactionLog
  ) {}

  transfer(
    fromAccountId: AccountId,
    toAccountId: AccountId,
    amount: Money
  ): void {
    const from = this.accountRepo.findById(fromAccountId)
    const to = this.accountRepo.findById(toAccountId)

    if (!from.canWithdraw(amount)) {
      throw new Error("Insufficient balance")
    }

    from.withdraw(amount)
    to.deposit(amount)

    this.transactionLog.record(new TransferLog(
      fromAccountId,
      toAccountId,
      amount
    ))

    this.accountRepo.save(from)
    this.accountRepo.save(to)
  }
}
```

### 6. 仓储（Repository）

#### 定义

仓储提供类似集合的接口来访问聚合根，隐藏持久化细节。

#### 接口

```typescript
interface Repository<T> {
  save(aggregate: T): Promise<void>
  findById(id: AggregateId): Promise<T | null>
  findByCriteria(criteria: QueryCriteria): Promise<T[]>
  exists(criteria: QueryCriteria): Promise<boolean>
}
```

#### 示例

```typescript
interface MembershipRepository extends Repository<Membership> {
  save(membership: Membership): Promise<void>
  findById(id: MembershipId): Promise<Membership | null>
  findByUserId(userId: UserId): Promise<Membership | null>
  findActiveByUserId(userId: UserId): Promise<Membership | null>
  existsActiveMembership(userId: UserId): Promise<boolean>
}

// 实现
class PostgresMembershipRepository implements MembershipRepository {
  async save(membership: Membership): Promise<void> {
    await this.db.insert(schema.memberships).values({
      id: membership.id.value,
      userId: membership.userId.value,
      status: membership.status,
      level: membership.level.code,
      // ...
    })
  }

  async findByUserId(userId: UserId): Promise<Membership | null> {
    const row = await this.db.query(schema.memberships).where(
      eq(schema.memberships.userId, userId.value)
    ).first()

    return row ? this.toDomain(row) : null
  }
}
```

### 7. 工厂（Factory）

#### 定义

工厂用于创建复杂对象，封装创建逻辑。

#### 示例

```typescript
class MembershipFactory {
  static create(
    userId: UserId,
    level: MembershipLevel,
    period: SubscriptionPeriod
  ): Membership {
    const membership = new Membership(
      MembershipId.create(),
      userId,
      MembershipStatus.PENDING,
      level,
      period
    )

    membership.validate()

    return membership
  }
}

// 使用
const membership = MembershipFactory.create(
  userId,
  MembershipLevel.PREMIUM,
  new SubscriptionPeriod(PeriodType.MONTHLY, 1)
)
```

## 组合模式

### 模式 1: 聚合 + 实体 + 值对象

```
Order (聚合根/实体)
├── OrderItem[] (实体)
│   └── Money (值对象)
└── Address (值对象)
```

### 模式 2: 聚合 + 领域事件

```typescript
class Order extends AggregateRoot {
  confirm(): void {
    this.status = OrderStatus.CONFIRMED
    this.addEvent(new OrderConfirmed(this.id))
  }
}
```

### 模式 3: 领域服务 + 仓储

```typescript
class TransferService {
  constructor(
    private accountRepo: AccountRepository,
    private transactionLog: TransactionLog
  ) {}

  transfer(from: AccountId, to: AccountId, amount: Money): void {
    const fromAccount = this.accountRepo.findById(from)
    const toAccount = this.accountRepo.findById(to)

    fromAccount.withdraw(amount)
    toAccount.deposit(amount)

    this.accountRepo.save(fromAccount)
    this.accountRepo.save(toAccount)
  }
}
```

## 应用场景

### 场景 1: 订单管理

```
Order (聚合根)
├── OrderItem[] (实体)
├── Money (值对象)
├── Address (值对象)
└── 领域事件: OrderCreated, OrderConfirmed, OrderShipped
```

### 场景 2: 会员订阅

```
Membership (聚合根)
├── SubscriptionPeriod (值对象)
├── MembershipLevel (值对象)
└── 领域事件: MembershipActivated, MembershipExpired
```

### 场景 3: 点券系统

```
CouponAccount (聚合根)
├── CouponGrant[] (实体)
├── Money (值对象)
└── 领域事件: CouponGranted, CouponConsumed
```

## 设计指南

### 何时使用聚合

```
需要强一致性的对象组 → 聚合
├── 需要在同一事务中修改
├── 需要维护不变量
└── 需要防止并发冲突
```

### 何时使用实体

```
需要追踪身份的对象 → 实体
├── 有唯一标识
├── 有生命周期
└── 需要追踪变化
```

### 何时使用值对象

```
描述特征的对象 → 值对象
├── 没有标识
├── 不可变
└── 属性相同即为相等
```

### 何时使用领域事件

```
需要通知其他部分 → 领域事件
├── 跨聚合协作
├── 异步处理
├── 审计追踪
└── 需要解耦
```

### 何时使用领域服务

```
不属于特定实体的操作 → 领域服务
├── 跨聚合协作
├── 复杂领域规则计算
└── 无明确归属的行为
```

## 检查清单

战术设计完成前，确认：

- [ ] 聚合边界清晰
- [ ] 实体和值对象正确区分
- [ ] 领域事件完整
- [ ] 领域服务识别正确
- [ ] 仓储接口定义
- [ ] 不变量已封装
- [ ] 工厂方法实现（如果需要）
- [ ] 编写了单元测试

## 参考资料

- Domain-Driven Design (Eric Evans) - Part IV
- Implementing Domain-Driven Design (Vaughn Vernon) - Chapters 8-12
- Patterns of Enterprise Application Architecture (Martin Fowler)
