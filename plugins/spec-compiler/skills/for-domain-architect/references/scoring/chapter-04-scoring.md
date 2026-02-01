# 第四章评分标准：应用层设计

> **满分**：100 分
> **及格分**：60 分
> **优秀线**：80 分
> **对应章节**：chapter-04-application.md
> **对应原则**：application.md

---

## 评分维度

| 维度 | 权重 | 评分要点 |
|------|------|---------|
| 应用层职责 | 20 分 | 用例编排、事务管理、调用领域层、发布事件、返回结果 |
| 用户行为 vs 系统行为 | 15 分 | 行为分类、决策树、特征区分 |
| 应用服务设计 | 25 分 | 服务命名、方法命名、服务结构 |
| 业务逻辑分层 | 15 分 | 应用层不包含业务逻辑、参数校验分层 |
| 事务管理 | 10 分 | 事务边界、事务粒度 |
| Command 和 DTO | 10 分 | Command 设计、DTO 设计 |
| 错误处理 | 5 分 | 错误分类、异常转换 |

---

## 一、应用层职责（20 分）

### 1.1 核心职责（12 分）

**满分**：12 分

**评分标准**：
- 优秀（90-100分）：所有应用服务都只负责核心职责
- 良好（80-89分）：90%以上应用服务只负责核心职责
- 及格（60-79分）：70%以上应用服务只负责核心职责
- 不及格（<60分）：低于70%应用服务只负责核心职责

**检查项**：
- [ ] 用例编排（3分）：协调多个领域对象
- [ ] 事务管理（3分）：管理事务边界
- [ ] 调用领域层（3分）：调用聚合根和领域服务
- [ ] 发布领域事件（2分）：发布聚合根产生的事件
- [ ] 返回结果（1分）：返回 DTO 或响应

**扣分项**：
- 职责混乱：应用层包含其他职责扣 3 分/处
- 缺失核心职责：缺少核心职责扣 2 分/处

---

### 1.2 职责边界（8 分）

**满分**：8 分

**评分标准**：
- 优秀（90-100分）：应用层完全不包含业务逻辑
- 良好（80-89分）：90%以上应用层不包含业务逻辑
- 及格（60-79分）：70%以上应用层不包含业务逻辑
- 不及格（<60分）：低于70%应用层不包含业务逻辑

**检查项**：
- [ ] 应用层不包含业务逻辑（5分）：业务逻辑在领域层
- [ ] 应用层只负责编排（3分）：应用层只负责编排

**示例**：
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

**扣分项**：
- 应用层包含业务逻辑：扣 4 分/处

---

## 二、用户行为 vs 系统行为（15 分）

### 2.1 行为分类（8 分）

**满分**：8 分

**评分标准**：
- 优秀（90-100分）：用户行为和系统行为完全正确区分
- 良好（80-89分）：90%以上行为正确区分
- 及格（60-79分）：70%以上行为正确区分
- 不及格（<60分）：低于70%行为正确区分

**检查项**：
- [ ] 用户行为特征（4分）：
  - 用户发起
  - 需要权限控制
  - 需要参数校验
- [ ] 系统行为特征（4分）：
  - 系统触发
  - 无用户交互
  - 无权限控制

**扣分项**：
- 行为分类错误：用户行为和系统行为混淆扣 3 分/处

---

### 2.2 决策树（7 分）

**满分**：7 分

**评分标准**：
- 优秀（90-100分）：使用决策树验证所有行为
- 良好（80-89分）：90%以上行为通过决策树验证
- 及格（60-79分）：70%以上行为通过决策树验证
- 不及格（<60分）：低于70%行为通过决策树验证

**检查项**：
- [ ] 使用决策树验证（7分）：使用决策树验证每个行为

**决策树**：
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

**扣分项**：
- 未使用决策树：扣 4 分
- 决策树应用错误：扣 2 分/处

---

## 三、应用服务设计（25 分）

### 3.1 服务命名（8 分）

**满分**：8 分

**评分标准**：
- 优秀（90-100分）：所有应用服务命名完全符合规范
- 良好（80-89分）：90%以上应用服务命名符合规范
- 及格（60-79分）：70%以上应用服务命名符合规范
- 不及格（<60分）：低于70%应用服务命名符合规范

