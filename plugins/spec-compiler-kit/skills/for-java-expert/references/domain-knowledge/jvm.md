## JVM 深入分析与性能调优

### 概述

本文档深入讲解 JVM 的内部机制、性能调优技巧和故障排查方法，帮助 Java 技术专家进行系统级别的性能优化。

---

## JVM 内存模型详解

### 1. 堆内存（Heap）

```
┌─────────────────────────────────────────────────────────────┐
│                       Java 堆内存                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   新生代 (Young Generation)                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │  │
│  │  │ Eden 区     │  │ Survivor 0 │  │ Survivor 1 │      │  │
│  │  │ 8/10       │  │ 1/10       │  │ 1/10       │      │  │
│  │  │            │  │ S0 → S1    │  │ S1 → S0    │      │  │
│  │  └────────────┘  └────────────┘  └────────────┘      │  │
│  │                                                       │  │
│  │   Eden 区满了 → Minor GC → 存活对象移到 Survivor       │  │
│  │   Survivor 年龄 > 阈值 → 晋升到老年代                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   老年代 (Old Generation / Tenured Generation)          │  │
│  │   存放生命周期长的对象                                   │  │
│  │   Full GC 会清理整个堆（包括老年代）                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**关键参数**：
```bash
-Xms4g                    # 初始堆大小
-Xmx4g                    # 最大堆大小（建议与 Xms 相同）
-Xmn2g                    # 新生代大小（建议为堆的 1/2）
-XX:NewRatio=2            # 新生代:老年代 = 1:2
-XX:SurvivorRatio=8       # Eden:S0:S1 = 8:1:1
-XX:MaxTenuringThreshold=15 # 晋升老年代年龄阈值
-XX:+UseAdaptiveSizePolicy # 自动调整各分区大小
```

### 2. 非堆内存（Non-Heap）

```
┌─────────────────────────────────────────────────────────────┐
│                      非堆内存                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   元空间 (Metaspace)                                   │  │
│  │   存放类元数据：类定义、方法定义、字段定义               │  │
│  │   -XX:MetaspaceSize=256m                               │  │
│  │   -XX:MaxMetaspaceSize=256m                           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   直接内存 (Direct Memory)                             │  │
│  │   NIO 使用，避免 Java 堆和 Native 堆之间的拷贝          │  │
│  │   -XX:MaxDirectMemorySize=1g                          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   线程栈 (Thread Stack)                                │  │
│  │   每个线程的栈空间                                     │  │
│  │   -Xss1m (每个线程 1MB)                                │  │
│  │   1000 线程 ≈ 1GB 内存                                │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   代码缓存 (Code Cache)                                │  │
│  │   存放 JIT 编译后的本地代码                             │  │
│  │   -XX:ReservedCodeCacheSize=240m                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   字符串去重 (String Deduplication)                    │  │
│  │   G1 特性：去重堆中的重复字符串                         │  │
│  │   -XX:+UseStringDeduplication                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3. 对象生命周期

```
对象创建 → Eden 区
    ↓
Eden 区满 → Minor GC
    ↓
存活对象 → Survivor 区（S0 或 S1）
    ↓
每次 Minor GC 年龄 +1
    ↓
年龄 > MaxTenuringThreshold → 晋升老年代
    ↓
老年代空间不足 → Full GC（清理整个堆）
```

---

## 垃圾回收器（GC）

### 1. GC 分类

