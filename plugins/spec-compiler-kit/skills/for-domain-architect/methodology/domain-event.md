---
description: 领域事件设计方法论
---

# 领域事件设计方法论

## 概述

领域事件（Domain Event）是 DDD 中表示领域内发生的重要事情。它是一种建模手段，用于捕获领域内有意义的业务事实，支持跨上下文的异步协作。

## 核心概念

```
领域事件 = 已经发生的业务事实

┌─────────────────────────────────────────┐
│           Domain Event                 │
│  ┌───────────────────────────────────┐  │
│  │  事件名称：MembershipActivated    │  │
│  │  发生时间：2024-01-15 10:30:00   │  │
│  │  事件数据：                        │  │
│  │    - membershipId: "m-001"        │  │
│  │    - userId: "u-001"              │  │
│  │    - level: "PREMIUM"             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  特征：                                 │
│  1. 已经发生（过去式）                  │
│  2. 不可变                             │
│  3. 携带业务数据                        │
└─────────────────────────────────────────┘
```

## 领域事件的特征

| 特征 | 说明 | 示例 |
|------|------|------|
| **已经发生** | 表示过去的事实 | MembershipActivated（会员已激活） |
| **不可变** | 一旦发生不能改变 | 事件不能被修改 |
| **业务相关** | 表达业务含义 | OrderPaid（订单已支付） |
| **携带数据** | 包含必要业务数据 | 包含 orderId, userId, amount |
| **有唯一标识** | 每个事件有唯一 ID | eventId |

## 领域事件 vs 命令

| 维度 | 命令（Command） | 事件（Event） |
|------|-----------------|---------------|
| 时态 | 将来时（要做） | 过去时（已做） |
| 命名 | ActivateMembership | MembershipActivated |
| 来源 | 用户/系统发起 | 聚合发布 |
| 数量 | 可能多个 | 唯一确定 |
| 处理 | 可以失败 | 必须成功 |
| 示例 | "激活会员" | "会员已激活" |

```typescript
// 命令：请求做某事
interface ActivateMembershipCommand {
  membershipId: string
}

// 事件：已经发生的事实
interface MembershipActivatedEvent {
  eventId: string
  membershipId: string
  userId: string
  activatedAt: Date
}
```

## 识别领域事件

### 事件识别时机

| 时机 | 说明 | 示例 |
|------|------|------|
| **状态变化** | 聚合状态发生重要变化 | 会员激活、过期 |
| **跨边界协作** | 需要通知其他上下文 | 会员激活通知点券上下文 |
| **异步处理** | 触发后台任务 | 支付成功触发发货 |
| **审计追踪** | 记录关键操作 | 敏感操作审计 |

### 事件识别问题清单

对每个业务场景，问以下问题：

```
1. 这个事情重要到需要通知其他部分吗？
   是 → 领域事件候选

2. 这个事情是一个已经发生的事实吗？
   是 → 领域事件候选

3. 其他上下文需要对这个事情做出反应吗？
   是 → 领域事件候选

4. 需要审计追踪这个事情吗？
   是 → 领域事件候选
```

### 常见领域事件类别

| 类别 | 说明 | 示例 |
|------|------|------|
| **生命周期事件** | 实体生命周期变化 | MembershipCreated, MembershipExpired |
| **状态转移事件** | 状态变化 | OrderConfirmed, OrderShipped |
| **业务操作事件** | 重要业务操作 | PaymentCompleted, CouponGranted |
| **异常事件** | 异常情况 | PaymentFailed, SubscriptionExpired |

## 领域事件设计

### 命名规范

```
格式：{聚合名}{过去式动词}

✅ 正确的命名：
- MembershipCreated（会员已创建）
- MembershipActivated（会员已激活）
- OrderPaid（订单已支付）
- CouponGranted（点券已发放）

❌ 错误的命名：
- CreateMembership（这是命令）
- MembershipActivation（不够明确）
- ActivateMembership（这是命令）
```

### 事件数据设计

#### 基本结构

```typescript
interface DomainEvent {
  // 必须字段
  eventId: string          // 事件唯一标识
  eventType: string        // 事件类型
  occurredAt: Date         // 发生时间
  aggregateId: string      // 聚合根 ID
  aggregateVersion: number // 聚合版本号（可选）

  // 业务数据
  data: Record<string, any>
}
```

#### 携带数据原则

| 原则 | 说明 | 示例 |
|------|------|------|
| **最小化** | 只携带必要数据 | 携带 ID 而不是整个对象 |
| **业务相关** | 只携带业务数据 | 不携带技术细节 |
| **不可变** | 数据不能被修改 | 使用 readonly |
| **可序列化** | 可以序列化和反序列化 | 避免循环引用 |

