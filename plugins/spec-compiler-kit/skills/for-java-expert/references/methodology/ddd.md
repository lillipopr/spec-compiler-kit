## 领域驱动设计 (DDD)

### 概述

DDD 是一种软件设计方法，强调以业务领域为中心，通过深入理解业务来设计系统架构。核心理念是将复杂的业务规则表达为代码，使代码更容易维护和演进。

---

## 战略设计

### 1. 识别核心域、支撑域、通用域

**核心域 (Core Domain)**
- 企业的竞争优势所在
- 需要内部团队深度投入
- 例：电商平台的推荐引擎、支付处理

**支撑域 (Supporting Subdomain)**
- 支持核心域的功能
- 可能需要定制，但不是竞争力来源
- 例：用户管理、权限控制

**通用域 (Generic Subdomain)**
- 行业通用的功能
- 可以使用现有解决方案或开源库
- 例：日志、监控、邮件通知

### 2. 划分限界上下文 (Bounded Context)

**定义**: 限界上下文是一个内聚的业务功能区域，内部使用统一的通用语言，有明确的边界。

**示例**:
```
电商系统
├── 订单上下文 (Order Context)
│   - 概念: 订单、订单项、订单状态
│   - Application: OrderApplication (编排 + 数据访问)
│   - Domain: OrderDomain (业务计算)
│   - Repository: OrderRepository (基础设施层)
│
├── 支付上下文 (Payment Context)
│   - 概念: 支付、支付渠道、支付结果
│   - Application: PaymentApplication
│   - Domain: PaymentDomain
│   - Repository: PaymentRepository
│
└── 库存上下文 (Inventory Context)
    - 概念: 库存、库存预留、库存扣减
    - Application: InventoryApplication
    - Domain: InventoryDomain
    - Repository: InventoryRepository
```

**关键原则**:
- 每个上下文有独立的数据库（Database per Context）
- 通过接口进行上下文间通信
- 避免共享数据模型

### 3. 上下文映射关系

**发布-订阅 (Publish-Subscribe)**
```
订单系统发布"订单创建"事件
  ↓
支付系统、库存系统监听此事件
  ↓
各自系统独立处理
```

**客户-供应商 (Customer-Supplier)**
```
库存系统是上游（Supplier）
订单系统依赖库存系统（Customer）
```

**共享核心 (Shared Kernel)**
```
多个上下文共享基础类型库
（谨慎使用，只在必要时）
```

### 4. 通用语言 (Ubiquitous Language)

定义业务术语的精确含义，确保团队、代码、文档都使用相同语言。

**示例**:
```
术语: "订单"
- 定义: 用户购买商品的意图表示
- 创建时机: 用户点击"提交订单"
- 生命周期: 待支付 → 已支付 → 待发货 → 已发货 → 已完成
- 关键属性: 订单ID、用户ID、商品列表、总金额、创建时间
```

在代码中体现:
```java
@Getter
@Builder
public class Order {  // "订单"
    private String orderId;           // 全局唯一ID
    private Long userId;              // 用户ID（分片键）
    private List<OrderItem> items;    // 订单项
    private OrderStatus status;       // 状态（待支付/已支付/...)
    private Money totalAmount;        // 总金额

    public void confirm() { ... }     // 业务行为
}
```

---

## 战术设计

### 1. 实体 (Entity)

**特征**:
- 具有唯一标识
- 生命周期内标识不变
- 通常是数据库中的主表记录

**设计原则**:
```java
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {
    private Long userId;           // 唯一标识
    private String email;          // 业务属性
    private String name;
    private UserStatus status;

    // 包含业务逻辑（充血模型）
    public void activate() {
        if (status != UserStatus.INACTIVE) {
            throw new DomainException("只有未激活用户可以激活");
        }
        this.status = UserStatus.ACTIVE;
    }
}
```

### 2. 值对象 (Value Object)

**特征**:
- 没有唯一标识
- 不可变（Immutable）
- 通过属性值判断相等性
- 例: 金额、日期、地址

**设计示例**:
```java
@Getter
@EqualsAndHashCode
public class Money {
    private final BigDecimal amount;
    private final String currency;

    private Money(BigDecimal amount, String currency) {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new DomainException("金额不能为负数");
        }
        this.amount = amount;
        this.currency = currency;
    }

    // 工厂方法
    public static Money of(BigDecimal amount) {
        return new Money(amount, "CNY");
    }

    // 业务操作
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new DomainException("货币类型不一致");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
}
```

### 3. 聚合 (Aggregate)

**定义**: 一组相关的实体和值对象，有一个聚合根，外部通过聚合根访问内部对象。

