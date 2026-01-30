# Swift 并发编程完整指南

## 概述

Swift 5.5 引入了结构化并发（Structured Concurrency），彻底改变了异步编程的方式。作为 iOS 资深工程师，必须深入理解这些概念。

---

## 核心概念

### 1. async/await

**基本语法**:
```swift
// 异步函数定义
func fetchUserData() async throws -> User {
    let url = URL(string: "https://api.example.com/user")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}

// 调用异步函数
Task {
    do {
        let user = try await fetchUserData()
        print("User: \(user.name)")
    } catch {
        print("Error: \(error)")
    }
}
```

**关键要点**:
- 使用 `async` 标记异步函数
- 使用 `await` 等待异步操作完成
- 异步函数只能在异步上下文中调用
- 使用 `Task` 创建异步上下文

### 2. Task

**Task 类型**:
```swift
// 1. Task.init - 立即执行
let task = Task {
    print("Task started")
    try? await fetchUserData()
}

// 取消任务
task.cancel()

// 2. Task.detached - 不继承上下文
let detachedTask = await Task.detached {
    // 不继承父任务的优先级、任务本地存储等
    await fetchUserData()
}.value

// 3. Task.sleep - 异步等待
try await Task.sleep(nanoseconds: 1_000_000_000) // 1秒
```

**Task 优先级**:
```swift
let task = Task(priority: .userInitiated) {
    // 高优先级任务
    await fetchUserData()
}

// 优先级级别
// .userInitiated - 用户发起，高优先级
// .utility - 实用工具，中优先级
// .background - 后台任务，低优先级
```

### 3. Actor

**Actor 定义**:
```swift
actor UserManager {
    private var users: [String: User] = [:]
    private var currentUser: User?

    // Actor 方法自动串行化
    func addUser(_ user: User) {
        users[user.id] = user
    }

    func getUser(id: String) -> User? {
        return users[id]
    }

    func setCurrentUser(_ user: User) {
        self.currentUser = user
    }

    func getCurrentUser() -> User? {
        return currentUser
    }
}
```

**Actor 使用**:
```swift
let userManager = UserManager()

// 所有访问都通过 await
await userManager.addUser(user)
let fetchedUser = await userManager.getUser(id: "123")
```

**MainActor**:
```swift
@MainActor
class HomeViewModel: ObservableObject {
    @Published var users: [User] = []

    func loadUsers() async {
        // 已经在 MainActor 上下文中
        let users = await fetchUsersFromAPI()
        self.users = users // 直接访问 UI 状态
    }
}

// 在非 MainActor 上下文中更新 UI
Task {
    let users = await fetchUsersFromAPI()
    await MainActor.run {
        self.users = users
    }
}
```

### 4. Sendable

**Sendable 协议**:
```swift
// 值类型自动 Sendable
struct User: Sendable {
    let id: String
    let name: String
}

// class 需要 @unchecked Sendable 或 final + 不可变
final class ImmutableUser: Sendable {
    let id: String
    let name: String

    init(id: String, name: String) {
        self.id = id
        self.name = name
    }
}

// Actor 自动 Sendable
actor UserManager: Sendable {
    // ...
}
```

**跨并发域传递**:
```swift
func processUser(user: User) async {
    // User 是 Sendable，可以安全传递
    await Task.detached {
        print("Processing: \(user.name)")
    }
}
```

---

## 高级模式

### 1. TaskGroup

**并发执行多个任务**:
```swift
func fetchAllUsers() async throws -> [User] {
    let userIds = ["1", "2", "3", "4", "5"]

    return try await withThrowingTaskGroup(of: User.self) { group in
        // 添加任务到组
        for userId in userIds {
            group.addTask {
                try await self.fetchUser(id: userId)
            }
        }

        // 收集结果
        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}
```

**AsyncStream 版本**:
```swift
func fetchUsersStream() async throws -> [User] {
    let userIds = ["1", "2", "3", "4", "5"]

    return try await withThrowingTaskGroup(of: User.self) { group in
        for userId in userIds {
            group.addTask {
                try await self.fetchUser(id: userId)
            }
        }

        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}
```

### 2. AsyncStream / AsyncThrowingStream

**创建异步流**:
```swift
func downloadProgress(url: URL) -> AsyncThrowingStream<Double, Error> {
    return AsyncThrowingStream { continuation in
        // 模拟下载进度
        Task {
            for progress in stride(from: 0.0, through: 1.0, by: 0.1) {
                try? await Task.sleep(nanoseconds: 100_000_000)
                continuation.yield(progress)
            }
            continuation.finish()
        }
    }
}

// 使用异步流
for try await progress in try await downloadProgress(url: url) {
    print("Progress: \(progress * 100)%")
}
```