**检查项**：
- [ ] 使用"聚合名 + Application"格式（5分）：MembershipApplication、CouponApplication
- [ ] 不与其他层混淆（3分）：不使用 XxxService、XxxController

**命名规范**：
- ✅ 好的服务命名：MembershipApplication、CouponApplication、PaymentApplication
- ❌ 差的服务命名：MembershipService（与领域服务混淆）、MembershipApplicationService（啰嗦，不够简洁）、MembershipController（Controller 层命名）

**扣分项**：
- 命名不规范：扣 3 分/个
- 与其他层混淆：扣 2 分/个

---

### 3.2 方法命名（8 分）

**满分**：8 分

**评分标准**：
- 优秀（90-100分）：所有方法命名完全符合规范
- 良好（80-89分）：90%以上方法命名符合规范
- 及格（60-79分）：70%以上方法命名符合规范
- 不及格（<60分）：低于70%方法命名符合规范

**检查项**：
- [ ] 使用动词+名词（5分）：createMembership()、cancelMembership()、upgradeMembership()
- [ ] 表达用例意图（3分）：方法名清晰表达用例意图

**命名规范**：
- ✅ 好的方法命名：createMembership()、cancelMembership()、upgradeMembership()
- ❌ 差的方法命名：doMembership()、handle()、process()

**扣分项**：
- 方法命名不规范：扣 3 分/个
- 意图不明确：扣 2 分/个

---

### 3.3 服务结构（9 分）

**满分**：9 分

**评分标准**：
- 优秀（90-100分）：所有应用服务方法都遵循统一结构
- 良好（80-89分）：90%以上方法遵循统一结构
- 及格（60-79分）：70%以上方法遵循统一结构
- 不及格（<60分）：低于70%方法遵循统一结构

**检查项**：
- [ ] 参数校验（2分）
- [ ] 调用领域层（2分）
- [ ] 保存（2分）
- [ ] 发布事件（2分）
- [ ] 返回结果（1分）

**统一结构**：
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

**扣分项**：
- 结构不统一：扣 2 分/处
- 缺少步骤：缺少必要步骤扣 1 分/处

---

## 四、业务逻辑分层（15 分）

### 4.1 职责分离（8 分）

**满分**：8 分

**评分标准**：
- 优秀（90-100分）：应用层完全不包含业务逻辑
- 良好（80-89分）：90%以上应用层不包含业务逻辑
- 及格（60-79分）：70%以上应用层不包含业务逻辑
- 不及格（<60分）：低于70%应用层不包含业务逻辑

**检查项**：
- [ ] 应用层不包含业务逻辑（5分）：业务逻辑在领域层
- [ ] 应用层只负责编排（3分）：应用层只负责编排

**扣分项**：
- 应用层包含业务逻辑：扣 4 分/处

---

### 4.2 参数校验分层（7 分）

**满分**：7 分

**评分标准**：
- 优秀（90-100分）：参数校验分层完全清晰
- 良好（80-89分）：90%以上参数校验分层清晰
- 及格（60-79分）：70%以上参数校验分层清晰
- 不及格（<60分）：低于70%参数校验分层清晰

**检查项**：
- [ ] 应用层：参数校验（4分）：格式、必填、范围
- [ ] 领域层：业务规则校验（3分）：业务不变量

**示例**：
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

**扣分项**：
- 分层不清晰：扣 3 分/处

---

## 五、事务管理（10 分）

### 5.1 事务边界（5 分）

**满分**：5 分

**评分标准**：
- 优秀（90-100分）：所有应用层都正确管理事务边界
- 良好（80-89分）：90%以上应用层正确管理事务边界
- 及格（60-79分）：70%以上应用层正确管理事务边界
- 不及格（<60分）：低于70%应用层正确管理事务边界

**检查项**：
- [ ] 应用层管理事务边界（5分）：使用 @Transactional 注解

**示例**：
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

**扣分项**：
- 事务边界错误：领域层管理事务扣 3 分/处

---