**示例: 订单聚合**
```java
@Getter
@Builder
public class Order {  // 聚合根
    private String orderId;
    private Long userId;
    private List<OrderItem> items;  // 聚合内对象
    private OrderStatus status;

    // 业务操作（通过聚合根）
    public void addItem(OrderItem item) {
        if (status != OrderStatus.PENDING) {
            throw new DomainException("只能向待确认订单添加项");
        }
        this.items.add(item);
    }

    public void confirm() { ... }
}

@Getter
@Builder
public class OrderItem {  // 聚合内对象
    private String itemId;
    private Long productId;
    private Integer quantity;

    // 不直接暴露给外部，只能通过 Order 访问
}
```

**聚合边界原则**:
- 每个聚合一个事务边界
- 聚合间通过 ID 引用（不直接引用对象）
- 修改一个聚合通过一个事务完成

### 4. 领域服务 (Domain Service)

**何时使用**: 跨聚合的业务逻辑，无法放在单个聚合内。

**特征**:
- 无状态
- 接收参数进行业务计算
- 返回计算结果（不涉及数据查询和持久化）

**示例**:
```java
public interface OrderDomain {
    // 业务计算：验证订单并创建订单对象
    Order createOrder(Long userId, List<OrderItem> items, BigDecimal userBalance);
}

@Component
public class OrderDomainImpl implements OrderDomain {
    private final IdGenerator idGenerator;

    @Override
    public Order createOrder(Long userId, List<OrderItem> items, BigDecimal userBalance) {
        // 1. 业务规则验证（基于传入参数）
        if (items == null || items.isEmpty()) {
            throw new DomainException("订单项不能为空");
        }

        // 2. 计算订单总额
        BigDecimal totalAmount = items.stream()
            .map(OrderItem::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. 业务规则：余额是否充足
        if (userBalance.compareTo(totalAmount) < 0) {
            throw new DomainException("余额不足");
        }

        // 4. 创建订单对象（纯计算，不涉及数据访问）
        return Order.builder()
            .orderId(idGenerator.generateId())
            .userId(userId)
            .items(items)
            .totalAmount(totalAmount)
            .status(OrderStatus.PENDING)
            .build();
    }
}
```

**在 Application 层中使用**:
```java
@Service
@RequiredArgsConstructor
public class OrderApplicationImpl implements OrderApplication {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderDomain orderDomain;

    @Override
    @Transactional
    public OrderDTO createOrder(CreateOrderParam param) {
        // 1. 数据查询（Application 层）
        User user = userRepository.findById(param.getUserId());
        List<OrderItem> items = param.getItems();

        // 2. 业务计算（Domain 层）
        Order order = orderDomain.createOrder(user.getId(), items, user.getBalance());

        // 3. 数据持久化（Application 层）
        orderRepository.save(order);
        return OrderDTO.from(order);
    }
}
```

### 5. 仓储 (Repository)

**责任**: 抽象数据访问，由 Application 层使用，Domain 层不依赖 Repository。

**设计**:
```java
// 基础设施层定义接口（或在 Application 层定义）
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(String orderId);
    List<Order> findByUserIdAndStatus(Long userId, OrderStatus status);
    boolean existsByUserIdAndStatus(Long userId, OrderStatus status);
}

// 基础设施层实现
@Repository
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepository {
    private final OrderMapper orderMapper;

    @Override
    public Order save(Order order) {
        OrderPO po = OrderPO.from(order);  // VO 转换
        if (po.getId() == null) {
            orderMapper.insert(po);
        } else {
            orderMapper.updateById(po);
        }
        return order;
    }

    @Override
    public Optional<Order> findById(String orderId) {
        OrderPO po = orderMapper.selectById(orderId);
        return Optional.ofNullable(po).map(OrderPO::toDomain);
    }

    @Override
    public List<Order> findByUserIdAndStatus(Long userId, OrderStatus status) {
        return orderMapper.selectList(
            new LambdaQueryWrapper<OrderPO>()
                .eq(OrderPO::getUserId, userId)
                .eq(OrderPO::getStatus, status)
        ).stream().map(OrderPO::toDomain).collect(Collectors.toList());
    }
}
```

**使用原则**:
- Repository 仅在 Application 层使用
- Domain 层不依赖 Repository，只进行业务计算
- 数据查询和持久化都在 Application 层完成

### 6. 工厂 (Factory)

**用途**: 处理复杂对象的创建逻辑。

