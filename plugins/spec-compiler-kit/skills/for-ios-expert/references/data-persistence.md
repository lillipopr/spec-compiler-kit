# iOS 数据持久化完整指南

## 概述

iOS 提供了多种数据持久化方案，作为资深工程师需要根据场景选择合适的方案。

---

## 方案对比

| 方案 | 适用场景 | 复杂度 | 性能 | 线程安全 |
|------|---------|--------|------|---------|
| **UserDefaults** | 简单配置 | 低 | 中 | ✅ |
| **Keychain** | 敏感数据 | 中 | 低 | ✅ |
| **FileManager** | 文件存储 | 中 | 高 | ❌ |
| **Core Data** | 复杂数据模型 | 高 | 中 | ✅ |
| **Realm** | 跨平台 | 中 | 高 | ✅ |
| **SwiftData** | SwiftUI 项目 | 中 | 高 | ✅ |

---

## 1. UserDefaults

### 适用场景
- 用户配置
- 简单键值对
- 小型数据（< 1MB）

### 基础用法

```swift
// 存储
UserDefaults.standard.set("John", forKey: "username")
UserDefaults.standard.set(true, forKey: "isLoggedIn")
UserDefaults.standard.set(Date(), forKey: "lastLogin")

// 读取
let username = UserDefaults.standard.string(forKey: "username")
let isLoggedIn = UserDefaults.standard.bool(forKey: "isLoggedIn")
let lastLogin = UserDefaults.standard.object(forKey: "lastLogin") as? Date

// 删除
UserDefaults.standard.removeObject(forKey: "username")
```

### 封装最佳实践

```swift
// ✅ 使用属性包装器封装
@propertyWrapper
struct UserDefault<T> {
    let key: String
    let defaultValue: T

    var wrappedValue: T {
        get {
            UserDefaults.standard.object(forKey: key) as? T ?? defaultValue
        }
        set {
            UserDefaults.standard.set(newValue, forKey: key)
        }
    }
}

// 使用
struct AppSettings {
    @UserDefault(key: "username", defaultValue: "")
    static var username: String

    @UserDefault(key: "isFirstLaunch", defaultValue: true)
    static var isFirstLaunch: Bool
}

// 使用
AppSettings.username = "John"
print(AppSettings.username)
```

### 响应式 UserDefaults

```swift
import Combine

extension UserDefaults {
    @dynamicMemberLookup
    struct Observable {
        let defaults: UserDefaults

        subscript<T>(dynamicMember key: String) -> T where T: Codable {
            get {
                guard let data = defaults.data(forKey: key),
                      let value = try? JSONDecoder().decode(T.self, from: data) else {
                    return defaultValue()
                }
                return value
            }
            set {
                if let data = try? JSONEncoder().encode(newValue) {
                    defaults.set(data, forKey: key)
                }
            }

            func defaultValue() -> T {
                fatalError("No default value")
            }
        }
    }

    var observable: Observable {
        Observable(defaults: self)
    }
}

// 使用
class ViewModel: ObservableObject {
    @Published var settings: UserDefaults.Observable

    init() {
        self.settings = UserDefaults.standard.observable
    }
}
```

---

## 2. Keychain

### 适用场景
- 密码、Token
- API 密钥
- 证书

### 基础封装

```swift
import Security

enum KeychainError: Error {
    case itemNotFound
    case unexpectedData
    case unhandledError(status: OSStatus)
}

class KeychainManager {
    static let shared = KeychainManager()

    private let service = "com.yourapp.keychain"

    private init() {}

    // 保存
    func save(_ data: Data, forKey key: String) throws {
        let query = [
            kSecValueData as String: data,
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ] as [String: Any]

        // 先删除旧数据
        SecItemDelete(query as CFDictionary)

        // 添加新数据
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unhandledError(status: status)
        }
    }

    // 读取
    func load(forKey key: String) throws -> Data {
        let query = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ] as [String: Any]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data else {
            throw KeychainError.itemNotFound
        }

        return data
    }

    // 删除
    func delete(forKey key: String) throws {
        let query = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ] as [String: Any]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unhandledError(status: status)
        }
    }
}
```

### 使用示例