```
┌─────────────────────────────────────────────────────────────┐
│                       垃圾回收器分类                           │
├─────────────────────────────────────────────────────────────┤
│  串行 GC (Serial GC)                                        │
│  - 单线程 GC                                                │
│  - 适合单核 CPU、小内存应用                                  │
│  -XX:+UseSerialGC                                          │
├─────────────────────────────────────────────────────────────┤
│  并行 GC (Parallel GC)                                      │
│  - 多线程 GC，关注吞吐量                                    │
│  - 适合后台计算、批处理任务                                  │
│  -XX:+UseParallelGC                                        │
├─────────────────────────────────────────────────────────────┤
│  CMS GC (Concurrent Mark Sweep)                            │
│  - 低延迟 GC（已废弃）                                      │
│  - 适合交互式应用、Web 应用                                  │
│  -XX:+UseConcMarkSweepGC (已移除)                          │
├─────────────────────────────────────────────────────────────┤
│  G1 GC (Garbage First)                                     │
│  - 服务端默认 GC                                           │
│  - 平衡吞吐量和延迟                                         │
│  - 支持大堆（< 32GB）                                      │
│  -XX:+UseG1GC                                             │
├─────────────────────────────────────────────────────────────┤
│  ZGC (Z Garbage Collector)                                 │
│  - 超低延迟（< 10ms）                                      │
│  - 支持超大堆（TB 级别）                                    │
│  - Java 15+ 正式可用                                       │
│  -XX:+UseZGC                                              │
├─────────────────────────────────────────────────────────────┤
│  Shenandoah GC                                             │
│  - 超低延迟（< 10ms）                                      │
│  - 支持超大堆                                              │
│  - OpenJDK 实现                                           │
│  -XX:+UseShenandoahGC                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2. G1 GC 详解

**G1 特点**：
- 基于 Region 的内存布局
- 可预测的停顿时间模型
- 并行和并发标记
- 增量回收

**Region 结构**：
```
┌─────────────────────────────────────────────────────────────┐
│                        G1 Heap                              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │ R0 │ │ R1 │ │ R2 │ │ R3 │ │ R4 │ │ R5 │ │ R6 │ │ R7 │   │
│  │Eden│ │Eden│ │Eden│ │Surv│ │Surv│ │Old │ │Old │ │Old │   │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘   │
│                                                               │
│  Region 大小: 1MB - 32MB（可配置，必须是 2 的幂次）            │
│  每个 Region 可以是 Eden、Survivor、Old、Humongous            │
└─────────────────────────────────────────────────────────────┘
```

**G1 GC 配置**：
```bash
# 基本 G1 配置
-XX:+UseG1GC                              # 启用 G1

# 停顿时间目标（默认 200ms）
-XX:MaxGCPauseMillis=200                  # 最大 GC 停顿时间

# Region 大小（自动计算）
-XX:G1HeapRegionSize=16m                  # 手动指定 Region 大小

# 并发标记线程数
-XX:ConcGCThreads=2                       # 并发标记线程数

# GC 后备线程
-XX:G1ReservePercent=10                   # 保留堆的 10% 作为备用

# 混合 GC 触发阈值（老年代占用堆的比例）
-XX:G1MixedGCLiveThresholdPercent=85      # 默认 85%

# 字符串去重
-XX:+UseStringDeduplication               # 启用字符串去重
-XX:StringDeduplicationAgeThreshold=3     # 字符串达到此年龄后去重
```

**G1 GC 日志**：
```bash
# GC 日志配置
-Xlog:gc*:file=gc.log:time,uptime:level,tags:filecount=5,filesize=10m

# 详细 GC 日志
-Xlog:gc+gc+ref=debug:file=gc-debug.log:time,uptime
```

### 3. ZGC 配置

```bash
# 启用 ZGC
-XX:+UseZGC

# ZGC 特定配置
-XX:ZCollectionInterval=5                 # GC 间隔（秒）
-XX:ZAllocationSpikeTolerance=5           # 分配峰值容忍度
```

---

## JIT 编译器

### 1. 分层编译（Tiered Compilation）

```
解释执行 → C1 编译（Client 编译器）→ C2 编译（Server 编译器）
   ↓              ↓                         ↓
快速启动        优化编译                   激进优化
               （收集统计信息）           （基于性能数据）
```

**编译级别**：
```
Level 0: 解释执行
Level 1: C1 编译（简单优化）
Level 2: C1 编译（有限 profiling）
Level 3: C1 编译（完全 profiling）
Level 4: C2 编译（激进优化）
```

**JIT 配置**：
```bash
# 启用分层编译（默认开启）
-XX:+TieredCompilation

