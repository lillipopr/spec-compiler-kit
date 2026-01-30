# 接口设计方法

## 目录
1. [核心原则](#核心原则)
2. [接口推导步骤](#接口推导步骤)
3. [区分意图与事实](#区分意图与事实)
4. [后端接口设计](#后端接口设计)
5. [前端接口设计](#前端接口设计)
6. [接口收敛三问](#接口收敛三问)

---

## 核心原则

**接口**：为了让状态转移合法发生而存在，不是"为了好用"

- ❌ CRUD 导向：create/get/update/delete
- ✅ 状态转移导向：订阅成功/续费成功/到期

---

## 接口推导步骤

### Step 1：列出所有外部行为

外部行为 = 用户/外部系统触发的行为

| 用户操作 | 触发方式 |
|---------|---------|
| 加载个人资料 | onAppear / 用户下拉刷新 |
| 提交表单 | 点击提交按钮 |
| 删除数据 | 点击删除按钮 |
| 取消操作 | 点击取消按钮 |

### Step 2：区分意图与事实（极重要）

这是新范式的关键分界点，很多人会混淆。

---

## 区分意图与事实

### 核心区分

| 类型 | 定义 | 示例 | 所在层 |
|------|------|------|--------|
| **意图** | 用户想做某事，结果不确定 | 用户发起订阅 | 应用层 |
| **事实** | 已经发生的不可逆事件 | 订阅成功（钱已到账） | 领域层 |

### 关键示例：为什么"发起订阅"不是领域接口？

**反证法**：

如果"发起订阅"是领域接口，会发生什么？

```
POST /subscribe（领域接口）
├─ 用户点击订阅
├─ 调用支付系统
├─ 支付成功？ → 改状态
├─ 支付失败？ → 怎么办？
├─ 用户中途取消？ → 状态怎么回退？
└─ 支付超时？ → 状态挂哪里？
```

状态空间瞬间爆炸！一个接口承载了太多不确定性。

### 正确做法：分层

**应用层（意图接口）**：
```
POST /subscription/order/create
目的：创建支付订单（准备事实）
职责：不改会员状态，只创建订单
```

**领域层（事实接口）**：
```
POST /membership/subscription/success
目的：接收"订阅成功"事实（钱已到账）
职责：状态转移 M0/M2 → M1
前置：只有支付成功后才会调用
```

### 验证标准

**问自己**：这个接口是否对应一个"已经确定为真"的事实？

- ✅ 订阅成功（钱已到账，不可逆）
- ✅ 续费成功（钱已到账，不可逆）
- ❌ 发起订阅（可能失败，可取消）
- ❌ 查询状态（只读，不改状态）

---

## 后端接口设计

### 三层视角完整示例

```
① 用户/产品视角（流程层）
用户点击"订阅" → 跳转支付 → 等待结果

② 应用层（意图接收层）
POST /subscription/order/create
  ├─ 输入：用户ID、商品ID
  ├─ 输出：订单ID
  └─ 职责：准备支付事实，不改会员状态

③ 领域层（事实处理层）
POST /membership/subscription/success
  ├─ 输入：用户ID、支付成功回调
  ├─ 输出：状态变更
  └─ 职责：确认事实后，执行状态转移

④ 基础设施层（支付/定时）
支付回调、定时任务、重试逻辑
```

### 后端三层架构

#### 应用层（Application Layer）
- 职责：接收用户意图 → 验证 → 转化为领域事实
- 接口：面向用户/外部系统
- 规则：不直接改领域状态

#### 领域层（Domain Layer）
- 职责：管理状态、不变量、事实接口
- 接口：只接受已确认事实
- 规则：所有不变量在此校验

#### 系统层（Infrastructure Layer）
- 职责：定时任务、内部行为
- 不暴露外部接口

---

## 前端接口设计

### View → ViewModel 接口（用户意图）

#### 接口推导方法

**Step 1：列出用户操作**

问：用户在界面上可以做什么？

| 用户操作 | 触发方式 |
|---------|---------|
| 加载个人资料 | onAppear / 用户下拉刷新 |
| 提交表单 | 点击提交按钮 |
| 删除数据 | 点击删除按钮 |
| 取消操作 | 点击取消按钮 |

**Step 2：定义用户意图接口**

每个用户操作对应一个 ViewModel 方法。

| 接口名称 | 触发方式 | 方法签名 | 输出状态 |
|---------|---------|---------|---------|
| loadProfile | onAppear/用户下拉 | func loadProfile() async | uiState: idle → loading |
| submitForm | 用户点击提交 | func submit() async throws | uiState: idle → loading |
| refreshData | 用户下拉刷新 | func refresh() async throws | uiState: idle → loading |

#### View → ViewModel 接口示例

**iOS (SwiftUI)**：
```swift
@MainActor
class ProfileViewModel: ObservableObject {
    // MARK: - User Intent Actions
    func loadProfile() async {
        uiState = .loading
        do {
            let profile = try await profileService.fetchProfile()
            self.profile = profile
            uiState = .success
        } catch {
            handleError(error)
        }
    }

    func refresh() async {
        await loadProfile()
    }
}
```

**Android (Jetpack Compose)**：
```kotlin
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val profileService: ProfileService
) : ViewModel() {

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            profileService.fetchProfile()
                .onSuccess { profile ->
                    _profile.value = profile
                    _uiState.value = UiState.Success
                }
                .onFailure { error ->
                    handleError(error)
                }
        }
    }

    fun refresh() {
        loadProfile()
    }
}
```

**Vue 3 (Composable)**：
```javascript
export function useDimensionViewModel() {
  const loadTree = async (typeFilter = '') => {
    uiState.value = 'loading'
    errorMessage.value = ''

    try {
      const data = await dimensionService.fetchTree(typeFilter)
      treeData.value = data
      uiState.value = 'success'
    } catch (err) {
      errorMessage.value = err.message
      uiState.value = 'error'
    }
  }

  return { loadTree }
}
```

### ViewModel → Service 接口（业务调用）

#### Service 层接口设计

**协议定义（iOS）**：
```swift
protocol ProfileServiceProtocol {
    func fetchProfile(userId: String) async throws -> Profile
    func updateProfile(data: ProfileData) async throws -> Profile
}
```

**接口定义（Android）**：
```kotlin
interface ProfileService {
    suspend fun fetchProfile(userId: String): Result<Profile>
    suspend fun updateProfile(data: ProfileData): Result<Profile>
}
```

**Service 接口清单**：

| 接口名称 | 方法签名 | 返回类型 | 说明 |
|---------|---------|---------|------|
| ProfileService | func fetchProfile(userId: String) async throws -> Profile | Publisher | 异步获取用户资料 |
| ProfileService | func updateProfile(data: ProfileData) async throws -> Profile | Publisher | 更新用户资料 |

---

**详细的前端架构设计** → 见 [03-platform-guide/](../03-platform-guide/)

## 接口收敛三问

1. 是否对应一个状态转移或事实？
2. 是否改变了不变量承载实体？
3. 删掉它，系统是否无法完成某个用例？

三个都否 → 不该存在

### 接口语义
接口表达"事实"，不是"操作数据库"
- ❌ createMembership / updateUser / addCoupon
- ✅ POST /membership/subscription/success
