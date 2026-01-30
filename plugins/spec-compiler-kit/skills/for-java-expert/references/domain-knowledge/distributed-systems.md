# 分布式系统

## 概述

本文档介绍分布式系统的核心知识，包括分布式事务、分布式 ID、消息队列等。

---

## 分布式事务

### CAP 定理

- **Consistency** (一致性)：所有节点同时看到相同的数据
- **Availability** (可用性)：每个请求都能得到响应
- **Partition Tolerance** (分区容错性)：系统在网络分区时仍能运行

**只能同时满足两个**：
- CA：单机系统
- CP：牺牲可用性（如传统数据库）
- AP：牺牲强一致性（如 NoSQL）

### BASE 理论

- **Basically Available** (基本可用)：允许部分失败
- **Soft State** (软状态)：状态可能随时间变化
- **Eventually Consistent** (最终一致性)：系统最终达到一致

### Saga 模式（补偿事务）

```java
@Component
@RequiredArgsConstructor
public class OrderSaga {

    private final OrderService orderService;
    private final PaymentService paymentService;
    private final InventoryService inventoryService;

    public void execute(CreateOrderParam param) {
        List<CompensableAction> actions = new ArrayList<>();

        try {
            // Step 1: 创建订单
            Order order = orderService.createOrder(param);
            actions.add(() -> orderService.cancelOrder(order.getOrderId()));

            // Step 2: 初始化支付
            Payment payment = paymentService.initializePayment(order);
            actions.add(() -> paymentService.cancelPayment(payment.getId()));

            // Step 3: 扣减库存
            inventoryService.reserve(order);
            actions.add(() -> inventoryService.release(order));

            // 所有步骤成功，清空补偿操作
            actions.clear();

        } catch (Exception e) {
            // 执行补偿，从后向前
            Collections.reverse(actions);
            for (CompensableAction action : actions) {
                try {
                    action.compensate();
                } catch (Exception ex) {
                    log.error("补偿失败", ex);
                }
            }
            throw new SagaException("订单创建失败", e);
        }
    }
}
```

### TCC 模式（Try-Confirm-Cancel）

- **Try**：尝试执行业务（预留资源）
- **Confirm**：确认执行业务（使用资源）
- **Cancel**：取消执行业务（释放资源）

---

## 分布式 ID

### 雪花算法（Snowflake）

```java
@Component
public class SnowflakeIdGenerator {

    private final long twepoch = 1288834974657L;
    private final long workerIdBits = 5L;
    private final long datacenterIdBits = 5L;
    private final long maxWorkerId = -1L ^ (-1L << workerIdBits);
    private final long maxDatacenterId = -1L ^ (-1L << datacenterIdBits);
    private final long sequenceBits = 12L;

    private final long workerIdShift = sequenceBits;
    private final long datacenterIdShift = sequenceBits + workerIdBits;
    private final long timestampLeftShift = sequenceBits + workerIdBits + datacenterIdBits;
    private final long sequenceMask = -1L ^ (-1L << sequenceBits);

    private long workerId;
    private long datacenterId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    public synchronized long nextId() {
        long timestamp = timeGen();

        if (timestamp < lastTimestamp) {
            throw new RuntimeException("时钟回拨");
        }

        if (lastTimestamp == timestamp) {
            sequence = (sequence + 1) & sequenceMask;
            if (sequence == 0) {
                timestamp = tilNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }

        lastTimestamp = timestamp;

        return ((timestamp - twepoch) << timestampLeftShift)
            | (datacenterId << datacenterIdShift)
            | (workerId << workerIdShift)
            | sequence;
    }

    protected long tilNextMillis(long lastTimestamp) {
        long timestamp = timeGen();
        while (timestamp <= lastTimestamp) {
            timestamp = timeGen();
        }
        return timestamp;
    }

    protected long timeGen() {
        return System.currentTimeMillis();
    }
}
```

### 其他方案

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **UUID** | 简单、无中心化 | 无序、长 | 非排序 ID |
| **数据库自增** | 简单、递增 | 性能瓶颈、单点 | 小规模 |
| **Redis INCR** | 高性能、递增 | 依赖 Redis | 中小规模 |
| **雪花算法** | 高性能、递增、有序 | 依赖时钟 | 大规模 |

---

## 消息队列

### 使用场景

