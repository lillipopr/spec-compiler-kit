## 设计案例：用户列表功能

### 需求
- 展示用户列表
- 支持下拉刷新
- 支持加载状态和错误处理
- 完整的 MVVM 架构
- 单元测试覆盖

---

## 完整实现

### 1. Model 层

```swift
// User.swift
struct User: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
    let avatarURL: String?
    let bio: String?
}

// UserDTO.swift (网络传输对象)
struct UserDTO: Codable {
    let id: String
    let name: String
    let email: String
    let avatar_url: String?
    let bio: String?

    func toDomain() -> User {
        User(
            id: id,
            name: name,
            email: email,
            avatarURL: avatar_url,
            bio: bio
        )
    }
}

// API Response
struct UsersResponse: Codable {
    let users: [UserDTO]
    let total: Int
}
```

### 2. Service 层

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
        let response: UsersResponse = try await networkManager.request(
            endpoint: "/api/users",
            method: .get
        )
        return response.users.map { $0.toDomain() }
    }

    func fetchUser(id: String) async throws -> User {
        let dto: UserDTO = try await networkManager.request(
            endpoint: "/api/users/\(id)",
            method: .get
        )
        return dto.toDomain()
    }
}

// NetworkManager.swift (简化版)
class NetworkManager {
    static let shared = NetworkManager()

    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod
    ) async throws -> T {
        guard let url = URL(string: "https://api.example.com\(endpoint)") else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.serverError
        }

        return try JSONDecoder().decode(T.self, from: data)
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
}

enum NetworkError: Error {
    case invalidURL
    case serverError
    case decodingError
}
```

### 3. ViewModel 层

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

    /// 加载用户列表
    func loadUsers() async {
        isLoading = true
        error = nil

        do {
            users = try await userService.fetchUsers()
        } catch {
            self.error = error
            print("Failed to load users: \(error)")
        }

        isLoading = false
    }

    /// 刷新用户列表
    func refresh() async {
        await loadUsers()
    }

    /// 清除错误
    func clearError() {
        error = nil
    }
}
```

### 4. View 层

```swift
// UserListView.swift
struct UserListView: View {
    @StateObject private var viewModel = UserListViewModel()

    var body: some View {
        NavigationView {
            content
                .navigationTitle("Users")
                .task {
                    await viewModel.loadUsers()
                }
        }
    }

    @ViewBuilder
    private var content: some View {
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

    private var userList: some View {
        List(viewModel.users) { user in
            NavigationLink(destination: UserDetailView(userId: user.id)) {
                UserRow(user: user)
            }
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
        HStack(spacing: 12) {
            // 头像
            AsyncImage(url: URL(string: user.avatarURL ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Color.gray
            }
            .frame(width: 50, height: 50)
            .clipShape(Circle())

            // 用户信息
            VStack(alignment: .leading, spacing: 4) {
                Text(user.name)
                    .font(.headline)

                Text(user.email)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                if let bio = user.bio {
                    Text(bio)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

// LoadingView.swift
struct LoadingView: View {
    var body: some View {
        VStack {
            ProgressView()
            Text("Loading...")
                .foregroundColor(.secondary)
                .padding(.top, 8)
        }
    }
}

// ErrorView.swift
struct ErrorView: View {
    let error: Error
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.red)

            Text("Something went wrong")
                .font(.headline)

            Text(error.localizedDescription)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button("Retry") {
                retry()
            }
            .buttonStyle(.borderedProminent)
        }
    }
}

// EmptyStateView.swift
struct EmptyStateView: View {
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.3")
                .font(.system(size: 50))
                .foregroundColor(.secondary)

            Text(message)
                .font(.headline)
                .foregroundColor(.secondary)
        }
    }
}
```

---

## 单元测试

### 1. Mock Service

```swift
// MockUserService.swift
class MockUserService: UserServiceProtocol {
    var shouldFail = false
    var mockUsers: [User] = []

    func fetchUsers() async throws -> [User] {
        if shouldFail {
            throw NetworkError.serverError
        }
        return mockUsers
    }

    func fetchUser(id: String) async throws -> User {
        if shouldFail {
            throw NetworkError.serverError
        }
        return mockUsers.first { $0.id == id } ?? mockUsers[0]
    }
}
```

### 2. ViewModel 测试

