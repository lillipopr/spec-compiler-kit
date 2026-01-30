## SwiftUI + MVVM 最佳实践

### 状态管理架构

```swift
// 1. 环境对象 - 跨 View 共享全局状态
@MainActor
class AppEnvironment: ObservableObject {
    @Published var authState: AuthState = .unauthenticated
    @Published var user: User?

    private let authService: AuthenticationService

    init(authService: AuthenticationService) {
        self.authService = authService
    }

    func login(email: String, password: String) async {
        do {
            user = try await authService.login(email: email, password: password)
            authState = .authenticated
        } catch {
            authState = .error(error)
        }
    }
}

enum AuthState {
    case unauthenticated
    case authenticated
    case loading
    case error(Error)
}

// 2. ViewModel - 管理单个 View 的状态
@MainActor
class ProfileViewModel: ObservableObject {
    @Published var profile: UserProfile?
    @Published var isEditing = false
    @Published var isSaving = false

    private let profileService: ProfileServiceProtocol

    init(profileService: ProfileServiceProtocol = ProfileService()) {
        self.profileService = profileService
    }

    func loadProfile(userId: String) async {
        do {
            profile = try await profileService.fetchProfile(userId: userId)
        } catch {
            // 错误处理
        }
    }

    func updateProfile(_ updated: UserProfile) async {
        isSaving = true
        defer { isSaving = false }

        do {
            profile = try await profileService.updateProfile(updated)
            isEditing = false
        } catch {
            // 错误处理
        }
    }
}

// 3. View - 呈现 ViewModel 的状态
struct ProfileView: View {
    @StateObject private var viewModel: ProfileViewModel
    @EnvironmentObject var appEnvironment: AppEnvironment

    var body: some View {
        VStack {
            if let profile = viewModel.profile {
                Form {
                    Section("基本信息") {
                        Text(profile.name)
                        Text(profile.email)
                    }

                    Section {
                        Button("编辑") {
                            viewModel.isEditing = true
                        }
                    }
                }
            } else {
                ProgressView()
            }
        }
        .sheet(isPresented: $viewModel.isEditing) {
            EditProfileView(
                profile: viewModel.profile ?? UserProfile(),
                onSave: { updated in
                    Task {
                        await viewModel.updateProfile(updated)
                    }
                }
            )
        }
        .task {
            if let userId = appEnvironment.user?.id {
                await viewModel.loadProfile(userId: userId)
            }
        }
    }
}
```

### ViewModel 设计模式

```swift
// 规范的 ViewModel 实现
@MainActor
class ListViewModel<Item: Identifiable>: ObservableObject {
    // MARK: - Published State
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var error: Error?
    @Published var searchText = ""

    // MARK: - Private Dependencies
    private let itemService: ItemServiceProtocol

    // MARK: - Computed Properties
    var filteredItems: [Item] {
        if searchText.isEmpty {
            return items
        }
        return items.filter { item in
            String(describing: item).lowercased().contains(searchText.lowercased())
        }
    }

    // MARK: - Initialization
    init(
        itemService: ItemServiceProtocol = ItemService()
    ) {
        self.itemService = itemService
    }

    // MARK: - Public Methods
    func loadItems() async {
        isLoading = true
        defer { isLoading = false }

        do {
            items = try await itemService.fetchItems()
        } catch {
            self.error = error
        }
    }

    func deleteItem(_ item: Item) async {
        do {
            try await itemService.deleteItem(id: item.id)
            items.removeAll { $0.id == item.id }
        } catch {
            self.error = error
        }
    }
}
```

