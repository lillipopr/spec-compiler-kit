---
name: for-java-expert
description: Java 资深技术专家知识库，提供 DDD 架构、SOLID 原则、JVM 调优、并发编程、分布式系统等核心知识。
---

# Java 技术专家 Skill

## 概述
本知识库为 Java 资深技术专家提供 DDD 架构、SOLID 原则、JVM 调优、并发编程、分布式系统等核心知识。

## 目录结构
- `methodology/`：方法论（DDD、SOLID、设计原则）
- `sop/`：标准作业流程（架构设计工作流、开发工作流）
- `domain-knowledge/`：领域知识（JVM、并发、分布式）
- `templates/`：代码模板（Controller、Application、Domain）
- `patterns/`：设计模式和最佳实践

## 文件列表

### Methodology（方法论）
- [DDD 领域驱动设计](methodology/ddd.md) - 战略设计、战术设计、分层架构
- [SOLID 设计原则](methodology/solid.md) - 单一职责、开闭原则、里氏替换、接口隔离、依赖倒置
- [其他设计原则](methodology/design-principles.md) - DRY、KISS、YAGNI

### SOP（标准作业流程）
- [架构设计工作流](sop/architecture-workflow.md) - 需求分析、领域建模、数据库设计
- [开发工作流](sop/development-workflow.md) - 编码规范、测试、代码审查

### Domain Knowledge（领域知识）
- [JVM 深入分析](domain-knowledge/jvm.md) - 内存模型、GC 调优、性能分析工具
- [并发编程](domain-knowledge/concurrency.md) - 线程池、并发工具类、分布式锁
- [分布式系统](domain-knowledge/distributed-systems.md) - 分布式事务、分布式 ID、消息队列

### Templates（代码模板）
- [Controller 模板](templates/controller-template.md) - REST API 层规范
- [Application 模板](templates/application-template.md) - 应用层规范
- [Domain 模板](templates/domain-template.md) - 领域层规范

### Patterns（设计模式）
- [反模式识别](patterns/anti-patterns.md) - 贫血模型、事务脚本、N+1 查询
- [最佳实践](patterns/best-practices.md) - 充血模型、批量查询、缓存策略

## 快速导航

### 核心内容
- [DDD 分层架构](methodology/ddd.md)
- [SOLID 原则](methodology/solid.md)
- [JVM 调优](domain-knowledge/jvm.md)
- [并发编程](domain-knowledge/concurrency.md)

### 常见任务
- **架构设计**: 见 [架构设计工作流](sop/architecture-workflow.md)
- **性能优化**: 见 [JVM 深入分析](domain-knowledge/jvm.md)
- **故障排查**: 见 [JVM 性能分析工具](domain-knowledge/jvm.md#性能分析工具)
- **代码审查**: 见 [开发工作流](sop/development-workflow.md)

### 相关 Agent
- `agents/java-expert/AGENT.md`

## 快速参考

### 分层架构
```
Controller → Application → Domain ← Repository
                      ↑
                   Mapper
```

### 命名规范
- Controller: `XxxController`
- Application: `XxxApplication` / `XxxApplicationImpl`
- Domain: `Xxx` / `XxxDomain` / `XxxDomainImpl`
- Repository: `XxxRepository` / `XxxRepositoryImpl`
- Mapper: `XxxMapper`

### 关键原则
1. **Domain 层不依赖 Repository** - 数据访问在 Application 层
2. **性能优先** - 优先考虑时间复杂度
3. **SOLID 原则** - 单一职责、开闭原则、依赖倒置
4. **DRY** - 相同逻辑只实现一次
