## MySQL 分库分表

### 概述

分库分表是解决数据库性能瓶颈的经典方案。通过将大表拆分成多个小表，分散到多个数据库实例，实现数据的水平扩展。

---

## 分片策略

### 1. 垂直分片（按业务模块）

**原理**: 不同的业务模块使用不同的数据库。

```
用户数据库
├── user_profile          # 用户基本信息
├── user_account          # 用户账户信息
└── user_settings         # 用户设置

订单数据库
├── orders                # 订单主表
├── order_items           # 订单项
└── order_payments        # 订单支付记录

商品数据库
├── products              # 商品信息
├── product_inventory     # 商品库存
└── product_categories    # 商品分类
```

**优点**:
- 业务逻辑清晰
- 降低单库压力
- 易于管理和维护

**缺点**:
- 跨库 JOIN 困难
- 分布式事务复杂

### 2. 水平分片（按分片键）

**原理**: 根据分片键（通常是用户ID）将同一个表的数据分散到多个库的多个表。

```
订单表水平分片示例:

user_id     表名              分片库
123         user_order_0      db1
456         user_order_1      db1
789         user_order_0      db2
1000        user_order_1      db2

分片规则:
order_table = user_order_(user_id % 2)
order_db = db[user_id % 2]
```

**优点**:
- 数据分散，单表数据量小
- 查询性能高（包含分片键时）
- 支持大规模数据

**缺点**:
- 分片键选择困难
- 跨分片查询复杂
- 需要分布式ID生成

### 3. 分片键选择标准

**高基数（Cardinality High）**
- 分片键的取值范围要大
- 例: user_id 有百万级别，适合分片
- 反例: gender（只有 M/F），不适合

**查询频繁**
- 大部分查询都包含这个键
- 例: 订单查询通常按 user_id
- 不适合: 按创建时间查询不频繁

**数据分布均匀**
- 分片后各分片数据量接近
- 例: user_id 均匀分布
- 反例: 新用户都在同一分片

---

## ShardingSphere 配置

### 1. 数据源配置

```yaml
# application.yml
spring:
  shardingsphere:
    datasource:
      names: ds0, ds1

      # 数据源 1
      ds0:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://mysql-master-1:3306/lightcone_0
        username: root
        password: ${DB_PASSWORD}
        maximum-pool-size: 20
        minimum-idle: 5
        # 虚拟线程支持
        auto-commit: false

      # 数据源 2
      ds1:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://mysql-master-2:3306/lightcone_1
        username: root
        password: ${DB_PASSWORD}
        maximum-pool-size: 20
        minimum-idle: 5
```

### 2. 分片算法配置

```yaml
rules:
  sharding:
    # 表规则
    tables:
      user_order:
        actual-data-nodes: ds${0..1}.user_order_${0..1}

        # 数据库分片策略（分片键: user_id）
        database-strategy:
          standard:
            sharding-column: user_id
            sharding-algorithm-name: database_inline

        # 表分片策略（分片键: user_id）
        table-strategy:
          standard:
            sharding-column: user_id
            sharding-algorithm-name: table_inline

        # 分布式主键生成
        key-generate-strategy:
          column: id
          key-generator-name: snowflake_id

    # 分片算法定义
    sharding-algorithms:
      # 数据库分片：user_id % 2 决定分片库（ds0 或 ds1）
      database_inline:
        type: INLINE
        props:
          algorithm-expression: ds${user_id % 2}

      # 表分片：user_id % 2 决定分片表（user_order_0 或 user_order_1）
      table_inline:
        type: INLINE
        props:
          algorithm-expression: user_order_${user_id % 2}

    # 主键生成策略
    key-generators:
      snowflake_id:
        type: SNOWFLAKE
        props:
          worker-id: 0

# 展示执行的 SQL
  sql-show: true
```

### 3. 分布式主键生成

