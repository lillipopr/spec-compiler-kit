## 完整开发工作流

### 概述

本文档描述 Java 后端开发的完整工作流程，从需求分析到代码审查，涵盖 DDD、TDD、数据库设计等所有关键环节。

---

## 步骤 1: 需求分析

**目标**: 充分理解业务需求，为架构设计奠定基础。

### 1.1 理解业务需求

```
问题清单:
- 这个功能解决什么业务问题？
- 涉及哪些业务角色？
- 主要的业务流程是什么？
- 有什么约束条件或规则？
```

**示例**:
```
功能：订单创建
业务问题：用户需要能够购买多个商品
角色：购买者、商家、平台
流程：
  1. 用户选择商品
  2. 填写收货地址
  3. 选择支付方式
  4. 提交订单
约束：
  - 库存必须充足
  - 单个订单最多 100 个商品
  - 订单总额不能超过 500,000 元
```

### 1.2 确定功能范围

```
MVP（最小可行产品）:
- 创建订单
- 查询订单
- 取消订单

未来扩展:
- 订单修改
- 订单分享
- 订单评价
```

### 1.3 评估技术可行性

```
风险评估:
- 并发：高峰期 1000 QPS，需要分库分表和缓存
- 一致性：订单和库存需要保证一致性，考虑 Saga 模式
- 可靠性：订单丢失不可接受，需要持久化和重试机制
```

---

## 步骤 2: 领域建模 (DDD)

**目标**: 使用通用语言构建领域模型，定义核心概念和业务规则。

### 2.1 识别领域对象

```
实体（有唯一标识）:
- 订单 (Order)
- 用户 (User)
- 商品 (Product)

值对象（不可变）:
- 金额 (Money) - 包含数值和货币单位
- 收货地址 (Address)
- 日期范围 (DateRange)

聚合根:
- Order（订单聚合根）包含 OrderItem
```

**代码示例**:
```java
// 值对象：金额
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

    public static Money of(BigDecimal amount) {
        return new Money(amount, "CNY");
    }
}

// 聚合根：订单
@Getter
@Builder
public class Order {
    private String orderId;          // 全局唯一ID
    private Long userId;             // 分片键
    private List<OrderItem> items;   // 聚合内对象
    private OrderStatus status;
    private Money totalAmount;

    public void addItem(OrderItem item) {
        if (status != OrderStatus.PENDING) {
            throw new DomainException("只能向待确认订单添加项");
        }
        this.items.add(item);
    }
}
```

### 2.2 定义业务规则

```
订单状态转移:
PENDING(待确认)
  ↓ 确认
CONFIRMED(已确认)
  ↓ 发货
SHIPPED(已发货)
  ↓ 确认收货
COMPLETED(已完成)

允许的操作:
- PENDING: 可以添加项、可以取消
- CONFIRMED: 不能添加项、不能取消
- SHIPPED: 只能确认收货
- COMPLETED: 不能做任何操作

验证规则:
- 订单总额不能为负
- 订单至少包含一个商品
- 订单金额不能超过 500,000 元
```

### 2.3 划分限界上下文

```
订单上下文 (Order Context)
- 聚合根: Order
- 核心概念: OrderStatus, OrderItem

支付上下文 (Payment Context)  ← 独立系统
- 聚合根: Payment
- 核心概念: PaymentStatus

库存上下文 (Inventory Context) ← 独立系统
- 聚合根: Inventory
- 核心概念: Stock
```

**上下文通信**:
```
订单系统 ─发布事件─→ "订单已创建"
                    ↓
               支付系统 监听
               库存系统 监听
```

---

## 步骤 3: 数据库设计

**目标**: 根据业务特性设计表结构和分片策略。

### 3.1 确定是否需要分片

```
评估指标:
- 数据量: 预期 5 年内多少条记录？
  → 订单: 100M 条 → 需要分片
  → 用户: 10M 条 → 可能需要分片

- 查询模式: 如何查询最频繁？
  → 订单: 按 user_id 查询 → user_id 是分片键
  → 用户: 按 email 查询 → 不适合分片
```

### 3.2 设计表结构

```sql
-- 订单表（分片表）
CREATE TABLE `user_order_0` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分片内自增ID',
  `order_id` VARCHAR(64) NOT NULL COMMENT '全局唯一订单ID',
  `user_id` BIGINT(20) UNSIGNED NOT NULL COMMENT '用户ID（分片键）',
  `product_id` BIGINT(20) UNSIGNED NOT NULL COMMENT '商品ID',
  `quantity` INT NOT NULL COMMENT '数量',
  `total_amount` DECIMAL(19, 4) NOT NULL COMMENT '订单金额',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '订单状态',

  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '软删除标记',
  `deleted_at` DATETIME(3) NULL COMMENT '删除时间',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  KEY `idx_user_id_status` (`user_id`, `status`)
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 订单项表（与订单同分片）
CREATE TABLE `user_order_item_0` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(64) NOT NULL COMMENT '关联订单ID',
  `product_id` BIGINT(20) UNSIGNED NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(19, 4) NOT NULL,

  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB CHARSET=utf8mb4;
```

