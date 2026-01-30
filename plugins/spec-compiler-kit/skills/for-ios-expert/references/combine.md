# Combine 框架完整指南

## 概述

Combine 是 Apple 在 WWDC 2019 推出的响应式编程框架，用于处理异步事件流。虽然 Swift 5.5 引入了 async/await，但 Combine 仍然是处理复杂事件流的重要工具。

---

## 核心概念

### 1. 三大核心组件

**Publisher（发布者）**:
```swift
// 内置 Publisher
let numbers = (1...5).publisher // 集合 Publisher
let notification = NotificationCenter.default
    .publisher(for: .dataDidChange)
let urlSession = URLSession.shared
    .dataTaskPublisher(for: url) // 网络 Publisher

// 自定义 Publisher
struct CustomPublisher: Publisher {
    typealias Output = Int
    typealias Failure = Never

    func receive<S>(subscriber: S) where S: Subscriber,
                                             Self.Output == S.Input,
                                             Self.Failure == S.Failure {
        // 实现订阅逻辑
    }
}
```

**Subscriber（订阅者）**:
```swift
// sink - 订阅并处理值
let cancellable = publisher
    .sink { completion in
        print("Completed: \(completion)")
    } receiveValue: { value in
        print("Received: \(value)")
    }

// assign - 绑定到属性
@Published var name: String = ""
let cancellable = publisher
    .assign(to: &$name)
```

**Operator（操作符）**:
```swift
// map - 转换值
let mapped = publisher
    .map { $0 * 2 }

// filter - 过滤值
let filtered = publisher
    .filter { $0 > 10 }

// flatMap - 展平嵌套 Publisher
let flattened = publisher
    .flatMap { value in
        Future { promise in
            promise(.success(value * 2))
        }
    }
```

### 2. Cancellable

**AnyCancellable**:
```swift
var cancellables = Set<AnyCancellable>()

// 存储订阅
publisher
    .sink { value in
        print(value)
    }
    .store(in: &cancellables)

// 取消订阅
cancellables.forEach { $0.cancel() }
```

**自动取消**:
```swift
// 使用 @Published 自动管理
class ViewModel: ObservableObject {
    @Published var data: String = ""
    var cancellables = Set<AnyCancellable>()

    init() {
        publisher
            .assign(to: &$data) // 自动管理生命周期
    }
}
```

---

## 常用 Operators

### 1. 转换 Operators

```swift
// map - 转换每个值
[1, 2, 3].publisher
    .map { $0 * 2 }
    .sink { print($0) } // 2, 4, 6

// scan - 累积值
[1, 2, 3, 4].publisher
    .scan(0, +)
    .sink { print($0) } // 1, 3, 6, 10

// flatMap - 展平嵌套 Publisher
struct User {
    let id: Int
}

func fetchUser(id: Int) -> AnyPublisher<User, Never> {
    // 返回 User Publisher
    return Just(User(id: id)).eraseToAnyPublisher()
}

[1, 2, 3].publisher
    .flatMap { id in
        fetchUser(id: id)
    }
    .sink { user in
        print("User: \(user.id)")
    }

// switchToLatest - 切换到最新 Publisher
let searchPublisher = PassthroughSubject<String, Never>()

searchPublisher
    .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
    .removeDuplicates()
    .flatMap { query in
        self.searchUsers(query: query)
    }
    .switchToLatest() // 取消之前的搜索
    .sink { users in
        self.searchResults = users
    }
    .store(in: &cancellables)
```

### 2. 过滤 Operators

```swift
// filter - 过滤值
(1...10).publisher
    .filter { $0 % 2 == 0 }
    .sink { print($0) } // 2, 4, 6, 8, 10

// removeDuplicates - 去重
[1, 2, 2, 3, 3, 3].publisher
    .removeDuplicates()
    .sink { print($0) } // 1, 2, 3

// debounce - 防抖
let searchTextPublisher = PassthroughSubject<String, Never>()

searchTextPublisher
    .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
    .sink { text in
        print("Search: \(text)")
    }

// throttle - 节流
let buttonClicks = PassthroughSubject<Void, Never>()

buttonClicks
    .throttle(for: .seconds(1), scheduler: DispatchQueue.main, latest: true)
    .sink {
        print("Button clicked")
    }
```

