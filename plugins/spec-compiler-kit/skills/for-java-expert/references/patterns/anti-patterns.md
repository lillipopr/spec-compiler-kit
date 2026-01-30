## 反模式和最佳实践

### 概述

本文档总结 Java 开发中常见的反模式（Anti-patterns）和对应的最佳实践，帮助识别和避免常见错误，提升代码质量。

---

## 设计模式

### ❌ 反模式 1: 贫血模型 (Anemic Domain Model)

**问题**: 实体只有 getter/setter，所有业务逻辑都在 Service 层。

```java
// ❌ 错误：实体没有业务逻辑
@Data
public class Order {
    private Long id;
    private OrderStatus status;
    private BigDecimal totalAmount;
    // 只有 getter/setter
}

// Service 包含所有逻辑
@Service
public class OrderService {
    public void confirmOrder(Order order) {
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException("状态不正确");
        }
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
    }

    public void cancelOrder(Order order) {
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BusinessException("已完成订单无法取消");
        }
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }
}
```

**问题**:
- 领域对象失去意义，成为数据容器
- 业务规则分散在 Service 层
- 违反 OOP 封装原则
- 难以维护和测试

### ✅ 最佳实践: 充血模型 (Rich Domain Model)

```java
// ✅ 正确：实体包含业务逻辑
@Getter
@Builder
public class Order {
    private Long id;
    private OrderStatus status;
    private Money totalAmount;

    // 业务行为封装在实体内
    public void confirm() {
        if (status != OrderStatus.PENDING) {
            throw new DomainException("只有待确认订单可以确认");
        }
        this.status = OrderStatus.CONFIRMED;
    }

    public void cancel() {
        if (status == OrderStatus.COMPLETED) {
            throw new DomainException("已完成订单无法取消");
        }
        this.status = OrderStatus.CANCELLED;
    }

    public void validate() {
        if (totalAmount.isNegative()) {
            throw new DomainException("订单金额不能为负数");
        }
    }
}

// Domain 层：调用领域对象的业务方法
@Component
@RequiredArgsConstructor
public class OrderDomainImpl implements OrderDomain {
    private final OrderRepository orderRepository;

    @Override
    public Order confirmOrder(String orderId) {
        Order order = orderRepository.findByOrderId(orderId)
            .orElseThrow(() -> new DomainException("订单不存在"));
        order.confirm();  // 领域行为
        return orderRepository.save(order);
    }
}

// Application 层：只负责编排
@Service
@RequiredArgsConstructor
public class OrderApplicationImpl implements OrderApplication {
    private final OrderDomain orderDomain;

    @Override
    @Transactional
    public OrderDTO confirmOrder(String orderId) {
        Order order = orderDomain.confirmOrder(orderId);
        return OrderDTO.from(order);
    }
}
```

---

### ❌ 反模式 2: 事务脚本 (Transaction Script)

**问题**: Service 包含大量过程式代码，没有领域对象。

```java
// ❌ 错误：Service 包含所有过程式代码
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderMapper orderMapper;
    private final ProductMapper productMapper;
    private final UserMapper userMapper;

    public OrderDTO createOrder(CreateOrderParam param) {
        // 200+ 行代码，各种 if-else，没有领域对象
        if (param.getUserId() == null) {
            throw new BusinessException("用户ID不能为空");
        }

        User user = userMapper.selectById(param.getUserId());
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        Product product = productMapper.selectById(param.getProductId());
        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        if (product.getStock() < param.getQuantity()) {
            throw new BusinessException("库存不足");
        }

        BigDecimal amount = product.getPrice().multiply(
            BigDecimal.valueOf(param.getQuantity())
        );

        OrderPO orderPO = new OrderPO();
        orderPO.setOrderId(UUID.randomUUID().toString());
        orderPO.setUserId(param.getUserId());
        orderPO.setProductId(param.getProductId());
        orderPO.setQuantity(param.getQuantity());
        orderPO.setTotalAmount(amount);
        orderPO.setStatus(1);
        orderMapper.insert(orderPO);

        product.setStock(product.getStock() - param.getQuantity());
        productMapper.updateById(product);

        return convertToDTO(orderPO);
    }
}
```