# 关闭分层编译（仅 C2）
-XX:-TieredCompilation

# 设置编译线程数
-XX:CICompilerCount=2

# 预热编译
-XX:CompileThreshold=10000                # 方法调用次数阈值
```

### 2. 逃逸分析（Escape Analysis）

```java
public void method() {
    // 对象未逃逸，可能被优化到栈上
    MyObject obj = new MyObject();
    obj.doSomething();
    // 对象在这里销毁
}
```

**逃逸分析优化**：
- 栈上分配（Stack Allocation）
- 标量替换（Scalar Replacement）
- 锁消除（Lock Elimination）

**配置**：
```bash
-XX:+DoEscapeAnalysis                     # 启用逃逸分析（默认开启）
-XX:+EliminateAllocations                 # 启用标量替换（默认开启）
-XX:+EliminateLocks                       # 启用锁消除（默认开启）
-XX:+PrintEliminateAllocations            # 打印标量替换信息
```

---

## 类加载机制

### 1. 类加载器层次

```
┌─────────────────────────────────────────────────────────────┐
│                    启动类加载器 (Bootstrap ClassLoader)       │
│  加载: $JAVA_HOME/lib/rt.jar, resources.jar                │
│  实现: C++ 实现，是 JVM 的一部分                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ (父类加载器)
┌─────────────────────────────────────────────────────────────┐
│                扩展类加载器 (Extension ClassLoader)           │
│  加载: $JAVA_HOME/lib/ext 目录下的 JAR                      │
│  实现: sun.misc.Launcher$ExtClassLoader                    │
└─────────────────────────────────────────────────────────────┘
                          ↓ (父类加载器)
┌─────────────────────────────────────────────────────────────┐
│                应用类加载器 (Application ClassLoader)         │
│  加载: 用户 Classpath 上的类                                │
│  实现: sun.misc.Launcher$AppClassLoader                    │
└─────────────────────────────────────────────────────────────┘
                          ↓ (父类加载器)
┌─────────────────────────────────────────────────────────────┐
│                自定义类加载器 (Custom ClassLoader)            │
│  用户自定义的类加载器                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2. 双亲委派模型

```java
protected Class<?> loadClass(String name, boolean resolve) {
    // 1. 检查类是否已加载
    synchronized (getClassLoadingLock(name)) {
        Class<?> c = findLoadedClass(name);
        if (c == null) {
            try {
                // 2. 委派给父类加载器
                if (parent != null) {
                    c = parent.loadClass(name, false);
                } else {
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // 父类加载器无法加载
            }

            if (c == null) {
                // 3. 自己尝试加载
                c = findClass(name);
            }
        }
    }
    return c;
}
```

**双亲委派的好处**：
- 避免类的重复加载
- 保证 Java 核心类的安全性

### 3. 类加载过程

```
加载 → 验证 → 准备 → 解析 → 初始化
 ↓      ↓      ↓      ↓      ↓
二进制  类文件  分配    符号    执行
字节流  验证    内存    引用    <clinit>
        字节码  (静态         替换为
        验证    字段         直接引用
        )       赋0值)
```

---

## JVM 调优实战

### 1. 内存问题排查

**内存泄漏**：
```bash
# 1. 查看堆内存使用
jmap -heap <pid>

# 2. 查看堆中对象统计
jmap -histo:live <pid> | head -20

# 3. 导出堆转储
jmap -dump:live,format=b,file=heap.hprof <pid>

# 4. 使用 MAT 分析堆转储
```

**内存溢出（OOM）**：
```bash
# OOM 时自动生成堆转储
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/heap.hprof

# OOM 时执行脚本
-XX:OnOutOfMemoryError="/bin/kill -9 %p"
```

### 2. CPU 问题排查

