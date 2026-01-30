## Lightweight MVVM 项目结构

### 结构选择指南

根据项目复杂度选择合适的结构：

- **小项目（< 10 个页面）**: 使用基础结构
- **中大型项目（10-50 个页面）**: 使用标准结构
- **复杂项目（> 50 个页面）**: 使用扩展结构

---

### 1. 基础结构（小项目）

适用于小型应用，关注快速开发：

```
YourApp/
├── App/                          # 应用入口
│   ├── YourApp.swift            # @main App 入口
│   └── ContentView.swift        # 主视图（TabView 或 NavigationView）
│
├── Views/                        # SwiftUI 视图
│   ├── Home/
│   │   ├── HomeView.swift
│   │   └── HomeDetailView.swift
│   ├── Profile/
│   │   ├── ProfileView.swift
│   │   └── EditProfileView.swift
│   └── Settings/
│       └── SettingsView.swift
│
├── ViewModels/                   # ViewModel 层
│   ├── HomeViewModel.swift
│   ├── ProfileViewModel.swift
│   └── SettingsViewModel.swift
│
├── Models/                       # 数据模型
│   ├── User.swift
│   ├── Post.swift
│   └── Comment.swift
│
├── Services/                     # 服务层
│   ├── NetworkManager.swift     # 网络管理器（Alamofire 或 URLSession）
│   ├── UserService.swift        # 用户相关服务
│   └── AuthService.swift        # 认证服务
│
├── Components/                   # 可复用 UI 组件
│   ├── LoadingView.swift
│   ├── ErrorView.swift
│   └── EmptyStateView.swift
│
└── Resources/                    # 资源文件
    ├── Assets.xcassets/
    └── Localizable.strings
```

---

### 2. 标准结构（中大型项目）

适用于中大型应用，引入 Core 层统一管理基础设施：

```
YourApp/
├── App/                          # 应用入口
│   ├── YourApp.swift            # @main App 入口
│   └── ContentView.swift        # 主视图
│
├── Core/                         # 核心基础设施层
│   ├── AppState.swift           # 全局状态管理（认证、UI 状态）
│   ├── Navigation/              # 路由系统
│   │   ├── Router.swift         # 导航管理器（iOS 16+）
│   │   └── AppRoute.swift       # 路由枚举定义
│   ├── Utilities/               # 工具类
│   │   ├── NetworkManager.swift # 网络管理器封装
│   │   ├── Logger.swift         # 统一日志系统
│   │   ├── ErrorHandler.swift   # 错误处理
│   │   └── KeychainManager.swift # Keychain 存储
│   └── Extensions/              # 扩展
│       ├── String+Extensions.swift
│       └── View+Extensions.swift
│
├── Views/                        # SwiftUI 视图
├── ViewModels/                   # ViewModel 层
├── Models/                       # 数据模型
│   └── DTOs/                    # 网络传输对象
│       ├── UserDTO.swift
│       └── PostDTO.swift
│
├── Services/                     # 业务逻辑层
│   ├── UserService.swift        # 用户服务
│   ├── AuthService.swift        # 认证服务
│   └── Cache/                   # 缓存层（可选）
│       └── MemoryCache.swift
│
├── Components/                   # 可复用 UI 组件
└── Resources/                    # 资源文件
```

---

### 3. 扩展结构（复杂项目）

适用于复杂应用，引入 Gateway 层、事件总线、依赖注入：