### 3. 组合 Operators

```swift
// combineLatest - 组合多个 Publisher 的最新值
let usernamePublisher = PassthroughSubject<String, Never>()
let passwordPublisher = PassthroughSubject<String, Never>

Publishers.CombineLatest(usernamePublisher, passwordPublisher)
    .map { username, password in
        return username.count > 0 && password.count > 0
    }
    .sink { isValid in
        print("Form valid: \(isValid)")
    }

// merge - 合并同类型 Publisher
let publisher1 = [1, 2].publisher
let publisher2 = [3, 4].publisher

publisher1.merge(with: publisher2)
    .sink { print($0) } // 1, 2, 3, 4

// zip - 配对多个 Publisher
let numbers = [1, 2, 3].publisher
let letters = ["A", "B", "C"].publisher

numbers.zip(letters)
    .sink { print("\($0.0)-\($0.1)") } // 1-A, 2-B, 3-C
```

### 4. 时间 Operators

```swift
// delay - 延迟发射
[1, 2, 3].publisher
    .delay(for: .seconds(1), scheduler: DispatchQueue.main)
    .sink { print($0) }

// throttle - 节流
let clicks = PassthroughSubject<Void, Never>()

clicks
    .throttle(for: .seconds(1), scheduler: .main, latest: true)
    .sink { print("Throttled") }

// debounce - 防抖
let searchInput = PassthroughSubject<String, Never>()

searchInput
    .debounce(for: .milliseconds(300), scheduler: .main)
    .sink { text in
        self.performSearch(text)
    }

// timeout - 超时
URLSession.shared.dataTaskPublisher(for: url)
    .timeout(.seconds(5), scheduler: .main, customError: {
        .timeout
    })
    .sink { completion in
        // 处理完成
    } receiveValue: { data, response in
        // 处理数据
    }
```

---

## 实际应用场景

### 1. 表单验证

```swift
class FormViewModel: ObservableObject {
    @Published var email: String = ""
    @Published var password: String = ""
    @Published var confirmPassword: String = ""
    @Published var isValid: Bool = false

    var cancellables = Set<AnyCancellable>()

    init() {
        isValidEmail
            .combineLatest(isValidPassword, isPasswordMatching)
            .map { emailValid, passwordValid, matching in
                emailValid && passwordValid && matching
            }
            .assign(to: &$isValid)
    }

    private var isValidEmail: AnyPublisher<Bool, Never> {
        $email
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .map { $0.contains("@") }
            .eraseToAnyPublisher()
    }

    private var isValidPassword: AnyPublisher<Bool, Never> {
        $password
            .map { $0.count >= 8 }
            .eraseToAnyPublisher()
    }

    private var isPasswordMatching: AnyPublisher<Bool, Never> {
        Publishers.CombineLatest($password, $confirmPassword)
            .map { $0 == $1 && $0.count > 0 }
            .eraseToAnyPublisher()
    }
}
```

### 2. 网络请求

```swift
class NetworkManager {
    func fetchUser(id: String) -> AnyPublisher<User, APIError> {
        let url = URL(string: "https://api.example.com/users/\(id)")!

        return URLSession.shared.dataTaskPublisher(for: url)
            .map(\.data)
            .decode(type: UserDTO.self, decoder: JSONDecoder())
            .map { $0.toDomain() }
            .mapError { error in
                if let error = error as? DecodingError {
                    return .decodingError(error)
                }
                return .networkError(error)
            }
            .eraseToAnyPublisher()
    }

    func fetchUsers() -> AnyPublisher<[User], APIError> {
        let url = URL(string: "https://api.example.com/users")!

        return URLSession.shared.dataTaskPublisher(for: url)
            .map(\.data)
            .decode(type: [UserDTO].self, decoder: JSONDecoder())
            .map { $0.map { $0.toDomain() } }
            .mapError { error in
                if let error = error as? DecodingError {
                    return .decodingError(error)
                }
                return .networkError(error)
            }
            .eraseToAnyPublisher()
    }
}
```