### 5.2 事务粒度（5 分）

**满分**：5 分

**评分标准**：
- 优秀（90-100分）：所有事务都只修改一个聚合
- 良好（80-89分）：90%以上事务只修改一个聚合
- 及格（60-79分）：70%以上事务只修改一个聚合
- 不及格（<60分）：低于70%事务只修改一个聚合

**检查项**：
- [ ] 一个事务只修改一个聚合（5分）

**扣分项**：
- 跨聚合事务：一个事务修改多个聚合扣 3 分/处

---

## 六、Command 和 DTO（10 分）

### 6.1 Command 设计（5 分）

**满分**：5 分

**评分标准**：
- 优秀（90-100分）：所有 Command 设计都符合规范
- 良好（80-89分）：90%以上 Command 设计符合规范
- 及格（60-79分）：70%以上 Command 设计符合规范
- 不及格（<60分）：低于70% Command 设计符合规范

**检查项**：
- [ ] 包含输入参数（3分）
- [ ] 不包含业务规则（2分）

**示例**：
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

**扣分项**：
- Command 包含业务规则：扣 3 分/处

---

### 6.2 DTO 设计（5 分）

**满分**：5 分

**评分标准**：
- 优秀（90-100分）：所有 DTO 设计都符合规范
- 良好（80-89分）：90%以上 DTO 设计符合规范
- 及格（60-79分）：70%以上 DTO 设计符合规范
- 不及格（<60分）：低于70% DTO 设计符合规范

**检查项**：
- [ ] 只包含数据（3分）
- [ ] 不包含业务逻辑（2分）

**示例**：
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

**扣分项**：
- DTO 包含业务方法：扣 3 分/处

---

## 七、错误处理（5 分）

### 7.1 错误分类（3 分）

**满分**：3 分

**评分标准**：
- 优秀（90-100分）：错误分类完全正确
- 良好（80-89分）：90%以上错误分类正确
- 及格（60-79分）：70%以上错误分类正确
- 不及格（<60分）：低于70%错误分类正确

**检查项**：
- [ ] 错误分类正确（3分）：
  - 参数错误：HTTP 200，业务状态码 400
  - 权限错误：HTTP 200，业务状态码 403
  - 业务错误：HTTP 200，业务状态码 422
  - 系统错误：HTTP 200，业务状态码 500

**扣分项**：
- 错误分类错误：扣 2 分/处

---

### 7.2 异常转换（2 分）

**满分**：2 分

**评分标准**：
- 优秀（90-100分）：所有异常都正确转换
- 良好（80-89分）：90%以上异常正确转换
- 及格（60-79分）：70%以上异常正确转换
- 不及格（<60分）：低于70%异常正确转换

**检查项**：
- [ ] 领域异常转换为应用层响应（2分）

**示例**：
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

**扣分项**：
- 异常未转换：扣 2 分/处

---

## 快速评分表

| 检查项 | 分值 | 得分 | 备注 |
|--------|------|------|------|
| **应用层职责** | | | |
| 用例编排 | 3 | __ | 核心职责 |
| 事务管理 | 3 | __ | 核心职责 |
| 调用领域层 | 3 | __ | 核心职责 |
| 发布领域事件 | 2 | __ | 核心职责 |
| 返回结果 | 1 | __ | 核心职责 |
| 不包含业务逻辑 | 5 | __ | 职责边界 |
| 只负责编排 | 3 | __ | 职责边界 |
| **用户行为vs系统行为** | | | |
| 用户行为特征 | 4 | __ | 行为分类 |
| 系统行为特征 | 4 | __ | 行为分类 |
| 使用决策树 | 7 | __ | 决策树 |
| **应用服务设计** | | | |
| 服务命名格式 | 5 | __ | "聚合名+Application" |
| 不混淆其他层 | 3 | __ | 服务命名 |
| 动词+名词 | 5 | __ | 方法命名 |
| 表达用例意图 | 3 | __ | 方法命名 |
| 参数校验 | 2 | __ | 服务结构 |
| 调用领域层 | 2 | __ | 服务结构 |
| 保存 | 2 | __ | 服务结构 |
| 发布事件 | 2 | __ | 服务结构 |
| 返回结果 | 1 | __ | 服务结构 |
| **业务逻辑分层** | | | |
| 不包含业务逻辑 | 5 | __ | 职责分离 |
| 只负责编排 | 3 | __ | 职责分离 |
| 参数校验分层 | 4 | __ | 参数校验 |
| 业务规则校验 | 3 | __ | 参数校验 |
| **事务管理** | | | |
| 应用层管理事务 | 5 | __ | 事务边界 |
| 一事务一聚合 | 5 | __ | 事务粒度 |
| **Command和DTO** | | | |
| Command包含输入 | 3 | __ | Command设计 |
| 不含业务规则 | 2 | __ | Command设计 |
| 只包含数据 | 3 | __ | DTO设计 |
| 不含业务逻辑 | 2 | __ | DTO设计 |
| **错误处理** | | | |
| 错误分类正确 | 3 | __ | 错误分类 |
| 异常转换 | 2 | __ | 异常转换 |
| **总计** | 100 | __ | |

