# 不变量定义方法

## 目录
1. [不变量特征](#不变量特征)
2. [验证标准（三测试）](#验证标准三测试)
3. [业务不变量](#业务不变量)
4. [UI 不变量](#ui-不变量)
5. [判断型系统不变量](#判断型系统不变量)

---

## 不变量特征

### 定义
不变量（Invariant）= 系统中**永远为真**的约束条件

### 核心特征
- **永远为真**：不是 if 判断，不是"一般情况下"
- **可自动验证**：能写成 assert 语句
- **不依赖实现**：与代码细节无关

### 与业务规则的区别

| 类型 | 业务规则 | 不变量 |
|------|---------|--------|
| **性质** | 描述性 | 约束性 |
| **验证** | 人工审核 | 自动化测试 |
| **违反** | 警告 | 系统拒绝 |
| **示例** | "用户应该填写邮箱" | "无邮箱不能创建账号" |

---

## 验证标准（三测试）

每个不变量必须通过以下三个测试：

### ✅ 测试 1：可执行

**问题**：能否写成 assert 语句？

#### 业务不变量示例

```python
# 自然语言描述
INV-1: 只有 M1 状态才能发放点券

# 转换为 assert
assert membership.state == "M1" or coupon_grant_amount == 0
```

```python
# 自然语言描述
INV-2: 每天最多发放一次（幂等）

# 转换为 assert
assert count_daily_grants(user_id, date) <= 1
```

#### UI 不变量示例

```swift
// 自然语言描述
UI-INV-01: Loading 状态下提交按钮必须 disabled

// 转换为 assert
assert uiState != .loading || submitDisabled == true
```

---

### ✅ 测试 2：可测试

**问题**：能否设计用例验证它？

#### 业务不变量用例

```gherkin
Case: 验证 INV-1
Given：会员状态 = M0
When：触发刷新点券
Then：点券增加量 = 0
```

#### UI 不变量用例

```gherkin
Case-UI-01：加载状态正确显示
Given：用户进入页面，数据未加载
When：触发数据加载
Then：
  - UI 状态：UI-0 → UI-1
  - 显示：LoadingView（加载指示器）
  - 交互：提交按钮 disabled
  - 约束：UI-INV-01
```

---

### ✅ 测试 3：可解释

**问题**：能否用自然语言解释为什么它必须成立？

#### 业务不变量解释

> INV-1 的原因：点券是会员权益，非会员不应获得，否则违反商业规则

#### UI 不变量解释

> UI-INV-01 的原因：Loading 状态表示异步操作进行中，此时允许用户提交可能导致重复请求或状态混乱。

---

### ❌ 不合格示例

| 不合格描述 | 问题 | 正确写法 |
|-----------|------|---------|
| "一般情况下用户应该..." | 模糊，无法验证 | "用户必须..." |
| "正常情况下不超过..." | 什么情况算"正常"？ | "始终 ≤ X" |
| "用户不应该..." | 这是期望，不是约束 | "系统拒绝..." |
| "尽量保证..." | 无法自动化验证 | "必须保证..." |

---

## 业务不变量

### 定义示例

```
INV-1：只有 M1 状态才能发放点券
INV-2：每个用户每天最多发放一次（幂等）
INV-3：同一天点券总量 ≤ 100
INV-4：会员到期当天 0 点后不得再发放
```

### 实体收敛原则

**一个实体 = 一组必须被一起保护的不变量**

| 不变量 | 依附对象 |
|--------|----------|
| INV-1 会员才能发 | 用户会员身份 |
| INV-2 每天一次 | 用户 + 日期 |
| INV-3 总量 ≤ 100 | 会员账户 |

### 实体收敛三问

1. 是否承载至少一个不变量？
2. 是否有生命周期？
3. 是否需要被并发保护？

少于 2 个 → 不该是实体（值对象/计算结果）

---

## UI 不变量

### UI 不变量 vs 业务不变量

| 特征 | 业务不变量 | UI 不变量 |
|------|-----------|----------|
| **关注点** | 业务规则正确性 | UI 行为一致性 |
| **验证方式** | 后端 assert | UI 自动化测试 |
| **失败影响** | 业务错误 | 用户体验问题 |

### UI 不变量清单

| 不变量编号 | 不变量描述 | 验证方式 |
|-----------|-----------|---------|
| UI-INV-01 | Loading 状态下提交按钮必须 disabled | assert loading implies submitDisabled |
| UI-INV-02 | 错误状态必须显示明确的错误信息 | assert errorState implies errorMessage != nil |
| UI-INV-03 | 网络请求期间必须显示加载状态 | assert networking implies loading |
| UI-INV-04 | 空数据状态必须显示空页面提示 | assert isEmpty implies showEmptyView |
| UI-INV-05 | 列表滚动时禁止触发刷新 | assert isScrolling implies !refreshing |

### UI 不变量验证示例

#### Swift 单元测试

```swift
// UI-INV-01: Loading 状态下提交按钮必须 disabled
func test_submitButtonDisabledWhenLoading() {
    // Given
    let viewModel = ProfileViewModel()
    viewModel.uiState = .loading

    // Then
    XCTAssertTrue(viewModel.isLoading)
    XCTAssertTrue(viewModel.submitDisabled) // Derived property
}
```

#### Kotlin 单元测试

```kotlin
// UI-INV-01: Loading 状态下提交按钮必须 disabled
@Test
fun submitButtonDisabledWhenLoading() {
    // Given
    val viewModel = ProfileViewModel()
    viewModel.uiState = UiState.Loading

    // Then
    assertTrue(viewModel.isLoading)
    assertTrue(viewModel.submitDisabled) // Derived property
}
```

---

**详细的 UI 状态建模和不变量** → 见 [03-platform-guide/](../03-platform-guide/)

## 判断型系统不变量

### 可解释性约束（极重要）

判断型系统的核心价值在于"可解释"。

#### 可解释性不变量

```
INV-5：每个标签必须能回溯到具体指标区间
INV-6：报告必须能解释"为什么是这个结果"
INV-7：每个维度得分必须能追溯到具体题目
```

#### 验证标准

**能否回答"为什么"**？

```gherkin
Case：验证可解释性
Given：用户获得标签"情感导向型"
When：用户问"为什么是这个标签？"
Then：系统能回答：
  "因为您的情感依赖度得分是 85（来自 Q1 和 Q5），
   高于现实条件得分 40，所以判断为情感导向型"
```

### 评估坐标系不变量

```
INV-1：每道题只能归属一个指标
INV-2：指标必须能被量化
INV-3：标签必须由指标区间唯一确定
INV-4：标签区间不能重叠
```

---

**判断型系统特化** → 见 [04-domain-specific/evaluation-systems.md](../04-domain-specific/evaluation-systems.md)