```swift
// 保存 Token
let token = "abc123"
let data = token.data(using: .utf8)!
try KeychainManager.shared.save(data, forKey: "authToken")

// 读取 Token
if let data = try? KeychainManager.shared.load(forKey: "authToken"),
   let token = String(data: data, encoding: .utf8) {
    print("Token: \(token)")
}

// 删除 Token
try KeychainManager.shared.delete(forKey: "authToken")
```

---

## 3. FileManager

### 适用场景
- 文档存储
- 图片、视频
- 大型数据

### 目录结构

```swift
class FileManagerHelper {
    static let shared = FileManagerHelper()

    private let fileManager = FileManager.default

    // 文档目录
    var documentsDirectory: URL {
        fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }

    // 缓存目录
    var cachesDirectory: URL {
        fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    }

    // 临时目录
    var temporaryDirectory: URL {
        fileManager.temporaryDirectory
    }

    // 应用支持目录
    var applicationSupportDirectory: URL {
        fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    }

    private init() {
        createDirectoriesIfNeeded()
    }

    private func createDirectoriesIfNeeded() {
        let directories = [documentsDirectory, cachesDirectory, applicationSupportDirectory]

        for directory in directories {
            if !fileManager.fileExists(atPath: directory.path) {
                try? fileManager.createDirectory(
                    at: directory,
                    withIntermediateDirectories: true
                )
            }
        }
    }
}
```

### JSON 文件存储

```swift
struct JSONFileStorage {
    private let fileManager = FileManager.default
    private let fileName: String
    private let directory: URL

    init(fileName: String, directory: URL = FileManagerHelper.shared.documentsDirectory) {
        self.fileName = fileName
        self.directory = directory
    }

    private var fileURL: URL {
        directory.appendingPathComponent(fileName)
    }

    // 保存
    func save<T: Codable>(_ object: T) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        let data = try encoder.encode(object)
        try data.write(to: fileURL)
    }

    // 读取
    func load<T: Codable>(_ type: T.Type) throws -> T {
        guard fileManager.fileExists(atPath: fileURL.path) else {
            throw NSError(domain: "FileNotFound", code: -1)
        }

        let data = try Data(contentsOf: fileURL)
        return try JSONDecoder().decode(T.self, from: data)
    }

    // 删除
    func delete() throws {
        try fileManager.removeItem(at: fileURL)
    }

    // 检查是否存在
    var exists: Bool {
        fileManager.fileExists(atPath: fileURL.path)
    }
}

// 使用
let storage = JSONFileStorage(fileName: "user.json")
let user = User(id: "1", name: "John")
try storage.save(user)

if let loadedUser = try? storage.load(User.self) {
    print(loadedUser)
}
```

### 图片缓存

```swift
class ImageCache {
    static let shared = ImageCache()

    private let cacheDirectory: URL
    private let fileManager = FileManager.default

    private init() {
        let cacheDir = FileManagerHelper.shared.cachesDirectory
        self.cacheDirectory = cacheDir.appendingPathComponent("Images")

        if !fileManager.fileExists(atPath: cacheDirectory.path) {
            try? fileManager.createDirectory(
                at: cacheDirectory,
                withIntermediateDirectories: true
            )
        }
    }

    private func fileURL(for key: String) -> URL {
        let filename = key.md5Hash
        return cacheDirectory.appendingPathComponent(filename)
    }

    // 保存图片
    func saveImage(_ image: UIImage, forKey key: String) {
        guard let data = image.pngData() else { return }
        let url = fileURL(for: key)
        try? data.write(to: url)
    }

    // 加载图片
    func loadImage(forKey key: String) -> UIImage? {
        let url = fileURL(for: key)
        guard fileManager.fileExists(atPath: url.path) else { return nil }
        return UIImage(contentsOfFile: url.path)
    }

    // 删除图片
    func removeImage(forKey key: String) {
        let url = fileURL(for: key)
        try? fileManager.removeItem(at: url)
    }

    // 清除缓存
    func clearCache() {
        try? fileManager.removeItem(at: cacheDirectory)
        try? fileManager.createDirectory(
            at: cacheDirectory,
            withIntermediateDirectories: true
        )
    }

    // 缓存大小
    var cacheSize: Int64 {
        guard let urls = try? fileManager.contentsOfDirectory(
            at: cacheDirectory,
            includingPropertiesForKeys: [.fileSizeKey]
        ) else { return 0 }

        return urls.compactMap { url -> Int64? in
            guard let resourceValues = try? url.resourceValues(forKeys: [.fileSizeKey]),
                  let fileSize = resourceValues.fileSize else { return nil }
            return Int64(fileSize)
        }.reduce(0, +)
    }
}

extension String {
    var md5Hash: String {
        guard let data = self.data(using: .utf8) else { return self }
        let hash = data.withUnsafeBytes { bytes in
            // 实际项目中应该使用 CommonCrypto 或 CryptoKit
            return String(format: "%02x", bytes.reduce(0) { $0 + Int($1) })
        }
        return hash
    }
}
```

