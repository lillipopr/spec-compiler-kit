# SOLID 设计原则

## 概述

SOLID 是面向对象设计的五个基本原则，遵循这些原则可以让代码更易维护、扩展和测试。

---

## S - 单一职责原则 (Single Responsibility Principle)

### 定义

> 一个类应该只有一个引起它变化的原因。

### 核心思想

- 每个类只负责一件事
- 修改一个功能不应影响其他功能
- 职责清晰，易于理解和维护

### 编码实践

```java
// ❌ 错误：一个类负责多件事
public class UserService {
    public void createUser(User user) { }           // 业务逻辑
    public void sendEmail(String to, String content) { }  // 邮件发送
    public void log(String message) { }             // 日志记录
}

// ✅ 正确：职责分离
public class UserApplication {
    private final UserRepository userRepository;
    private final EmailService emailService;

    public void createUser(CreateUserParam param) {
        User user = domain.createUser(param);
        userRepository.save(user);
        emailService.sendWelcomeEmail(user.getEmail());
    }
}

// 邮件服务独立
public class EmailService {
    public void sendWelcomeEmail(String email) {
        // 邮件发送逻辑
    }
}

// 日志服务独立
public class Logger {
    public void log(String message) {
        // 日志逻辑
    }
}
```

### Code Review 检查点

- [ ] 类的方法是否都在做同一件事？
- [ ] 修改一个功能是否影响其他功能？
- [ ] 类的名称是否准确描述其职责？

### DDD 分层中的体现

| 层 | 单一职责 |
|----|----------|
| **Controller** | 只负责请求处理和响应封装 |
| **Application** | 只负责业务编排、数据访问、事务管理 |
| **Domain** | 只负责业务规则验证和纯业务计算 |
| **Repository** | 只负责数据访问 |

---

## O - 开闭原则 (Open-Closed Principle)

### 定义

> 软件实体（类、模块、函数）应该对扩展开放，对修改关闭。

### 核心思想

- 新增功能时通过扩展实现，不修改已有代码
- 使用抽象和多态实现灵活性
- 减少引入 bug 的风险

### 编码实践

#### 策略模式替代 if-else

```java
// ❌ 错误：每次新增类型都要修改代码
public class OrderService {
    public void calculateDiscount(Order order) {
        if (order.getType() == OrderType.NORMAL) {
            order.setDiscount(new NormalDiscountStrategy().calculate(order));
        } else if (order.getType() == OrderType.VIP) {
            order.setDiscount(new VipDiscountStrategy().calculate(order));
        } else if (order.getType() == OrderType.SUPER_VIP) {
            // 每次新增类型都要修改这里
            order.setDiscount(new SuperVipDiscountStrategy().calculate(order));
        }
    }
}

// ✅ 正确：使用策略模式
// 1. 定义策略接口
public interface DiscountStrategy {
    BigDecimal calculate(Order order);
}

// 2. 每种策略独立实现
@Component
public class NormalDiscountStrategy implements DiscountStrategy {
    @Override
    public BigDecimal calculate(Order order) {
        return order.getAmount().multiply(new BigDecimal("0.95"));
    }
}

@Component
public class VipDiscountStrategy implements DiscountStrategy {
    @Override
    public BigDecimal calculate(Order order) {
        return order.getAmount().multiply(new BigDecimal("0.85"));
    }
}

// 3. 使用策略工厂
@Component
@RequiredArgsConstructor
public class DiscountStrategyFactory {
    private final Map<OrderType, DiscountStrategy> strategyMap;

    // Spring 自动注入所有实现
    public DiscountStrategy getStrategy(OrderType type) {
        return strategyMap.get(type);
    }
}

// 4. 业务代码简洁，新增类型只需新增策略类
@Service
@RequiredArgsConstructor
public class OrderApplication {
    private final DiscountStrategyFactory strategyFactory;

    public void calculateDiscount(Order order) {
        DiscountStrategy strategy = strategyFactory.getStrategy(order.getType());
        order.setDiscount(strategy.calculate(order));
    }
}
```

#### 模板方法定义流程

```java
// ✅ 使用模板方法
public abstract class OrderProcessTemplate {

    // 模板方法：定义流程骨架
    public final void process(Order order) {
        validateOrder(order);           // 步骤 1
        calculateAmount(order);         // 步骤 2
        applyDiscount(order);           // 步骤 3（可扩展）
        saveOrder(order);               // 步骤 4
        sendNotification(order);        // 步骤 5（可扩展）
    }

    private void validateOrder(Order order) {
        // 固定逻辑
    }

    private void calculateAmount(Order order) {
        // 固定逻辑
    }

    // 扩展点：子类可覆盖
    protected void applyDiscount(Order order) {
        // 默认实现
    }

    private void saveOrder(Order order) {
        // 固定逻辑
    }

    // 扩展点：子类可覆盖
    protected void sendNotification(Order order) {
        // 默认实现
    }
}

// 扩展：VIP 订单处理
public class VipOrderProcess extends OrderProcessTemplate {
    @Override
    protected void applyDiscount(Order order) {
        order.setAmount(order.getAmount().multiply(new BigDecimal("0.85")));
    }

    @Override
    protected void sendNotification(Order order) {
        // VIP 专属通知
    }
}
```

### Code Review 检查点

- [ ] 新增功能是否只需新增代码？
- [ ] 是否修改了已有稳定代码？
- [ ] 是否使用了抽象和多态？

---

## L - 里氏替换原则 (Liskov Substitution Principle)

### 定义

> 子类对象必须能够替换父类对象，而不破坏程序的正确性。

### 核心思想

- 子类可以扩展父类功能，但不能改变父类原有功能
- 不重写父类已实现的方法
- 子类不能增加父类没有的约束