### 3. 搜索功能

```swift
class SearchViewModel: ObservableObject {
    @Published var searchText: String = ""
    @Published var searchResults: [SearchResult] = []

    private let networkManager: NetworkManager
    var cancellables = Set<AnyCancellable>()

    init(networkManager: NetworkManager) {
        self.networkManager = networkManager
        setupSearch()
    }

    private func setupSearch() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .flatMap { [weak self] query in
                guard let self = self, !query.isEmpty else {
                    return Just([]).eraseToAnyPublisher()
                }
                return self.networkManager.search(query: query)
                    .catch { error in
                        return Just([]).eraseToAnyPublisher()
                    }
            }
            .receive(on: DispatchQueue.main)
            .assign(to: &$searchResults)
    }
}
```

### 4. 定时器

```swift
class TimerViewModel: ObservableObject {
    @Published var currentTime: Date = Date()
    @Published var countdown: Int = 60

    private var timerCancellable: Cancellable?
    private var countdownCancellable: Cancellable?

    func startClock() {
        timerCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.currentTime = Date()
            }
    }

    func startCountdown() {
        countdownCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self else { return }
                if self.countdown > 0 {
                    self.countdown -= 1
                } else {
                    self.countdownCancellable?.cancel()
                }
            }
    }
}
```

### 5. 多步骤操作

```swift
class CheckoutViewModel: ObservableObject {
    @Published var cartItems: [CartItem] = []
    @Published var shippingAddress: Address?
    @Published var paymentMethod: PaymentMethod?
    @Published var orderStatus: OrderStatus = .idle

    private let api: CheckoutAPI
    var cancellables = Set<AnyCancellable>()

    func processCheckout() {
        guard let shippingAddress = shippingAddress,
              let paymentMethod = paymentMethod else {
            return
        }

        let cartPublisher = api.validateCart(items: cartItems)
        let shippingPublisher = api.validateShipping(address: shippingAddress)
        let paymentPublisher = api.validatePayment(method: paymentMethod)

        Publishers.Zip3(cartPublisher, shippingPublisher, paymentPublisher)
            .flatMap { [weak self] cart, shipping, payment -> AnyPublisher<Order, APIError> in
                guard let self = self else {
                    return Fail(error: .unknown).eraseToAnyPublisher()
                }
                return self.api.createOrder(
                    cart: cart,
                    shipping: shipping,
                    payment: payment
                )
            }
            .handleEvents(
                receiveSubscription: { _ in self.orderStatus = .processing },
                receiveOutput: { _ in self.orderStatus = .success },
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        self.orderStatus = .failed(error)
                    }
                }
            )
            .sink { _ in }
            .store(in: &cancellables)
    }
}
```

---

## Subject 类型

### 1. PassthroughSubject

```swift
let subject = PassthroughSubject<String, Never>()

// 发送值
subject.send("Hello")
subject.send("World")

// 订阅
subject
    .sink { value in
        print(value)
    }

// 发送完成
subject.send(completion: .finished)
```

### 2. CurrentValueSubject

```swift
let subject = CurrentValueSubject<String, Never>("Initial")

// 访问当前值
print(subject.value) // "Initial"

// 发送值
subject.send("Hello")
print(subject.value) // "Hello"

// 订阅（立即接收当前值）
subject
    .sink { value in
        print(value)
    } // "Hello"
```

### 3. @Published 属性包装器

```swift
class ViewModel: ObservableObject {
    @Published var count: Int = 0

    var cancellables = Set<AnyCancellable>()

    init() {
        $count // $count 是 Publisher<Int, Never>
            .sink { value in
                print("Count changed: \(value)")
            }
            .store(in: &cancellables)
    }

    func increment() {
        count += 1
    }
}
```

---

## 错误处理

### 1. catch

```swift
publisher
    .catch { error -> AnyPublisher<Int, Never> in
        print("Error: \(error)")
        return Just(0).eraseToAnyPublisher()
    }
    .sink { value in
        print(value)
    }
```

### 2. retry