```
YourApp/
├── App/                          # 应用入口
│   ├── YourApp.swift            # @main App 入口
│   └── ContentView.swift        # 主视图
│
├── Core/                         # 核心基础设施层
│   ├── AppState.swift           # 全局状态管理
│   ├── Navigation/              # 路由系统
│   │   ├── Router.swift
│   │   └── AppRoute.swift
│   ├── Utilities/               # 工具类
│   │   ├── NetworkManager.swift
│   │   ├── DependencyContainer.swift # 依赖注入容器
│   │   ├── Logger.swift
│   │   ├── ErrorHandler.swift
│   │   └── KeychainManager.swift
│   ├── EventMQ/                 # 事件总线（跨模块通信）
│   │   └── XxxEventPublisher.swift
│   ├── Enums/                   # 枚举定义
│   │   └── AppEnvironment.swift
│   └── Extensions/              # 扩展
│
├── Views/                        # SwiftUI 视图
├── ViewModels/                   # ViewModel 层
├── Models/                       # 数据模型
│   └── DTOs/                    # 网络传输对象
│
├── Gateways/                     # API 网关层（防腐层）
│   ├── UserAPI.swift            # API 协议定义
│   ├── PostAPI.swift
│   └── Impl/                    # API 实现
│       ├── UserAPIImpl.swift
│       └── PostAPIImpl.swift
│
├── Services/                     # 业务逻辑层
│   ├── UserService.swift        # 服务协议
│   ├── AuthService.swift
│   ├── PostService.swift
│   ├── Impl/                    # 服务实现
│   │   ├── UserServiceImpl.swift
│   │   └── PostServiceImpl.swift
│   ├── Cache/                   # 缓存层
│   │   ├── CacheProtocol.swift
│   │   └── MemoryCache.swift
│   └── Mock/                    # Mock 服务（开发环境）
│       ├── MockUserService.swift
│       └── MockPostService.swift
│
├── Components/                   # 可复用 UI 组件
│   ├── Common/                  # 通用组件
│   │   ├── LoadingView.swift
│   │   ├── ErrorView.swift
│   │   └── EmptyStateView.swift
│   └── Business/                # 业务组件（可选）
│       └── UserCard.swift
│
├── Resources/                    # 资源文件
│   ├── Assets.xcassets/
│   ├── Localizable.strings
│   └── Fonts/
│
└── Configurations/               # 构建配置（可选）
    ├── Debug.xcconfig           # 测试环境配置
    └── Release.xcconfig         # 生产环境配置
```

### 架构分层职责

#### 核心分层（所有项目必需）

**1. Views（视图层）**
- **职责**: UI 渲染和用户交互
- **原则**:
  - 只负责展示，不包含业务逻辑
  - 通过 `@StateObject` 或 `@ObservedObject` 绑定 ViewModel
  - 响应用户操作，调用 ViewModel 方法
- **依赖**: 只依赖 ViewModel，不直接依赖 Service

**2. ViewModels（视图模型层）**
- **职责**: 状态管理和业务逻辑编排
- **原则**:
  - 管理 UI 状态（`@Published` 属性）
  - 调用 Services 获取数据
  - 处理 UI 相关的业务逻辑和数据转换
  - 标记为 `@MainActor` 确保线程安全
- **依赖**: 依赖 Service 协议（可选），不依赖具体实现

**3. Models（模型层）**
- **职责**: 数据结构定义
- **类型**:
  - **Domain Model**: 领域模型（如 `User`）
  - **DTO**: 数据传输对象（如 `UserDTO`）
- **原则**:
  - 纯数据结构，不包含业务逻辑
  - 遵循 `Codable` 协议（用于网络传输）
  - 遵循 `Identifiable` 协议（用于 SwiftUI 列表）

**4. Services（服务层）**
- **职责**: 业务逻辑和数据获取
- **类型**:
  - **业务服务**: 封装业务逻辑（如 `UserService`）
  - **基础设施服务**: 网络请求、存储、日志（如 `NetworkManager`）
- **原则**:
  - 封装网络请求和 API 调用
  - 处理认证和授权
  - 返回 Combine Publisher 或 async/await
  - 支持协议抽象（便于测试和 Mock）

**5. Components（组件层）**
- **职责**: 可复用的 UI 组件
- **原则**:
  - 高度可复用
  - 通过参数配置行为
  - 不包含业务逻辑

---

#### 扩展分层（中大型项目可选）

**6. Core（核心基础设施层）**
- **AppState**: 全局状态管理（认证、UI 状态）
  - 管理用户登录状态
  - 管理 UI 状态（Tab 选择、弹窗显示）
  - 提供 Token 管理
- **Router**: 路由系统（iOS 16+ NavigationStack）
  - 统一管理应用内导航
  - 支持 Tab 切换、页面跳转、Sheet、全屏覆盖
- **Utilities**: 工具类
  - NetworkManager: 网络管理器封装（Alamofire 或 URLSession）
  - Logger: 统一日志系统
  - ErrorHandler: 统一错误处理
  - KeychainManager: 敏感数据存储

