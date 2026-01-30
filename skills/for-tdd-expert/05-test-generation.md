---
description: Stage 5 - 测试生成（从规格用例推导测试代码）
---

# Stage 5: Test Generation（测试生成）

## 概述

| 项目 | 说明 |
|------|------|
| **执行者** | AI + 人工审核 |
| **输入** | Stage 3 Spec Modeling + Stage 4 Artifact Derivation |
| **产出物** | 《测试代码》 |
| **闸口条件** | 测试覆盖所有用例、测试可运行 |

## 核心理念

**Spec 用例 = 测试用例**

```
规格建模用例              测试代码
─────────────────────────────────────
TC-01 (正向用例)    →    test_happy_path_xxx
TC-10 (边界用例)    →    test_boundary_xxx
TC-20 (Bad Case)    →    test_should_reject_xxx
INV-1 (不变量)      →    断言逻辑
```

## 用例到测试的映射

### 1. 正向用例 → Happy Path 测试

```markdown
## 规格用例
| ID | 场景 | 前置状态 | 操作 | 期望结果 |
|----|------|---------|------|---------|
| TC-01 | 首次订阅 | INACTIVE | subscribe | ACTIVE |
```

```java
// 后端测试
@Test
void test_TC01_subscribe_when_inactive_should_become_active() {
    // Given: 前置状态 INACTIVE
    Membership membership = createMembership(Status.INACTIVE);

    // When: 操作 subscribe
    membership.subscribe(period);

    // Then: 期望结果 ACTIVE
    assertThat(membership.getStatus()).isEqualTo(Status.ACTIVE);
}
```

```swift
// iOS 测试
func test_TC01_subscribe_when_inactive_should_become_active() async throws {
    // Given
    let membership = Membership(status: .inactive)

    // When
    try await membership.subscribe(period: .monthly)

    // Then
    XCTAssertEqual(membership.status, .active)
}
```

### 2. Bad Case → 异常测试

```markdown
## 规格用例
| ID | 场景 | 前置状态 | 操作 | 期望结果 | 覆盖不变量 |
|----|------|---------|------|---------|-----------|
| TC-20 | 非会员发券 | INACTIVE | 发放点券 | 拒绝 | INV-1 |
```

```java
// 后端测试
@Test
void test_TC20_grant_coupon_when_inactive_should_reject() {
    // Given: 前置状态 INACTIVE
    Membership membership = createMembership(Status.INACTIVE);

    // When & Then: 期望拒绝
    assertThatThrownBy(() -> couponService.grant(membership.getId()))
        .isInstanceOf(BusinessException.class)
        .hasMessage("MEMBERSHIP_NOT_ACTIVE");
}
```

### 3. 不变量 → 断言逻辑

```markdown
## 不变量
INV-1: 只有 ACTIVE 状态的会员才能发放点券
```

```java
// Domain 层校验
public void grant(String membershipId) {
    Membership m = membershipRepository.findById(membershipId);

    // INV-1 断言
    Preconditions.checkState(
        m.getStatus() == Status.ACTIVE,
        "INV-1: Only ACTIVE membership can grant coupon"
    );

    // ... 发放逻辑
}
```

## 测试分层

### 后端测试分层

| 层级 | 测试类型 | 覆盖内容 |
|------|---------|---------|
| Domain | 单元测试 | 不变量、状态转移 |
| Application | 集成测试 | 用例编排、事务 |
| Controller | API 测试 | 接口契约、参数校验 |

### iOS 测试分层

| 层级 | 测试类型 | 覆盖内容 |
|------|---------|---------|
| Service | 单元测试 | 业务逻辑、不变量 |
| ViewModel | 单元测试 | 状态管理、用例编排 |
| View | UI 测试 | 用户交互 |

### 前端测试分层

| 层级 | 测试类型 | 覆盖内容 |
|------|---------|---------|
| Service | 单元测试 | 业务逻辑 |
| Composable | 单元测试 | 状态管理 |
| Component | 组件测试 | 渲染、交互 |

## 测试命名规范

```
test_{用例ID}_{操作}_{前置条件}_{期望结果}

示例：
test_TC01_subscribe_when_inactive_should_become_active
test_TC20_grant_coupon_when_inactive_should_reject
test_TC10_check_expiry_when_end_date_is_today_should_expire
```

## 测试覆盖矩阵

```markdown
| 用例 ID | 用例描述 | 后端测试 | iOS 测试 | 前端测试 | 状态 |
|--------|---------|---------|---------|---------|------|
| TC-01 | 首次订阅 | ✅ | ✅ | ✅ | Done |
| TC-20 | 非会员发券 | ✅ | - | - | Done |
```

## 执行流程

```
1. 读取规格建模文档
   ├─ 提取所有用例（TC-XX）
   └─ 提取所有不变量（INV-X）

2. 读取工件推导文档
   ├─ 获取实现位置映射
   └─ 确定测试文件位置

3. 生成测试代码
   ├─ 按用例生成测试方法
   ├─ 按不变量生成断言
   └─ 生成测试覆盖矩阵

4. 输出测试文件
   └─ 提醒用户 Review
```

## 闸口检查清单

进入编码前，必须确认：

- [ ] 每个用例都有对应测试
- [ ] 每个 Bad Case 都有异常测试
- [ ] 不变量都有断言逻辑
- [ ] 测试命名符合规范
- [ ] 测试覆盖矩阵完整

## TDD 工作流集成

### 正向流程（Spec → TDD）

```
Stage 3 规格建模 → Stage 4 工件推导 → Stage 5 测试生成 → 编码实现
                                            ↓
                                    RED: 测试失败
                                            ↓
                                    GREEN: 实现通过
                                            ↓
                                    REFACTOR: 重构
```

### 逆向流程（Bug → Spec → TDD）

```
Bug 发现 → /spec-fix 补充用例 → Stage 5 生成测试 → 修复代码
                                      ↓
                              RED: 复现 Bug
                                      ↓
                              GREEN: 修复通过
```

## 模板

详见 [templates/tpl-test-generation.md](../templates/tpl-test-generation.md)
