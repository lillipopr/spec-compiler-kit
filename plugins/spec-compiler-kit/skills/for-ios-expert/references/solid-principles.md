## SOLID 原则在 iOS 中的应用

### 1. 单一职责原则 (SRP)

**定义**: 一个类只应该有一个改变的理由。

#### ❌ 反面例子 - 职责混乱

```swift
// 违反 SRP：一个类承担多个职责
class UserManager {
    // 职责 1: 管理用户状态
    var currentUser: User?

    // 职责 2: 网络请求
    func fetchUser(id: String) async throws -> User {
        let url = URL(string: "https://api.example.com/users/\(id)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(User.self, from: data)
    }

    // 职责 3: 本地存储
    func saveUser(_ user: User) {
        let encoder = JSONEncoder()
        let data = try! encoder.encode(user)
        UserDefaults.standard.set(data, forKey: "user")
    }

    // 职责 4: 业务逻辑
    func login(email: String, password: String) async throws {
        let user = try await fetchUser(id: email)
        self.currentUser = user
        saveUser(user)
    }
}
```

#### ✅ 符合 SRP 的设计

```swift
// 职责 1: 网络请求
protocol UserNetworkService {
    func fetchUser(id: String) async throws -> User
}

class DefaultUserNetworkService: UserNetworkService {
    private let session: URLSession
    private let decoder: JSONDecoder

    init(session: URLSession = .shared, decoder: JSONDecoder = JSONDecoder()) {
        self.session = session
        self.decoder = decoder
    }

    func fetchUser(id: String) async throws -> User {
        let url = URL(string: "https://api.example.com/users/\(id)")!
        let (data, _) = try await session.data(from: url)
        return try decoder.decode(User.self, from: data)
    }
}

// 职责 2: 本地存储
protocol UserLocalStorage {
    func save(_ user: User) throws
    func load() -> User?
}

class KeychainUserStorage: UserLocalStorage {
    private let service = "com.lightcone.user"

    func save(_ user: User) throws {
        let encoder = JSONEncoder()
        let data = try encoder.encode(user)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecValueData as String: data
        ]
        try? SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    func load() -> User? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecReturnData as String: true
        ]
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        guard let data = result as? Data else { return nil }
        return try? JSONDecoder().decode(User.self, from: data)
    }
}

// 职责 3: 业务逻辑
protocol AuthenticationService {
    func login(email: String, password: String) async throws -> User
}

class DefaultAuthenticationService: AuthenticationService {
    private let networkService: UserNetworkService
    private let storage: UserLocalStorage

    init(
        networkService: UserNetworkService,
        storage: UserLocalStorage
    ) {
        self.networkService = networkService
        self.storage = storage
    }

    func login(email: String, password: String) async throws -> User {
        let user = try await networkService.fetchUser(id: email)
        try storage.save(user)
        return user
    }
}

// 职责 4: 状态管理
@MainActor
class AuthenticationViewModel: ObservableObject {
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var error: Error?

    private let authService: AuthenticationService

    init(authService: AuthenticationService) {
        self.authService = authService
    }

    func login(email: String, password: String) async {
        isLoading = true
        defer { isLoading = false }

        do {
            currentUser = try await useCase.login(email: email, password: password)
        } catch {
            self.error = error
        }
    }
}
```

**关键要点**:
- 网络服务职责单一：只负责 API 调用
- 存储服务职责单一：只负责数据持久化
- 使用用例（Use Case）隔离业务逻辑
- ViewModel 只负责 UI 状态管理

---

### 2. 开闭原则 (OCP)

**定义**: 对扩展开放，对修改关闭。

#### ❌ 反面例子 - 每次添加新功能都修改代码

```swift
// 每次添加新的数据源都要修改这个类
class DataManager {
    func fetchData(source: String) async throws -> [String] {
        if source == "api" {
            // API 请求逻辑
            return try await fetchFromAPI()
        } else if source == "database" {
            // 数据库逻辑
            return try fetchFromDatabase()
        } else if source == "cache" {
            // 缓存逻辑
            return try fetchFromCache()
        }
        return []
    }
}
```

