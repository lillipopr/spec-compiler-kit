## 并发编程与分布式系统

### 概述

本文档深入讲解 Java 并发编程的核心概念、并发工具类、分布式系统的设计模式和最佳实践。

---

## Java 并发基础

### 1. 线程状态转换

```
┌─────────────────────────────────────────────────────────────┐
│                        线程状态转换                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   NEW           RUNNABLE         BLOCKED        WAITING     │
│    │              │  ↑             │  ↑            │        │
│    │ start()      │  │             │  │            │        │
│    ↓              │  │             │  │ notify()   │        │
│  RUNNABLE ──→ sleep()            │  └────────────┘         │
│    │  ↑          │  │             │                         │
│    │  │          │  │             │                         │
│    │  │          ↓  │             └── lock()                │
│    │  │        TIMED_WAITING       │  ↑                     │
│    │  │          │  │              │  │                     │
│    └──┴──────────┘  │              │  │ unlock()            │
│       run 完成      │              └──┘                     │
│                     ↓                                       │
│                  TERMINATED                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. synchronized vs Lock

```java
// synchronized 内置锁
public class SynchronizedExample {
    private int count = 0;

    // 方法锁
    public synchronized void increment() {
        count++;
    }

    // 代码块锁（更细粒度）
    public void decrement() {
        synchronized (this) {
            count--;
        }
    }

    // 静态方法锁（类锁）
    public static synchronized void staticMethod() {
        // ...
    }
}

// ReentrantLock 可重入锁
public class LockExample {
    private final ReentrantLock lock = new ReentrantLock();
    private int count = 0;

    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();  // 必须在 finally 中释放
        }
    }

    // 尝试获取锁
    public boolean tryIncrement() {
        if (lock.tryLock()) {
            try {
                count++;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false;
    }

    // 可中断锁
    public void interruptibleIncrement() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            count++;
        } finally {
            lock.unlock();
        }
    }

    // 公平锁
    private final ReentrantLock fairLock = new ReentrantLock(true);
}

// ReadWriteLock 读写锁
public class ReadWriteLockExample {
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    private Map<String, String> cache = new HashMap<>();

    public String get(String key) {
        readLock.lock();
        try {
            return cache.get(key);
        } finally {
            readLock.unlock();
        }
    }

    public void put(String key, String value) {
        writeLock.lock();
        try {
            cache.put(key, value);
        } finally {
            writeLock.unlock();
        }
    }
}

// StampedLock 乐观读锁（Java 8）
public class StampedLockExample {
    private final StampedLock stampedLock = new StampedLock();
    private double value;

    public double read() {
        // 尝试乐观读
        long stamp = stampedLock.tryOptimisticRead();
        double currentValue = value;

        // 验证是否有写操作
        if (!stampedLock.validate(stamp)) {
            // 乐观读失败，使用悲观读锁
            stamp = stampedLock.readLock();
            try {
                currentValue = value;
            } finally {
                stampedLock.unlockRead(stamp);
            }
        }
        return currentValue;
    }

    public void write(double newValue) {
        long stamp = stampedLock.writeLock();
        try {
            value = newValue;
        } finally {
            stampedLock.unlockWrite(stamp);
        }
    }
}
```

### 3. volatile 关键字

```java
public class VolatileExample {
    // volatile 保证可见性和有序性，但不保证原子性
    private volatile boolean running = true;
    private volatile int counter;

    public void shutdown() {
        running = false;  // 立即对所有线程可见
    }

    public void worker() {
        while (running) {
            // 工作逻辑
        }
    }

    // volatile 不适用的场景
    private volatile int i = 0;

    public void increment() {
        i++;  // 不是原子操作！（读-改-写）
    }

    // 正确做法：使用 AtomicInteger
    private AtomicInteger atomicI = new AtomicInteger(0);

    public void atomicIncrement() {
        atomicI.incrementAndGet();  // 原子操作
    }
}
```

---

## 并发工具类

### 1. CountDownLatch（倒计时门闩）

```java
// 场景：等待多个线程完成
public class CountDownLatchExample {
    private static final int THREAD_COUNT = 3;

