# 最佳实践

## 充血模型

### 概念

将业务逻辑放在实体内部，而不是放在服务层。

### 示例

```java
// ✅ 充血模型：业务逻辑在实体内
@Getter
@Entity
public class Order {
    private OrderStatus status;
    private Money totalAmount;

    // 业务行为
    public void confirm() {
        if (status != OrderStatus.PENDING) {
            throw new DomainException("只有待确认订单可以确认");
        }
        this.status = OrderStatus.CONFIRMED;
    }

    public void pay(Money amount) {
        if (status != OrderStatus.CONFIRMED) {
            throw new DomainException("只有已确认订单可以支付");
        }
        if (!totalAmount.equals(amount)) {
            throw new DomainException("金额不匹配");
        }
        this.status = OrderStatus.PAID;
    }
}

// ❌ 贫血模型：业务逻辑在服务层
@Getter
@Setter
@Entity
public class Order {
    private OrderStatus status;
    private Money totalAmount;
    // 没有 business logic
}

@Service
public class OrderService {
    public void confirmOrder(Order order) {
        // 业务逻辑散落在服务层
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new DomainException("只有待确认订单可以确认");
        }
        order.setStatus(OrderStatus.CONFIRMED);
    }
}
```

---

## 批量查询

### 概念

使用批量查询替代循环查询，减少数据库交互次数。

### 示例

```java
// ❌ N+1 查询问题
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

// ✅ 批量查询优化
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
        .collect(Collectors.toMap(Product::getId, Function.identity()));

    // 4. 组装结果
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

## 缓存策略

### Cache-Aside

```java
@Service
@RequiredArgsConstructor
public class ProductApplication {
    private final ProductRepository productRepository;
    private final RedisTemplate<String, Product> redisTemplate;

    public Product getProduct(Long productId) {
        String cacheKey = "product:" + productId;

        // 1. 先查缓存
        Product product = redisTemplate.opsForValue().get(cacheKey);
        if (product != null) {
            return product;
        }

        // 2. 缓存未命中，查数据库
        product = productRepository.findById(productId)
            .orElseThrow(() -> new NotFoundException("商品不存在"));

        // 3. 写入缓存
        redisTemplate.opsForValue().set(cacheKey, product, 30, TimeUnit.MINUTES);

        return product;
    }

    public void updateProduct(Product product) {
        // 1. 更新数据库
        productRepository.save(product);

        // 2. 删除缓存（而非更新）
        String cacheKey = "product:" + product.getId();
        redisTemplate.delete(cacheKey);
    }
}
```

### 缓存穿透防护

```java
public Product getProduct(Long productId) {
    String cacheKey = "product:" + productId;

    // 1. 查询缓存（包括空值缓存）
    Product product = redisTemplate.opsForValue().get(cacheKey);
    if (product != null) {
        if (product == NULL_PLACEHOLDER) {
            throw new NotFoundException("商品不存在");
        }
        return product;
    }

    // 2. 查询数据库
    Optional<Product> optional = productRepository.findById(productId);

    // 3. 缓存结果（包括空值）
    if (optional.isPresent()) {
        redisTemplate.opsForValue().set(cacheKey, optional.get(), 30, TimeUnit.MINUTES);
        return optional.get();
    } else {
        // 缓存空值，防止穿透
        redisTemplate.opsForValue().set(cacheKey, NULL_PLACEHOLDER, 5, TimeUnit.MINUTES);
        throw new NotFoundException("商品不存在");
    }
}
```

### 缓存雪崩防护

```java
@Bean
public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(factory);

    // 设置随机过期时间，防止雪崩
    Random random = new Random();
    template.setKeySerializer(new StringRedisSerializer());
    template.setValueSerializer(new GenericJackson2JsonRedisSerializer());

    return template;
}

// 使用时添加随机值
redisTemplate.opsForValue().set(
    cacheKey,
    product,
    30 + random.nextInt(5),  // 30-35 分钟随机过期
    TimeUnit.MINUTES
);
```

---

## 异步处理

### CompletableFuture

```java
@Service
@RequiredArgsConstructor
public class OrderApplication {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;

    public OrderDTO getOrderDetail(Long orderId) {
        // 并行查询
        CompletableFuture<Order> orderFuture = CompletableFuture.supplyAsync(
            () -> orderRepository.findById(orderId).orElseThrow()
        );
        CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(
            () -> userRepository.findById(userId).orElseThrow()
        );
        CompletableFuture<List<Product>> productsFuture = CompletableFuture.supplyAsync(
            () -> productRepository.findByOrderId(orderId)
        );

        // 等待所有结果
        CompletableFuture.allOf(orderFuture, userFuture, productsFuture).join();

        // 组装结果
        Order order = orderFuture.join();
        User user = userFuture.join();
        List<Product> products = productsFuture.join();

        return OrderDTO.builder()
            .order(order)
            .user(user)
            .products(products)
            .build();
    }
}
```

### @Async

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean("taskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("async-task-");
        executor.initialize();
        return executor;
    }
}

@Service
public class OrderService {

    @Async("taskExecutor")
    public void sendOrderNotification(Order order) {
        // 异步发送通知
        emailService.send(order.getUserEmail(), "订单创建成功");
    }
}
```

---

## 参数验证

### Bean Validation

```java
// Param 对象
@Data
public class CreateUserParam {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "姓名不能为空")
    @Size(min = 2, max = 20, message = "姓名长度必须在 2-20 之间")
    private String name;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 20, message = "密码长度必须在 8-20 之间")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$", message = "密码必须包含大小写字母和数字")
    private String password;
}

// Controller 验证
@RestController
@RequiredArgsConstructor
public class UserController {

    @PostMapping("/create")
    public ApiResponse<UserDTO> createUser(@Valid @RequestBody CreateUserParam param) {
        // @Valid 自动验证，失败返回 400
        return ApiResponse.success(userApplication.createUser(param));
    }
}

// 自定义验证注解
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
public @interface StrongPassword {
    String message() default "密码强度不够";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PasswordValidator implements ConstraintValidator<StrongPassword, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return false;
        }
        // 自定义验证逻辑
        return value.length() >= 8
            && value.matches(".*[A-Z].*")
            && value.matches(".*[a-z].*")
            && value.matches(".*\\d.**");
    }
}
```

---

## 异常处理

### 统一异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiResponse<Void>> handleDomainException(DomainException e) {
        log.warn("业务异常: {}", e.getMessage());
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getAllErrors().stream()
            .map(DefaultMessageSourceResolvable::getDefaultMessage)
            .collect(Collectors.joining(", "));
        log.warn("参数验证失败: {}", message);
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error("VALIDATION_ERROR", message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("系统异常", e);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("SYSTEM_ERROR", "系统异常，请稍后再试"));
    }
}
```

### 业务异常

```java
@Getter
public class DomainException extends RuntimeException {
    private final String code;

    public DomainException(String code, String message) {
        super(message);
        this.code = code;
    }

    public DomainException(String message) {
        this("BUSINESS_ERROR", message);
    }
}

// 使用
public void createUser(CreateUserParam param) {
    if (userRepository.existsByEmail(param.getEmail())) {
        throw new DomainException("EMAIL_EXISTS", "邮箱已存在");
    }
}
```