#### ✅ 符合 OCP 的设计 - 使用策略模式

```swift
// 定义数据源协议
protocol DataSource {
    associatedtype Output
    func fetch() async throws -> Output
}

// 具体实现 - 无需修改现有代码，只需添加新的 DataSource
class APIDataSource: DataSource {
    typealias Output = [String]

    func fetch() async throws -> [String] {
        // API 实现
        return try await fetchFromAPI()
    }

    private func fetchFromAPI() async throws -> [String] {
        // 真实实现
        []
    }
}

class DatabaseDataSource: DataSource {
    typealias Output = [String]

    func fetch() async throws -> [String] {
        // 数据库实现
        return try fetchFromDatabase()
    }

    private func fetchFromDatabase() throws -> [String] {
        // 真实实现
        []
    }
}

class CacheDataSource: DataSource {
    typealias Output = [String]

    func fetch() async throws -> [String] {
        // 缓存实现
        return try fetchFromCache()
    }

    private func fetchFromCache() throws -> [String] {
        // 真实实现
        []
    }
}

// 数据管理器 - 对扩展开放，对修改关闭
class DataManager<Source: DataSource> {
    private let dataSource: Source

    init(dataSource: Source) {
        self.dataSource = dataSource
    }

    func fetch() async throws -> Source.Output {
        try await dataSource.fetch()
    }
}

// 使用示例 - 添加新的数据源无需修改现有代码
let apiManager = DataManager(dataSource: APIDataSource())
let databaseManager = DataManager(dataSource: DatabaseDataSource())
let cacheManager = DataManager(dataSource: CacheDataSource())
```

---

### 3. 里氏替换原则 (LSP)

**定义**: 子类对象应该可以替换父类对象。

#### ❌ 反面例子 - 破坏契约

```swift
// 父类
protocol PaymentProcessor {
    func process(amount: Double) throws
}

// 子类 1 - 正常实现
class CreditCardProcessor: PaymentProcessor {
    func process(amount: Double) throws {
        guard amount > 0 else { throw PaymentError.invalidAmount }
        // 处理支付
    }
}

// 子类 2 - 违反契约（父类没有金额限制，子类却有）
class MockPaymentProcessor: PaymentProcessor {
    func process(amount: Double) throws {
        guard amount <= 1000 else { throw PaymentError.amountTooLarge }
        // 处理支付
    }
}

// 这会导致不可预测的行为
func processPayment(processor: PaymentProcessor, amount: Double) throws {
    try processor.process(amount: amount)  // 不同的处理器有不同的限制
}
```

#### ✅ 符合 LSP 的设计

```swift
// 定义清晰的协议
protocol PaymentProcessor {
    func process(amount: Double) throws
    var maxAmount: Double? { get }  // 明确表达限制
}

class CreditCardProcessor: PaymentProcessor {
    let maxAmount: Double? = nil  // 无限制

    func process(amount: Double) throws {
        guard amount > 0 else { throw PaymentError.invalidAmount }
    }
}

class MockPaymentProcessor: PaymentProcessor {
    let maxAmount: Double? = 1000  // 明确限制

    func process(amount: Double) throws {
        guard let max = maxAmount, amount <= max else {
            throw PaymentError.amountTooLarge
        }
        guard amount > 0 else { throw PaymentError.invalidAmount }
    }
}

// 调用方可以检查限制
func processPayment(processor: PaymentProcessor, amount: Double) throws {
    if let max = processor.maxAmount, amount > max {
        throw PaymentError.amountExceedsLimit
    }
    try processor.process(amount: amount)
}
```

---

### 4. 接口隔离原则 (ISP)

**定义**: 客户端不应该依赖它不使用的接口。

#### ❌ 反面例子 - 过度设计的协议