**7. Gateways（API 网关层）**
- **职责**: API 调用隔离（防腐层模式）
- **设计模式**:
  - 定义协议（如 `UserAPI`）
  - 实现类调用 NetworkManager（如 `UserAPIImpl`）
- **优势**:
  - 隔离外部 API 变更
  - 支持 Mock 实现（测试环境）
  - 便于替换网络库

**8. EventMQ（事件总线）**
- **职责**: 跨模块通信
- **使用场景**:
  - Profile 创建/更新/删除事件
  - 登录状态变更通知
  - 数据刷新事件
- **实现方式**:
  - 使用 Combine 的 PassthroughSubject
  - 定义事件枚举
  - 提供 Publisher 供订阅

**9. DependencyContainer（依赖注入容器）**
- **职责**: 统一管理依赖创建
- **使用场景**:
  - 管理单例对象（NetworkManager、AppState）
  - 提供工厂方法创建 Service 和 ViewModel
  - 支持不同环境配置（开发、测试、生产）
- **优势**:
  - 集中管理依赖关系
  - 便于切换 Mock 数据
  - 提高可测试性

---

### 架构演进路径

```
基础结构 → 标准结构 → 扩展结构
    ↓           ↓           ↓
 小项目      中大型项目    复杂项目
```

**何时升级结构**:
- 需要全局状态管理 → 添加 Core/AppState
- 需要统一路由管理 → 添加 Core/Router
- API 变更频繁或需要 Mock → 添加 Gateways 层
- 跨模块通信复杂 → 添加 EventMQ
- 依赖关系复杂 → 添加 DependencyContainer

---

## 代码示例

### 1. Model 定义

```swift
// User.swift
struct User: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
    let avatarURL: String?
}

// UserDTO.swift (网络传输对象)
struct UserDTO: Codable {
    let id: String
    let name: String
    let email: String
    let avatar_url: String?

    // 转换为领域模型
    func toDomain() -> User {
        User(
            id: id,
            name: name,
            email: email,
            avatarURL: avatar_url
        )
    }
}
```

### 2. Service 实现

```swift
// UserService.swift
protocol UserServiceProtocol {
    func fetchUsers() async throws -> [User]
    func fetchUser(id: String) async throws -> User
}

class UserService: UserServiceProtocol {
    private let networkManager: NetworkManager

    init(networkManager: NetworkManager = .shared) {
        self.networkManager = networkManager
    }

    func fetchUsers() async throws -> [User] {
        let dtos: [UserDTO] = try await networkManager.request(
            endpoint: "/users",
            method: .get
        )
        return dtos.map { $0.toDomain() }
    }

    func fetchUser(id: String) async throws -> User {
        let dto: UserDTO = try await networkManager.request(
            endpoint: "/users/\(id)",
            method: .get
        )
        return dto.toDomain()
    }
}
```

### 3. ViewModel 实现

```swift
// UserListViewModel.swift
@MainActor
class UserListViewModel: ObservableObject {
    // MARK: - Published State
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var error: Error?

    // MARK: - Dependencies
    private let userService: UserServiceProtocol

    // MARK: - Initialization
    init(userService: UserServiceProtocol = UserService()) {
        self.userService = userService
    }

    // MARK: - Public Methods
    func loadUsers() async {
        isLoading = true
        error = nil

        do {
            users = try await userService.fetchUsers()
        } catch {
            self.error = error
        }

        isLoading = false
    }

    func refresh() async {
        await loadUsers()
    }
}
```

### 4. View 实现

```swift
// UserListView.swift
struct UserListView: View {
    @StateObject private var viewModel = UserListViewModel()

    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    LoadingView()
                } else if let error = viewModel.error {
                    ErrorView(error: error) {
                        Task { await viewModel.refresh() }
                    }
                } else if viewModel.users.isEmpty {
                    EmptyStateView(message: "No users found")
                } else {
                    userList
                }
            }
            .navigationTitle("Users")
            .task {
                await viewModel.loadUsers()
            }
        }
    }

    private var userList: some View {
        List(viewModel.users) { user in
            UserRow(user: user)
        }
        .refreshable {
            await viewModel.refresh()
        }
    }
}

// UserRow.swift (可复用组件)
struct UserRow: View {
    let user: User

    var body: some View {
        HStack {
            AsyncImage(url: URL(string: user.avatarURL ?? "")) { image in
                image.resizable()
            } placeholder: {
                Color.gray
            }
            .frame(width: 50, height: 50)
            .clipShape(Circle())

            VStack(alignment: .leading) {
                Text(user.name)
                    .font(.headline)
                Text(user.email)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}
```