**使用 AsyncStream 包装回调**:
```swift`
func observeNotifications() -> AsyncStream<Notification> {
    return AsyncStream { continuation in
        let observer = NotificationCenter.default.addObserver(
            forName: .dataDidChange,
            object: nil,
            queue: nil
        ) { notification in
            continuation.yield(notification)
        }

        continuation.onTermination = { @Sendable _ in
            NotificationCenter.default.removeObserver(observer)
        }
    }
}

// 使用
for await notification in observeNotifications() {
    print("Notification: \(notification)")
}
```

### 3. Continuation

**包装基于回调的 API**:
```swift
// 传统回调 API
typealias CallbackHandler = (Result<Data, Error>) -> Void
func legacyFetchData(completion: CallbackHandler) {
    // 传统实现
}

// 使用 withCheckedContinuation 包装
func modernFetchData() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        legacyFetchData { result in
            switch result {
            case .success(let data):
                continuation.resume(returning: data)
            case .failure(let error):
                continuation.resume(throwing: error)
            }
        }
    }
}
```

**withCheckedContinuation vs withUnsafeContinuation**:
```swift
// 安全版本（推荐）
func safeOperation() async -> Int {
    await withCheckedContinuation { continuation in
        // 只能 resume 一次
        DispatchQueue.global().asyncAfter(deadline: .now() + 1) {
            continuation.resume(returning: 42)
        }
    }
}

// 不安全版本（性能优化）
func unsafeOperation() async -> Int {
    await withUnsafeUncheckedContinuation { continuation in
        // 需要确保只 resume 一次
        DispatchQueue.global().asyncAfter(deadline: .now() + 1) {
            continuation.resume(returning: 42)
        }
    }
}
```

---

## 并发安全模式

### 1. 数据竞争检测

**Xcode 数据竞争检测器**:
```bash
# 启用数据竞争检测
Xcode -> Product -> Scheme -> Edit Scheme -> Run -> Thread Sanitizer
```

**常见数据竞争**:
```swift
// ❌ 数据竞争
class Counter {
    var count = 0

    func increment() {
        count += 1 // 非线程安全
    }
}

// ✅ 使用 Actor
actor SafeCounter {
    var count = 0

    func increment() {
        count += 1 // 线程安全
    }
}

// ✅ 使用 MainActor
@MainActor
class ViewModelCounter: ObservableObject {
    @Published var count = 0

    func increment() {
        count += 1 // 主线程安全
    }
}
```

### 2. 避免共享可变状态

**❌ 错误示例**:
```swift
class DataCache {
    var cache: [String: Data] = [:]

    func updateCache(key: String, value: Data) {
        cache[key] = value // 数据竞争
    }
}
```

**✅ 正确示例**:
```swift
actor DataCache {
    private var cache: [String: Data] = [:]

    func updateCache(key: String, value: Data) {
        cache[key] = value // 线程安全
    }

    func getValue(key: String) -> Data? {
        cache[key]
    }
}
```

### 3. Task 取消处理

**检查取消状态**:
```swift
func longRunningTask() async throws {
    for i in 0..<1000 {
        // 检查是否被取消
        try Task.checkCancellation()

        // 执行工作
        await processItem(i)
    }
}

// 使用
let task = Task {
    try? await longRunningTask()
}