    public static void main(String[] args) throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(THREAD_COUNT);

        for (int i = 0; i < THREAD_COUNT; i++) {
            new Thread(() -> {
                try {
                    // 执行任务
                    doWork();
                } finally {
                    latch.countDown();  // 完成后倒计时
                }
            }).start();
        }

        latch.await();  // 等待所有线程完成
        System.out.println("所有任务完成");
    }

    private static void doWork() {
        // ...
    }
}
```

### 2. CyclicBarrier（循环栅栏）

```java
// 场景：多个线程互相等待
public class CyclicBarrierExample {
    private static final int THREAD_COUNT = 3;

    public static void main(String[] args) {
        CyclicBarrier barrier = new CyclicBarrier(THREAD_COUNT, () -> {
            // 所有线程到达后执行
            System.out.println("所有线程已到达栅栏");
        });

        for (int i = 0; i < THREAD_COUNT; i++) {
            new Thread(() -> {
                try {
                    doWork();
                    barrier.await();  // 等待其他线程
                    doWorkAfterBarrier();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

### 3. Semaphore（信号量）

```java
// 场景：限制并发访问数
public class SemaphoreExample {
    private final Semaphore semaphore = new Semaphore(10);  // 最多 10 个并发

    public void accessResource() {
        try {
            semaphore.acquire();  // 获取许可
            try {
                // 访问资源
                doWork();
            } finally {
                semaphore.release();  // 释放许可
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### 4. Exchanger（交换器）

```java
// 场景：两个线程交换数据
public class ExchangerExample {
    public static void main(String[] args) {
        Exchanger<String> exchanger = new Exchanger<>();

        new Thread(() -> {
            try {
                String data = "线程 A 的数据";
                System.out.println("A 发送: " + data);
                String received = exchanger.exchange(data);
                System.out.println("A 收到: " + received);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        new Thread(() -> {
            try {
                String data = "线程 B 的数据";
                System.out.println("B 发送: " + data);
                String received = exchanger.exchange(data);
                System.out.println("B 收到: " + received);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }
}
```

### 5. Phaser（阶段器，Java 7）

```java
// 场景：多阶段并发任务
public class PhaserExample {
    public static void main(String[] args) {
        int parties = 3;
        Phaser phaser = new Phaser(parties);

        for (int i = 0; i < parties; i++) {
            new Thread(() -> {
                // 阶段 1
                doPhase1();
                phaser.arriveAndAwaitAdvance();  // 等待其他线程

                // 阶段 2
                doPhase2();
                phaser.arriveAndAwaitAdvance();

                // 阶段 3
                doPhase3();
                phaser.arriveAndDeregister();  // 完成并注销
            }).start();
        }
    }
}
```

---

## 并发集合

### 1. ConcurrentHashMap

```java
public class ConcurrentHashMapExample {
    private final ConcurrentHashMap<String, Object> cache = new ConcurrentHashMap<>();

    // putIfAbsent（原子操作）
    public Object computeIfAbsent(String key, Function<String, Object> mappingFunction) {
        return cache.computeIfAbsent(key, mappingFunction);
    }

    // 复合操作（原子）
    public Object putIfAbsent(String key, Object value) {
        return cache.putIfAbsent(key, value);
    }

    // replace（原子）
    public boolean replace(String key, Object oldValue, Object newValue) {
        return cache.replace(key, oldValue, newValue);
    }

    // forEach（并行）
    public void processAll() {
        cache.forEach(1, (key, value) -> {
            // 并行处理，1 为并行度
            process(key, value);
        });
    }

    // search（并行查找）
    public Object searchValue(Predicate<Object> predicate) {
        return cache.search(1, (key, value) -> {
            return predicate.test(value) ? value : null;
        });
    }

    // reduce（并行归约）
    public int reduce() {
        return cache.reduce(1, (key, value) -> {
            return value.hashCode();
        }, (r1, r2) -> r1 + r2);
    }
}
```

### 2. 并发队列

```java
// BlockingQueue 阻塞队列
public class BlockingQueueExample {
    private final BlockingQueue<String> queue = new LinkedBlockingQueue<>(100);

    // 生产者
    public void produce(String item) throws InterruptedException {
        queue.put(item);  // 队列满时阻塞
    }

    // 消费者
    public String consume() throws InterruptedException {
        return queue.take();  // 队列空时阻塞
    }

    // offer（非阻塞，带超时）
    public boolean tryProduce(String item, long timeout, TimeUnit unit) {
        try {
            return queue.offer(item, timeout, unit);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}

// ConcurrentLinkedQueue 非阻塞队列
public class ConcurrentLinkedQueueExample {
    private final ConcurrentLinkedQueue<String> queue = new ConcurrentLinkedQueue<>();

    public void offer(String item) {
        queue.offer(item);  // 非阻塞，永不失败
    }

    public String poll() {
        return queue.poll();  // 非阻塞，空时返回 null
    }
}

// DelayQueue 延迟队列
public class DelayQueueExample {
    private static class DelayedTask implements Delayed {
        private final long startTime;
        private final String task;

        public DelayedTask(long delay, String task) {
            this.startTime = System.currentTimeMillis() + delay;
            this.task = task;
        }

        @Override
        public long getDelay(TimeUnit unit) {
            return unit.convert(startTime - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
        }

        @Override
        public int compareTo(Delayed o) {
            return Long.compare(this.startTime, ((DelayedTask) o).startTime);
        }
    }

    private final DelayQueue<DelayedTask> queue = new DelayQueue<>();

    public void schedule(long delay, String task) {
        queue.put(new DelayedTask(delay, task));
    }

    public String take() throws InterruptedException {
        DelayedTask task = queue.take();
        return task.task;
    }
}
```

---

## 线程池

### 1. 线程池配置

```java
@Configuration
public class ThreadPoolConfig {

    /**
     * CPU 密集型任务配置
     * 核心线程数 = CPU 核心数 + 1
     */
    @Bean("cpuIntensiveExecutor")
    public ThreadPoolTaskExecutor cpuIntensiveExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(Runtime.getRuntime().availableProcessors() + 1);
        executor.setMaxPoolSize(Runtime.getRuntime().availableProcessors() + 1);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("cpu-intensive-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
        executor.initialize();
        return executor;
    }

    /**
     * IO 密集型任务配置
     * 核心线程数 = CPU 核心数 * 2
     */
    @Bean("ioIntensiveExecutor")
    public ThreadPoolTaskExecutor ioIntensiveExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(Runtime.getRuntime().availableProcessors() * 2);
        executor.setMaxPoolSize(Runtime.getRuntime().availableProcessors() * 4);
        executor.setQueueCapacity(1000);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("io-intensive-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    /**
     * 混合型任务配置
     * 使用动态调整
     */
    @Bean("adaptiveExecutor")
    public ThreadPoolTaskExecutor adaptiveExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(500);
        executor.setAllowCoreThreadTimeOut(true);  // 允许核心线程超时
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("adaptive-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

### 2. 拒绝策略

```java
public class RejectedPolicyExample {

    // AbortPolicy：抛出异常（默认）
    ThreadPoolExecutor.AbortPolicy abortPolicy = new ThreadPoolExecutor.AbortPolicy();

    // CallerRunsPolicy：调用者线程执行
    ThreadPoolExecutor.CallerRunsPolicy callerRunsPolicy = new ThreadPoolExecutor.CallerRunsPolicy();

    // DiscardPolicy：直接丢弃
    ThreadPoolExecutor.DiscardPolicy discardPolicy = new ThreadPoolExecutor.DiscardPolicy();

    // DiscardOldestPolicy：丢弃队列中最老的任务
    ThreadPoolExecutor.DiscardOldestPolicy discardOldestPolicy = new ThreadPoolExecutor.DiscardOldestPolicy();

    // 自定义拒绝策略
    public static class CustomRejectedPolicy implements RejectedExecutionHandler {
        @Override
        public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
            // 记录日志
            log.warn("Task rejected: {}", r);

            // 尝试重新放入队列
            if (!executor.isShutdown()) {
                try {
                    executor.getQueue().put(r);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }
}
```

### 3. CompletableFuture 异步编程

```java
public class CompletableFutureExample {

    // 创建异步任务
    public CompletableFuture<String> asyncTask() {
        return CompletableFuture.supplyAsync(() -> {
            // 异步执行
            return "result";
        });
    }

    // 链式调用
    public CompletableFuture<Integer> chain() {
        return CompletableFuture.supplyAsync(() -> "123")
            .thenApplyAsync(Integer::parseInt)           // 转换
            .thenApplyAsync(i -> i * 2)                 // 计算
            .thenAcceptAsync(result -> {                // 消费
                System.out.println("Result: " + result);
            });
    }

    // 组合多个 Future
    public CompletableFuture<Void> combine() {
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "Hello");
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "World");

        // allOf：等待所有完成
        CompletableFuture<Void> allOf = CompletableFuture.allOf(future1, future2)
            .thenRun(() -> {
                System.out.println("All completed");
            });

        // anyOf：任意一个完成
        CompletableFuture<Object> anyOf = CompletableFuture.anyOf(future1, future2)
            .thenAccept(result -> {
                System.out.println("First completed: " + result);
            });

        // 组合结果
        CompletableFuture<String> combined = future1.thenCombine(future2, (r1, r2) -> {
            return r1 + " " + r2;
        });

        return allOf;
    }

    // 异常处理
    public CompletableFuture<String> withExceptionHandling() {
        return CompletableFuture.supplyAsync(() -> {
            if (Math.random() > 0.5) {
                throw new RuntimeException("Random error");
            }
            return "success";
        })
        .exceptionally(ex -> {
            log.error("Error occurred", ex);
            return "fallback";  // 降级值
        });

        // 或者使用 handle
        .handle((result, ex) -> {
            if (ex != null) {
                log.error("Error occurred", ex);
                return "fallback";
            }
            return result;
        });
    }

    // 超时控制
    public CompletableFuture<String> withTimeout() {
        return CompletableFuture.supplyAsync(() -> {
            // 长时间任务
            return "result";
        })
        .completeOnTimeout("timeout", 1, TimeUnit.SECONDS)  // Java 9
        .orTimeout(1, TimeUnit.SECONDS);  // Java 9
    }
}
```

---

## 分布式锁

### 1. Redis 分布式锁

```java
@Component
@RequiredArgsConstructor
public class RedisDistributedLock {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String LOCK_PREFIX = "lock:";
    private static final long DEFAULT_EXPIRE_TIME = 30;  // 秒

    /**
     * 尝试获取锁
     * @param key 锁的 key
     * @param value 锁的 value（用于释放时验证）
     * @param expireTime 过期时间（秒）
     * @return 是否获取成功
     */
    public boolean lock(String key, String value, long expireTime) {
        try {
            Boolean result = redisTemplate.opsForValue()
                .setIfAbsent(LOCK_PREFIX + key, value, expireTime, TimeUnit.SECONDS);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("获取分布式锁失败: {}", key, e);
            return false;
        }
    }

    /**
     * 释放锁（使用 Lua 脚本保证原子性）
     * @param key 锁的 key
     * @param value 锁的 value（必须与获取时的 value 一致）
     */
    public void unlock(String key, String value) {
        String script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
        redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(LOCK_PREFIX + key),
            value
        );
    }

    /**
     * 尝试获取锁，带重试
     * @param key 锁的 key
     * @param value 锁的 value
     * @param expireTime 锁过期时间（秒）
     * @param waitTime 等待时间（毫秒）
     * @return 是否获取成功
     */
    public boolean tryLock(String key, String value, long expireTime, long waitTime) {
        long deadline = System.currentTimeMillis() + waitTime;
        while (System.currentTimeMillis() < deadline) {
            if (lock(key, value, expireTime)) {
                return true;
            }
            try {
                Thread.sleep(100);  // 重试间隔
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }
}

// 使用示例
@Service
@RequiredArgsConstructor
public class OrderService {

    private final RedisDistributedLock lock;

    public void createOrder(String orderId) {
        String lockValue = UUID.randomUUID().toString();
        String lockKey = "order:" + orderId;

        try {
            // 尝试获取锁
            if (lock.tryLock(lockKey, lockValue, 30, 5000)) {
                // 执行业务逻辑
                doCreateOrder(orderId);
            } else {
                throw new BusinessException("系统繁忙，请稍后重试");
            }
        } finally {
            // 释放锁
            lock.unlock(lockKey, lockValue);
        }
    }
}
```

### 2. ZooKeeper 分布式锁

```java
@Component
@RequiredArgsConstructor
public class ZkDistributedLock {

    private final CuratorFramework curatorFramework;

    private static final String LOCK_PATH = "/locks/";

    /**
     * 获取锁
     * @param lockName 锁名称
     * @param timeout 超时时间
     * @param unit 时间单位
     * @return 锁对象
     */
    public InterProcessMutex acquire(String lockName, long timeout, TimeUnit unit) {
        String path = LOCK_PATH + lockName;
        InterProcessMutex lock = new InterProcessMutex(curatorFramework, path);
        try {
            if (lock.acquire(timeout, unit)) {
                return lock;
            }
        } catch (Exception e) {
            log.error("获取 ZooKeeper 锁失败: {}", lockName, e);
        }
        return null;
    }

    /**
     * 释放锁
     * @param lock 锁对象
     */
    public void release(InterProcessMutex lock) {
        if (lock != null) {
            try {
                lock.release();
            } catch (Exception e) {
                log.error("释放 ZooKeeper 锁失败", e);
            }
        }
    }
}
```

### 3. Redlock 算法（Redis Cluster）

```java
@Component
public class Redlock {

    private final List<RedisTemplate<String, String>> redisTemplates;

    public boolean lock(String key, String value, long expireTime) {
        int successCount = 0;
        int requiredCount = redisTemplates.size() / 2 + 1;  // 多数派

        long startTime = System.currentTimeMillis();

        for (RedisTemplate<String, String> template : redisTemplates) {
            try {
                Boolean result = template.opsForValue()
                    .setIfAbsent(key, value, expireTime, TimeUnit.SECONDS);
                if (Boolean.TRUE.equals(result)) {
                    successCount++;
                }
            } catch (Exception e) {
                log.error("获取锁失败", e);
            }
        }

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (successCount >= requiredCount && elapsedTime < expireTime * 1000) {
            return true;
        }

        // 获取失败，释放已获取的锁
        unlock(key, value);
        return false;
    }

    public void unlock(String key, String value) {
        String script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
        for (RedisTemplate<String, String> template : redisTemplates) {
            try {
                template.execute(
                    new DefaultRedisScript<>(script, Long.class),
                    Collections.singletonList(key),
                    value
                );
            } catch (Exception e) {
                log.error("释放锁失败", e);
            }
        }
    }
}
```

---

## 分布式事务

### 1. Saga 模式

```java
@Component
@RequiredArgsConstructor
public class OrderSaga {

    private final OrderService orderService;
    private final PaymentService paymentService;
    private final InventoryService inventoryService;

    public void execute(CreateOrderParam param) {
        SagaTransaction saga = new SagaTransaction();

        try {
            // Step 1: 创建订单
            Order order = orderService.createOrder(param);
            saga.addCompensation(() -> orderService.cancelOrder(order.getOrderId()));

            // Step 2: 初始化支付
            Payment payment = paymentService.initializePayment(order);
            saga.addCompensation(() -> paymentService.cancelPayment(payment.getId()));

            // Step 3: 扣减库存
            inventoryService.reserve(order);
            saga.addCompensation(() -> inventoryService.release(order));

            // 所有步骤成功
            saga.commit();

        } catch (Exception e) {
            // 执行补偿
            saga.rollback();
            throw new SagaException("订单创建失败", e);
        }
    }
}

// Saga 事务管理
public class SagaTransaction {

    private final List<CompensableAction> actions = new ArrayList<>();
    private boolean committed = false;

    public void addCompensation(CompensableAction action) {
        actions.add(action);
    }

    public void commit() {
        committed = true;
        actions.clear();  // 清空补偿操作
    }

    public void rollback() {
        if (committed) {
            return;  // 已提交，不需要补偿
        }

        // 从后向前执行补偿
        Collections.reverse(actions);
        for (CompensableAction action : actions) {
            try {
                action.compensate();
            } catch (Exception e) {
                log.error("补偿操作失败", e);
                // 继续执行其他补偿
            }
        }
    }

    @FunctionalInterface
    public interface CompensableAction {
        void compensate();
    }
}
```

### 2. TCC 模式

```java
// TCC 接口定义
public interface TccTransaction {

    /**
     * Try 阶段：尝试执行业务
     */
    void try();

    /**
     * Confirm 阶段：确认提交
     */
    void confirm();

    /**
     * Cancel 阶段：取消回滚
     */
    void cancel();
}

// 订单 TCC 实现
@Component
@RequiredArgsConstructor
public class OrderTccService implements TccTransaction {

    private final OrderRepository orderRepository;

    @Transactional
    @Override
    public void try() {
        // Try: 预留资源
        Order order = Order.builder()
            .status(OrderStatus.TRYING)
            .build();
        orderRepository.save(order);
    }

    @Transactional
    @Override
    public void confirm() {
        // Confirm: 确认订单
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new DomainException("订单不存在"));
        order.confirm();
        orderRepository.save(order);
    }

    @Transactional
    @Override
    public void cancel() {
        // Cancel: 取消订单
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new DomainException("订单不存在"));
        order.cancel();
        orderRepository.save(order);
    }
}

// TCC 事务管理器
@Component
public class TccTransactionManager {

    private final List<TccTransaction> transactions = new ArrayList<>();

    public void register(TccTransaction transaction) {
        transactions.add(transaction);
    }

    public void execute() {
        // Try 阶段
        for (TccTransaction transaction : transactions) {
            try {
                transaction.try();
            } catch (Exception e) {
                // Try 失败，执行 Cancel
                cancelAll();
                throw new TccException("TCC Try 阶段失败", e);
            }
        }

        // Confirm 阶段
        for (TccTransaction transaction : transactions) {
            try {
                transaction.confirm();
            } catch (Exception e) {
                log.error("Confirm 失败，需要人工介入", e);
            }
        }
    }

    private void cancelAll() {
        for (TccTransaction transaction : transactions) {
            try {
                transaction.cancel();
            } catch (Exception e) {
                log.error("Cancel 失败", e);
            }
        }
    }
}
```

---

## 最佳实践

### 1. 并发编程检查清单

- [ ] 是否正确使用 synchronized/Lock？
- [ ] 是否避免死锁？
- [ ] 是否正确处理 InterruptedException？
- [ ] 是否使用线程安全的集合？
- [ ] 线程池配置是否合理？
- [ ] 是否正确释放锁（在 finally 中）？
- [ ] 是否避免线程泄露？

### 2. 分布式系统检查清单

- [ ] 是否正确使用分布式锁？
- [ ] 分布式事务是否考虑了补偿机制？
- [ ] 是否有幂等性保证？
- [ ] 是否考虑了网络分区？
- [ ] 是否有降级和熔断机制？
- [ ] 是否有重试机制（带退避）？
- [ ] 是否有限流保护？

### 3. 性能优化建议

- 使用并发集合代替同步集合
- 使用读写锁代替互斥锁（读多写少场景）
- 使用 CAS 代替锁（无锁算法）
- 使用线程池复用线程
- 合理设置线程池大小
- 避免创建过多对象（减少 GC 压力）
- 使用异步编程提高吞吐量
