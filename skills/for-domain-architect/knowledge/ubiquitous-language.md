---
description: 通用语言详解
---

# 通用语言详解

## 概述

通用语言（Ubiquitous Language）是 DDD 的核心概念之一，指团队（业务人员和技术人员）在特定上下文中统一使用的语言。它是连接业务和技术的桥梁。

## 核心概念

### 定义

> 通用语言是领域专家和开发团队在讨论软件解决方案时使用的统一语言，它体现在代码、文档、讨论中。

### 特征

| 特征 | 说明 |
|------|------|
| **统一性** | 业务和技术使用相同术语 |
| **精确性** | 术语有明确定义 |
| **上下文相关** | 在特定限界上下文中有效 |
| **持续演进** | 随着理解深入不断更新 |

## 为什么需要通用语言

### 问题 1: 术语不一致

```
问题：不同角色使用不同术语

业务人员说：
- "会员激活"
- "发放点券"
- "订阅到期"

技术人员说：
- "updateStatus(1)"
- "addCoupon(100)"
- "setExpired(true)"

后果：
- 沟通困难
- 理解偏差
- 开发错误

解决方案：建立通用语言
- "会员激活" → activate()
- "发放点券" → grantCoupon()
- "订阅到期" → expire()
```

### 问题 2: 语义丢失

```
问题：技术实现掩盖业务语义

代码：
function updateStatus(id, status) {
  db.execute("UPDATE users SET status = ? WHERE id = ?", [status, id])
}

问题：
- 丢失了"会员激活"的业务含义
- status = 1 是什么意思？
- 为什么要更新状态？

通用语言版本：
class Membership {
  activate(): void {
    this.status = MembershipStatus.ACTIVE
    this.addEvent(new MembershipActivated(this.id))
  }
}

优势：
- 代码即文档
- 业务语义清晰
- 易于维护
```

### 问题 3: 知识割裂

```
问题：业务知识只存在于文档中，代码中无法体现

传统方式：
- 需求文档：业务规则
- 设计文档：技术设计
- 代码：技术实现
- 三者割裂，容易不一致

通用语言方式：
- 需求文档：使用通用语言
- 设计文档：使用通用语言
- 代码：使用通用语言
- 三者一致，知识统一
```

## 建立通用语言

### 步骤 1: 与领域专家讨论

```
目标：理解业务领域

方法：
1. 访谈领域专家
2. 参与业务会议
3. 观察业务流程
4. 提问和澄清

注意事项：
- 不要使用技术术语
- 让专家解释业务概念
- 确认理解正确
```

### 步骤 2: 提取核心术语

```
从讨论中提取核心术语：

示例对话：
业务专家："用户可以订阅会员，订阅后每天刷新100点券"

提取术语：
- 用户（User）
- 订阅（Subscribe）
- 会员（Membership）
- 点券（Coupon）
- 刷新（Refresh）
```

### 步骤 3: 统一术语

```
建立术语表：

| 统一术语 | ❌ 不一致使用 |
|----------|--------------|
| 会员 | 用户 / 订阅者 / 会员 |
| 会员激活 | 激活会员 / 启用会员 / 会员激活 |
| 点券发放 | 发放点券 / 刷新点券 / 发放积分 |
| 会员过期 | 订阅到期 / 会员失效 / 过期会员 |
```

### 步骤 4: 在代码中使用

```typescript
// ✅ 正确：使用通用语言
class Membership {
  activate(): void {
    this.status = MembershipStatus.ACTIVE
  }

  expire(): void {
    this.status = MembershipStatus.EXPIRED
  }
}

class CouponService {
  grantCoupon(membershipId: MembershipId): void {
    // 发放点券逻辑
  }
}

// ❌ 错误：使用技术术语
class Membership {
  updateStatus(status: number): void {
    this.status = status
  }
}

class CouponService {
  addCoupon(userId: string, amount: number): void {
    // 发放点券逻辑
  }
}
```

### 步骤 5: 持续演进

```
通用语言需要持续演进：

1. 定期与领域专家讨论
2. 更新术语表
3. 重构代码以反映新理解
4. 更新文档
```

## 通用语言的表现形式

### 1. 代码中的体现

```typescript
// 类名使用通用语言
class Membership { }
class Coupon { }
class Order { }

// 方法名使用通用语言
membership.activate()
membership.expire()
coupon.grant()
order.confirm()

// 变量名使用通用语言
const activeMemberships: Membership[]
const couponAmount: Money
const orderStatus: OrderStatus

// 枚举使用通用语言
enum MembershipStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  SUSPENDED = "SUSPENDED"
}
```

### 2. 文档中的体现

```markdown
## 会员激活流程

1. 用户订阅会员
2. 会员状态变为"生效中"
3. 系统开始每日点券发放
4. 会员到期时状态变为"已过期"

注意：
- 只有"生效中"的会员才能发放点券
- 会员到期后30天内可续费
```

