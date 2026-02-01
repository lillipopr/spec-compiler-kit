---
description: 领域服务相关原则
---

# 领域服务相关原则

## 概述

领域服务（Domain Service）是处理领域逻辑的服务，当逻辑无法自然归属到某个实体或值对象时使用。

---

## 1. 领域服务识别原则

### 1.1 领域服务判断标准

**原则**：满足以下任一条件 → 领域服务候选

| 标准 | 说明 | 示例 |
|------|------|------|
| **涉及多个聚合** | 逻辑需要访问多个聚合 | 计算会员总收益（跨会员和点券聚合） |
| **不属于特定实体** | 逻辑无法自然归属到某个实体 | 货币转换服务 |
| **复杂计算** | 复杂算法或计算 | 价格计算引擎 |

### 1.2 领域服务 vs 聚合根行为

**原则**：优先将行为放在聚合根中，只在必要时使用领域服务。

| 维度 | 聚合根行为 | 领域服务 |
|------|-----------|---------|
| 范围 | 单个聚合内 | 跨聚合或无自然归属 |
| 状态修改 | 修改聚合状态 | 不修改聚合状态（或协调多个聚合） |
| 示例 | `order.addItem()` | `calculateDiscount(order, user)` |

### 1.3 领域服务识别决策树

```
这个逻辑是领域服务吗？
│
├─ 涉及多个聚合吗？
│   ├─ 是 → 领域服务
│   └─ 否 → 继续
│
├─ 属于某个实体吗？
│   ├─ 是 → 实体行为
│   └─ 否 → 继续
│
└─ 是复杂计算吗？
    ├─ 是 → 领域服务
    └─ 否 → 可能是值对象或简单函数
```

---

## 2. 领域服务设计原则

### 2.1 无状态原则

**原则**：领域服务应该无状态，不持有聚合的引用。

```typescript
// ✅ 正确：领域服务无状态
class MembershipDomain {
  transfer(from: Membership, to: Membership, amount: number): void {
    from.deductPoints(amount)
    to.addPoints(amount)
  }
}

// ❌ 错误：领域服务有状态
class MembershipDomain {
  private from: Membership
  private to: Membership

  setFrom(membership: Membership): void {
    this.from = membership  // 持有状态
  }
}
```

### 2.2 协调原则

**原则**：领域服务协调多个聚合，但不直接修改聚合状态。

```typescript
// ✅ 正确：领域服务协调，通过聚合根行为修改状态
class MembershipDomain {
  transfer(from: Membership, to: Membership, amount: number): void {
    from.deductPoints(amount)  // 调用聚合根行为
    to.addPoints(amount)        // 调用聚合根行为
  }
}

// ❌ 错误：领域服务直接修改状态
class MembershipDomain {
  transfer(from: Membership, to: Membership, amount: number): void {
    from.points -= amount  // 直接修改状态
    to.points += amount
  }
}
```

### 2.3 命名原则

**原则**：使用"聚合名 + Domain"格式命名领域服务。

```
✅ 好的服务命名
- MembershipDomain
- CouponDomain
- PaymentDomain

❌ 差的服务命名
- MembershipService（与 Application 层混淆）
- MembershipDomainService（繁琐，不够简洁）
- MembershipService（与领域服务混淆）
- 点券服务（中文，不符合代码规范）
```

---

## 3. 领域服务职责原则

### 3.1 跨聚合协调原则

**原则**：领域服务负责跨聚合的协调工作。

```typescript
class OrderDomain {
  fulfillOrder(order: Order): void {
    // 协调多个聚合
    order.confirm()
    this.inventory.allocate(order.items)
    this.shipping.prepare(order.shippingAddress)
  }
}
```

### 3.2 复杂计算原则

**原则**：复杂计算逻辑放在领域服务中。

```typescript
class PricingDomain {
  calculateDiscount(
    order: Order,
    user: User,
    currentDate: Date
  ): Money {
    let discount = Money.ZERO

    // 会员折扣
    if (user.hasMembership()) {
      discount = discount.add(user.membership.getDiscount())
    }

    // 时令折扣
    if (currentDate.isHoliday()) {
      discount = discount.add(order.total.multiply(0.1))
    }

    return discount
  }
}
```

### 3.3 值对象创建原则

**原则**：复杂的值对象创建逻辑放在领域服务中。

```typescript
class MoneyFactory {
  createFromExternal(
    amountInCents: number,
    currencyCode: string
  ): Money {
    return new Money(
      BigInt(amountInCents),
      this.validateCurrency(currencyCode)
    )
  }
}
```

---

## 4. 领域服务与聚合根协作原则

### 4.1 调用聚合根行为原则

**原则**：领域服务通过调用聚合根的行为来实现逻辑。

```typescript
// ✅ 正确：领域服务调用聚合根行为
class MembershipDomain {
  upgradeMembership(membership: Membership, newLevel: MembershipLevel): void {
    // 业务验证
    if (!this.canUpgrade(membership, newLevel)) {
      throw new Error("Cannot upgrade membership")
    }
    // 调用聚合根行为
    membership.upgrade(newLevel)
  }
}

// ❌ 错误：直接操作聚合根属性
class MembershipDomain {
  upgradeMembership(membership: Membership, newLevel: MembershipLevel): void {
    membership.level = newLevel  // 直接修改属性
  }
}
```

### 4.2 事务边界原则

**原则**：领域服务不管理事务，事务管理在应用层。

```typescript
// ✅ 正确：领域服务只负责业务逻辑
class MembershipDomain {
  upgradeMembership(membership: Membership, newLevel: MembershipLevel): void {
    membership.upgrade(newLevel)
  }
}

// ❌ 错误：领域服务管理事务
class MembershipDomain {
  @Transactional
  upgradeMembership(membership: Membership, newLevel: MembershipLevel): void {
    membership.upgrade(newLevel)
    this.repo.save(membership)  // 不应该在领域服务中
  }
}
```

---

## 5. 领域服务类型

### 5.1 计算服务

**职责**：执行复杂计算。

```typescript
class PricingDomain {
  calculatePrice(order: Order): Money {
    return order.items.reduce(
      (sum, item) => sum.add(item.price),
      Money.ZERO
    )
  }
}
```

### 5.2 转换服务

**职责**：将一种模型转换为另一种模型。

```typescript
class PaymentACL {
  toDomain(response: ExternalPaymentResponse): Payment {
    return new Payment(
      new PaymentId(response.payment_id),
      this.mapStatus(response.status_code)
    )
  }
}
```

### 5.3 协调服务

**职责**：协调多个聚合的操作。

```typescript
class OrderDomain {
  fulfillOrder(order: Order): void {
    order.confirm()
    this.inventory.allocate(order.items)
    this.shipping.prepare(order.shippingAddress)
  }
}
```

---

## 检查清单

领域服务设计完成前，确认：

- [ ] 领域服务已识别
- [ ] 服务命名符合规范
- [ ] 服务职责清晰
- [ ] 服务无状态
- [ ] 服务不直接修改聚合状态（或通过聚合根行为）
- [ ] 服务不管理事务
- [ ] 复杂计算已放在领域服务中
- [ ] 跨聚合协调已放在领域服务中