---

## 扩展架构示例（中大型项目）

### 1. Gateway 层实现

```swift
// UserAPI.swift (协议定义)
protocol UserAPI {
    func fetchUsers() -> AnyPublisher<[UserDTO], APIError>
    func fetchUser(id: String) -> AnyPublisher<UserDTO, APIError>
    func createUser(_ params: CreateUserParams) -> AnyPublisher<UserDTO, APIError>
}

// UserAPIImpl.swift (实现)
final class UserAPIImpl: UserAPI {
    private let networkManager: NetworkManager
    private let logger: Logger

    init(networkManager: NetworkManager, logger: Logger = .shared) {
        self.networkManager = networkManager
        self.logger = logger
    }

    func fetchUsers() -> AnyPublisher<[UserDTO], APIError> {
        logger.debug("Fetching users", category: .network)
        return networkManager.post(endpoint: "/api/user/list", body: [:])
    }

    func fetchUser(id: String) -> AnyPublisher<UserDTO, APIError> {
        return networkManager.post(endpoint: "/api/user/detail", body: ["userId": id])
    }

    func createUser(_ params: CreateUserParams) -> AnyPublisher<UserDTO, APIError> {
        return networkManager.post(endpoint: "/api/user/create", body: params)
    }
}
```

### 2. Service 层实现（使用 Gateway）

```swift
// UserService.swift (协议定义)
protocol UserService {
    func getUsers() -> AnyPublisher<[User], APIError>
    func getUser(id: String) -> AnyPublisher<User, APIError>
    func createuser(_ params: CreateUserParams) -> AnyPublisher<User, APIError>
}

// UserServiceImpl.swift (实现)
final class UserServiceImpl: UserService {
    private let api: UserAPI
    private let cache: UserCacheProtocol?
    private let logger: Logger

    init(api: UserAPI, cache: UserCacheProtocol? = nil, logger: Logger = .shared) {
        self.api = api
        self.cache = cache
        self.logger = logger
    }

    func getUsers() -> AnyPublisher<[User], APIError> {
        // 先尝试从缓存获取
        if let cached = cache?.getUsers() {
            logger.debug("Returning cached users", category: .general)
            return Just(cached).setFailureType(to: APIError.self).eraseToAnyPublisher()
        }

        // 从 API 获取
        return api.fetchUsers()
            .map { dtos in
                let users = dtos.map { $0.toDomain() }
                self.cache?.saveUsers(users)
                return users
            }
            .eraseToAnyPublisher()
    }

    func getUser(id: String) -> AnyPublisher<User, APIError> {
        return api.fetchUser(id: id)
            .map { $0.toDomain() }
            .eraseToAnyPublisher()
    }

    func createUser(_ params: CreateUserParams) -> AnyPublisher<User, APIError> {
        return api.createUser(params)
            .map { $0.toDomain() }
            .eraseToAnyPublisher()
    }
}
```

### 3. 事件总线实现

```swift
// ProfileEventPublisher.swift
enum ProfileEvent {
    case created(Profile)
    case updated(Profile)
    case deleted(profileId: String)
}

class ProfileEventPublisher {
    static let shared = ProfileEventPublisher()

    let eventPublisher = PassthroughSubject<ProfileEvent, Never>()

    private init() {}

    func notifyCreated(_ profile: Profile) {
        eventPublisher.send(.created(profile))
    }

    func notifyUpdated(_ profile: Profile) {
        eventPublisher.send(.updated(profile))
    }

    func notifyDeleted(profileId: String) {
        eventPublisher.send(.deleted(profileId: profileId))
    }
}

// ViewModel 中监听事件
@MainActor
class ProfileListViewModel: ObservableObject, ProfileEventObserver {
    var cancellables = Set<AnyCancellable>()
    @Published var profiles: [Profile] = []

    private let service: ProfileService

    init(service: ProfileService) {
        self.service = service
        observeProfileEvents() // 开始监听
    }

    func onProfileCreated(_ profile: Profile) {
        profiles.append(profile)
    }

    func onProfileUpdated(_ profile: Profile) {
        if let index = profiles.firstIndex(where: { $0.id == profile.id }) {
            profiles[index] = profile
        }
    }

    func onProfileDeleted(profileId: String) {
        profiles.removeAll { $0.id == profileId }
    }
}
```

