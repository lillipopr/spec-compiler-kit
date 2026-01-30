# 后端 DDD 分层架构指南

> **注意**：本文档只描述分层架构，不包含独立建模。
> 问题建模、约束定义、用例设计请参考 Phase 1-3 文档（跨端统一）。

## 分层架构

### 标准分层

```
Controller → Application → Domain → Gateway/Infra → Mapper
```

### 层级职责

| 层级 | 职责 | 技术选型 |
|------|------|---------|
| **Controller** | 接收 HTTP 请求、参数验证 | @RestController |
| **Application** | 跨领域业务编排 | @Service |
| **Domain** | 单领域业务逻辑、不变量校验 | @Service + Domain Object |
| **Gateway** | 外部依赖接口定义 | Protocol/Interface |
| **Infra** | 外部依赖实现 | @Component |
| **Mapper** | 数据访问 | MyBatis Plus |

### 依赖方向

```
Controller → Application → Domain → Gateway → Infra → Mapper
    ↑                                                ↓
    └──────────────── 不依赖 ─────────────────────────┘
```

---

## Controller 层

### 职责

- 接收 HTTP 请求
- 参数验证（@Valid）
- 调用 Application 层
- 返回统一响应（ApiResponse）

### 示例

```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    @Autowired
    private OrderApplication orderApplication;

    @PostMapping("/create")
    public ApiResponse<OrderDTO> createOrder(
        @Valid @RequestBody CreateOrderParam param
    ) {
        OrderDTO order = orderApplication.createOrder(param);
        return ApiResponse.success(order);
    }
}
```

### 约定

- 统一使用 POST 请求
- 入参使用 `XxxParam`
- 返回 `ApiResponse<XxxDTO>`
- 接口语义化（非 CRUD）

---

## Application 层

### 职责

- 跨领域业务编排
- 不直接改领域状态
- 协调多个 Domain Service

### 示例

```java
@Service
public class OrderApplicationImpl implements OrderApplication {

    @Autowired
    private OrderDomain orderDomain;

    @Autowired
    private InventoryDomain inventoryDomain;

    @Override
    public OrderDTO createOrder(CreateOrderParam param) {
        // 1. 检查库存
        inventoryDomain.checkStock(param.getItems());

        // 2. 创建订单
        Order order = orderDomain.create(param);

        // 3. 返回结果
        return OrderDTO.from(order);
    }
}
```

---

## Domain 层

### 职责

- 单领域业务逻辑
- 状态管理
- **不变量校验**（核心）

### 示例

```java
@Service
public class OrderDomainImpl implements OrderDomain {

    @Autowired
    private OrderMapper orderMapper;

    @Override
    @Transactional
    public Order create(CreateOrderParam param) {
        Order order = new Order();
        order.setItems(param.getItems());

        // 不变量校验：INV-01 订单金额计算
        order.calculateTotalAmount();
        validateAmount(order);

        orderMapper.insert(order);
        return order;
    }

    private void validateAmount(Order order) {
        long calculated = order.getItems().stream()
            .mapToLong(item -> item.getPrice() * item.getQuantity())
            .sum();

        if (order.getTotalAmount() != calculated) {
            throw new BusinessException("INV-01: 订单金额计算错误");
        }
    }
}
```

---

## Gateway/Infra 层

### Gateway（接口定义）

```java
public interface PaymentGateway {
    PaymentOrder createOrder(String userId, String productId);
    PaymentResult queryOrder(String orderId);
}
```

### Infra（实现）

```java
@Component
public class AliPaymentGatewayImpl implements PaymentGateway {

    @Autowired
    private AliPayClient aliPayClient;

    @Override
    public PaymentOrder createOrder(String userId, String productId) {
        return aliPayClient.createOrder(userId, productId);
    }
}
```

---

## Mapper 层

### 职责

- 数据访问
- SQL 执行

### 示例

```java
@Mapper
public interface OrderMapper extends BaseMapper<Order> {

    @Select("SELECT * FROM t_order WHERE user_id = #{userId}")
    List<Order> selectByUserId(String userId);
}
```

---

## 与端到端设计的关系

在端到端接口设计文档中，后端部分应包含：

1. **分层设计表**：明确各层的类名和方法
2. **实体设计表**：明确实体与不变量的对应关系
3. **代码结构**：明确文件组织方式

详见 [Phase 4: 端到端接口设计](../02-compilation-phases/phase-4-e2e-design.md)
