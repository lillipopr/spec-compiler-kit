# Phase 2: 可执行约束（跨端一致）

> **跨端一致性**：本文档的约束适用于所有端。
> 各端实现时将伪代码翻译为对应语言（Java/Swift/TypeScript）。

## 目标

将 Phase 1 的不变量转化为可执行的验证逻辑，确保约束可以被代码检查。

**关键原则**：使用统一的伪代码/DSL 定义约束，不绑定具体编程语言。各端实现时翻译为对应语言。

## 2.0 核心变化

### 原版 vs 2.0

| 维度 | 原版设计 | 2.0 设计 |
|------|---------|---------|
| 约束格式 | 模板 A/B/C 按功能类型分，用 Python/Swift/Java | **统一伪代码/DSL** |
| 语言绑定 | 绑定具体语言 | **不绑定语言** |
| 实现位置 | 各端独立定义 | **统一定义 + 各端实现位置映射** |

---

## 约束分类体系

| 类型 | 前缀 | 说明 | 执行时机 |
|------|------|------|----------|
| 结构约束 | STR- | 数据结构完整性 | 创建/更新时 |
| 业务约束 | BIZ- | 业务规则正确性 | 操作时 |
| 状态约束 | STA- | 状态转移合法性 | 状态变更时 |
| 版本约束 | VER- | 版本不可变性 | 修改时 |
| 可解释性约束 | EXP- | 结果可追溯性 | 生成报告时 |

---

## 约束定义格式（统一伪代码）

每个约束必须包含：

```markdown
### INV-XX: {约束名称}

**约束描述**：{一句话描述}

**伪代码**：
```
ASSERT {条件表达式}
ON_VIOLATION: THROW "{约束ID}: {错误信息}"
```

**各端实现位置**：
| 端 | 层级 | 文件 | 方法 |
|----|------|------|------|
| 后端 | Domain | XxxDomain.java | validateXxx() |
| iOS | Service | XxxService.swift | validateXxx() |
| 前端 | Service | xxxService.ts | validateXxx() |
```

---

## 伪代码语法规范

### 基本语法

```
# 断言
ASSERT <condition>
ON_VIOLATION: THROW "<error_message>"

# 条件判断
IF <condition> THEN
    <statements>
ELSE
    <statements>
END IF

# 循环
FOR EACH <item> IN <collection>
    <statements>
END FOR

# 函数定义
FUNCTION <name>(<params>) -> <return_type>
    <statements>
    RETURN <value>
END FUNCTION

# 常用操作符
==, !=, <, >, <=, >=    # 比较
AND, OR, NOT            # 逻辑
IN, NOT IN              # 集合
SUM(), COUNT(), MAX()   # 聚合
```

### 示例约束

```
# INV-01: 订单金额计算正确性
ASSERT order.total_amount == SUM(item.price * item.quantity FOR item IN order.items)
ON_VIOLATION: THROW "INV-01: 订单金额计算错误"

# INV-02: 库存非负
ASSERT inventory.quantity >= 0
ON_VIOLATION: THROW "INV-02: 库存不能为负"

# INV-03: 状态转移合法性
ASSERT (current_state, event) IN ALLOWED_TRANSITIONS
ON_VIOLATION: THROW "INV-03: 非法状态转移"
```

---

## 完整约束定义示例

### INV-01: 订单金额计算正确性

**约束描述**：订单总金额必须等于所有订单项金额之和

**伪代码**：
```
FUNCTION validate_order_amount(order) -> bool
    calculated_amount = SUM(item.price * item.quantity FOR item IN order.items)
    ASSERT order.total_amount == calculated_amount
    ON_VIOLATION: THROW "INV-01: 订单金额计算错误, expected={calculated_amount}, actual={order.total_amount}"
    RETURN true
END FUNCTION
```

**各端实现位置**：
| 端 | 层级 | 文件 | 方法 |
|----|------|------|------|
| 后端 | Domain | OrderDomain.java | validateAmount() |
| iOS | Service | OrderService.swift | validateAmount() |
| 前端 | Service | orderService.ts | validateAmount() |

---

### INV-02: 会员状态才能发放点券

**约束描述**：只有生效中（M1）的会员才能发放点券