```bash
# 1. 找到 CPU 最高的 Java 进程
top

# 2. 找到 CPU 最高的线程
top -Hp <pid>

# 3. 将线程 ID 转为十六进制
printf "%x" <tid>

# 4. 查看线程堆栈
jstack <pid> | grep <hex-tid> -A 20

# 5. 使用 Arthas 在线诊断
thread               # 查看所有线程
thread <thread-id>   # 查看指定线程
thread -n 5          # 查看 CPU 最高的 5 个线程
```

### 3. 死锁排查

```bash
# 1. 查看死锁信息
jstack <pid> | grep -A 10 "Found one Java-level deadlock"

# 2. 使用 Arthas 检测死锁
thread -b            # 检测死锁

# 3. 使用 JConsole 检测死锁
jconsole <pid>
```

### 4. GC 问题排查

```bash
# 1. 开启 GC 日志
-Xlog:gc*:file=gc.log:time,uptime:level,tags

# 2. 使用 GCViewer 分析 GC 日志

# 3. 使用 jstat 查看 GC 统计
jstat -gcutil <pid> 1000 10   # 每秒输出一次，共 10 次

# 输出含义:
# S0: Survivor 0 使用率
# S1: Survivor 1 使用率
# E: Eden 使用率
# O: 老年代使用率
# M: 元空间使用率
# YGC: Young GC 次数
# YGCT: Young GC 总时间
# FGC: Full GC 次数
# FGCT: Full GC 总时间
# GCT: 总 GC 时间
```

**常见 GC 问题**：

| 问题 | 现象 | 原因 | 解决方案 |
|------|------|------|----------|
| **频繁 Full GC** | Full GC 间隔短、停顿长 | 老年代空间不足、对象晋升过快 | 增大堆、降低晋升阈值、检查内存泄漏 |
| **GC 停顿过长** | 单次 GC > 1s | 堆过大、对象过多 | 使用 G1/ZGC、降低 MaxGCPauseMillis |
| **内存泄漏** | 老年代持续增长 | 对象无法回收 | 堆转储分析、修复泄漏代码 |
| **元空间溢出** | Metaspace OOM | 加载类过多 | 增大 MaxMetaspaceSize、检查类加载 |

---

## 性能调优案例

### 案例 1: 大堆内存应用调优

**场景**：
- 堆大小: 16GB
- GC 停顿时间: > 2s
- 使用 Parallel GC

**优化方案**：
```bash
# 切换到 G1 GC
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16m
-XX:ParallelGCThreads=8
-XX:ConcGCThreads=2

# 结果:
# - GC 停顿时间降至 200ms 以内
# - 吞吐量提升 30%
```

### 案例 2: 低延迟应用调优

**场景**：
- 交易系统
- 要求: GC 停顿 < 10ms
- 堆大小: 8GB

**优化方案**：
```bash
# 使用 ZGC
-XX:+UseZGC

# 结果:
# - GC 停顿时间 < 10ms
# - 99.9% 的请求满足延迟要求
```

### 案例 3: 内存泄漏排查

**现象**：
- 应用运行一段时间后变慢
- Full GC 频繁
- 老年代持续增长

**排查步骤**：
```bash
# 1. 导出堆转储
jmap -dump:format=b,file=heap.hprof <pid>

# 2. 使用 MAT 分析
# - Dominator Tree: 找出占用内存最大的对象
# - Histogram: 统计对象数量
# - Leak Suspects: 自动检测可能的内存泄漏

# 3. 发现问题
# - ArrayList 持有 100 万个对象未释放
# - 原因: 监听器未注销

# 4. 修复代码
public void addListener(Listener listener) {
    listeners.add(listener);
}

// 添加注销方法
public void removeListener(Listener listener) {
    listeners.remove(listener);
}
```

---

## Arthas 在线诊断

### 安装与启动

```bash
# 下载
curl -O https://arthas.aliyun.com/arthas-boot.jar

# 启动
java -jar arthas-boot.jar

# 选择目标 Java 进程
```