**问题**:
- 代码可读性差
- 逻辑难以复用
- 违反单一职责原则
- 测试困难

### ✅ 最佳实践: 领域驱动设计

```java
// ✅ 正确：使用领域对象和领域服务
@Service
@RequiredArgsConstructor
public class OrderApplicationImpl implements OrderApplication {
    private final UserDomain userDomain;
    private final ProductDomain productDomain;
    private final OrderDomain orderDomain;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    public OrderDTO createOrder(Long userId, Long productId, Integer quantity) {
        // 1. 验证用户（领域层）
        User user = userDomain.getUserById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        // 2. 验证商品库存（领域层）
        Product product = productDomain.getProductById(productId);
        if (!product.hasEnoughStock(quantity)) {
            throw new BusinessException("库存不足");
        }

        // 3. 创建订单（领域层）
        Order order = orderDomain.createOrder(userId, productId, quantity);

        // 4. 扣减库存（领域层）
        productDomain.reduceStock(productId, quantity);

        // 5. 发布领域事件
        eventPublisher.publish(new OrderCreatedEvent(order.getOrderId()));

        // 6. 返回 DTO
        return OrderDTO.from(order);
    }
}
```

---

## 数据库设计

### ❌ 反模式 3: 跨分片查询

**问题**: 查询不包含分片键，需要扫描所有分片。

```java
// ❌ 错误：缺少分片键，扫描所有分片
List<Order> orders = orderRepository.findByStatus(OrderStatus.PENDING);

// ShardingSphere 需要在所有分片执行查询
// SELECT * FROM user_order_0 WHERE status = ?
// SELECT * FROM user_order_1 WHERE status = ?
// SELECT * FROM user_order_2 WHERE status = ?
// ... (性能差)
```

### ✅ 最佳实践: 包含分片键

```java
// ✅ 正确：包含分片键 user_id
List<Order> orders = orderRepository.findByUserIdAndStatus(
    userId,
    OrderStatus.PENDING
);

// ShardingSphere 直接路由到单个分片
// SELECT * FROM user_order_${userId % 2} WHERE user_id = ? AND status = ?
```

---

### ❌ 反模式 4: 跨分片 JOIN

**问题**: JOIN 操作跨越多个分片。

```java
// ❌ 错误：跨分片 JOIN
@Query("""
    SELECT o.*, p.name
    FROM user_order_0 o
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ?
    """)
List<OrderWithProduct> findOrdersWithProduct(Long userId);
```

**问题**:
- ShardingSphere 无法高效执行跨库 JOIN
- 性能低下

### ✅ 最佳实践: 应用层关联

```java
// ✅ 正确：应用层关联
public List<OrderDTO> getOrdersWithProducts(Long userId) {
    // 1. 查询订单
    List<Order> orders = orderRepository.findByUserId(userId);

    // 2. 收集商品 ID
    List<Long> productIds = orders.stream()
        .map(Order::getProductId)
        .distinct()
        .collect(Collectors.toList());

    // 3. 批量查询商品
    Map<Long, Product> productMap = productRepository
        .findByIdIn(productIds)
        .stream()
        .collect(Collectors.toMap(Product::getId, p -> p));

    // 4. 在应用层组装
    return orders.stream()
        .map(order -> {
            OrderDTO dto = OrderDTO.from(order);
            dto.setProduct(productMap.get(order.getProductId()));
            return dto;
        })
        .collect(Collectors.toList());
}
```

---

## 代码结构

### ❌ 反模式 5: 上帝类 (God Class)

**问题**: 一个类承担过多职责。

```java
// ❌ 错误：一个类承担 10+ 个职责
@Service
public class UserService {
    // 职责 1: 用户注册
    public User register(RegisterParam param) { ... }

    // 职责 2: 用户登录
    public String login(LoginParam param) { ... }

    // 职责 3: 密码重置
    public void resetPassword(String email) { ... }

    // 职责 4: 头像上传
    public String uploadAvatar(MultipartFile file) { ... }

    // 职责 5: 个人资料更新
    public void updateProfile(UpdateProfileParam param) { ... }

    // 职责 6: 邮件发送
    public void sendEmail(String to, String subject, String content) { ... }

    // 职责 7: 短信发送
    public void sendSms(String phone, String code) { ... }

    // 职责 8: 用户权限验证
    public boolean hasPermission(Long userId, String permission) { ... }

    // 职责 9: 用户行为日志
    public void logUserAction(Long userId, String action) { ... }

    // 职责 10: 统计分析
    public UserStatistics getUserStatistics(Long userId) { ... }
}
```