1. **异步处理**：提高响应速度
2. **削峰填谷**：缓冲突发流量
3. **解耦**：降低系统耦合度
4. **可靠性**：消息持久化、重试

### 消息发送

```java
@Service
@RequiredArgsConstructor
public class OrderMessageProducer {

    private final RocketMQTemplate rocketMQTemplate;

    public void sendOrderCreatedEvent(Order order) {
        OrderCreatedEvent event = new OrderCreatedEvent(
            order.getOrderId(),
            order.getUserId(),
            order.getTotalAmount()
        );

        rocketMQTemplate.syncSend(
            "order-created-topic",
            event
        );
    }
}
```

### 消息消费

```java
@RocketMQMessageListener(
    topic = "order-created-topic",
    consumerGroup = "payment-consumer-group"
)
@Service
@RequiredArgsConstructor
public class OrderCreatedConsumer implements RocketMQListener<OrderCreatedEvent> {

    private final PaymentApplication paymentApplication;

    @Override
    public void onMessage(OrderCreatedEvent event) {
        try {
            paymentApplication.initializePayment(
                event.getOrderId(),
                event.getTotalAmount()
            );
        } catch (Exception e) {
            log.error("处理订单创建事件失败", e);
            throw e;  // 抛出异常触发重试
        }
    }
}
```

### 消息可靠性

1. **发送确认**：同步发送、事务消息
2. **消费确认**：手动 ACK
3. **重试机制**：指数退避
4. **死信队列**：多次失败后进入 DLQ

---

## 分布式锁

### Redis 分布式锁

```java
@Component
@RequiredArgsConstructor
public class RedisDistributedLock {

    private final RedisTemplate<String, String> redisTemplate;

    public boolean lock(String key, String value, long expireTime) {
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(key, value, expireTime, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(result);
    }

    public void unlock(String key, String value) {
        // 使用 Lua 脚本确保原子性
        String script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
        redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(key),
            value
        );
    }
}

// 使用
@Service
@RequiredArgsConstructor
public class InventoryService {
    private final RedisDistributedLock distributedLock;

    public void deduct(String productId, int quantity) {
        String lockKey = "lock:inventory:" + productId;
        String lockValue = UUID.randomUUID().toString();

        try {
            // 获取锁
            if (distributedLock.lock(lockKey, lockValue, 30)) {
                // 执行业务逻辑
                doDeduct(productId, quantity);
            } else {
                throw new BusinessException("获取锁失败");
            }
        } finally {
            // 释放锁
            distributedLock.unlock(lockKey, lockValue);
        }
    }
}
```

### Zookeeper 分布式锁

```java
@Component
@RequiredArgsConstructor
public class ZkDistributedLock {

    private final CuratorFramework curatorFramework;

    public void lock(String path, Runnable callback) {
        InterProcessMutex lock = new InterProcessMutex(curatorFramework, path);

        try {
            // 获取锁
            if (lock.acquire(30, TimeUnit.SECONDS)) {
                try {
                    callback.run();
                } finally {
                    lock.release();
                }
            }
        } catch (Exception e) {
            throw new BusinessException("分布式锁异常", e);
        }
    }
}
```

---

## 服务治理

### Nacos（注册中心）

```yaml
spring:
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        namespace: dev
        group: DEFAULT_GROUP
```

### Sentinel（限流降级）

```java
@SentinelResource(
    value = "createOrder",
    blockHandler = "handleBlock",
    fallback = "handleFallback"
)
public Order createOrder(CreateOrderParam param) {
    // 业务逻辑
}

public Order handleBlock(CreateOrderParam param, BlockException ex) {
    // 限流降级处理
    throw new BusinessException("系统繁忙，请稍后再试");
}

public Order handleFallback(CreateOrderParam param, Throwable ex) {
    // 异常降级处理
    throw new BusinessException("服务异常，请稍后再试");
}
```

---

## 常见问题

### Q: 如何选择分布式事务方案？

A:
- **强一致性要求**：使用 TCC 或 Seata AT 模式
- **最终一致性可接受**：使用 Saga 模式
- **高并发场景**：使用消息队列 + 最终一致性

### Q: 分布式 ID 如何选择？

A:
- **小规模**：数据库自增
- **中规模**：Redis INCR
- **大规模**：雪花算法

### Q: 分布式锁如何选择？

A:
- **性能要求高**：Redis 实现
- **可靠性要求高**：Zookeeper 实现
- **简单场景**：数据库乐观锁