### 3. 讨论中的体现

```
❌ 技术讨论：
"调用 updateStatus 方法把 status 改成 1"

✅ 业务讨论（通用语言）：
"激活会员，会员状态变为生效中"

优势：
- 业务人员能理解
- 技术人员能实现
- 沟通无障碍
```

## 通用语言和限界上下文

### 关系

```
通用语言在限界上下文内有效

示例：
- 会员上下文中的"会员" = 订阅关系
- 用户上下文中的"会员" = 用户属性
- 支付上下文中的"会员" = 折扣标识

每个上下文有自己的通用语言
```

### 跨上下文的语言转换

```
上下文边界需要语言转换：

会员上下文 → 点券上下文

会员上下文语言：
"会员激活"

点券上下文语言：
"开始每日点券发放"

通过领域事件转换：
MembershipActivated {
  membershipId: string
  userId: string
  level: string
}

点券上下文订阅事件，转换为自己的语言
```

## 通用语言的层次

### 1. 核心术语层

```
业务领域最核心的概念

示例：
- 会员（Membership）
- 订阅（Subscription）
- 点券（Coupon）
```

### 2. 行为层

```
业务操作和动作

示例：
- 激活会员（Activate Membership）
- 发放点券（Grant Coupon）
- 过期会员（Expire Membership）
```

### 3. 规则层

```
业务约束和规则

示例：
- 只有生效中的会员才能发放点券
- 一个用户只能有一个生效中的订阅
- 会员到期后30天内可续费
```

### 4. 状态层

```
业务状态和状态转移

示例：
- 待激活（PENDING）
- 生效中（ACTIVE）
- 已过期（EXPIRED）
```

## 通用语言的最佳实践

### 1. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 类名 | 名词，业务概念 | Membership, Coupon |
| 方法名 | 动词+名词，业务操作 | activate(), grantCoupon() |
| 变量名 | 名词，业务数据 | activeMemberships, couponAmount |
| 常量名 | 全大写，业务概念 | MAX_COUPON_AMOUNT |

### 2. 避免技术术语

```typescript
// ❌ 错误：使用技术术语
class Membership {
  id: string
  data: any
  metadata: Record<string, any>

  serialize(): string {
    return JSON.stringify(this)
  }
}

// ✅ 正确：使用业务术语
class Membership {
  readonly id: MembershipId
  readonly userId: UserId
  readonly status: MembershipStatus
  readonly level: MembershipLevel

  canGrantCoupon(): boolean {
    return this.status === MembershipStatus.ACTIVE
  }
}
```

### 3. 避免缩写

```typescript
// ❌ 错误：使用缩写
class Mem {
  act(): void {
    this.st = MemSt.ACT
  }
}

// ✅ 正确：完整单词
class Membership {
  activate(): void {
    this.status = MembershipStatus.ACTIVE
  }
}
```

### 4. 使用业务词汇

```typescript
// ❌ 错误：使用技术词汇
if (user.flags & 0x01) {
  // 处理逻辑
}

// ✅ 正确：使用业务词汇
if (membership.isActive()) {
  // 处理逻辑
}
```

## 通用语言维护

### 1. 术语表

```markdown
## 术语表

| 术语 | 定义 | 上下文 | 示例 |
|------|------|--------|------|
| 会员 | 用户与平台的订阅关系 | 会员上下文 | 张三有一个生效中的会员 |
| 会员激活 | 会员状态变为生效中 | 会员上下文 | 订阅成功后会员自动激活 |
| 点券发放 | 为会员账户增加点券 | 点券上下文 | 每日为生效会员发放100点券 |
```

### 2. 代码审查

```
代码审查时检查：
- 是否使用通用语言？
- 是否有技术术语泄露？
- 命名是否体现业务含义？
- 是否易于业务人员理解？
```

### 3. 持续重构

```
随着理解深入，持续重构：
1. 更新术语表
2. 重构代码以反映新理解
3. 更新文档
4. 与团队同步
```

## 常见错误

### 错误 1: 使用技术术语

```typescript
// ❌ 错误
function updateStatus(id, status) {
  db.execute("UPDATE...")
}

// ✅ 正确
membership.activate()
```

### 错误 2: 术语不一致

```
❌ 错误：
- 代码中用 "member"
- 文档中用 "会员"
- 讨论中用 "用户"

✅ 正确：
- 统一使用 "会员"（Membership）
```

### 错误 3: 丢失业务语义

```
❌ 错误：
if (status === 1) {
  // 处理逻辑
}

✅ 正确：
if (membership.isActive()) {
  // 处理逻辑
}
```

## 参考资料

- Domain-Driven Design (Eric Evans) - Chapter 2
- Implementing Domain-Driven Design (Vaughn Vernon) - Chapter 2
- Ubiquitous Language (Martin Fowler)