### 3.3 配置分片策略

参见 `references/sharding.md`

---

## 步骤 4: 编写测试 (TDD)

**目标**: 先编写测试，驱动代码设计。

### 4.1 单元测试

```java
@Test
void shouldCreateOrderSuccessfully() {
    // Given - 准备数据
    Long userId = 123L;
    Long productId = 456L;
    Integer quantity = 2;
    Money unitPrice = Money.of(new BigDecimal("100.00"));

    Product product = Product.builder()
        .id(productId)
        .price(unitPrice)
        .stock(10)
        .build();

    when(productRepository.findById(productId))
        .thenReturn(Optional.of(product));

    // When - 执行操作
    Order order = orderDomain.createOrder(userId, productId, quantity);

    // Then - 验证结果
    assertThat(order).isNotNull();
    assertThat(order.getUserId()).isEqualTo(userId);
    assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
    assertThat(order.getTotalAmount())
        .isEqualTo(Money.of(new BigDecimal("200.00")));
}

@Test
void shouldThrowExceptionWhenStockInsufficient() {
    // Given
    Product product = Product.builder()
        .id(456L)
        .stock(1)
        .build();

    when(productRepository.findById(456L))
        .thenReturn(Optional.of(product));

    // When & Then
    assertThatThrownBy(() ->
        orderDomain.createOrder(123L, 456L, 10)  // 库存不足
    ).isInstanceOf(DomainException.class)
     .hasMessage("库存不足");
}
```

### 4.2 集成测试

```java
@SpringBootTest
@AutoConfigureTestDatabase
class OrderServiceIntegrationTest {
    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @Transactional
    void shouldCreateOrderWithSharding() {
        // Given
        CreateOrderParam param = new CreateOrderParam();
        param.setUserId(123L);
        param.setProductId(456L);
        param.setQuantity(2);

        // When
        OrderDTO result = orderService.createOrder(param);

        // Then
        assertThat(result).isNotNull();

        // 验证数据库中是否存在
        Optional<Order> savedOrder = orderRepository.findByOrderId(result.getOrderId());
        assertThat(savedOrder).isPresent();
        assertThat(savedOrder.get().getUserId()).isEqualTo(123L);
    }
}
```

---

## 步骤 5: 实现代码

**目标**: 按照分层架构实现代码。

### 5.1 Controller 层

```java
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderApplication orderApplication;

    @PostMapping("/create")
    public ApiResponse<OrderDTO> createOrder(
        @Valid @RequestBody CreateOrderParam param
    ) {
        OrderDTO order = orderApplication.createOrder(
            param.getUserId(),
            param.getProductId(),
            param.getQuantity(),
            param.getAmount()
        );
        return ApiResponse.success(order);
    }

    @PostMapping("/{orderId}/confirm")
    public ApiResponse<OrderDTO> confirmOrder(
        @PathVariable String orderId
    ) {
        OrderDTO order = orderApplication.confirmOrder(orderId);
        return ApiResponse.success(order);
    }

    @PostMapping("/{orderId}/cancel")
    public ApiResponse<Void> cancelOrder(
        @PathVariable String orderId
    ) {
        orderApplication.cancelOrder(orderId);
        return ApiResponse.success();
    }
}
```

### 5.2 Application 层

```java
public interface OrderApplication {
    OrderDTO createOrder(Long userId, Long productId, Integer quantity, Long amount);
    OrderDTO confirmOrder(String orderId);
    void cancelOrder(String orderId);
}

@Service
@RequiredArgsConstructor
public class OrderApplicationImpl implements OrderApplication {
    private final OrderDomain orderDomain;
    private final UserDomain userDomain;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    public OrderDTO createOrder(Long userId, Long productId, Integer quantity, Long amount) {
        // 1. 验证用户
        User user = userDomain.getUserById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        // 2. 创建订单
        Order order = orderDomain.createOrder(userId, productId, quantity, Money.of(amount));

        // 3. 发布事件
        eventPublisher.publish(new OrderCreatedEvent(order.getOrderId()));

        // 4. 返回 DTO
        return OrderDTO.from(order);
    }

    @Override
    @Transactional
    public OrderDTO confirmOrder(String orderId) {
        Order order = orderDomain.confirmOrder(orderId);
        eventPublisher.publish(new OrderConfirmedEvent(orderId));
        return OrderDTO.from(order);
    }
}
```

### 5.3 Domain 层