#### 事件数据示例

```typescript
// ✅ 正确：携带最小必要数据
interface MembershipActivatedEvent {
  eventId: string
  eventType: "MembershipActivated"
  occurredAt: Date

  // 业务数据
  membershipId: string
  userId: string
  level: "BASIC" | "PREMIUM" | "VIP"
  activatedAt: Date
}

// ❌ 错误：携带整个对象
interface MembershipActivatedEvent {
  eventId: string
  eventType: "MembershipActivated"
  occurredAt: Date

  // 不应该携带整个聚合
  membership: Membership  // 太大，可能循环引用
}
```

### 事件设计模板

```markdown
## 领域事件：{事件名称}

### 描述
{事件的业务含义}

### 业务场景
{什么业务场景会触发这个事件}

### 触发条件
{触发这个事件的条件}

### 发布者
{哪个上下文/聚合发布}

### 订阅者
{哪些上下文/聚合订阅}

### 事件数据
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| eventId | string | Y | 事件唯一标识 |
| {字段 1} | {类型} | Y/N | {说明} |

### 业务规则
- {规则 1}
- {规则 2}

### 处理策略
| 订阅者 | 处理逻辑 | 优先级 |
|--------|----------|--------|
| {订阅者 1} | {处理逻辑} | {高/中/低} |
```

## 领域事件处理

### 事件发布

```typescript
// 聚合根发布事件
class Membership extends AggregateRoot {
  activate(): void {
    // 改变状态
    this.status = MembershipStatus.ACTIVE

    // 发布事件
    this.addEvent(new MembershipActivated(
      this.id,
      this.userId,
      this.level,
      new Date()
    ))
  }
}

// 基类
abstract class AggregateRoot {
  private events: DomainEvent[] = []

  protected addEvent(event: DomainEvent): void {
    this.events.push(event)
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.events]
  }

  markEventsAsCommitted(): void {
    this.events = []
  }
}
```

### 事件存储

```typescript
// 事件仓储
interface EventStore {
  append(aggregateId: string, events: DomainEvent[]): Promise<void>
  getEvents(aggregateId: string): Promise<DomainEvent[]>
  getEventsFromVersion(aggregateId: string, version: number): Promise<DomainEvent[]>
}

// 事件存储实现
class PostgresEventStore implements EventStore {
  async append(aggregateId: string, events: DomainEvent[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const event of events) {
        await tx.insert(schema.events).values({
          id: event.eventId,
          aggregate_id: aggregateId,
          event_type: event.eventType,
          event_data: JSON.stringify(event),
          occurred_at: event.occurredAt
        })
      }
    })
  }
}
```

### 事件订阅

```typescript
// 事件处理器
interface EventHandler {
  handle(event: DomainEvent): Promise<void>
}

// 事件总线
interface EventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe(eventType: string, handler: EventHandler): void
}

// 具体处理器
class CouponEventHandler implements EventHandler {
  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType === "MembershipActivated") {
      const data = event.data as MembershipActivatedEvent
      await this.startDailyGrant(data.membershipId)
    }
  }

  private async startDailyGrant(membershipId: string): Promise<void> {
    // 开始每日点券发放
  }
}
```

## 事件风暴

### 什么是事件风暴

事件风暴（Event Storming）是一种可视化协作技术，用于探索复杂业务领域。

### 事件风暴流程

#### Step 1: 识别领域事件

```
橙色便签：领域事件
- MembershipCreated
- MembershipActivated
- MembershipExpired
- CouponGranted
```

#### Step 2: 识别命令

```
蓝色便签：命令
- CreateMembership
- ActivateMembership
- ExpireMembership
- GrantCoupon
```

#### Step 3: 识别聚合

```
黄色便签：聚合
- Membership
- Coupon
- User
```

#### Step 4: 识别上下文

```
粉色便签：限界上下文
- 会员上下文
- 点券上下文
- 用户上下文
```

### 事件风暴示例

```
┌────────────────────────────────────────────────────────┐
│                    会员上下文                          │
│                                                        │
│  [命令: CreateMembership]                              │
│         │                                              │
│         ▼                                              │
│  [聚合: Membership]                                    │
│         │                                              │
│         ▼                                              │
│  [事件: MembershipCreated] ─────────────┐             │
│                                         │             │
│                                        [策略]         │
│                                         │             │
│                                         ▼             │
│  [命令: ActivateMembership]      [事件: NotifyUser]  │
│         │                              [事件: StartCouponGrant] │
│         ▼                                              │
│  [聚合: Membership]                                    │
│         │                                              │
│         ▼                                              │
│  [事件: MembershipActivated] ────────────┐            │
│                                         │            │
│                                        [策略]        │
│                                         │            │
│                                         ▼            │
│                            [事件: GrantDailyCoupon]  │
└────────────────────────────────────────────────────────┘
```

