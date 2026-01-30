## 可测试性设计

### 1. 单元测试基础

```swift
import XCTest

// ✅ 可测试的 ViewModel 设计
@MainActor
class LoginViewModelTests: XCTestCase {
    var viewModel: LoginViewModel!
    var mockAuthService: MockAuthenticationService!

    override func setUp() {
        super.setUp()
        mockAuthService = MockAuthenticationService()
        viewModel = LoginViewModel(authService: mockAuthService)
    }

    override func tearDown() {
        viewModel = nil
        mockAuthService = nil
        super.tearDown()
    }

    func testLoginSuccess() async {
        // Arrange
        mockAuthService.mockUser = User(id: "1", email: "test@example.com", name: "Test")

        // Act
        await viewModel.login(email: "test@example.com", password: "password")

        // Assert
        XCTAssertEqual(viewModel.currentUser?.email, "test@example.com")
        XCTAssertFalse(viewModel.isLoading)
    }

    func testLoginFailure() async {
        // Arrange
        mockAuthService.shouldThrow = AuthenticationError.invalidCredentials

        // Act
        await viewModel.login(email: "test@example.com", password: "wrong")

        // Assert
        XCTAssertNil(viewModel.currentUser)
        XCTAssertNotNil(viewModel.error)
    }

    func testLoadingState() async {
        // Arrange
        var loadingStates: [Bool] = []
        let task = Task {
            for await isLoading in viewModel.$isLoading.values {
                loadingStates.append(isLoading)
            }
        }

        // Act
        await viewModel.login(email: "test@example.com", password: "password")
        task.cancel()

        // Assert
        XCTAssertTrue(loadingStates.contains(true))
    }
}

// ✅ Mock 服务实现
class MockAuthenticationService: AuthenticationService {
    var mockUser: User?
    var shouldThrow: Error?
    var callCount = 0

    func login(email: String, password: String) async throws -> User {
        callCount += 1

        if let error = shouldThrow {
            throw error
        }

        guard let user = mockUser else {
            throw AuthenticationError.userNotFound
        }

        return user
    }
}
```

### 2. UI 测试

```swift
// ✅ 可测试的 View 设计
struct LoginViewTests: XCTestCase {
    func testLoginViewElements() {
        let sut = LoginView(authService: MockAuthenticationService())

        XCTAssertTrue(sut.body as? LoginView.Body != nil)
    }
}

// ✅ 准备 View 以进行测试
#Preview {
    LoginView(authService: MockAuthenticationService())
        .environmentObject(AppEnvironment(authService: MockAuthenticationService()))
}
```

### 3. 集成测试

```swift
// ✅ 集成测试示例
class AuthenticationFlowTests: XCTestCase {
    var coordinator: AuthenticationCoordinator!
    var mockNetworkService: MockUserNetworkService!
    var mockStorage: MockUserLocalStorage!

    override func setUp() {
        super.setUp()
        mockNetworkService = MockUserNetworkService()
        mockStorage = MockUserLocalStorage()

        let userService = UserService(
            networkService: mockNetworkService,
            storage: mockStorage
        )

        let authService = AuthenticationService(userService: userService)
        coordinator = AuthenticationCoordinator(authService: authService)
    }

    func testCompleteAuthenticationFlow() async {
        // Prepare
        let expectedUser = User(
            id: "1",
            email: "test@example.com",
            name: "Test User"
        )
        mockNetworkService.mockUser = expectedUser

        // Execute authentication
        let result = try? await coordinator.authenticate(
            email: "test@example.com",
            password: "password"
        )

        // Verify user is stored locally
        XCTAssertEqual(mockStorage.savedUser?.id, expectedUser.id)
        XCTAssertEqual(result?.email, expectedUser.email)
    }
}
```