### 4. DependencyContainer 实现

```swift
// DependencyContainer.swift
@MainActor
class DependencyContainer {
    static let shared = DependencyContainer()

    // MARK: - Core Dependencies (Singletons)

    private lazy var networkManager: NetworkManager = {
        NetworkManager.shared
    }()

    private lazy var logger: Logger = {
        Logger.shared
    }()

    private lazy var appState: AppState = {
        AppState(networkManager: networkManager)
    }()

    // MARK: - API Services (Gateway Layer)

    private lazy var userAPI: UserAPI = {
        UserAPIImpl(networkManager: networkManager, logger: logger)
    }()

    private lazy var profileAPI: ProfileAPI = {
        ProfileAPIImpl(networkManager: networkManager, logger: logger)
    }()

    // MARK: - Services (Business Logic Layer)

    private lazy var userService: UserService = {
        UserServiceImpl(api: userAPI, logger: logger)
    }()

    private lazy var profileService: ProfileService = {
        ProfileServiceImpl(api: profileAPI, logger: logger)
    }()

    // MARK: - Factory Methods

    func makeAppState() -> AppState {
        return appState
    }

    func makeUserListViewModel() -> UserListViewModel {
        return UserListViewModel(service: userService, logger: logger)
    }

    func makeProfileDetailViewModel(profileId: String) -> ProfileDetailViewModel {
        return ProfileDetailViewModel(
            profileId: profileId,
            service: profileService,
            logger: logger
        )
    }

    // MARK: - Testing Support

    #if DEBUG
    var useMockData: Bool = true

    func setMockServices() {
        // 替换为 Mock 服务（用于测试）
    }
    #endif

    private init() {
        logger.info("DependencyContainer initialized", category: .general)
    }
}
```

### 5. Router 实现

```swift
// AppRoute.swift
enum AppRoute: Hashable, Identifiable {
    case tab(TabType)
    case userList
    case userDetail(userId: String)
    case profileList
    case profileDetail(profileId: String)
    case settings

    var id: String {
        switch self {
        case .tab(let type): return "tab_\(type.rawValue)"
        case .userList: return "userList"
        case .userDetail(let id): return "userDetail_\(id)"
        case .profileList: return "profileList"
        case .profileDetail(let id): return "profileDetail_\(id)"
        case .settings: return "settings"
        }
    }
}

// Router.swift
@MainActor
class Router: ObservableObject {
    static let shared = Router()

    @Published var path: [AppRoute] = []
    @Published var presentedSheet: AppRoute?
    @Published var presentedFullScreen: AppRoute?

    private init() {}

    func navigate(to route: AppRoute) {
        path.append(route)
    }

    func pop() -> Bool {
        guard !path.isEmpty else { return false }
        path.removeLast()
        return true
    }

    func popToRoot() {
        path.removeAll()
    }

    func presentSheet(_ route: AppRoute) {
        presentedSheet = route
    }

    func dismissSheet() {
        presentedSheet = nil
    }

    func switchTab(to tab: TabType, using appState: AppState) {
        appState.selectedTab = tab
    }
}

// ContentView 中使用
struct ContentView: View {
    @StateObject private var viewModel: ContentViewModel
    @EnvironmentObject var router: Router

    var body: some View {
        NavigationStack(path: $router.path) {
            TabView(selection: viewModel.selectedTab) {
                // ...
            }
            .navigationDestination(for: AppRoute.self) { route in
                routeDestination(for: route)
            }
        }
    }

    @ViewBuilder
    func routeDestination(for route: AppRoute) -> some View {
        switch route {
        case .userList:
            UserListView()
        case .userDetail(let userId):
            UserDetailView(userId: userId)
        case .profileList:
            ProfileListView()
        case .profileDetail(let profileId):
            ProfileDetailView(profileId: profileId)
        default:
            EmptyView()
        }
    }
}
```

---

## 关键设计原则