**问题**:
- 违反单一职责原则
- 难以维护和测试
- 代码耦合严重

### ✅ 最佳实践: 职责分离

```java
// ✅ 正确：按职责拆分服务

// 认证服务
@Component
public class AuthenticationDomainImpl implements AuthenticationDomain {
    public User login(String email, String password) { ... }
    public void resetPassword(String email) { ... }
}

// 用户资料服务
@Component
public class ProfileDomainImpl implements ProfileDomain {
    public void updateProfile(Long userId, ProfileParam param) { ... }
    public String uploadAvatar(Long userId, MultipartFile file) { ... }
}

// 通知服务
@Component
public class NotificationDomainImpl implements NotificationDomain {
    public void sendEmail(String to, String subject, String content) { ... }
    public void sendSms(String phone, String code) { ... }
}

// 权限服务
@Component
public class PermissionDomainImpl implements PermissionDomain {
    public boolean hasPermission(Long userId, String permission) { ... }
}
```

---

### ❌ 反模式 6: 硬依赖

**问题**: Service 直接依赖具体实现，难以测试。

```java
// ❌ 错误：硬依赖具体实现
@Service
public class OrderService {
    private final OrderMapper orderMapper = new OrderMapper();  // 硬依赖
    private final EmailService emailService = new EmailService();  // 硬依赖

    public void createOrder(CreateOrderParam param) {
        // ...
        emailService.sendOrderConfirmation(param.getUserEmail());
    }
}

// 无法测试：无法 Mock emailService
```

### ✅ 最佳实践: 依赖注入

```java
// ✅ 正确：依赖抽象，通过构造函数注入
public interface NotificationService {
    void sendOrderConfirmation(String email, String orderId);
}

@Service
@RequiredArgsConstructor
public class OrderApplicationImpl implements OrderApplication {
    private final OrderDomain orderDomain;
    private final NotificationService notificationService;  // 依赖抽象

    @Override
    @Transactional
    public OrderDTO createOrder(CreateOrderParam param) {
        Order order = orderDomain.createOrder(param);

        // 使用注入的服务
        notificationService.sendOrderConfirmation(
            param.getUserEmail(),
            order.getOrderId()
        );

        return OrderDTO.from(order);
    }
}

// 可测试：可以注入 Mock 实现
@Test
void testCreateOrder() {
    NotificationService mockService = mock(NotificationService.class);
    OrderApplicationImpl service = new OrderApplicationImpl(orderDomain, mockService);

    service.createOrder(param);

    verify(mockService).sendOrderConfirmation(anyString(), anyString());
}
```

---

## 异常处理

### ❌ 反模式 7: 吞掉异常

**问题**: 捕获异常后不处理或仅打印日志。

```java
// ❌ 错误：吞掉异常
public void updateUser(Long userId, UpdateUserParam param) {
    try {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("用户不存在"));
        user.update(param);
        userRepository.save(user);
    } catch (Exception e) {
        e.printStackTrace();  // 仅打印，不向上抛出
    }
}
```

**问题**:
- 调用方无法知道操作失败
- 数据可能不一致
- 难以排查问题

### ✅ 最佳实践: 合理传递异常

```java
// ✅ 正确：异常向上传递，统一处理
@Component
@RequiredArgsConstructor
public class UserDomainImpl implements UserDomain {
    private final UserRepository userRepository;

    @Override
    public User updateUser(Long userId, UpdateUserParam param) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new DomainException("用户不存在"));

        user.update(param);
        return userRepository.save(user);
        // 异常向上抛出，由统一异常处理器处理
    }
}

// 统一异常处理
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(DomainException.class)
    public ApiResponse<Void> handleDomainException(DomainException e) {
        log.error("领域异常: {}", e.getMessage());
        return ApiResponse.fail(e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return ApiResponse.fail("系统异常，请稍后重试");
    }
}
```

