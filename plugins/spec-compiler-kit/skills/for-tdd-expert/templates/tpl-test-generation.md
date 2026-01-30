---
description: 测试生成文档模板
---

# {功能名称} - 测试生成文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | YYYY-MM-DD |
| 关联规格建模 | {规格建模文档链接} |
| 关联工件推导 | {工件推导文档链接} |

## 1. 测试覆盖矩阵

| 用例 ID | 用例描述 | 后端测试 | iOS 测试 | 前端测试 | 状态 |
|--------|---------|---------|---------|---------|------|
| TC-01 | {描述} | ✅ | ✅ | - | Done |
| TC-10 | {描述} | ✅ | - | - | Done |
| TC-20 | {描述} | ✅ | ✅ | - | Done |

## 2. 后端测试

### 2.1 单元测试（Domain 层）

```java
class MembershipTest {

    @Test
    void test_TC01_subscribe_when_inactive_should_become_active() {
        // Given
        // When
        // Then
    }

    @Test
    void test_TC20_grant_coupon_when_inactive_should_reject() {
        // Given
        // When & Then
    }
}
```

### 2.2 集成测试（Application 层）

```java
@SpringBootTest
class MembershipAppServiceTest {

    @Test
    void test_TC01_subscribe_integration() {
        // Given
        // When
        // Then
    }
}
```

## 3. iOS 测试

### 3.1 Service 测试

```swift
final class MembershipServiceTests: XCTestCase {

    func test_TC01_subscribe_when_inactive_should_become_active() async throws {
        // Given
        // When
        // Then
    }
}
```

### 3.2 ViewModel 测试

```swift
@MainActor
final class MembershipViewModelTests: XCTestCase {

    func test_TC01_subscribe_updates_state() async throws {
        // Given
        // When
        // Then
    }
}
```

## 4. 前端测试

### 4.1 Service 测试

```typescript
describe('MembershipService', () => {
  it('TC01: should subscribe successfully', async () => {
    // Given
    // When
    // Then
  })
})
```

### 4.2 Composable 测试

```typescript
describe('useMembership', () => {
  it('TC01: should update state after subscribe', async () => {
    // Given
    // When
    // Then
  })
})
```

## 5. 不变量断言

| 不变量 | 断言位置 | 断言代码 |
|--------|---------|---------|
| INV-1 | Domain.XxxService | `Preconditions.checkState(...)` |

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | YYYY-MM-DD | 初始版本 | {作者} |