// 取消任务
task.cancel()
```

**处理 CancellationError**:
```swift
func gracefulTask() async {
    do {
        try await longRunningTask()
    } catch is CancellationError {
        print("Task was cancelled")
        // 执行清理工作
        cleanup()
    } catch {
        print("Other error: \(error)")
    }
}
```

---

## 性能优化

### 1. 避免过度串行化

**❌ 串行执行**:
```swift
// 慢：串行执行
func loadAllData() async throws -> (Users, Posts, Comments) {
    let users = try await fetchUsers()
    let posts = try await fetchPosts()
    let comments = try await fetchComments()
    return (users, posts, comments)
}
```

**✅ 并发执行**:
```swift
// 快：并发执行
func loadAllData() async throws -> (Users, Posts, Comments) {
    async let users = fetchUsers()
    async let posts = fetchPosts()
    async let comments = fetchComments()

    return try await (users, posts, comments)
}
```

### 2. 使用 TaskGroup 并发

```swift
func processImages(urls: [URL]) async throws -> [Image] {
    try await withThrowingTaskGroup(of: Image.self) { group in
        for url in urls {
            group.addTask {
                try await downloadImage(from: url)
            }
        }

        var images: [Image] = []
        for try await image in group {
            images.append(image)
        }
        return images
    }
}
```

### 3. 限制并发数量

```swift
func processLimitedConcurrency<T>(
    items: [T],
    maxConcurrency: Int = 4,
    operation: @Sendable (T) async throws -> Void
) async throws {
    try await withThrowingTaskGroup(of: Void.self) { group in
        var activeTasks = 0

        for item in items {
            // 等待活跃任务数量降到限制以下
            while activeTasks >= maxConcurrency {
                try await group.next()
                activeTasks -= 1
            }

            group.addTask {
                try await operation(item)
            }
            activeTasks += 1
        }

        // 等待所有任务完成
        while activeTasks > 0 {
            try await group.next()
            activeTasks -= 1
        }
    }
}
```

---

## 最佳实践

### 1. 错误处理

```swift
// ✅ 在异步函数中正确传播错误
func fetchAndProcessUser() async throws -> User {
    let data = try await fetchUserData() // 传播错误
    return try await processData(data)   // 传播错误
}

// ✅ 捕获并处理错误
func safeFetchUser() async -> User? {
    do {
        return try? await fetchUserData()
    } catch {
        print("Error: \(error)")
        return nil
    }
}
```

### 2. 资源清理

```swift
// 使用 defer 确保清理
func processFile() async throws {
    let file = try openFile()
    defer {
        closeFile(file)
    }

    try await processContents(file)
}
```

### 3. 避免死锁

```swift
// ❌ 可能死锁
actor DeadlockActor {
    func method1() async {
        await self.method2()
    }

    func method2() async {
        // 可能导致死锁
    }
}

// ✅ 避免在 Actor 内部 await self
actor SafeActor {
    private var state: Int = 0

    func updateState() {
        // 不需要 await，直接访问
        state += 1
    }

    func asyncMethod() async {
        // 如果必须 await self，确保不会重入
    }
}
```

---

## 调试技巧

### 1. 使用 Instruments

**Time Profiler**: 检查 CPU 使用
**Points of Interest**: 标记异步操作

```swift
let signpost = OSSignpostLogger.logInterval("com.app.network")
// ... 执行操作
signpost.end()
```

### 2. 日志记录

```swift
func fetchData() async throws -> Data {
    let taskId = Task.isCancelled ? "cancelled" : "active"
    print("Task \(taskId): Starting fetch")

    let result = try await performFetch()

    print("Task \(taskId): Completed")
    return result
}
```

---

## 常见陷阱

### 1. 忘记 await

```swift
// ❌ 编译错误
func loadData() {
    let data = fetchData() // Missing await
}

// ✅ 正确
func loadData() async {
    let data = await fetchData()
}
```

### 2. 在非异步上下文调用异步函数

```swift
// ❌ 错误
func syncFunction() {
    Task {
        let data = await fetchData()
        // 无法同步返回结果
    }
}

// ✅ 使用 Continuation
func syncFunction() async -> Data {
    await fetchData()
}
```

### 3. Actor 重入

```swift
actor Account {
    private var balance: Double = 0

    func deposit(amount: Double) async {
        balance += amount
    }

    func withdraw(amount: Double) async {
        balance -= amount
    }

    // ❌ 可能导致重入问题
    func transfer(to other: Account, amount: Double) async {
        await withdraw(amount: amount)
        await other.deposit(amount: amount)
    }
}
```

---

## 面试要点

### 关键概念

1. **结构化并发**: Task、TaskGroup 的层次结构
2. **Actor 隔离**: 防止数据竞争
3. **Sendable**: 跨并发域安全传递
4. **AsyncSequence**: 异步序列处理
5. **Continuation**: 包装回调 API

### 常见问题

**Q: async/await 相比闭包的优势？**
- 代码可读性更好
- 错误处理更自然
- 避免回调地狱
- 编译器优化

**Q: 什么时候使用 Actor？**
- 需要保护可变状态
- 多个并发任务访问同一数据
- 需要串行化操作

**Q: TaskGroup 相比创建多个 Task 的优势？**
- 结构化并发
- 自动传播错误
- 作用域管理
- 自动取消

**Q: MainActor 的作用？**
- 确保代码在主线程执行
- UI 更新必须使用
- 自动串行化主线程操作
