# iOS MVVM 分层架构指南

> **注意**：本文档只描述分层架构，不包含独立建模。
> 问题建模、约束定义、用例设计请参考 Phase 1-3 文档（跨端统一）。

## 分层架构

### 标准分层

```
View ← ViewModel → Service → Gateway → Network
```

### 层级职责

| 层级 | 职责 | 技术选型 |
|------|------|---------|
| **View** | UI 展示和用户交互 | SwiftUI |
| **ViewModel** | 状态管理、业务协调 | @ObservableObject |
| **Service** | 业务逻辑、不变量校验 | Protocol + Class |
| **Gateway** | API 网关（防腐层） | Protocol + Class |
| **Network** | 网络管理器 | URLSession / Alamofire |

### 依赖方向

```
View → ViewModel → Service → Gateway → Network
 ↑                                          ↓
 └──────────────── 不依赖 ──────────────────┘
```

---

## View 层

### 职责

- UI 布局和渲染
- 用户交互事件传递
- 绑定 ViewModel 状态

### 示例

```swift
struct OrderView: View {
    @StateObject private var viewModel = OrderViewModel()

    var body: some View {
        switch viewModel.uiState {
        case .idle:
            EmptyView()
        case .loading:
            LoadingView()
        case .success:
            OrderContentView(order: viewModel.order)
        case .failure:
            ErrorView(message: viewModel.errorMessage) {
                Task { await viewModel.createOrder() }
            }
        }
    }
}
```

---

## ViewModel 层

### 职责

- 管理 UI 状态（UIState）
- 提供用户意图接口
- 协调 Service 层调用

### 示例

```swift
@MainActor
class OrderViewModel: ObservableObject {
    private let orderService: OrderServiceProtocol

    @Published var uiState: UIState = .idle
    @Published var order: Order?
    @Published var errorMessage: String?

    init(orderService: OrderServiceProtocol = OrderService()) {
        self.orderService = orderService
    }

    func createOrder(items: [OrderItem]) async {
        uiState = .loading
        do {
            let order = try await orderService.createOrder(items: items)
            self.order = order
            uiState = .success
        } catch {
            errorMessage = error.localizedDescription
            uiState = .failure
        }
    }
}

enum UIState: Equatable {
    case idle, loading, success, failure
}
```

---

## Service 层

### 职责

- 实现业务逻辑
- **不变量校验**（核心）
- 协调多个 Gateway 调用

### 示例

```swift
protocol OrderServiceProtocol {
    func createOrder(items: [OrderItem]) async throws -> Order
}

actor OrderService: OrderServiceProtocol {
    private let gateway: OrderGatewayProtocol

    init(gateway: OrderGatewayProtocol = OrderGateway()) {
        self.gateway = gateway
    }

    func createOrder(items: [OrderItem]) async throws -> Order {
        // 不变量校验：INV-01 订单金额计算
        let totalAmount = items.reduce(0) { $0 + $1.price * $1.quantity }

        let order = try await gateway.postOrder(items: items)

        // 验证返回结果
        guard order.totalAmount == totalAmount else {
            throw ServiceError.business(
                code: "INV-01",
                message: "订单金额计算错误"
            )
        }

        return order
    }
}
```

---

## Gateway 层

### 职责

- API 防腐层（隔离网络请求细节）
- 数据转换（DTO → Domain Model）
- 错误映射

### 示例

```swift
protocol OrderGatewayProtocol {
    func postOrder(items: [OrderItem]) async throws -> Order
}

actor OrderGateway: OrderGatewayProtocol {
    private let network: NetworkProtocol

    init(network: NetworkProtocol = NetworkManager.shared) {
        self.network = network
    }

    func postOrder(items: [OrderItem]) async throws -> Order {
        let endpoint = OrderEndpoint.create(items: items)
        let dto: OrderDTO = try await network.request(endpoint)
        return Order(from: dto)
    }
}
```

---

## Network 层

### 职责

- HTTP 请求封装
- 认证管理（JWT Token）
- 请求/响应拦截

### 示例

```swift
protocol NetworkProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T
}

actor NetworkManager: NetworkProtocol {
    static let shared = NetworkManager()

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        var request = endpoint.urlRequest

        if let token = AuthManager.shared.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              200...299 ~= httpResponse.statusCode else {
            throw NetworkError.requestFailed
        }

        return try JSONDecoder().decode(T.self, from: data)
    }
}
```

---

## 与端到端设计的关系

在端到端接口设计文档中，iOS 部分应包含：

1. **分层设计表**：明确各层的类名和方法
2. **DTO 映射表**：明确后端 DTO 与 iOS Model 的对应关系
3. **代码结构**：明确文件组织方式

详见 [Phase 4: 端到端接口设计](../02-compilation-phases/phase-4-e2e-design.md)