```java
public interface OrderDomain {
    Order createOrder(Long userId, Long productId, Integer quantity, Money amount);
    Order confirmOrder(String orderId);
    void cancelOrder(String orderId);
}

@Component
@RequiredArgsConstructor
public class OrderDomainImpl implements OrderDomain {
    private final OrderRepository orderRepository;
    private final IdGenerator idGenerator;

    @Override
    public Order createOrder(Long userId, Long productId, Integer quantity, Money amount) {
        // 1. 生成全局 ID
        String orderId = idGenerator.generateId();

        // 2. 创建领域对象
        Order order = Order.builder()
            .orderId(orderId)
            .userId(userId)
            .productId(productId)
            .quantity(quantity)
            .totalAmount(amount)
            .status(OrderStatus.PENDING)
            .build();

        // 3. 业务规则验证
        order.validate();

        // 4. 持久化
        return orderRepository.save(order);
    }

    @Override
    public Order confirmOrder(String orderId) {
        Order order = orderRepository.findByOrderId(orderId)
            .orElseThrow(() -> new DomainException("订单不存在"));

        order.confirm();  // 业务行为
        return orderRepository.save(order);
    }
}
```

### 5.4 Repository 层

```java
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findByOrderId(String orderId);
    List<Order> findByUserIdAndStatus(Long userId, OrderStatus status, Pageable pageable);
}

@Repository
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepository {
    private final OrderMapper orderMapper;

    @Override
    public Order save(Order order) {
        OrderPO po = OrderPO.from(order);
        if (po.getId() == null) {
            orderMapper.insert(po);
        } else {
            orderMapper.updateById(po);
        }
        return order;
    }

    @Override
    public Optional<Order> findByOrderId(String orderId) {
        OrderPO po = orderMapper.selectByOrderId(orderId);
        return Optional.ofNullable(po).map(OrderPO::toDomain);
    }
}
```

---

## 步骤 6: 重构优化

**目标**: 改进代码质量和性能。

### 6.1 代码质量优化

```
检查清单:
- [ ] 是否有重复代码可以提取？
- [ ] 是否有长方法需要拆分？
- [ ] 命名是否清晰？
- [ ] 是否遵循 SOLID 原则？
```

**示例**:
```java
// ❌ 重复代码：验证用户和订单
public OrderDTO createOrder(CreateOrderParam param) {
    // 验证用户
    User user = userRepository.findById(param.getUserId())
        .orElseThrow(() -> new BusinessException("用户不存在"));
    // ...
}

public OrderDTO updateOrder(UpdateOrderParam param) {
    // 验证用户（重复）
    User user = userRepository.findById(param.getUserId())
        .orElseThrow(() -> new BusinessException("用户不存在"));
    // ...
}

// ✅ 提取重复代码
private User validateUser(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("用户不存在"));
}

public OrderDTO createOrder(CreateOrderParam param) {
    User user = validateUser(param.getUserId());
    // ...
}
```

### 6.2 性能优化

```
常见瓶颈:
1. N+1 查询 → 批量加载
2. 全表扫描 → 添加索引
3. 热数据频繁访问 → 使用缓存
4. 跨分片查询 → 优化查询条件
```

参见 `references/patterns.md` 中的性能优化部分。

---

## 步骤 7: 代码审查

**目标**: 确保代码质量和一致性。

### 7.1 审查清单

```
业务正确性:
- [ ] 业务逻辑是否符合需求？
- [ ] 是否处理了所有边界情况？
- [ ] 异常处理是否完善？

SOLID 原则:
- [ ] 每个类职责是否单一？
- [ ] 是否易于扩展？
- [ ] 是否依赖抽象？

性能考虑:
- [ ] 是否有 N+1 查询？
- [ ] 数据库查询是否优化？
- [ ] 是否有内存泄漏风险？

代码质量:
- [ ] 命名是否清晰？
- [ ] 代码是否可读？
- [ ] 是否有过度设计？
```

### 7.2 Review 反馈示例

```
Comment 1:
问题：OrderService.createOrder() 方法包含验证、创建、事件发布等多个职责
建议：拆分为更小的私有方法，或提取到独立的 Use Case
参考：OrderCreateUseCase

Comment 2:
问题：没有处理库存并发扣减的情况
建议：添加乐观锁（version 字段）或分布式锁

Comment 3:
问题：可能存在 N+1 查询
建议：批量加载商品信息而不是逐个加载
```

---

## 开发工作流总结

```
需求分析
    ↓
领域建模 (DDD)
    ↓
数据库设计
    ↓
编写测试 (TDD) ← 先写测试！
    ↓
实现代码
    ↓
重构优化
    ↓
代码审查
    ↓
完成 ✓
```

**关键原则**:
1. **以需求为驱动**: 充分理解业务后再设计
2. **使用 DDD**: 业务逻辑用领域对象表达，不是数据表达
3. **测试先行**: 先写测试，驱动代码设计
4. **持续重构**: 保持代码整洁，消除坏味道
5. **同行评审**: 保证质量一致性

---

## 检查清单

- [ ] 需求分析是否充分？
- [ ] 领域模型是否清晰？
- [ ] 数据库设计是否支持业务？
- [ ] 测试覆盖是否充分？
- [ ] 代码是否遵循分层架构？
- [ ] 是否有重复代码？
- [ ] 性能指标是否满足要求？
- [ ] 代码审查是否通过？