```swift
URLSession.shared.dataTaskPublisher(for: url)
    .retry(3) // 失败时重试 3 次
    .catch { error in
        return Just(Data()).eraseToAnyPublisher()
    }
    .sink { data in
        print(data)
    }
```

### 3. replaceError

```swift
publisher
    .replaceError(with: 0)
    .sink { value in
        print(value) // 错误时返回 0
    }
```

### 4. mapError

```swift
enum APIError: Error {
    case network(Error)
    case decoding(Error)
}

URLSession.shared.dataTaskPublisher(for: url)
    .mapError { error in
        APIError.network(error)
    }
    .map(\.data)
    .decode(type: User.self, decoder: JSONDecoder())
    .mapError { error in
        if let error = error as? DecodingError {
            return APIError.decoding(error)
        }
        return error
    }
```

---

## 调试技巧

### 1. 打印值

```swift
publisher
    .print("Debug") // 打印所有事件
    .sink { value in
        print(value)
    }

// 手动打印
publisher
    .handleEvents(
        receiveOutput: { value in
            print("Received: \(value)")
        },
        receiveCompletion: { completion in
            print("Completed: \(completion)")
        }
    )
    .sink { value in
        print(value)
    }
```

### 2. breakPoint

```swift
publisher
    .breakpointSink() // 在 sink 处断点
    .sink { value in
        print(value)
    }

publisher
    .breakpoint(
        receiveSubscription: { subscription in
            print("Subscribed")
        },
        receiveOutput: { value in
            print("Output: \(value)")
        },
        receiveCompletion: { completion in
            print("Completed: \(completion)")
        }
    )
```

---

## Combine vs async/await

### 何时使用 Combine

- 需要处理持续的事件流
- 需要复杂的操作符链
- 需要组合多个 Publisher
- 需要 SwiftUI 集成（@Published）
- 需要取消订阅

### 何时使用 async/await

- 单次异步操作
- 顺序执行多个异步操作
- 需要错误处理的简单场景
- 需要结构化并发

### 混合使用

```swift
// 在 Combine 中使用 async/await
let future = Future { promise in
    Task {
        do {
            let result = try await performAsyncOperation()
            promise(.success(result))
        } catch {
            promise(.failure(error))
        }
    }
}

future
    .sink { completion in
        // 处理完成
    } receiveValue: { value in
        print(value)
    }
```

---

## 性能优化

### 1. 使用 eraseToAnyPublisher

```swift
// 隐藏复杂类型
func createPublisher() -> AnyPublisher<Int, Never> {
    return (1...10)
        .publisher
        .map { $0 * 2 }
        .filter { $0 > 5 }
        .eraseToAnyPublisher()
}
```

### 2. 使用 share()

```swift
// 避免多次订阅导致多次执行
let expensivePublisher = URLSession.shared
    .dataTaskPublisher(for: url)
    .share()

// 多次订阅不会导致多次网络请求
expensivePublisher.sink { data in /* ... */ }
expensivePublisher.sink { data in /* ... */ }
```

### 3. 使用 flatMap 限制并发

```swift
func fetchImages(urls: [URL]) -> AnyPublisher<Image, Never> {
    urls.publisher
        .flatMap(maxPublishers: .max(4)) { url in
            URLSession.shared.dataTaskPublisher(for: url)
                .map { UIImage(data: $0.data)! }
                .catch { _ in Empty() }
        }
        .eraseToAnyPublisher()
}
```

---

## 面试要点

### 关键概念

1. **Publisher-Subscriber 模式**
2. **Operator 链式操作**
3. **背压处理**
4. **内存管理（Cancellable）**
5. **线程调度（Scheduler）**

### 常见问题

**Q: Combine 的核心优势？**
- 声明式编程
- 类型安全
- 组合性强
- 易于测试

**Q: 什么时候使用 PassthroughSubject vs CurrentValueSubject？**
- PassthroughSubject: 只发送新值
- CurrentValueSubject: 保存当前值，新订阅者立即接收

**Q: share() 的作用？**
- 避免多次订阅导致多次执行
- 多个订阅者共享同一个订阅

**Q: DispatchQueue.main vs background 调度？**
- main: UI 更新
- background: 耗时操作
- receive(on:) 切换线程
