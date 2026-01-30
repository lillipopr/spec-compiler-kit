---
description: 领域建模标准作业流程
---

# 领域建模 SOP

## 概述

领域建模是 DDD 战术设计的核心，将业务需求转化为可执行的领域模型。本 SOP 提供系统化的领域建模方法。

## 目标

- 识别并设计实体
- 识别并设计值对象
- 设计领域事件
- 识别领域服务
- 定义仓储接口

## 输入

- 聚合设计文档
- PRD 中的业务规则
- 业务用例清单

## 流程步骤

### Step 1: 实体设计

#### 1.1 实体识别检查清单

对每个候选对象，回答以下问题：

| 检查项 | 说明 | 示例 |
|--------|------|------|
| **有唯一标识吗？** | 需要通过 ID 追踪身份 | 会员有 membershipId |
| **有生命周期吗？** | 有创建、变化、终结过程 | 订单从创建到完成 |
| **可变吗？** | 属性会变化 | 会员状态会变化 |
| **需要追踪历史吗？** | 需要知道"这是同一个" | 用户改名后仍是同一用户 |

#### 1.2 实体设计模板

```markdown
## 实体：{实体名称}

### 标识
{实体 ID 类型}

### 属性
| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| {属性 1} | {类型} | Y/N | {说明} |

### 行为
| 行为名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| {行为 1} | {参数} | {返回} | {说明} |

### 业务规则
- {规则 1}
- {规则 2}
```

#### 1.3 实体设计示例

```markdown
## 实体：Membership（会员订阅）

### 标识
MembershipId（全局唯一）

### 属性
| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | MembershipId | Y | 唯一标识 |
| userId | UserId | Y | 所属用户 |
| status | MembershipStatus | Y | 订阅状态 |
| startDate | Date | Y | 开始日期 |
| endDate | Date | Y | 结束日期 |
| createdAt | DateTime | Y | 创建时间 |
| updatedAt | DateTime | Y | 更新时间 |

### 行为
| 行为名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| activate | - | void | 激活会员 |
| expire | - | void | 过期会员 |
| suspend | - | void | 暂停会员 |
| resume | - | void | 恢复会员 |

### 业务规则
- BR-1: 生效中的会员才能发放点券
- BR-2: 一个用户只能有一个生效中的订阅
```

### Step 2: 值对象设计

#### 2.1 值对象识别检查清单

对每个候选对象，回答以下问题：

| 检查项 | 说明 | 示例 |
|--------|------|------|
| **没有唯一标识吗？** | 不需要 ID 追踪 | 金额不需要 ID |
| **不可变吗？** | 创建后不修改 | 地址变化是替换 |
| **可替换吗？** | 属性相同即为相等 | 两个 100 元相等 |
| **描述性吗？** | 描述事物的特征 | 颜色、尺寸、地址 |

#### 2.2 值对象设计模板

```markdown
## 值对象：{值对象名称}

### 描述
{值对象的作用和含义}

### 属性
| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| {属性 1} | {类型} | Y/N | {说明} |

### 行为
| 行为名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| {行为 1} | {参数} | {返回} | {说明} |

### 不变量
- {不变量 1}
- {不变量 2}
```

#### 2.3 值对象设计示例

```markdown
## 值对象：Money（金额）

### 描述
表示货币金额，确保金额操作的精度和一致性

### 属性
| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| amount | BigInteger | Y | 金额（分） |
| currency | Currency | Y | 货币类型 |

### 行为
| 行为名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| add | Money | Money | 金额相加 |
| subtract | Money | Money | 金额相减 |
| multiply | number | Money | 金额乘法 |
| greaterThan | Money | boolean | 比较大小 |

### 不变量
- INV-1: 金额不能为负数
- INV-2: 金额精度到分

### 相等性
两个 Money 相等当且仅当 amount 和 currency 都相等
```

### Step 3: 领域事件设计

#### 3.1 事件识别时机

| 时机 | 说明 | 示例 |
|------|------|------|
| **状态重要变化** | 聚合状态发生关键变化 | 会员激活、过期 |
| **需要通知其他上下文** | 跨上下文的协作 | 会员激活通知点券上下文 |
| **需要异步处理** | 触发后台任务 | 支付成功触发发货 |
| **需要审计追踪** | 记录关键操作 | 敏感操作审计 |

