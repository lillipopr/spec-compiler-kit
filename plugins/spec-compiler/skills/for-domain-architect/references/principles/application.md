---
description: 应用层相关原则
---

# 应用层相关原则

## 概述

应用层（Application Layer）负责用例编排、事务管理、调用领域层。应用层不包含业务逻辑。

---

## 1. 应用层职责原则

### 1.1 应用层核心职责

**原则**：应用层只负责以下职责，不包含业务逻辑。

| 职责 | 说明 | 示例 |
|------|------|------|
| **用例编排** | 协调多个领域对象 | 创建订单涉及库存、支付、发货 |
| **事务管理** | 管理事务边界 | @Transactional |
| **调用领域层** | 调用聚合根和领域服务 | membership.activate() |
| **发布领域事件** | 发布聚合根产生的事件 | eventPublisher.publish() |
| **返回结果** | 返回 DTO 或响应 | ApiResponse<T> |

### 1.2 应用层 vs 领域层

**原则**：应用层编排，领域层执行。

| 维度 | 应用层 | 领域层 |
|------|--------|--------|
| 职责 | 用例编排 | 业务逻辑 |
| 状态修改 | 调用领域层修改 | 直接修改聚合状态 |
| 事务 | 管理事务 | 不管理事务 |
| 示例 | createMembership() | Membership.create() |

---

## 2. 用户行为 vs 系统行为原则

### 2.1 用户行为特征

**原则**：用户行为由用户操作触发，需要权限控制。

| 特征 | 说明 | 示例 |
|------|------|------|
| **用户发起** | 由用户操作触发 | 点击订阅按钮 |
| **需要权限控制** | 需要验证用户身份 | 只有会员才能查看 |
| **需要参数校验** | 需要校验输入参数 | 订阅金额必须 > 0 |

### 2.2 系统行为特征

**原则**：系统行为由系统触发，无需权限控制。

| 特征 | 说明 | 示例 |
|------|------|------|
| **系统触发** | 由系统事件触发 | 定时任务、事件监听 |
| **无用户交互** | 自动执行，无需用户介入 | 自动过期会员 |
| **无权限控制** | 不需要用户身份 | 系统内部操作 |

### 2.3 行为分类决策树

```
这个行为是用户行为还是系统行为？
│
├─ 由用户发起吗？
│   ├─ 是 → 用户行为
│   └─ 否 → 继续
│
├─ 由事件触发吗？
│   ├─ 是 → 系统行为
│   └─ 否 → 继续
│
└─ 由定时任务触发吗？
    ├─ 是 → 系统行为
    └─ 否 → 需要进一步分析
```

---

## 3. 应用服务设计原则

### 3.1 应用服务命名原则

**原则**：使用"聚合名 + Application"格式。

```
✅ 好的服务命名
- MembershipApplication
- CouponApplication
- PaymentApplication

❌ 差的服务命名
- MembershipService（与领域服务混淆）
- MembershipApplicationService（啰嗦，不够简洁）
- MembershipController（Controller 层命名）
- 会员服务（中文，不符合代码规范）
```

### 3.2 应用服务方法命名原则

**原则**：使用动词+名词，表达用例意图。

```
✅ 好的方法命名
- createMembership()  // 创建会员
- cancelMembership()  // 取消会员
- upgradeMembership() // 升级会员

❌ 差的方法命名
- doMembership()      // 不明确
- handle()            // 太泛
- process()           // 太泛
```

### 3.3 应用服务结构原则

**原则**：应用服务方法遵循统一结构。

```typescript
async createMembership(cmd: CreateMembershipCommand): Promise<MembershipDTO> {
  // 1. 参数校验
  this.validate(cmd)

  // 2. 调用领域层
  const membership = Membership.create(cmd)

  // 3. 保存
  await this.repo.save(membership)

  // 4. 发布事件
  this.eventPublisher.publish(membership.getEvents())

  // 5. 返回结果
  return this.toDTO(membership)
}
```

---

## 4. 应用层不包含业务逻辑原则

### 4.1 业务逻辑在领域层原则

**原则**：应用层不包含业务逻辑，业务逻辑在领域层。

```typescript
// ✅ 正确：应用层只负责编排
class MembershipApplication {
  async createMembership(cmd: CreateMembershipCommand): Promise<Membership> {
    // 参数校验（应用层职责）
    this.validate(cmd)

    // 调用领域层（业务逻辑在领域层）
    const membership = Membership.create(cmd)

    // 保存（应用层职责）
    await this.repo.save(membership)

    // 发布事件（应用层职责）
    this.eventPublisher.publish(membership.getEvents())

    return membership
  }
}

// ❌ 错误：应用层包含业务逻辑
class MembershipApplication {
  async createMembership(cmd: CreateMembershipCommand): Promise<Membership> {
    // 业务逻辑应该在领域层
    if (cmd.amount <= 0) {
      throw new Error("金额必须大于0")
    }

    const membership = new Membership()
    membership.status = "ACTIVE"
    membership.amount = cmd.amount

    await this.repo.save(membership)
    return membership
  }
}
```