**伪代码**：
```
FUNCTION validate_coupon_grant(membership, grant_amount) -> bool
    ASSERT membership.state == "M1" OR grant_amount == 0
    ON_VIOLATION: THROW "INV-02: 非会员不能发放点券, state={membership.state}"
    RETURN true
END FUNCTION
```

**各端实现位置**：
| 端 | 层级 | 文件 | 方法 |
|----|------|------|------|
| 后端 | Domain | MembershipDomain.java | validateCouponGrant() |
| iOS | Service | MembershipService.swift | validateCouponGrant() |
| 前端 | Service | membershipService.ts | validateCouponGrant() |

---

### INV-03: 每日发放幂等性

**约束描述**：每个用户每天最多发放一次点券

**伪代码**：
```
FUNCTION validate_daily_grant_idempotent(user_id, date) -> bool
    grant_count = COUNT(grants WHERE grants.user_id == user_id AND grants.date == date)
    ASSERT grant_count <= 1
    ON_VIOLATION: THROW "INV-03: 每日发放重复, user_id={user_id}, date={date}, count={grant_count}"
    RETURN true
END FUNCTION
```

**各端实现位置**：
| 端 | 层级 | 文件 | 方法 |
|----|------|------|------|
| 后端 | Domain | CouponDomain.java | validateDailyGrant() |
| iOS | Service | CouponService.swift | validateDailyGrant() |
| 前端 | - | - | 后端校验 |

---

## 状态转移表（统一定义）

```
# 状态转移表定义（伪代码）
ALLOWED_TRANSITIONS = {
    # (当前状态, 事件) -> (下一状态, [约束列表])
    ("M0", "payment_success"): ("M1", [INV-01, INV-02]),
    ("M1", "renewal_success"): ("M1", [INV-01]),
    ("M1", "membership_expire"): ("M2", []),
    ("M2", "reactivate"): ("M1", [INV-01, INV-02]),
}

FUNCTION validate_state_transition(current_state, event, next_state) -> bool
    key = (current_state, event)
    ASSERT key IN ALLOWED_TRANSITIONS
    ON_VIOLATION: THROW "STA-01: 未定义的状态转移"

    expected_state, constraints = ALLOWED_TRANSITIONS[key]
    ASSERT next_state == expected_state
    ON_VIOLATION: THROW "STA-02: 状态转移目标错误"

    FOR EACH constraint IN constraints
        constraint.validate()
    END FOR

    RETURN true
END FUNCTION
```

---

## 禁止态（统一定义）

```
# 禁止态定义（伪代码）
PROHIBITED_TRANSITIONS = {
    # (当前状态, 目标状态) -> "禁止原因"
    ("M2", "M1"): "过期会员不能自动恢复，必须重新购买",
    ("O2", "O0"): "已发货订单不能回退到待支付",
}

FUNCTION validate_not_prohibited(current_state, next_state) -> bool
    key = (current_state, next_state)
    ASSERT key NOT IN PROHIBITED_TRANSITIONS
    ON_VIOLATION: THROW "STA-03: 禁止的状态转移, reason={PROHIBITED_TRANSITIONS[key]}"
    RETURN true
END FUNCTION
```

---

## 约束优先级

| 优先级 | 描述 | 处理策略 |
|-------|------|----------|
| **P0** | 数据一致性破坏 | 立即抛异常，回滚事务 |
| **P1** | 业务规则违反 | 阻止操作，返回错误 |
| **P2** | 数据完整性问题 | 记录警告，允许操作 |
| **P3** | 可解释性问题 | 记录日志，人工审核 |

---

## 闸口检查

Phase 2 完成后，必须通过以下检查：

- [ ] 每个不变量至少对应一个约束定义
- [ ] 每个约束都有伪代码定义（可执行）
- [ ] 每个约束都标注了各端实现位置
- [ ] 约束覆盖结构、业务、状态三类
- [ ] P0 级别约束有明确的回滚机制
- [ ] **跨端一致性确认**：所有端使用同一份约束定义

## 自我验证

在进入下一阶段前，确认：

- [ ] 伪代码语法正确，无歧义
- [ ] 各端实现位置已明确
- [ ] 状态转移表完整
- [ ] 禁止态已定义
- [ ] **无平台特定语法**：约束定义不包含任何平台特定的语法

---

**上一步** → [Phase 1: 问题建模](phase-1-modeling.md)
**下一步** → [Phase 3: 用例设计](phase-3-use-cases.md)