#### 3.2 事件命名规范

```
格式：{聚合名}{过去式动词}

示例：
✅ MembershipActivated（会员已激活）
✅ MembershipExpired（会员已过期）
✅ CouponGranted（点券已发放）

❌ ActivateMembership（是命令不是事件）
❌ MembershipActivation（不够明确）
```

#### 3.3 事件设计模板

```markdown
## 领域事件：{事件名称}

### 描述
{事件的业务含义}

### 触发时机
{什么条件下触发这个事件}

### 发布者
{哪个上下文/聚合发布}

### 订阅者
{哪些上下文/聚合订阅}

### 携带数据
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| {字段 1} | {类型} | Y/N | {说明} |

### 业务规则
- {规则 1}
- {规则 2}
```

#### 3.4 领域事件设计示例

```markdown
## 领域事件：MembershipActivated（会员已激活）

### 描述
会员订阅成功激活，开始享受会员权益

### 触发时机
- 会员订阅创建后自动激活
- 已暂停的会员恢复订阅

### 发布者
会员上下文 - Membership 聚合

### 订阅者
- 点券上下文 - 开始每日点券发放
- 通知上下文 - 发送激活通知
- 统计上下文 - 记录激活数据

### 携带数据
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| eventId | EventId | Y | 事件唯一标识 |
| membershipId | MembershipId | Y | 会员订阅 ID |
| userId | UserId | Y | 用户 ID |
| level | MembershipLevel | Y | 会员等级 |
| activatedAt | DateTime | Y | 激活时间 |

### 业务规则
- BR-1: 只有待激活状态的会员才能激活
- BR-2: 激活后状态变为生效中
```

### Step 4: 领域服务设计

#### 4.1 领域服务识别

| 场景 | 说明 | 示例 |
|------|------|------|
| **跨聚合操作** | 涉及多个聚合的协作 | 转账（两个账户） |
| **无归属行为** | 不属于任何特定实体 | 计算会员等级 |
| **领域规则计算** | 复杂的业务规则计算 | 根据历史计算折扣 |

#### 4.2 领域服务设计模板

```markdown
## 领域服务：{服务名称}

### 职责
{服务负责什么}

### 方法
| 方法名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| {方法 1} | {参数} | {返回} | {说明} |

### 依赖
- {依赖 1}
- {依赖 2}

### 业务规则
- {规则 1}
- {规则 2}
```

#### 4.3 领域服务设计示例

```markdown
## 领域服务：MembershipService

### 职责
处理涉及多个聚合的会员相关业务逻辑

### 方法
| 方法名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| grantDailyCoupon | membershipId | void | 每日点券发放 |
| calculateLevel | userId, history | MembershipLevel | 计算会员等级 |

### 依赖
- MembershipRepository（会员仓储）
- CouponGrantRepository（点券发放仓储）

### 业务规则
- BR-1: 只有生效中的会员才能发放点券
- BR-2: 每天只能发放一次
- BR-3: 点券数量根据会员等级确定
```

### Step 5: 仓储接口设计

#### 5.1 仓储接口设计原则

| 原则 | 说明 |
|------|------|
| **聚合根专属** | 仓储针对聚合根，不针对实体 |
| **接口隔离** | 每个聚合有自己的仓储接口 |
| **业务语义** | 方法名体现业务含义 |

#### 5.2 仓储接口设计模板

```typescript
interface {Aggregate}Repository {
  // 基本操作
  save(aggregate: {Aggregate}): Promise<void>
  findById(id: {AggregateId}): Promise<{Aggregate} | null>

  // 业务查询
  findBy{Criteria}(criteria: {CriteriaType}): Promise<{Aggregate}[]>
  exists{Criteria}(criteria: {CriteriaType}): Promise<boolean>

  // 统计（如果需要）
  count(criteria: QueryCriteria): Promise<number>
}
```

#### 5.3 仓储接口设计示例