## 事件版本管理

### 版本变化场景

```typescript
// v1 版本
interface MembershipActivatedEvent {
  eventId: string
  membershipId: string
  userId: string
  activatedAt: Date
}

// v2 版本：增加 level 字段
interface MembershipActivatedEventV2 {
  eventId: string
  membershipId: string
  userId: string
  level: string
  activatedAt: Date
}
```

### 版本兼容策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **向后兼容** | 新增可选字段 | 字段可选 |
| **版本共存** | 多版本并存 | 渐进迁移 |
| **转换器** | 版本间转换 | 需要转换逻辑 |

```typescript
// 版本转换器
class EventVersionConverter {
  toV2(event: MembershipActivatedEvent): MembershipActivatedEventV2 {
    return {
      ...event,
      level: "BASIC" // v1 默认值
    }
  }
}
```

## 事件处理模式

### 1. 异步事件处理

```typescript
class AsyncEventProcessor {
  async process(event: DomainEvent): Promise<void> {
    // 异步处理，不阻塞主流程
    await this.queue.enqueue(event)
  }
}

// 后台处理
class EventWorker {
  async start(): Promise<void> {
    while (true) {
      const event = await this.queue.dequeue()
      await this.handler.handle(event)
    }
  }
}
```

### 2. 事件 SAGA

```typescript
// 编排多个事件
class OrderSaga {
  async execute(orderId: string): Promise<void> {
    try {
      // 步骤 1：创建订单
      await this.orderService.create(orderId)

      // 步骤 2：支付
      await this.paymentService.pay(orderId)

      // 步骤 3：发货
      await this.shippingService.ship(orderId)
    } catch (error) {
      // 补偿操作
      await this.compensate(orderId)
    }
  }

  private async compensate(orderId: string): Promise<void> {
    // 执行补偿
    await this.shippingService.cancel(orderId)
    await this.paymentService.refund(orderId)
    await this.orderService.cancel(orderId)
  }
}
```

### 3. 快照

```typescript
// 定期创建聚合快照
class SnapshotService {
  async createSnapshot(aggregateId: string): Promise<void> {
    const events = await this.eventStore.getEvents(aggregateId)
    const current = this.rebuildAggregate(events)

    await this.snapshotStore.save({
      aggregateId,
      version: current.version,
      data: JSON.stringify(current)
    })
  }

  async load(aggregateId: string): Promise<AggregateRoot | null> {
    const snapshot = await this.snapshotStore.findLatest(aggregateId)
    if (!snapshot) return null

    const events = await this.eventStore.getEventsFromVersion(
      aggregateId,
      snapshot.version
    )

    return this.rebuildFromSnapshot(snapshot, events)
  }
}
```

## 检查清单

领域事件设计完成前，确认：

- [ ] 事件命名符合规范（过去式）
- [ ] 事件携带数据最小化
- [ ] 事件数据可序列化
- [ ] 事件发布时机明确
- [ ] 事件订阅者清晰
- [ ] 事件处理幂等性
- [ ] 考虑了事件版本管理
- [ ] 定义了事件处理策略

## 常见错误

### 错误 1: 事件命名使用命令形式

```typescript
// ❌ 错误：使用命令形式
interface ActivateMembership {
  membershipId: string
}

// ✅ 正确：使用过去式
interface MembershipActivated {
  membershipId: string
  activatedAt: Date
}
```

### 错误 2: 事件携带过多数据

```typescript
// ❌ 错误：携带整个聚合
interface MembershipActivated {
  membership: Membership  // 太大
}

// ✅ 正确：只携带必要数据
interface MembershipActivated {
  membershipId: string
  userId: string
  level: string
  activatedAt: Date
}
```

### 错误 3: 事件处理非幂等

```typescript
// ❌ 错误：非幂等处理
class EventHandler {
  handle(event: MembershipActivated): void {
    // 重复处理会导致问题
    this.couponService.grantCoupon(event.userId, 100)
  }
}

// ✅ 正确：幂等处理
class EventHandler {
  handle(event: MembershipActivated): void {
    // 检查是否已处理
    if (this.isProcessed(event.eventId)) {
      return
    }

    this.couponService.grantCoupon(event.userId, 100)
    this.markAsProcessed(event.eventId)
  }
}
```

## 参考资料

- Domain-Driven Design (Eric Evans) - Chapter 5
- Implementing Domain-Driven Design (Vaughn Vernon) - Chapter 13
- Domain-Driven Design Reference (Eric Evans) - Section 5.6