---

## 及格标准

- **章节及格线**：60 分
- **优秀线**：80 分
- **核心项必须通过**：
  - 核心职责 ≥ 9 分
  - 不包含业务逻辑 ≥ 4 分
  - 服务命名 ≥ 6 分
  - 服务结构 ≥ 6 分
  - 一事务一聚合 ≥ 4 分

---

## 评分示例

### 优秀示例（94 分）

**场景**：会员应用层设计

**评分过程**：
1. 应用层职责：19/20 分
   - 核心职责：12/12 分（所有职责齐全）
   - 职责边界：7/8 分（基本不包含业务逻辑，扣1分因为有一处参数校验包含了业务规则）

2. 用户行为vs系统行为：14/15 分
   - 行为分类：8/8 分（完全正确区分）
   - 决策树：6/7 分（使用决策树，扣1分因为有一个行为未使用决策树验证）

3. 应用服务设计：23/25 分
   - 服务命名：8/8 分（命名完全符合规范）
   - 方法命名：8/8 分（方法命名完全符合规范）
   - 服务结构：7/9 分（基本遵循统一结构，扣2分因为有两个方法缺少发布事件步骤）

4. 业务逻辑分层：14/15 分
   - 职责分离：8/8 分（完全不包含业务逻辑）
   - 参数校验分层：6/7 分（分层清晰，扣1分因为有一处分层不够清晰）

5. 事务管理：10/10 分
   - 事务边界：5/5 分（应用层管理事务）
   - 事务粒度：5/5 分（一个事务一个聚合）

6. Command和DTO：9/10 分
   - Command 设计：5/5 分（设计完全符合规范）
   - DTO 设计：4/5 分（基本符合规范，扣1分因为有一个 DTO 包含了计算属性）

7. 错误处理：5/5 分
   - 错误分类：3/3 分（分类正确）
   - 异常转换：2/2 分（转换正确）

**总分**：94/100 分（优秀）

**改进建议**：
1. 参数校验不包含业务规则
2. 所有行为都使用决策树验证
3. 补充发布事件步骤
4. 完善参数校验分层
5. DTO 不包含计算属性

---

## 原则追溯

本评分标准基于以下原则：
- application.md 1.1-1.2：应用层职责原则
- application.md 2.1-2.3：用户行为 vs 系统行为原则
- application.md 3.1-3.3：应用服务设计原则
- application.md 4.1-4.2：应用层不包含业务逻辑原则
- application.md 5.1-5.2：事务管理原则
- application.md 6.1-6.2：Command 和 DTO 原则
- application.md 7.1-7.2：错误处理原则

---

## 检查清单对应

本评分标准与 chapter-04-checklist.md 对应：
- 应用层职责 → 检查清单第 1 节
- 用户行为vs系统行为 → 检查清单第 2 节
- 应用服务设计 → 检查清单第 3 节
- 业务逻辑分层 → 检查清单第 4 节
- 事务管理 → 检查清单第 5 节
- Command和DTO → 检查清单第 6 节
- 错误处理 → 检查清单第 7 节