---

## 性能优化

### ❌ 反模式 8: N+1 查询

**问题**: 循环中执行数据库查询。

```java
// ❌ 错误：N+1 查询
public List<OrderDTO> getOrders(Long userId) {
    List<Order> orders = orderRepository.findByUserId(userId);  // 1 query

    return orders.stream()
        .map(order -> {
            Product product = productRepository.findById(order.getProductId());  // N queries
            OrderDTO dto = OrderDTO.from(order);
            dto.setProduct(product);
            return dto;
        })
        .collect(Collectors.toList());
}

// 执行 1 + N 次查询（性能差）
```

### ✅ 最佳实践: 批量查询

```java
// ✅ 正确：批量查询
public List<OrderDTO> getOrders(Long userId) {
    // 1. 查询订单（1 query）
    List<Order> orders = orderRepository.findByUserId(userId);

    // 2. 收集商品 ID
    Set<Long> productIds = orders.stream()
        .map(Order::getProductId)
        .collect(Collectors.toSet());

    // 3. 批量查询商品（1 query）
    Map<Long, Product> productMap = productRepository
        .findByIdIn(productIds)
        .stream()
        .collect(Collectors.toMap(Product::getId, p -> p));

    // 4. 组装结果
    return orders.stream()
        .map(order -> {
            OrderDTO dto = OrderDTO.from(order);
            dto.setProduct(productMap.get(order.getProductId()));
            return dto;
        })
        .collect(Collectors.toList());
}

// 执行 2 次查询（性能好）
```

---

## 代码可读性

### ❌ 反模式 9: 魔法数字和字符串

**问题**: 代码中直接使用数字和字符串。

```java
// ❌ 错误：魔法数字和字符串
public void processOrder(Order order) {
    if (order.getStatus() == 1) {  // 1 表示什么？
        // ...
    }

    if (order.getType().equals("PHYSICAL")) {  // 字符串容易拼写错误
        // ...
    }

    if (order.getTotalAmount().compareTo(new BigDecimal("1000")) > 0) {  // 1000 是什么？
        // 满1000减100
    }
}
```

### ✅ 最佳实践: 使用常量和枚举

```java
// ✅ 正确：使用枚举和常量
public enum OrderStatus {
    PENDING(1, "待确认"),
    CONFIRMED(2, "已确认"),
    COMPLETED(3, "已完成");

    private final int code;
    private final String description;

    OrderStatus(int code, String description) {
        this.code = code;
        this.description = description;
    }
}

public enum OrderType {
    PHYSICAL,   // 实物商品
    DIGITAL     // 虚拟商品
}

public class PromotionConstants {
    public static final BigDecimal DISCOUNT_THRESHOLD = new BigDecimal("1000");
    public static final BigDecimal DISCOUNT_AMOUNT = new BigDecimal("100");
}

public void processOrder(Order order) {
    if (order.getStatus() == OrderStatus.PENDING) {
        // 清晰易懂
    }

    if (order.getType() == OrderType.PHYSICAL) {
        // 类型安全
    }

    if (order.getTotalAmount().compareTo(PromotionConstants.DISCOUNT_THRESHOLD) > 0) {
        // 语义明确
    }
}
```

---

## 检查清单

### 设计模式
- [ ] 实体是否包含业务逻辑（充血模型）？
- [ ] 是否避免了事务脚本反模式？
- [ ] 是否拆分了上帝类？

### 数据库设计
- [ ] 分片查询是否包含分片键？
- [ ] 是否避免了跨分片 JOIN？
- [ ] 是否解决了 N+1 查询问题？

### 代码结构
- [ ] 是否依赖抽象而非具体实现？
- [ ] 是否使用依赖注入？
- [ ] 是否遵循单一职责原则？

### 异常处理
- [ ] 异常是否正确向上传递？
- [ ] 是否有统一的异常处理器？
- [ ] 日志是否完善？

### 代码可读性
- [ ] 是否使用枚举替代魔法数字？
- [ ] 是否使用常量替代魔法字符串？
- [ ] 命名是否清晰？