---

## 4. Core Data

### 适用场景
- 复杂数据模型
- 大量数据
- 需要查询、排序、过滤
- 需要数据关系

### 栈配置

```swift
import CoreData

class PersistenceController {
    static let shared = PersistenceController()

    let container: NSPersistentContainer

    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "DataModel")

        if inMemory {
            container.persistentStoreDescriptions.first?.url = URL(fileURLWithPath: "/dev/null")
        }

        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Core Data store failed to load: \(error)")
            }
        }

        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }

    var viewContext: NSManagedObjectContext {
        container.viewContext
    }

    func backgroundContext() -> NSManagedObjectContext {
        container.newBackgroundContext()
    }

    func save() {
        let context = container.viewContext

        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Failed to save context: \(error)")
            }
        }
    }
}
```

### 创建实体

```swift
// User+CoreDataClass.swift
@objc(User)
public class User: NSManagedObject {
    @NSManaged public var id: String?
    @NSManaged public var name: String?
    @NSManaged public var email: String?
    @NSManaged public var createdAt: Date?
    @NSManaged public var posts: NSSet?
}

// User+CoreDataProperties.swift
extension User {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<User> {
        return NSFetchRequest<User>(entityName: "User")
    }

    @NSManaged public var postsArray: [Post] {
        let set = posts as? Set<Post> ?? []
        return set.sorted { $0.createdAt < $1.createdAt }
    }
}
```

### CRUD 操作

```swift
class CoreDataRepository {
    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext = PersistenceController.shared.viewContext) {
        self.context = context
    }

    // Create
    func createUser(id: String, name: String, email: String) -> User {
        let user = User(context: context)
        user.id = id
        user.name = name
        user.email = email
        user.createdAt = Date()

        try? context.save()
        return user
    }

    // Read
    func fetchUser(id: String) -> User? {
        let request: NSFetchRequest<User> = User.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", id)
        request.fetchLimit = 1

        return try? context.fetch(request).first
    }

    func fetchAllUsers() -> [User] {
        let request: NSFetchRequest<User> = User.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(key: "name", ascending: true)]

        return (try? context.fetch(request)) ?? []
    }

    // Update
    func updateUser(_ user: User, name: String? = nil, email: String? = nil) {
        user.name = name ?? user.name
        user.email = email ?? user.email

        try? context.save()
    }

    // Delete
    func deleteUser(_ user: User) {
        context.delete(user)
        try? context.save()
    }

    // 批量删除
    func deleteAllUsers() {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = User.fetchRequest()
        let batchDeleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

        try? context.execute(batchDeleteRequest)
        try? context.save()
    }
}
```

### 后台上下文

```swift
func performBackgroundTask(_ block: @escaping (NSManagedObjectContext) -> Void) {
    PersistenceController.shared.container.performBackgroundTask { context in
        block(context)
    }
}

// 使用
performBackgroundTask { context in
    let user = User(context: context)
    user.id = UUID().uuidString
    user.name = "John"

    try? context.save()
}
```

---

## 5. SwiftData（iOS 17+）

### 适用场景
- SwiftUI 项目
- 简单数据模型
- 不需要复杂查询

### 基础配置