### 常用命令

**1. 系统信息**
```bash
dashboard           # 查看系统实时数据面板
thread              # 查看所有线程
thread <thread-id>  # 查看指定线程堆栈
```

**2. 类信息**
```bash
sc -d *Class*       # 查看所有匹配的类
sm -d ClassName methodName  # 查看方法信息
jad MyClass         # 反编译类
```

**3. 方法监控**
```bash
monitor MyClass myMethod -c 5    # 每 5 秒统计一次
watch MyClass myMethod '{params, returnObj}'  # 查看入参和返回值
trace MyClass myMethod           # 方法调用链路追踪
stack MyClass myMethod           # 方法调用路径
```

**4. 类加载**
```bash
classloader        # 查看类加载器信息
classloader -t     # 按类加载器统计
load -c <hash> MyClass.class  # 热加载类
```

**5. 系统属性**
```bash
sysprop            # 查看所有系统属性
sysprop java.version  # 查看指定属性
sysenv             # 查看环境变量
vmoption           # 查看 JVM 参数
```

**6. Ognl 表达式**
```bash
# 调用静态方法
ognl '@java.lang.System@out.println("hello")'

# 获取类的静态字段
ognl '@com.example.Class@STATIC_FIELD'

# 调用对象方法
ognl '#user=@com.example.User@new(), #user.setName("test"), #user'
```

---

## 监控指标

### 关键监控指标

```
┌─────────────────────────────────────────────────────────────┐
│                    JVM 监控指标                               │
├─────────────────────────────────────────────────────────────┤
│  内存指标                                                     │
│  - 堆内存使用率                                              │
│  - 新生代/老年代使用率                                        │
│  - 元空间使用率                                              │
│  - 直接内存使用率                                            │
├─────────────────────────────────────────────────────────────┤
│  GC 指标                                                     │
│  - Young GC 次数和耗时                                       │
│  - Full GC 次数和耗时                                        │
│  - GC 停顿时间                                               │
│  - GC 回收的数据量                                           │
├─────────────────────────────────────────────────────────────┤
│  线程指标                                                     │
│  - 活跃线程数                                                │
│  - 峰值线程数                                                │
│  - 死锁检测                                                  │
│  - 线程状态分布                                              │
├─────────────────────────────────────────────────────────────┤
│  类加载指标                                                   │
│  - 已加载类数量                                              │
│  - 类加载/卸载次数                                           │
│  - 类加载器内存泄漏检测                                       │
├─────────────────────────────────────────────────────────────┤
│  编译指标                                                     │
│  - JIT 编译次数                                              │
│  - 编译队列长度                                              │
│  - 逆优化次数                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 最佳实践

### 1. 生产环境 JVM 参数模板

**通用 Web 应用（4-8GB 堆）**
```bash
# 堆内存
-Xms4g -Xmx4g
-Xmn2g
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=256m

# GC
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16m

# GC 日志
-Xlog:gc*:file=gc.log:time,uptime:level,tags:filecount=5,filesize=10m

# OOM 处理
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/

# 其他
-XX:+UseStringDeduplication
-XX:+AlwaysPreTouch
```

**低延迟应用（ZGC）**
```bash
-Xms8g -Xmx8g
-XX:+UseZGC
-XX:ZCollectionInterval=5
```

**大堆应用（> 32GB）**
```bash
-Xms32g -Xmx32g
-XX:+UseZGC
-XX:ZAllocationSpikeTolerance=5
```

### 2. 性能调优检查清单

- [ ] 堆内存大小是否合理（既不浪费也不频繁 GC）？
- [ ] 新生代/老年代比例是否合理？
- [ ] GC 停顿时间是否满足要求？
- [ ] 是否有内存泄漏？
- [ ] CPU 使用率是否正常？
- [ ] 是否有死锁？
- [ ] 类加载是否正常？
- [ ] JIT 编译是否正常？
- [ ] 监控是否完善？
