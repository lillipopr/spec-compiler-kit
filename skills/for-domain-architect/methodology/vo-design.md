---
description: 值对象设计方法论
---

# 值对象设计方法论

## 概述

值对象（Value Object）是 DDD 中用于描述事物特征的对象，它没有唯一标识，通过属性值来判断相等性。正确使用值对象可以简化模型，提高代码质量。

## 核心特征

| 特征 | 说明 | 示例 |
|------|------|------|
| **无标识** | 不需要 ID 来区分身份 | 两个相同的金额是相等的 |
| **不可变** | 创建后不能修改 | 地址变化是替换而不是修改 |
| **可替换** | 相同的值可以互相替换 | 100 元和 100 元是一样的 |
| **自验证** | 自身保证有效性 | Email 值对象验证格式 |

## 值对象 vs 实体

| 维度 | 实体 | 值对象 |
|------|------|--------|
| 标识 | 有唯一 ID | 无 ID |
| 相等性 | 按 ID 判断 | 按属性值判断 |
| 可变性 | 可变 | 不可变 |
| 生命周期 | 有创建、变化、终结 | 创建后不变 |
| 示例 | 用户、订单、会员 | 金额、地址、颜色 |

## 识别值对象

### 识别检查清单

对每个候选对象，回答以下问题：

```
1. 它描述事物的特征而不是事物本身吗？
   是 → 值对象候选

2. 两个属性完全相同的对象可以互换吗？
   是 → 值对象候选

3. 它不需要独立的标识吗？
   是 → 值对象候选

4. 它可以被安全地共享吗？
   是 → 值对象候选

5. 修改它的属性时，是创建新对象还是修改原对象？
   创建新对象 → 值对象
```

### 常见值对象类别

| 类别 | 示例 | 特征 |
|------|------|------|
| **度量值** | 金额、重量、长度 | 有单位和数值 |
| **范围值** | 时间段、日期范围 | 有开始和结束 |
| **标识符** | 邮箱、电话号码 | 有格式验证 |
| **描述值** | 地址、颜色 | 多属性组合 |
| **枚举值** | 状态、类型 | 有限集合 |

## 值对象设计原则

### 1. 不可变性（Immutability）

```typescript
// ✅ 正确：值对象不可变
class Money {
  readonly amount: bigint
  readonly currency: string

  constructor(amount: bigint, currency: string) {
    this.amount = amount
    this.currency = currency
    this.validate()
  }

  // 返回新对象，不修改原对象
  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error("Cannot add different currencies")
    }
    return new Money(this.amount + other.amount, this.currency)
  }
}

// ❌ 错误：可变的值对象
class Money {
  amount: bigint
  currency: string

  // 直接修改属性
  add(other: Money): void {
    this.amount += other.amount
  }
}
```

### 2. 值相等性（Value Equality）

```typescript
class Money {
  constructor(
    readonly amount: bigint,
    readonly currency: string
  ) {}

  // 基于属性值判断相等
  equals(other: Money): boolean {
    if (this === other) return true
    return this.amount === other.amount &&
           this.currency === other.currency
  }

  // 重写相等运算符
  [Symbol.equals](other: Money): boolean {
    return this.equals(other)
  }
}

// 使用
const m1 = new Money(100n, "CNY")
const m2 = new Money(100n, "CNY")
console.log(m1.equals(m2)) // true
```

### 3. 自验证（Self-Validation）

```typescript
class Email {
  private readonly value: string

  constructor(value: string) {
    this.validate(value)
    this.value = value
  }

  private validate(value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new Error("Invalid email format")
    }
  }

  get value(): string {
    return this.value
  }
}

// 创建时自动验证
try {
  const email = new Email("invalid-email") // 抛出异常
} catch (e) {
  console.error(e.message)
}
```

### 4. 组合性（Composability）

```typescript
// 值对象可以组合其他值对象
class Address {
  constructor(
    readonly street: Street,
    readonly city: City,
    readonly postalCode: PostalCode
  ) {}
}

class Street {
  constructor(
    readonly name: string,
    readonly number: string
  ) {}
}

class City {
  constructor(
    readonly name: string,
    readonly country: CountryCode
  ) {}
}

// 使用组合
const address = new Address(
  new Street("Main St", "123"),
  new City("New York", new CountryCode("US")),
  new PostalCode("10001")
)
```

## 值对象设计模式

### 1. 度量值对象（Measurement）

```typescript
class Money {
  constructor(
    readonly amount: bigint,  // 使用 bigint 避免浮点误差
    readonly currency: string
  ) {
    this.validate()
  }

  private validate(): void {
    if (this.amount < 0n) {
      throw new Error("Amount cannot be negative")
    }
    if (!this.isValidCurrency(this.currency)) {
      throw new Error("Invalid currency")
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other)
    return new Money(this.amount + other.amount, this.currency)
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other)
    if (this.amount < other.amount) {
      throw new Error("Insufficient funds")
    }
    return new Money(this.amount - other.amount, this.currency)
  }

  multiply(factor: number): Money {
    return new Money(
      BigInt(Math.floor(Number(this.amount) * factor)),
      this.currency
    )
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error("Cannot operate on different currencies")
    }
  }

  private isValidCurrency(currency: string): boolean {
    const validCurrencies = ["USD", "EUR", "CNY", "JPY"]
    return validCurrencies.includes(currency)
  }
}
```

### 2. 范围值对象（Range）