### 1. 单一职责原则 (SRP)
- **View**: 只负责 UI 渲染
- **ViewModel**: 只负责状态管理和业务逻辑
- **Service**: 只负责数据获取
- **Model**: 只负责数据结构

### 2. 依赖倒置原则 (DIP)
- ViewModel 依赖 Service 协议（不依赖具体实现）
- 通过构造函数注入依赖，便于测试

```swift
// ✅ 好的做法：依赖协议
class UserListViewModel: ObservableObject {
    private let userService: UserServiceProtocol

    init(userService: UserServiceProtocol = UserService()) {
        self.userService = userService
    }
}

// ❌ 不好的做法：硬编码依赖
class UserListViewModel: ObservableObject {
    private let userService = UserService()  // 难以测试
}
```

### 3. 开闭原则 (OCP)
- 通过协议定义抽象，支持扩展
- 添加新功能无需修改现有代码

```swift
// 定义协议
protocol UserServiceProtocol {
    func fetchUsers() async throws -> [User]
}

// 实现 1: 真实 API
class UserService: UserServiceProtocol { ... }

// 实现 2: Mock（用于测试）
class MockUserService: UserServiceProtocol { ... }

// 实现 3: 缓存（用于离线）
class CachedUserService: UserServiceProtocol { ... }
```

---

## 测试支持

### 1. ViewModel 单元测试

```swift
class UserListViewModelTests: XCTestCase {
    func testLoadUsers() async {
        // Given
        let mockService = MockUserService()
        let viewModel = UserListViewModel(userService: mockService)

        // When
        await viewModel.loadUsers()

        // Then
        XCTAssertEqual(viewModel.users.count, 3)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.error)
    }

    func testLoadUsersWithError() async {
        // Given
        let mockService = MockUserService(shouldFail: true)
        let viewModel = UserListViewModel(userService: mockService)

        // When
        await viewModel.loadUsers()

        // Then
        XCTAssertTrue(viewModel.users.isEmpty)
        XCTAssertNotNil(viewModel.error)
    }
}
```

### 2. Mock Service

```swift
class MockUserService: UserServiceProtocol {
    var shouldFail = false

    func fetchUsers() async throws -> [User] {
        if shouldFail {
            throw NSError(domain: "Test", code: -1)
        }

        return [
            User(id: "1", name: "Alice", email: "alice@example.com", avatarURL: nil),
            User(id: "2", name: "Bob", email: "bob@example.com", avatarURL: nil),
            User(id: "3", name: "Charlie", email: "charlie@example.com", avatarURL: nil)
        ]
    }

    func fetchUser(id: String) async throws -> User {
        if shouldFail {
            throw NSError(domain: "Test", code: -1)
        }

        return User(id: id, name: "Test User", email: "test@example.com", avatarURL: nil)
    }
}
```

---

## 最佳实践

### 1. 状态管理
- 使用 `@Published` 发布状态变化
- 所有 UI 更新必须在主线程（`@MainActor`）
- 避免在 View 中直接修改状态

### 2. 错误处理
- 在 ViewModel 中捕获错误
- 通过 `@Published var error: Error?` 传递给 View
- 提供用户友好的错误提示

### 3. 异步操作
- 优先使用 `async/await`（Swift 5.5+）
- 使用 `.task` 修饰符启动异步任务
- 使用 `.refreshable` 支持下拉刷新

### 4. 依赖注入
- 通过构造函数注入依赖
- 提供默认实现（便于使用）
- 支持 Mock 实现（便于测试）

### 5. 代码复用
- 提取可复用的 UI 组件到 `Components/`
- 提取通用工具到 `Utilities/`
- 避免重复代码

---

## 常见问题

### Q: ViewModel 应该包含多少业务逻辑？
**A**: ViewModel 应该包含 UI 相关的业务逻辑（如数据转换、验证、状态管理），但复杂的业务逻辑应该放在 Service 层。

### Q: 何时使用 `@StateObject` vs `@ObservedObject`？
**A**:
- `@StateObject`: View 拥有 ViewModel 的生命周期（通常用于根视图）
- `@ObservedObject`: View 不拥有 ViewModel（通常用于子视图，ViewModel 从父视图传入）

### Q: 如何处理网络请求的取消？
**A**: 使用 `Task` 和 `.task` 修饰符，SwiftUI 会自动在 View 消失时取消任务。

