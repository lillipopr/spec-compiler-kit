---
description: DDD 核心原则
---

# DDD 核心原则

## 概述

领域驱动设计（Domain-Driven Design, DDD）是一套面向复杂软件系统的设计方法论和原则。本文档总结 DDD 的核心原则。

## 战略设计原则

### 1. 关注核心域（Focus on Core Domain）

**原则**：80% 的精力应该投入核心域，支撑域做到够用，通用域直接采购。

| 领域类型 | 特征 | 投入策略 | 示例 |
|----------|------|----------|------|
| **核心域** | 竞争力所在，差异化 | 80% 精力 | 定价算法、推荐引擎 |
| **支撑域** | 必要但非差异化 | 够用就好 | 会员系统、通知系统 |
| **通用域** | 可直接采购/外包 | 直接购买 | 支付网关、短信服务 |
| **泛化域** | 无特殊规则 | 最小投入 | 日志、监控 |

### 2. 限界上下文清晰（Bounded Context Clarity）

**原则**：一个限界上下文内部语言一致，边界明确，可独立部署。

```markdown
## 上下文边界清晰性检查

- [ ] 上下文内部术语统一（Ubiquitous Language）
- [ ] 上下文边界不重叠
- [ ] 上下文可独立部署
- [ ] 上下文可独立演进
```

### 3. 上下文映射明确（Context Mapping）

**原则**：明确上下文间的集成关系和协作模式。

| 模式 | 适用场景 |
|------|----------|
| O/C | 上游不关心下游 |
| D + ACL | 下游隔离上游变化 |
| PL | 双方共享发布语言 |
| CF | 多上下文共享内核 |

### 4. 持续集成（Continuous Integration）

**原则**：同一个上下文内的代码应该持续集成，保持一致。

```markdown
## 持续集成实践

- 频繁合并代码（至少每天一次）
- 自动化测试覆盖
- 统一编码标准
- 定期代码审查
```

## 战术设计原则

### 1. 聚合设计保守（Aggregate Design Conservatism）

**原则**：聚合尽量小，一个事务只修改一个聚合，聚合间引用只用 ID。

```typescript
// ✅ 正确：小聚合
class Order {
  id: OrderId
  userId: UserId  // 只存储 ID
  items: OrderItem[]
  total: Money
}

// ❌ 错误：大聚合
class Order {
  id: OrderId
  user: User  // 不应该存储整个对象
  items: OrderItem[]
  payments: Payment[]  // 不应该包含在 Order 聚合
}
```

### 2. 持久化无关（Persistence Ignorance）

**原则**：领域模型不感知数据库，仓储隐藏持久化细节。

```typescript
// ✅ 正确：领域模型不感知数据库
class Order {
  addItem(item: OrderItem): void {
    this.items.push(item)
    this.recalculateTotal()
  }
}

// ❌ 错误：领域模型感知数据库
class Order {
  addItem(item: OrderItem, db: Database): void {
    this.items.push(item)
    db.save(this)  // 不应该直接操作数据库
  }
}
```

### 3. 实体 vs 值对象（Entity vs Value Object）

**原则**：根据是否有唯一标识和生命周期来区分实体和值对象。

| 维度 | 实体 | 值对象 |
|------|------|--------|
| 标识 | 有唯一 ID | 无 ID |
| 相等性 | 按 ID | 按属性值 |
| 可变性 | 可变 | 不可变 |
| 生命周期 | 有 | 无 |

### 4. 领域事件驱动（Domain Event Driven）

**原则**：使用领域事件来实现跨聚合的异步协作。

```typescript
// ✅ 正确：使用领域事件
class Membership {
  activate(): void {
    this.status = MembershipStatus.ACTIVE
    this.addEvent(new MembershipActivated(this.id))
  }
}

// ❌ 错误：直接调用其他聚合
class Membership {
  activate(): void {
    this.status = MembershipStatus.ACTIVE
    this.couponService.startGrant(this.id)  // 不应该直接调用
  }
}
```

## 分层架构原则

### 1. 依赖倒置（Dependency Inversion）

**原则**：高层模块不依赖低层模块，都依赖抽象。

```
┌─────────────────────────────────────┐
│         分层架构依赖方向             │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐                       │
│  │  User   │                       │
│  │Interface│                       │
│  └────┬────┘                       │
│       │                            │
│  ┌────▼────┐                       │
│  │  Domain │                       │
│  └────┬────┘                       │
│       │                            │
│  ┌────▼────┐                       │
│  │Infrastructure                    │
│  └─────────┘                       │
│                                     │
└─────────────────────────────────────┘
```

### 2. 职责分离（Separation of Concerns）

**原则**：每一层只负责自己的职责。

| 层 | 职责 | 不负责 |
|------|------|--------|
| User Interface | 用户交互 | 业务逻辑 |
| Application | 流程编排 | 业务规则 |
| Domain | 业务逻辑 | 持久化 |
| Infrastructure | 技术实现 | 业务逻辑 |

### 3. 防腐层（Anticorruption Layer）

**原则**：集成外部系统时，使用防腐层隔离外部变化。

```typescript
// 防腐层：将外部模型转换为领域模型
class PaymentACL {
  toDomain(response: ExternalPaymentResponse): Payment {
    return new Payment(
      new PaymentId(response.payment_id),
      this.mapStatus(response.status_code),
      new Money(response.amount_in_cents, response.currency_code)
    )
  }
}
```

## 建模原则

### 1. 通用语言（Ubiquitous Language）

**原则**：团队（业务+技术）使用统一的语言。

```markdown
## 通用语言实践

- 术语统一：在整个上下文中使用相同的术语
- 文档一致：代码、文档、讨论使用相同术语
- 持续演进：随着理解深入更新语言

示例：
- ✅ "会员激活"（统一术语）
- ❌ "用户激活" / "订阅生效"（不一致）
```

### 2. 业务不变量（Business Invariants）

**原则**：不变量应该在聚合内强制执行。

```typescript
class Order {
  private items: OrderItem[] = []

  addItem(item: OrderItem): void {
    // 不变量：订单不能超过 10 个项目
    if (this.items.length >= 10) {
      throw new Error("Cannot add more than 10 items")
    }

    this.items.push(item)
  }
}
```

### 3. 显式业务规则（Explicit Business Rules）

**原则**：业务规则应该显式编码，不隐藏在基础设施中。

```typescript
// ✅ 正确：显式业务规则
class Membership {
  grantCoupon(): void {
    if (!this.isActive()) {
      throw new Error("Only active memberships can grant coupons")
    }
    // ...
  }
}

// ❌ 错误：业务规则隐藏在数据库触发器
-- 数据库触发器不应该包含业务逻辑
CREATE TRIGGER check_membership_active ...
```

## 设计原则检查清单

### 战略设计检查

- [ ] 核心域已识别
- [ ] 限界上下文边界清晰
- [ ] 上下文映射明确
- [ ] 团队与上下文对齐

### 战术设计检查

- [ ] 聚合边界合理
- [ ] 实体和值对象正确区分
- [ ] 领域事件完整
- [ ] 不变量已识别

### 架构检查

- [ ] 分层清晰
- [ ] 依赖方向正确
- [ ] 防腐层已设计
- [ ] 持久化已隔离

## 参考资料

- Domain-Driven Design (Eric Evans)
- Implementing Domain-Driven Design (Vaughn Vernon)
- Strategic Domain-Driven Design (Vaughn Vernon)