```swift
import SwiftData

@Model
final class User {
    var id: String
    var name: String
    var email: String
    var createdAt: Date

    @Relationship(deleteRule: .cascade) var posts: [Post] = []

    init(id: String, name: String, email: String) {
        self.id = id
        self.name = name
        self.email = email
        self.createdAt = Date()
    }
}

@Model
final class Post {
    var id: String
    var title: String
    var content: String
    var createdAt: Date

    var author: User?

    init(id: String, title: String, content: String, author: User? = nil) {
        self.id = id
        self.title = title
        self.content = content
        self.createdAt = Date()
        self.author = author
    }
}
```

### App 集成

```swift
@main
struct MyApp: App {
    let modelContainer: ModelContainer

    init() {
        do {
            modelContainer = try ModelContainer(
                for: User.self, Post.self,
                configurations: [ModelConfiguration(isStoredInMemoryOnly: false)]
            )
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(modelContainer)
    }
}
```

### CRUD 操作

```swift
import SwiftData

@MainActor
class UserViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var currentUser: User?

    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        fetchUsers()
    }

    // Create
    func createUser(name: String, email: String) {
        let user = User(id: UUID().uuidString, name: name, email: email)
        modelContext.insert(user)
        try? modelContext.save()
        fetchUsers()
    }

    // Read
    func fetchUsers() {
        let descriptor = FetchDescriptor<User>(
            sortBy: [SortDescriptor(\.name)]
        )
        users = (try? modelContext.fetch(descriptor)) ?? []
    }

    func fetchUser(id: String) -> User? {
        let descriptor = FetchDescriptor<User>(
            predicate: #Predicate { $0.id == id }
        )
        return try? modelContext.fetch(descriptor).first
    }

    // Update
    func updateUser(_ user: User, name: String? = nil, email: String? = nil) {
        user.name = name ?? user.name
        user.email = email ?? user.email
        try? modelContext.save()
        fetchUsers()
    }

    // Delete
    func deleteUser(_ user: User) {
        modelContext.delete(user)
        try? modelContext.save()
        fetchUsers()
    }
}
```

---

## 6. 数据迁移

### Core Data 迁移

```swift
// 轻量级迁移
let container = NSPersistentContainer(name: "DataModel")

let description = container.persistentStoreDescriptions.first
description?.setOption(true as NSNumber, forKey: NSMigratePersistentStoresAutomaticallyOption)
description?.setOption(true as NSNumber, forKey: NSInferMappingModelAutomaticallyOption)

container.loadPersistentStores { description, error in
    if let error = error {
        fatalError("Migration failed: \(error)")
    }
}
```

### 自定义迁移策略

```swift
class MigrationPolicy: NSEntityMigrationPolicy {
    override func createDestinationInstances(
        forSource sInstance: NSManagedObject,
        in mapping: NSEntityMapping,
        manager: NSMigrationManager
    ) throws {
        try super.createDestinationInstances(forSource: sInstance, in: mapping, manager: manager)

        guard let destinationInstance = manager.destinationInstances(
            forEntityMappingName: mapping.name,
            sourceInstances: [sInstance]
        ).first else { return }

        // 自定义迁移逻辑
        if let sourceDate = sInstance.value(forKey: "createdAt") as? Date {
            let dateFormatter = ISO8601DateFormatter()
            destinationInstance.setValue(
                dateFormatter.string(from: sourceDate),
                forKey: "createdAtString"
            )
        }
    }
}
```

---

## 面试要点

### 关键问题

**Q: 何时使用 UserDefaults vs Core Data？**
- UserDefaults: 简单配置、小型数据
- Core Data: 复杂数据模型、大量数据、需要查询

**Q: Keychain 的优势？**
- 系统级加密
- 应用删除后数据保留
- 适合敏感信息

**Q: SwiftData vs Core Data？**
- SwiftData: 更简单、Swift 原生、SwiftUI 友好
- Core Data: 更成熟、更强大、复杂查询

**Q: 数据迁移策略？**
- 轻量级迁移（自动）
- 重度迁移（自定义）
- 版本控制

**Q: 线程安全？**
- UserDefaults/Keychain: 线程安全
- Core Data: 需要使用正确上下文
- FileManager: 需要手动同步