**示例**:
```java
public interface OrderFactory {
    Order createOrder(Long userId, List<OrderItemParam> items);
}

@Component
@RequiredArgsConstructor
public class OrderFactoryImpl implements OrderFactory {
    private final IdGenerator idGenerator;
    private final PricingService pricingService;

    @Override
    public Order createOrder(Long userId, List<OrderItemParam> items) {
        // 生成订单ID
        String orderId = idGenerator.generateId();

        // 计算订单项信息
        List<OrderItem> orderItems = items.stream()
            .map(item -> OrderItem.create(
                item.getProductId(),
                item.getQuantity(),
                pricingService.getPrice(item.getProductId())
            ))
            .collect(Collectors.toList());

        // 计算总金额
        Money totalAmount = orderItems.stream()
            .map(OrderItem::getTotalPrice)
            .reduce(Money.ZERO, Money::add);

        // 创建订单
        return Order.builder()
            .orderId(orderId)
            .userId(userId)
            .items(orderItems)
            .totalAmount(totalAmount)
            .status(OrderStatus.PENDING)
            .build();
    }
}
```

### 7. 领域事件 (Domain Event)

**作用**: 记录领域中发生的重要事件，支持上下文间通信。

**设计**:
```java
@Getter
public class OrderCreatedEvent extends DomainEvent {
    private final String orderId;
    private final Long userId;
    private final Money totalAmount;
    private final LocalDateTime createdAt;

    public OrderCreatedEvent(String orderId, Long userId, Money totalAmount) {
        this.orderId = orderId;
        this.userId = userId;
        this.totalAmount = totalAmount;
        this.createdAt = LocalDateTime.now();
    }
}

// Domain 层：返回订单对象和事件
@Component
@RequiredArgsConstructor
public class OrderDomainImpl implements OrderDomain {
    private final IdGenerator idGenerator;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public OrderCreateResult createOrder(Long userId, List<OrderItem> items) {
        // 业务计算
        Order order = Order.create(userId, items);

        // 返回结果（包含订单对象和事件）
        OrderCreatedEvent event = new OrderCreatedEvent(
            order.getOrderId(), userId, order.getTotalAmount()
        );
        return new OrderCreateResult(order, event);
    }
}

// Application 层：持久化并发布事件
@Service
@RequiredArgsConstructor
public class OrderApplicationImpl implements OrderApplication {
    private final OrderRepository orderRepository;
    private final OrderDomain orderDomain;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public OrderDTO createOrder(CreateOrderParam param) {
        // 业务计算（Domain 层）
        OrderCreateResult result = orderDomain.createOrder(param.getUserId(), param.getItems());

        // 数据持久化（Application 层）
        orderRepository.save(result.getOrder());

        // 发布事件（Application 层）
        eventPublisher.publishEvent(result.getEvent());

        return OrderDTO.from(result.getOrder());
    }
}

// 其他上下文监听事件
@Component
@RequiredArgsConstructor
public class PaymentOrderEventListener {
    private final PaymentApplication paymentApplication;

    @EventListener
    @Transactional
    public void onOrderCreated(OrderCreatedEvent event) {
        // 支付系统可以选择对此事件做出反应
        paymentApplication.initializePayment(event.getOrderId(), event.getTotalAmount());
    }
}
```

---

## 分层架构

```
┌─────────────────────────────────┐
│   表现层 (Presentation)          │
│  - Controller                   │
│  - Param / DTO                  │
│  - 参数校验、响应转换           │
└─────────────────────────────────┘
              ↓ 依赖
┌─────────────────────────────────┐
│   应用层 (Application)           │
│  - Application Service Interface│
│  - Application Service Impl     │
│  - 业务编排、事务管理           │
│  - 数据查询、数据持久化         │
└─────────────────────────────────┘
              ↓ 依赖
┌─────────────────────────────────┐
│   领域层 (Domain)                │
│  - Entity / Value Object        │
│  - Domain Service               │
│  - 纯业务逻辑、模型计算         │
└─────────────────────────────────┘
              ↓ 依赖
┌─────────────────────────────────┐
│   基础设施层 (Infrastructure)    │
│  - Repository Impl              │
│  - Data Mapper (MyBatis)        │
│  - External Service Client      │
└─────────────────────────────────┘
```

**关键规则**:
- 依赖只能向下（向内）流动
- 上层不能直接访问下层的具体实现
- **Domain 层不依赖 Repository，所有数据访问由 Application 层完成**
- Domain 层只接收参数进行业务计算，返回结果
- 领域层不依赖框架特性

---

## DDD 建模检查清单

- [ ] 是否通过与业务沟通确定通用语言？
- [ ] 是否清晰识别限界上下文边界？
- [ ] 是否设计了聚合根和聚合边界？
- [ ] 实体是否包含业务逻辑（充血模型）？
- [ ] 是否使用值对象表达业务概念？
- [ ] 跨聚合逻辑是否放在领域服务？
- [ ] 是否通过领域事件解耦上下文通信？
- [ ] **Domain 层是否不依赖 Repository（数据访问在 Application 层）？**
- [ ] **Domain 层是否只进行业务计算，不涉及数据查询和持久化？**
- [ ] 是否避免了数据库驱动的设计？