```typescript
class DateRange {
  constructor(
    readonly startDate: Date,
    readonly endDate: Date
  ) {
    this.validate()
  }

  private validate(): void {
    if (this.startDate > this.endDate) {
      throw new Error("Start date must be before end date")
    }
  }

  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate
  }

  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate &&
           this.endDate >= other.startDate
  }

  duration(): number {
    return this.endDate.getTime() - this.startDate.getTime()
  }
}

// 使用
const subscription = new DateRange(
  new Date("2024-01-01"),
  new Date("2024-12-31")
)

console.log(subscription.contains(new Date("2024-06-01"))) // true
```

### 3. 标识符值对象（Identifier）

```typescript
class Email {
  private readonly value: string

  constructor(value: string) {
    this.validate(value)
    this.value = value.toLowerCase() // 规范化
  }

  private validate(value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new Error(`Invalid email: ${value}`)
    }
  }

  get value(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

class PhoneNumber {
  private readonly value: string

  constructor(value: string) {
    const normalized = this.normalize(value)
    this.validate(normalized)
    this.value = normalized
  }

  private normalize(value: string): string {
    // 移除非数字字符
    return value.replace(/\D/g, "")
  }

  private validate(value: string): void {
    if (value.length < 10 || value.length > 15) {
      throw new Error("Invalid phone number length")
    }
  }

  get value(): string {
    return this.value
  }
}
```

### 4. 描述性值对象（Descriptive）

```typescript
class Address {
  constructor(
    readonly street: string,
    readonly city: string,
    readonly state: string,
    readonly postalCode: string,
    readonly country: string
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.street || this.street.trim().length === 0) {
      throw new Error("Street is required")
    }
    if (!this.city || this.city.trim().length === 0) {
      throw new Error("City is required")
    }
    if (!this.postalCode || this.postalCode.trim().length === 0) {
      throw new Error("Postal code is required")
    }
  }

  // 格式化显示
  format(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.postalCode}, ${this.country}`
  }

  equals(other: Address): boolean {
    return this.street === other.street &&
           this.city === other.city &&
           this.state === other.state &&
           this.postalCode === other.postalCode &&
           this.country === other.country
  }
}
```

## 值对象与持久化

### 存储策略

#### 策略 1: 内联到实体表

```sql
-- 订单表
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  -- Money 值对象内联存储
  amount_amount BIGINT NOT NULL,
  amount_currency VARCHAR(3) NOT NULL,
  -- Address 值对象内联存储
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(100) NOT NULL,
  address_postal_code VARCHAR(20) NOT NULL,
  address_country VARCHAR(2) NOT NULL
);
```

#### 策略 2: 共享值表

```sql
-- 值对象表
CREATE TABLE addresses (
  id VARCHAR(36) PRIMARY KEY,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(2) NOT NULL
);

-- 用户表引用地址
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address_id VARCHAR(36) REFERENCES addresses(id)
);
```

#### 策略 3: JSON 存储

```sql
-- 使用 JSON 存储复杂值对象
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  shipping_address JSON NOT NULL
);

-- JSON 示例
-- {
--   "street": "123 Main St",
--   "city": "New York",
--   "state": "NY",
--   "postalCode": "10001",
--   "country": "US"
-- }
```

## 值对象的优势

| 优势 | 说明 | 示例 |
|------|------|------|
| **消除原语偏执** | 用有意义的类型替代基础类型 | Money 替代 bigint |
| **封装验证逻辑** | 验证逻辑集中在一处 | Email 自验证格式 |
| **提高可读性** | 代码意图更清晰 | `new Money(100, "CNY")` |
| **防止错误** | 编译时检查类型错误 | 不能把金额当数量用 |
| **简化测试** | 值对象易于测试 | 验证逻辑独立测试 |

## 常见错误

### 错误 1: 可变的值对象

```typescript
// ❌ 错误：可变的值对象
class Money {
  amount: bigint
  currency: string

  add(other: Money): void {
    this.amount += other.amount // 修改原对象！
  }
}

// ✅ 正确：不可变的值对象
class Money {
  readonly amount: bigint
  readonly currency: string

  add(other: Money): Money {
    return new Money(this.amount + other.amount, this.currency) // 返回新对象
  }
}
```

### 错误 2: 值对象有标识

```typescript
// ❌ 错误：值对象不应该有 ID
class Money {
  id: string // 不应该有 ID
  amount: bigint
  currency: string
}

// ✅ 正确：值对象没有 ID
class Money {
  readonly amount: bigint
  readonly currency: string
}
```

### 错误 3: 相等性判断错误

```typescript
// ❌ 错误：使用引用相等
const m1 = new Money(100n, "CNY")
const m2 = new Money(100n, "CNY")
console.log(m1 === m2) // false（不同的对象引用）

// ✅ 正确：使用值相等
console.log(m1.equals(m2)) // true（相同的属性值）
```

## 检查清单

值对象设计完成前，确认：

- [ ] 值对象不可变
- [ ] 值对象没有唯一标识
- [ ] 实现了值相等性判断
- [ ] 实现了自验证逻辑
- [ ] 正确实现了 equals 方法
- [ ] 正确实现了 hashCode 方法（如果需要）
- [ ] 考虑了持久化策略
- [ ] 编写了单元测试

## 参考资料

- Implementing Domain-Driven Design (Vaughn Vernon) - Chapter 6
- Domain-Driven Design Reference (Eric Evans) - Sections 5.4
- Value Objects explained (Martin Fowler)