### 4.2 参数校验原则

**原则**：应用层负责参数校验，领域层负责业务规则校验。

```typescript
// ✅ 正确：职责分离
class MembershipApplication {
  async createMembership(cmd: CreateMembershipCommand): Promise<Membership> {
    // 应用层：参数校验
    if (!cmd.userId) {
      throw new Error("userId 不能为空")
    }

    // 领域层：业务规则校验
    const membership = Membership.create(cmd)  // 业务规则在这里
    await this.repo.save(membership)
    return membership
  }
}
```

---

## 5. 事务管理原则

### 5.1 事务边界原则

**原则**：应用层管理事务边界。

```typescript
// ✅ 正确：应用层管理事务
class MembershipApplication {
  @Transactional
  async createMembership(cmd: CreateMembershipCommand): Promise<Membership> {
    const membership = Membership.create(cmd)
    await this.repo.save(membership)
    this.eventPublisher.publish(membership.getEvents())
    return membership
  }
}

// ❌ 错误：领域层管理事务
class Membership {
  @Transactional  // 不应该在领域层
  activate(): void {
    this.status = MembershipStatus.ACTIVE
  }
}
```

### 5.2 事务粒度原则

**原则**：一个事务只修改一个聚合。

```typescript
// ✅ 正确：一个事务修改一个聚合
@Transactional
async activateMembership(membershipId: string): Promise<void> {
  const membership = await this.repo.findById(membershipId)
  membership.activate()
  await this.repo.save(membership)
}

// ❌ 错误：一个事务修改多个聚合
@Transactional
async activateMembershipAndGrantCoupon(membershipId: string): Promise<void> {
  const membership = await this.repo.findById(membershipId)
  membership.activate()
  await this.repo.save(membership)

  // 不应该在同一个事务中
  const coupon = await this.couponRepo.findByUserId(membership.userId)
  coupon.addAmount(100)
  await this.couponRepo.save(coupon)
}
```

---

## 6. Command 和 DTO 原则

### 6.1 Command 设计原则

**原则**：Command 表示用户意图，包含输入参数。

```typescript
// ✅ 正确：Command 包含用户输入
interface CreateMembershipCommand {
  userId: string
  level: MembershipLevel
  startDate: Date
  endDate: Date
}

// ❌ 错误：Command 包含业务规则
interface CreateMembershipCommand {
  userId: string
  level: MembershipLevel
  startDate: Date
  endDate: Date
  status: MembershipStatus  // 业务规则，应该在领域层
}
```

### 6.2 DTO 设计原则

**原则**：DTO 是数据传输对象，不包含业务逻辑。

```typescript
// ✅ 正确：DTO 只包含数据
interface MembershipDTO {
  id: string
  userId: string
  status: string
  level: string
}

// ❌ 错误：DTO 包含业务方法
interface MembershipDTO {
  id: string
  userId: string
  status: string

  activate(): void {  // 不应该在 DTO 中
    this.status = "ACTIVE"
  }
}
```

---

## 7. 错误处理原则

### 7.1 错误分类处理原则

**原则**：区分参数错误、业务错误、系统错误。

| 错误类型 | HTTP 状态码 | 业务状态码 | 处理方式 |
|---------|-----------|-----------|---------|
| 参数错误 | 200 | 400 | 校验失败，返回错误信息 |
| 权限错误 | 200 | 403 | 无权限，返回错误信息 |
| 业务错误 | 200 | 422 | 业务规则违反，返回错误信息 |
| 系统错误 | 200 | 500 | 系统异常，记录日志 |

### 7.2 异常转换原则

**原则**：领域异常转换为应用层响应。

```typescript
// ✅ 正确：异常转换
class MembershipApplication {
  async createMembership(cmd: CreateMembershipCommand): Promise<ApiResponse<MembershipDTO>> {
    try {
      const membership = Membership.create(cmd)
      await this.repo.save(membership)
      return ApiResponse.success(this.toDTO(membership))
    } catch (error) {
      if (error instanceof BusinessRuleException) {
        return ApiResponse.fail(422, error.message)
      }
      if (error instanceof ValidationException) {
        return ApiResponse.fail(400, error.message)
      }
      throw error  // 系统异常向上抛出
    }
  }
}
```

---

## 检查清单

应用层设计完成前，确认：

- [ ] 所有应用服务已识别
- [ ] 用户行为和系统行为已区分
- [ ] 应用服务命名符合规范
- [ ] 应用服务方法命名符合规范
- [ ] 应用层不包含业务逻辑
- [ ] 业务逻辑在领域层
- [ ] 应用层管理事务
- [ ] 一个事务只修改一个聚合
- [ ] Command 和 DTO 设计合理
- [ ] 错误处理完善