```typescript
interface MembershipRepository {
  // 基本操作
  save(membership: Membership): Promise<void>
  findById(id: MembershipId): Promise<Membership | null>

  // 业务查询
  findByUserId(userId: UserId): Promise<Membership | null>
  findActiveByUserId(userId: UserId): Promise<Membership | null>
  findByStatus(status: MembershipStatus): Promise<Membership[]>

  // 不变量验证
  existsActiveMembership(userId: UserId): Promise<boolean>

  // 统计
  countByStatus(status: MembershipStatus): Promise<number>
}

interface CouponGrantRepository {
  // 基本操作
  save(grant: CouponGrant): Promise<void>
  findById(id: GrantId): Promise<CouponGrant | null>

  // 业务查询
  findByUserId(userId: UserId): Promise<CouponGrant[]>
  findByMembershipId(membershipId: MembershipId): Promise<CouponGrant[]>
  findTodayGrant(userId: UserId): Promise<CouponGrant | null>

  // 统计
  sumAmountByUserId(userId: UserId): Promise<Money>
}
```

### Step 6: 模型验证

#### 6.1 模型验证检查清单

```markdown
## 模型验证清单

### 实体验证
- [ ] 每个实体都有唯一标识
- [ ] 每个实体都有明确的生命周期
- [ ] 实体属性完整且必要
- [ ] 实体行为正确归属

### 值对象验证
- [ ] 值对象不可变
- [ ] 值对象相等性基于属性值
- [ ] 值对象没有独立标识
- [ ] 值对象封装了不变量

### 领域事件验证
- [ ] 事件命名规范（过去式）
- [ ] 事件携带数据完整
- [ ] 事件触发时机明确
- [ ] 事件订阅者清晰

### 领域服务验证
- [ ] 领域服务职责单一
- [ ] 不属于实体或聚合的行为
- [ ] 涉及多聚合协作或复杂计算

### 仓储接口验证
- [ ] 仓储针对聚合根
- [ ] 接口方法有业务语义
- [ ] 隐藏持久化细节
```

## 输出

### 领域模型文档模板

```markdown
# 领域模型文档

## 1. 实体清单

| 实体 ID | 实体名称 | 所属聚合 | 标识类型 | 状态 |
|---------|----------|----------|----------|------|
| E-001 | Membership | 会员订阅聚合 | MembershipId | 已定义 |

## 2. 值对象清单

| 值对象 ID | 值对象名称 | 使用位置 | 状态 |
|-----------|------------|----------|------|
| VO-001 | Money | 全局 | 已定义 |
| VO-002 | SubscriptionPeriod | Membership | 已定义 |

## 3. 领域事件清单

| 事件 ID | 事件名称 | 发布者 | 订阅者 | 状态 |
|---------|----------|--------|--------|------|
| DE-001 | MembershipActivated | Membership | Coupon, Notification | 已定义 |

## 4. 领域服务清单

| 服务 ID | 服务名称 | 职责 | 状态 |
|---------|----------|------|------|
| DS-001 | MembershipService | 会员跨聚合操作 | 已定义 |

## 5. 仓储接口清单

| 仓储 ID | 仓储名称 | 聚合根 | 状态 |
|---------|----------|--------|------|
| R-001 | MembershipRepository | Membership | 已定义 |
```

## 验收标准

- [ ] 所有实体已识别并设计
- [ ] 所有值对象已识别并设计
- [ ] 实体和值对象正确区分
- [ ] 所有领域事件已识别并设计
- [ ] 所有领域服务已识别并设计
- [ ] 所有仓储接口已定义
- [ ] 模型验证检查清单全部通过
- [ ] 模型与 PRD 需求可追溯

## 常见问题

### Q1: 实体和值对象的边界？

**判断方法**：
- 需要追踪"这是同一个" → 实体
- 属性相同即相等 → 值对象

### Q2: 何时使用领域服务？

**场景**：
- 涉及多个聚合的协作
- 不属于任何特定实体的行为
- 复杂的领域规则计算

### Q3: 领域事件和命令的区别？

| 命令（Command） | 事件（Event） |
|-----------------|---------------|
| 动词（ActivateMembership） | 过去式（MembershipActivated） |
| 请求做某事 | 已经发生的事实 |
| 可能有多个 | 唯一确定 |

## 工具支持

- 领域模型画布（Domain Model Canvas）
- 事件风暴（Event Storming）
- 领域模型图（Domain Model Diagram）

## 参考资料

- Domain-Driven Design (Eric Evans) - Chapter 5-6
- Implementing Domain-Driven Design (Vaughn Vernon) - Chapter 8-11
- Patterns, Principles, and Practices of Domain-Driven Design