**雪花算法（Snowflake）**
```
┌─────────────────────────────────────────────────────────┐
│  1 bit  │  41 bits   │  10 bits  │  12 bits │
│ 符号位  │ 时间戳     │ 数据中心  │ 序列号   │
│    0    │ ms since   │  ID       │ sequence │
│         │ epoch      │           │          │
└─────────────────────────────────────────────────────────┘

特点:
- 全局唯一
- 趋势递增
- 可解析（包含时间信息）
- 性能高（无中心依赖）
```

**Redis ID 生成**
```java
@Component
@RequiredArgsConstructor
public class RedisIdGenerator {
    private final RedisTemplate<String, Long> redisTemplate;

    public Long generateId() {
        return redisTemplate.opsForValue().increment("id:generator");
    }
}
```

---

## 分片表设计约定

### 表结构示例

```sql
CREATE TABLE `user_order_0` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分片内自增ID',
  `order_id` VARCHAR(64) NOT NULL COMMENT '全局唯一订单ID',
  `user_id` BIGINT(20) UNSIGNED NOT NULL COMMENT '用户ID（分片键）',
  `product_id` BIGINT(20) UNSIGNED NOT NULL COMMENT '商品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
  `total_amount` DECIMAL(19, 4) NOT NULL COMMENT '订单金额',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '订单状态 (1=待支付, 2=已支付, 3=待发货, 4=已发货, 5=已完成)',

  -- 软删除字段（双软删除）
  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '软删除标记 (0=未删除, 1=已删除)',
  `deleted_at` DATETIME(3) NULL DEFAULT NULL COMMENT '删除时间',

  -- 时间字段（精确到毫秒）
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  KEY `idx_user_id_status` (`user_id`, `status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表（分片）';
```

**命名约定**:
- 表名: `{entity}_{shard_index}` 如 `user_order_0`, `user_order_1`
- 全局ID字段: `order_id` (VARCHAR(64))
- 分片键字段: `user_id` (BIGINT(20))
- 自增ID字段: `id` (仅分片内唯一)

**字段设计**:
- `id`: 分片内自增ID，不做业务用
- `order_id`: 全局唯一ID，跨分片查询时使用
- `user_id`: 分片键，所有查询都应包含
- `deleted` + `deleted_at`: 双软删除字段
- 时间字段用 `DATETIME(3)` 支持毫秒精度

### 索引设计原则

```sql
-- ✅ 正确：包含分片键的复合索引
KEY `idx_user_id_status` (`user_id`, `status`)

-- ✅ 正确：分片键是第一个
KEY `idx_user_id_created_at` (`user_id`, `created_at`)

-- ❌ 错误：不包含分片键
KEY `idx_product_id` (`product_id`)  -- ShardingSphere 无法优化

-- ❌ 错误：分片键不在最前
KEY `idx_status_user_id` (`status`, `user_id`)  -- 无法使用分片优化
```

---

## 查询优化

### 1. 包含分片键的查询（推荐）

```java
// ✅ 正确：包含分片键 user_id
List<Order> findByUserIdAndStatus(Long userId, OrderStatus status);

// ShardingSphere 可以直接路由到对应分片
// SQL: SELECT * FROM user_order_${userId % 2} WHERE user_id = ? AND status = ?
```

### 2. 避免跨分片 JOIN

```java
// ❌ 错误：跨分片 JOIN
SELECT o.*, p.name
FROM user_order_0 o
JOIN products p ON o.product_id = p.id
WHERE o.user_id = ?

// ✅ 正确：应用层关联
// 1. 查询订单
Order order = orderRepository.findByUserId(userId);

// 2. 在应用层关联商品信息
Product product = productRepository.findById(order.getProductId());
order.setProduct(product);
```

### 3. 使用全局 ID 进行精确查询

```java
// ✅ 正确：通过全局 ID 查询
Optional<Order> findByOrderId(String orderId);