```swift
.task {
    await viewModel.loadUsers()  // View 消失时自动取消
}
```

### Q: 如何在 ViewModel 之间共享数据？
**A**:
1. 通过构造函数传递
2. 使用 `@EnvironmentObject`（全局共享）
3. 使用事件总线（EventMQ，适合跨模块通信）
4. 使用单例 Service（谨慎使用）

---

## 结构选择指南

### 如何选择合适的项目结构

根据项目规模和复杂度选择合适的结构：

#### 基础结构（小项目）

**适用场景**:
- 页面数量 < 10
- 功能相对独立
- 团队规模 1-2 人
- 快速原型或 MVP

**特征**:
- 简单直接，快速开发
- 依赖关系清晰
- 易于理解和维护

**不需要**:
- ❌ Core 层（全局状态可用 @EnvironmentObject）
- ❌ Gateway 层（API 调用直接在 Service 中）
- ❌ EventMQ（跨模块通信少）
- ❌ DependencyContainer（依赖关系简单）

---

#### 标准结构（中大型项目）

**适用场景**:
- 页面数量 10-50
- 功能模块较多
- 团队规模 2-5 人
- 需要全局状态管理

**特征**:
- 引入 Core 层统一管理基础设施
- 支持 AppState 和 Router
- 代码组织更清晰

**需要**:
- ✅ Core/AppState（全局状态管理）
- ✅ Core/Router（统一路由管理）
- ✅ Core/Utilities（工具类集中管理）

**可选**:
- ⚠️ Gateway 层（API 稳定时再考虑）
- ⚠️ EventMQ（跨模块通信复杂时再考虑）
- ⚠️ DependencyContainer（依赖关系复杂时再考虑）

---

#### 扩展结构（复杂项目）

**适用场景**:
- 页面数量 > 50
- 多业务线、多团队协作
- 团队规模 > 5 人
- 长期维护的大型应用

**特征**:
- 完整的分层架构
- 支持防腐层模式
- 依赖注入容器管理

**需要**:
- ✅ 所有 Core 层组件
- ✅ Gateway 层（API 隔离，便于 Mock）
- ✅ EventMQ（事件驱动架构）
- ✅ DependencyContainer（依赖管理）

---

### 渐进式升级路径

不要一开始就使用最复杂的结构，根据项目发展逐步升级：

```
基础结构
    ↓ 项目增长（> 10 页面）
    ↓ 添加 Core 层
标准结构
    ↓ API 变更频繁（> 30 页面）
    ↓ 添加 Gateway 层
    ↓ 跨模块通信复杂
    ↓ 添加 EventMQ
    ↓ 依赖关系复杂
    ↓ 添加 DependencyContainer
扩展结构
```

---

### 升级检查清单

**何时从基础结构升级到标准结构**:
- [ ] 需要在多个页面共享全局状态
- [ ] 导航逻辑变得复杂
- [ ] 网络请求代码重复
- [ ] 需要统一的错误处理
- [ ] 团队成员 > 2 人

**何时从标准结构升级到扩展结构**:
- [ ] API 频繁变更，影响多个 Service
- [ ] 需要在开发环境使用 Mock 数据
- [ ] 跨模块通信频繁，代码耦合严重
- [ ] 依赖关系复杂，难以测试
- [ ] 团队成员 > 5 人

---

### 架构决策树

```
开始
  ↓
项目页面数 < 10？
  ↓ 是                      ↓ 否
使用基础结构              项目 API 是否频繁变更？
  ↓                         ↓ 否              ↓ 是
                          使用标准结构    是否需要跨模块通信？
                                            ↓ 否              ↓ 是
                                        添加 Gateway 层   添加 EventMQ
                                                          ↓
                                                    依赖关系是否复杂？
                                                          ↓ 否              ↓ 是
                                                          结束        添加 DependencyContainer
                                                                         ↓
                                                                    使用扩展结构
```

---

### 实用建议

1. **从简单开始**: 除非项目确定会很大，否则从基础结构开始
2. **按需升级**: 不要为了"架构"而架构，根据实际需求添加层级
3. **保持一致性**: 同一层级的项目使用相同的结构
4. **文档化**: 记录升级决策，便于团队理解
5. **定期审查**: 每个季度审查一次架构是否满足需求
