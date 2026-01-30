## 性能优化指南

### 1. 视图性能优化

```swift
// ❌ 低效：频繁重新计算和重新渲染
struct IneffectiveListView: View {
    @ObservedObject var viewModel: ListViewModel  // 任何变化都会触发重新渲染

    var body: some View {
        List {
            ForEach(viewModel.items) { item in
                ExpensiveCell(item: item)  // 即使只有搜索文本变化也会重新渲染
            }
        }
    }
}

// ✅ 高效：精细化的状态管理
struct EfficientListView: View {
    @StateObject private var viewModel: ListViewModel

    var body: some View {
        List {
            ForEach(viewModel.filteredItems) { item in
                NavigationLink(destination: DetailView(item: item)) {
                    ListItemView(item: item)
                        .id(item.id)  // 稳定的 ID，提高性能
                }
            }
        }
        .searchable(text: $viewModel.searchText, prompt: "搜索")
    }
}

// ✅ 子视图性能优化
struct ListItemView: View {
    let item: Item

    var body: some View {
        VStack(alignment: .leading) {
            Text(item.title)
                .font(.headline)
        }
        .contentShape(Rectangle())  // 扩展点击区域
    }
}
```

### 2. 异步操作优化

```swift
// ❌ 低效：创建多个数据源连接
class InefficientViewModel: ObservableObject {
    func loadUserAndPosts(userId: String) async {
        async let user = fetchUser(userId)
        async let posts = fetchPosts(userId)

        // 等待两个请求完成
        let (userData, postsData) = await (user, posts)
    }

    private func fetchUser(_ id: String) async throws -> User {
        try await networkService.fetchUser(id: id)
    }

    private func fetchPosts(_ id: String) async throws -> [Post] {
        try await networkService.fetchPosts(userId: id)
    }
}

// ✅ 高效：连接复用和错误处理
class EfficientViewModel: ObservableObject {
    @Published var user: User?
    @Published var posts: [Post] = []
    @Published var error: Error?

    private let networkService: NetworkService
    private var currentTask: Task<Void, Never>?

    func loadUserData(userId: String) async {
        // 取消之前的请求
        currentTask?.cancel()

        currentTask = Task {
            do {
                // 并发请求
                async let userData = networkService.fetchUser(id: userId)
                async let postsData = networkService.fetchPosts(userId: userId)

                (user, posts) = try await (userData, postsData)
            } catch {
                self.error = error
            }
        }
    }

    deinit {
        currentTask?.cancel()
    }
}
```

### 3. 内存管理

```swift
// ❌ 内存泄漏风险：循环引用
class ViewModelWithMemoryLeak: ObservableObject {
    private let service = SomeService()

    init() {
        // 闭包捕获 self 导致循环引用
        service.onDataReady = {
            self.updateUI()  // self 强引用 service，service 通过闭包强引用 self
        }
    }

    func updateUI() {
        // ...
    }
}

// ✅ 正确的内存管理：使用弱引用
class CorrectViewModel: ObservableObject {
    private let service = SomeService()

    init() {
        // 使用 [weak self] 避免循环引用
        service.onDataReady = { [weak self] in
            self?.updateUI()
        }
    }

    func updateUI() {
        // ...
    }
}

// ✅ 使用 Combine 框架管理订阅
class ModernViewModel: ObservableObject {
    @Published var data: String = ""

    private var cancellables = Set<AnyCancellable>()
    private let service = SomeService()

    init() {
        service.dataPublisher
            .receive(on: DispatchQueue.main)
            .assign(to: &$data)
    }
}
```

### 4. 图片加载优化

```swift
// ✅ 高效的图片加载和缓存
actor ImageCache {
    private var cache: [URL: UIImage] = [:]

    func image(for url: URL) -> UIImage? {
        cache[url]
    }

    func setImage(_ image: UIImage, for url: URL) {
        cache[url] = image
    }

    func clearCache() {
        cache.removeAll()
    }
}

// ✅ 懒加载图片的 View
struct AsyncImageView: View {
    let url: URL
    @State private var image: UIImage?
    @State private var isLoading = false

    var body: some View {
        ZStack {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
            } else if isLoading {
                ProgressView()
            } else {
                Color.gray.opacity(0.3)
            }
        }
        .onAppear {
            loadImage()
        }
    }

    private func loadImage() {
        isLoading = true

        Task(priority: .userInitiated) {
            defer { isLoading = false }

            // 检查缓存
            let cache = ImageCache()
            if let cached = await cache.image(for: url) {
                image = cached
                return
            }

            // 加载图片
            let (data, _) = try? await URLSession.shared.data(from: url)
            guard let data = data, let uiImage = UIImage(data: data) else {
                return
            }

            // 缓存并更新 UI
            await cache.setImage(uiImage, for: url)
            DispatchQueue.main.async {
                image = uiImage
            }
        }
    }
}
```