// ShardingSphere 可以通过 order_id 中包含的信息路由到正确分片
```

### 4. 避免全表扫描

```java
// ❌ 错误：缺少分片键，导致扫描所有分片
List<Order> findByStatus(OrderStatus status);  // 需要扫描所有分片

// ✅ 正确：指定分片键和其他条件
List<Order> findByUserIdAndStatus(Long userId, OrderStatus status);
```

---

## 常见问题

### Q1: 如何处理不带分片键的查询？

**场景**: 运营需要查看所有待支付订单

**方案 1: 使用分片提示**
```java
// ShardingSphere 提供 hint 功能
ShardingRuntimeContext.setDatabaseShardingValue(0);
ShardingRuntimeContext.setTableShardingValue(0);
List<Order> orders = orderRepository.findByStatus(OrderStatus.PENDING);
```

**方案 2: 循环查询**
```java
public List<Order> findAllByStatus(OrderStatus status) {
    List<Order> result = new ArrayList<>();
    for (int i = 0; i < 2; i++) {  // 2 是分片数
        result.addAll(
            orderRepository.findByUserIdAndStatus(generateUserId(i), status)
        );
    }
    return result;
}
```

**方案 3: 使用专门的只读库**
- 将所有分片数据同步到一个汇总库
- 查询汇总库而不是分片库

### Q2: 分片键能否修改？

**答**: 不能。分片键修改等同于删除后重新创建。

**处理方法**:
```java
// 1. 按旧分片键删除
orderRepository.deleteByOrderId(orderId);  // 删除原位置的数据

// 2. 按新分片键创建
orderRepository.save(newOrder);  // 插入到新位置
```

### Q3: 如何处理跨库事务？

**方案 1: 本地事务（推荐）**
```java
// 单个分片内的操作，使用本地事务
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);
    // 其他同库操作
}
```

**方案 2: 分布式事务（复杂）**
```java
// 跨分片操作，使用 Saga 模式
@Component
@RequiredArgsConstructor
public class CreateOrderSaga {
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final InventoryService inventoryService;

    public void execute(CreateOrderParam param) {
        try {
            // Step 1: 创建订单
            Order order = orderService.createOrder(param);

            // Step 2: 初始化支付
            Payment payment = paymentService.initializePayment(order);

            // Step 3: 扣减库存
            inventoryService.reserve(order);
        } catch (Exception e) {
            // 补偿事务：回滚各步骤
            compensate();
        }
    }
}
```

---

## 分片迁移

### 从不分片到分片

```
阶段 1: 准备
- 选定分片键（user_id）
- 设计分片策略（2库 × 2表）
- 创建新的分片表

阶段 2: 数据迁移
- 双写：写入旧表 + 新表
- 历史数据迁移到新表
- 数据验证（行数、校验和）

阶段 3: 切换
- 只写新表（停止双写旧表）
- 灰度验证
- 完全切换

阶段 4: 清理
- 下线旧表
- 归档旧数据
```

---

## 监控指标

```java
// 监控各分片的数据分布
SELECT
    table_name,
    COUNT(*) as record_count,
    ROUND(DATA_LENGTH/1024/1024, 2) as size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA LIKE 'lightcone_%'
GROUP BY table_name;

// 监控查询是否能有效利用分片
SHOW SLOW LOG;  // 查看慢查询是否都包含分片键
```

---

## 检查清单

- [ ] 是否选择了高基数、查询频繁的字段作为分片键？
- [ ] 数据分布是否均匀？
- [ ] 所有主要查询都包含分片键吗？
- [ ] 是否避免了跨分片 JOIN？
- [ ] 索引设计是否将分片键放在最前？
- [ ] 是否实现了分布式 ID 生成？
- [ ] 表设计是否遵循约定（双软删除、DATETIME(3)）？
- [ ] 是否有监控跟踪各分片的数据量？
- [ ] 是否制定了分片键修改的应急方案？
