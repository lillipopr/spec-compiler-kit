---
description: Stage 2 - 架构师产出 DDD 领域设计文档
---

# Stage 2: DDD Design（领域设计）

## 概述

| 项目 | 说明 |
|------|------|
| **执行者** | 架构师 |
| **输入** | Stage 1 PRD |
| **产出物** | 《DDD 设计文档》 |
| **下游依赖** | Stage 3 Spec Modeling |
| **闸口条件** | 领域边界清晰、聚合设计合理、上下文映射完整 |

## 职责边界

**架构师负责**：
- 领域划分和限界上下文
- 聚合根、实体、值对象识别
- 上下文映射关系
- 领域事件定义

**架构师不负责**：
- 具体状态机设计（Stage 3）
- 接口契约定义（Stage 4）
- 代码实现细节（Stage 4）

## DDD 设计核心要素

### 1. 限界上下文（Bounded Context）

```markdown
## 限界上下文

### 会员上下文（Membership Context）
- 职责：管理会员订阅生命周期
- 核心概念：会员、订阅、等级

### 点券上下文（Coupon Context）
- 职责：管理点券发放和消费
- 核心概念：点券、发放记录、消费记录

### 上下文映射
会员上下文 --[发布/订阅]--> 点券上下文
（会员状态变更时，通知点券上下文）
```

### 2. 聚合设计（Aggregate）

```markdown
## 聚合设计

### 聚合：Membership（会员订阅）
- 聚合根：Membership
- 实体：无
- 值对象：SubscriptionPeriod, MembershipLevel

### 聚合根职责
- 维护会员订阅状态
- 保证订阅规则的一致性
- 发布会员状态变更事件
```

### 3. 实体与值对象

```markdown
## 实体（Entity）

### Membership（会员订阅）
| 属性 | 类型 | 说明 |
|------|------|------|
| id | MembershipId | 唯一标识 |
| userId | UserId | 所属用户 |
| status | MembershipStatus | 订阅状态 |
| startDate | Date | 生效日期 |
| endDate | Date | 到期日期 |

## 值对象（Value Object）

### SubscriptionPeriod（订阅周期）
| 属性 | 类型 | 说明 |
|------|------|------|
| type | PeriodType | MONTHLY/YEARLY |
| duration | Integer | 时长（月） |
```

### 4. 领域事件（Domain Event）

```markdown
## 领域事件

### MembershipActivated（会员激活）
- 触发时机：会员订阅生效
- 携带数据：membershipId, userId, startDate, endDate
- 订阅者：点券上下文（开始每日发放）

### MembershipExpired（会员过期）
- 触发时机：会员订阅到期
- 携带数据：membershipId, userId, expiredDate
- 订阅者：点券上下文（停止每日发放）
```

### 5. 领域服务（Domain Service）

```markdown
## 领域服务

### MembershipService
- subscribe(userId, period): 创建订阅
- renew(membershipId, period): 续费
- cancel(membershipId): 取消订阅
```

## 闸口检查清单

进入 Stage 3 前，必须确认：

- [ ] 限界上下文边界清晰，职责单一
- [ ] 聚合根识别正确，有唯一标识和生命周期
- [ ] 实体和值对象区分明确
- [ ] 上下文映射关系完整
- [ ] 领域事件定义清晰，触发时机明确
- [ ] 无具体状态转移规则（那是 Stage 3 的事）

## 常见问题

### Q1: 如何判断是实体还是值对象？

| 判断点 | 实体 | 值对象 |
|--------|------|--------|
| 唯一标识 | 有 | 无 |
| 生命周期 | 有 | 无 |
| 可变性 | 可变 | 不可变 |
| 相等性 | 按 ID | 按属性值 |

### Q2: 聚合应该多大？

**原则**：尽量小，只包含必须一起变更的对象。

```
❌ 大聚合：User 包含 Order、Membership、Coupon
✅ 小聚合：Membership 只包含订阅相关
```

### Q3: DDD 设计和数据库设计的关系？

- DDD 设计关注**领域模型**，不关注存储
- 数据库设计在 Stage 4 工件推导中处理
- 一个聚合可能对应多张表，也可能多个值对象存在一张表

## 模板

详见 [templates/tpl-ddd-design.md](../templates/tpl-ddd-design.md)