```swift
// 一个庞大的协议，包含所有可能的操作
protocol UserService {
    func fetchUser(id: String) async throws -> User
    func updateProfile(_ profile: UserProfile) async throws
    func uploadAvatar(_ image: UIImage) async throws
    func deleteAccount() async throws
    func sendVerificationCode(email: String) async throws
    func resetPassword(token: String, newPassword: String) async throws
    func getPaymentMethods() async throws -> [PaymentMethod]
    func updatePaymentMethod(_ method: PaymentMethod) async throws
}

// 简单的登录视图，但必须依赖整个 UserService
class LoginView: View {
    @StateObject private var viewModel: LoginViewModel

    init(userService: UserService) {
        _viewModel = StateObject(wrappedValue: LoginViewModel(userService: userService))
    }

    var body: some View {
        // ...
    }
}
```

#### ✅ 符合 ISP 的设计 - 细粒度协议

```swift
// 按职责划分协议
protocol AuthenticationService {
    func fetchUser(id: String) async throws -> User
    func sendVerificationCode(email: String) async throws
}

protocol ProfileService {
    func updateProfile(_ profile: UserProfile) async throws
    func uploadAvatar(_ image: UIImage) async throws
}

protocol AccountService {
    func deleteAccount() async throws
    func resetPassword(token: String, newPassword: String) async throws
}

protocol PaymentService {
    func getPaymentMethods() async throws -> [PaymentMethod]
    func updatePaymentMethod(_ method: PaymentMethod) async throws
}

// 登录视图只依赖它需要的接口
class LoginView: View {
    @StateObject private var viewModel: LoginViewModel

    init(authService: AuthenticationService) {
        _viewModel = StateObject(wrappedValue: LoginViewModel(authService: authService))
    }

    var body: some View {
        // ...
    }
}

// 账户设置视图依赖不同的接口
class AccountSettingsView: View {
    @StateObject private var viewModel: AccountSettingsViewModel

    init(accountService: AccountService, profileService: ProfileService) {
        _viewModel = StateObject(
            wrappedValue: AccountSettingsViewModel(
                accountService: accountService,
                profileService: profileService
            )
        )
    }

    var body: some View {
        // ...
    }
}
```

---

### 5. 依赖倒置原则 (DIP)

**定义**: 依赖抽象，不依赖具体实现。

#### ❌ 反面例子 - 硬依赖

```swift
// ViewModel 直接依赖具体的网络实现
class ProfileViewModel: ObservableObject {
    private let networkService = UserNetworkService()  // 硬依赖

    func loadProfile() async {
        // ...
    }
}

// 难以测试 - 无法注入 Mock 数据
```

#### ✅ 符合 DIP 的设计

```swift
// 依赖抽象
protocol UserNetworkService {
    func fetchUserProfile(id: String) async throws -> UserProfile
}

// 具体实现
class DefaultUserNetworkService: UserNetworkService {
    func fetchUserProfile(id: String) async throws -> UserProfile {
        // 真实网络请求
        []
    }
}

// Mock 实现用于测试
class MockUserNetworkService: UserNetworkService {
    var mockProfile: UserProfile?
    var shouldThrow: Error?

    func fetchUserProfile(id: String) async throws -> UserProfile {
        if let error = shouldThrow {
            throw error
        }
        return mockProfile ?? UserProfile()
    }
}

// ViewModel 依赖抽象，通过构造函数注入
@MainActor
class ProfileViewModel: ObservableObject {
    @Published var profile: UserProfile?
    @Published var isLoading = false

    private let networkService: UserNetworkService

    init(networkService: UserNetworkService) {
        self.networkService = networkService
    }

    func loadProfile(id: String) async {
        isLoading = true
        defer { isLoading = false }

        do {
            profile = try await networkService.fetchUserProfile(id: id)
        } catch {
            // 错误处理
        }
    }
}

// 测试变得简单
class ProfileViewModelTests: XCTestCase {
    func testLoadProfileSuccess() async {
        // 准备 Mock 服务
        let mockService = MockUserNetworkService()
        mockService.mockProfile = UserProfile(id: "1", name: "Test")

        // 创建 ViewModel
        let viewModel = ProfileViewModel(networkService: mockService)

        // 验证行为
        await viewModel.loadProfile(id: "1")
        XCTAssertEqual(viewModel.profile?.name, "Test")
    }
}
```