### 编码实践

```java
// ❌ 错误：子类改变了父类行为
public class Rectangle {
    protected int width;
    protected int height;

    public void setWidth(int width) {
        this.width = width;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int area() {
        return width * height;
    }
}

// 正方形继承矩形，但行为不一致
public class Square extends Rectangle {
    @Override
    public void setWidth(int width) {
        this.width = width;
        this.height = width;  // 破坏了父类行为
    }

    @Override
    public void setHeight(int height) {
        this.height = height;
        this.width = height;  // 破坏了父类行为
    }
}

// ✅ 正确：不继承，独立实现
public class Rectangle {
    private final int width;
    private final int height;

    public Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }

    public int area() {
        return width * height;
    }
}

public class Square {
    private final int side;

    public Square(int side) {
        this.side = side;
    }

    public int area() {
        return side * side;
    }
}
```

### Code Review 检查点

- [ ] 子类是否能完全替代父类？
- [ ] 是否有破坏性的重写？
- [ ] 子类是否增加了父类没有的约束？

---

## I - 接口隔离原则 (Interface Segregation Principle)

### 定义

> 客户端不应该依赖它不需要的接口。

### 核心思想

- 按职责拆分大接口
- 接口方法数量 < 10 个
- 客户端只依赖需要的接口

### 编码实践

```java
// ❌ 错误：接口过于臃肿
public interface UserService {
    User createUser(User user);
    User getUser(Long id);
    void updateUser(User user);
    void deleteUser(Long id);
    List<User> queryUsers(UserQuery query);
    void resetPassword(String email);
    void sendEmail(String to, String content);
    void uploadAvatar(Long userId, byte[] avatar);
    void exportToExcel(List<User> users);
    // ... 更多方法
}

// ✅ 正确：按职责拆分
public interface UserRepository {
    User save(User user);
    Optional<User> findById(Long id);
    List<User> query(UserQuery query);
    void deleteById(Long id);
}

public interface PasswordService {
    void resetPassword(String email);
    void validatePassword(String rawPassword, String encodedPassword);
}

public interface NotificationService {
    void sendEmail(String to, String content);
    void sendSms(String phone, String content);
}

public interface FileService {
    String upload(byte[] file);
    byte[] download(String fileId);
}

// 客户端按需依赖
@Service
@RequiredArgsConstructor
public class UserApplication {
    private final UserRepository userRepository;        // 只依赖数据访问
    private final PasswordService passwordService;     // 只依赖密码服务
    private final NotificationService notificationService;  // 只依赖通知服务
}
```

### Code Review 检查点

- [ ] 接口是否过于臃肿？
- [ ] 实现类是否有空方法？
- [ ] 客户端是否依赖了不需要的方法？

---

## D - 依赖倒置原则 (Dependency Inversion Principle)

### 定义

> 高层模块不应依赖低层模块，两者都应依赖抽象。抽象不应依赖细节，细节应依赖抽象。

### 核心思想

- 依赖接口而非实现类
- 通过构造函数注入依赖
- 使用 Spring DI 管理依赖

### 编码实践

```java
// ❌ 错误：直接依赖具体实现
@Service
public class OrderApplication {
    private final OrderRepositoryImpl repository = new OrderRepositoryImpl();  // 硬编码依赖

    public void createOrder(Order order) {
        repository.save(order);
    }
}

// ✅ 正确：依赖接口
// 1. 定义接口
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(String orderId);
}

// 2. 实现接口
@Repository
public class OrderRepositoryImpl implements OrderRepository {
    private final OrderMapper orderMapper;

    @Override
    public Order save(Order order) {
        // 实现细节
    }
}

// 3. 依赖接口，由 Spring 注入
@Service
@RequiredArgsConstructor  // Lombok 生成构造函数
public class OrderApplication {
    private final OrderRepository orderRepository;  // 依赖接口，不依赖实现

    public void createOrder(Order order) {
        orderRepository.save(order);
    }
}
```

### 依赖注入方式

```java
// ✅ 推荐：构造函数注入（必需依赖）
@Service
@RequiredArgsConstructor  // Lombok 自动生成构造函数
public class OrderApplication {
    private final OrderRepository orderRepository;
    private final OrderDomain orderDomain;
}

// ✅ 可选：Setter 注入（可选依赖）
@Service
public class OrderApplication {
    private OrderRepository orderRepository;

    @Autowired
    public void setOrderRepository(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }
}

// ❌ 不推荐：字段注入（难以测试）
@Service
public class OrderApplication {
    @Autowired
    private OrderRepository orderRepository;
}
```

### Code Review 检查点

- [ ] 是否直接 new 具体类？
- [ ] 是否依赖接口编程？
- [ ] 是否使用依赖注入？

---

## SOLID 原则总结

| 原则 | 一句话总结 | 常见违反 |
|------|------------|----------|
| **S** | 一个类只做一件事 | 上帝类、职责混乱 |
| **O** | 对扩展开放，对修改关闭 | 到处 if-else、硬编码 |
| **L** | 子类可以替换父类 | 破坏性重写 |
| **I** | 接口最小化 | 臃肿接口、空方法 |
| **D** | 依赖抽象，不依赖具体 | new 具体类、字段注入 |

## DDD 分层中的 SOLID

```
┌─────────────────────────────────────────────────────┐
│ Controller (单一职责: 请求处理)                      │
│   ↓ 依赖接口 (依赖倒置)                              │
│ Application (单一职责: 业务编排)                     │
│   ↓ 依赖接口 (依赖倒置)                              │
│ Domain (单一职责: 业务规则)                         │
│   ↓ 扩展点开放 (开闭原则)                            │
│ Repository (接口隔离: 数据访问)                      │
└─────────────────────────────────────────────────────┘
```