```swift
// UserListViewModelTests.swift
import XCTest
@testable import YourApp

@MainActor
class UserListViewModelTests: XCTestCase {

    // MARK: - Test: 成功加载用户

    func testLoadUsers_Success() async {
        // Given
        let mockService = MockUserService()
        mockService.mockUsers = [
            User(id: "1", name: "Alice", email: "alice@example.com", avatarURL: nil, bio: "iOS Developer"),
            User(id: "2", name: "Bob", email: "bob@example.com", avatarURL: nil, bio: "Designer"),
            User(id: "3", name: "Charlie", email: "charlie@example.com", avatarURL: nil, bio: "Product Manager")
        ]

        let viewModel = UserListViewModel(userService: mockService)

        // When
        await viewModel.loadUsers()

        // Then
        XCTAssertEqual(viewModel.users.count, 3)
        XCTAssertEqual(viewModel.users[0].name, "Alice")
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.error)
    }

    // MARK: - Test: 加载失败

    func testLoadUsers_Failure() async {
        // Given
        let mockService = MockUserService()
        mockService.shouldFail = true

        let viewModel = UserListViewModel(userService: mockService)

        // When
        await viewModel.loadUsers()

        // Then
        XCTAssertTrue(viewModel.users.isEmpty)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNotNil(viewModel.error)
    }

    // MARK: - Test: 刷新

    func testRefresh() async {
        // Given
        let mockService = MockUserService()
        mockService.mockUsers = [
            User(id: "1", name: "Alice", email: "alice@example.com", avatarURL: nil, bio: nil)
        ]

        let viewModel = UserListViewModel(userService: mockService)

        // When
        await viewModel.refresh()

        // Then
        XCTAssertEqual(viewModel.users.count, 1)
        XCTAssertFalse(viewModel.isLoading)
    }

    // MARK: - Test: 清除错误

    func testClearError() async {
        // Given
        let mockService = MockUserService()
        mockService.shouldFail = true

        let viewModel = UserListViewModel(userService: mockService)
        await viewModel.loadUsers()

        XCTAssertNotNil(viewModel.error)

        // When
        viewModel.clearError()

        // Then
        XCTAssertNil(viewModel.error)
    }
}
```

---

## 架构说明

### 数据流

```
User Action (View)
    ↓
ViewModel.loadUsers()
    ↓
UserService.fetchUsers()
    ↓
NetworkManager.request()
    ↓
API Response (UserDTO)
    ↓
Transform to Domain Model (User)
    ↓
Update @Published State
    ↓
View Re-renders
```

### 职责分离

1. **View**: 只负责 UI 渲染和用户交互
   - 不包含业务逻辑
   - 通过 `@StateObject` 绑定 ViewModel
   - 响应状态变化自动刷新

2. **ViewModel**: 管理 UI 状态和业务逻辑
   - 管理 `@Published` 状态
   - 调用 Service 获取数据
   - 处理错误和加载状态

3. **Service**: 封装 API 调用
   - 处理网络请求
   - 数据转换（DTO → Domain Model）
   - 返回 async/await 结果

4. **Model**: 纯数据结构
   - 不包含业务逻辑
   - 遵循 `Codable` 和 `Identifiable`

### 关键设计原则

1. **单一职责原则 (SRP)**
   - 每个类只有一个职责
   - View 只负责 UI，ViewModel 只负责状态管理

2. **依赖倒置原则 (DIP)**
   - ViewModel 依赖 `UserServiceProtocol` 协议
   - 便于测试和替换实现

3. **开闭原则 (OCP)**
   - 通过协议扩展功能
   - 无需修改现有代码

---

## 扩展功能

### 1. 添加分页加载

```swift
@MainActor
class UserListViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var error: Error?

    private var currentPage = 0
    private let pageSize = 20
    private var hasMorePages = true

    func loadUsers() async {
        guard !isLoading else { return }
        isLoading = true
        currentPage = 0
        users = []

        await fetchUsers()
        isLoading = false
    }

    func loadMore() async {
        guard !isLoadingMore && hasMorePages else { return }
        isLoadingMore = true
        currentPage += 1

        await fetchUsers()
        isLoadingMore = false
    }

    private func fetchUsers() async {
        do {
            let newUsers = try await userService.fetchUsers(
                page: currentPage,
                pageSize: pageSize
            )
            users.append(contentsOf: newUsers)
            hasMorePages = newUsers.count == pageSize
        } catch {
            self.error = error
        }
    }
}
```

### 2. 添加搜索功能

```swift
@MainActor
class UserListViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var searchText = ""

    var filteredUsers: [User] {
        if searchText.isEmpty {
            return users
        }
        return users.filter { user in
            user.name.localizedCaseInsensitiveContains(searchText) ||
            user.email.localizedCaseInsensitiveContains(searchText)
        }
    }
}

// View
struct UserListView: View {
    @StateObject private var viewModel = UserListViewModel()

    var body: some View {
        NavigationView {
            List(viewModel.filteredUsers) { user in
                UserRow(user: user)
            }
            .searchable(text: $viewModel.searchText)
        }
    }
}
```

---

## 总结

这个案例展示了：
- ✅ 完整的 Lightweight MVVM 架构
- ✅ 清晰的职责分离
- ✅ 依赖注入和协议抽象
- ✅ 完整的错误处理
- ✅ 单元测试覆盖
- ✅ 可扩展的设计

这是一个通用的、可复用的架构模式，适用于大多数 iOS 应用开发场景。
