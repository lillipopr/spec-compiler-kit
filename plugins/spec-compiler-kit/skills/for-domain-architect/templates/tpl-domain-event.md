---
description: 领域事件模板
---

# 领域事件设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | YYYY-MM-DD |
| 作者 | {架构师姓名} |
| 所属上下文 | {上下文名称} |

## 1. 事件清单

| 事件 ID | 事件名称 | 发布者 | 订阅者 | 状态 |
|---------|----------|--------|--------|------|
| DE-001 | {事件名称} | {聚合} | {上下文/聚合} | 已定义 |
| DE-002 | {事件名称} | {聚合} | {上下文/聚合} | 已定义 |

## 2. 事件详情

### DE-001: {事件名称}

#### 2.1 基本信息

| 项目 | 内容 |
|------|------|
| 事件名称 | {事件名称} |
| 事件类型 | {EventTypeName} |
| 发布者 | {上下文/聚合} |
| 发布时机 | {什么条件触发} |

#### 2.2 业务含义

{描述这个事件的业务含义}

#### 2.3 触发条件

| 条件 | 说明 |
|------|------|
| 条件 1 | {条件描述} |
| 条件 2 | {条件描述} |

#### 2.4 携带数据

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| eventId | string | Y | 事件唯一标识 |
| eventType | string | Y | 事件类型 |
| occurredAt | Date | Y | 发生时间 |
| aggregateId | string | Y | 聚合根 ID |
| aggregateVersion | number | Y | 聚合版本号 |
| {字段 1} | {类型} | Y/N | {说明} |
| {字段 2} | {类型} | Y/N | {说明} |

#### 2.5 代码定义

```typescript
class {EventName} implements DomainEvent {
  readonly eventId: string
  readonly eventType = "{EventTypeName}"
  readonly occurredAt: Date
  readonly aggregateId: string
  readonly aggregateVersion: number

  // 业务数据
  readonly {field1}: {type}
  readonly {field2}: {type}

  constructor({params}) {
    this.eventId = uuid()
    this.occurredAt = new Date()
    this.aggregateId = {aggregateId}
    this.aggregateVersion = {version}
    this.{field1} = {value1}
    this.{field2} = {value2}
  }
}
```

#### 2.6 订阅者

| 订阅者 | 处理逻辑 | 优先级 | 超时处理 |
|--------|----------|--------|----------|
| {订阅者 1} | {处理逻辑} | 高/中/低 | {超时处理} |
| {订阅者 2} | {处理逻辑} | 高/中/低 | {超时处理} |

#### 2.7 处理策略

##### {订阅者 1} 处理

**处理逻辑**：
```typescript
class {SubscriberName} {
  async handle(event: {EventName}): Promise<void> {
    // 处理逻辑
    const {entity} = await this.repo.findById(event.{field})

    // 业务处理
    {entity}.{method}(event.{data})

    // 保存
    await this.repo.save({entity})
  }
}
```

**幂等性处理**：
```typescript
class {SubscriberName} {
  async handle(event: {EventName}): Promise<void> {
    // 检查是否已处理
    if (await this.isProcessed(event.eventId)) {
      return
    }

    // 处理事件
    await this.processEvent(event)

    // 标记为已处理
    await this.markAsProcessed(event.eventId)
  }
}
```

**错误处理**：
| 错误类型 | 处理策略 | 重试次数 |
|----------|----------|----------|
| {错误 1} | {策略} | {次数} |
| {错误 2} | {策略} | {次数} |

## 3. 事件版本管理

### 3.1 版本历史

| 版本 | 变更日期 | 变更内容 | 兼容性 |
|------|----------|----------|--------|
| v1.0 | YYYY-MM-DD | 初始版本 | - |
| v2.0 | YYYY-MM-DD | {变更内容} | 向后兼容 |

### 3.2 版本差异

#### v1.0 → v2.0

**新增字段**：
| 字段名 | 类型 | 说明 |
|--------|------|------|
| {字段} | {类型} | {说明} |

**兼容性处理**：
```typescript
class {EventName}Converter {
  toV2(event: {EventName}V1): {EventName}V2 {
    return {
      ...event,
      {newField}: {defaultValue}
    }
  }
}
```

## 4. 事件存储

### 4.1 存储策略

| 策略 | 说明 |
|------|------|
| 事件溯源 | 存储所有事件 |
| 快照 + 事件 | 定期创建快照 |
| 状态存储 | 只存储当前状态 |

### 4.2 存储结构

```sql
CREATE TABLE domain_events (
  id VARCHAR(36) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(36) NOT NULL,
  aggregate_version INT NOT NULL,
  event_data JSON NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  processed_at TIMESTAMP,
  INDEX idx_aggregate (aggregate_id, aggregate_version),
  INDEX idx_event_type (event_type),
  INDEX idx_occurred_at (occurred_at)
);
```

## 5. 事件监控

### 5.1 监控指标

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| 发布速率 | 每秒发布事件数 | > 1000/s |
| 处理延迟 | 事件从发布到处理的延迟 | > 5s |
| 失败率 | 事件处理失败率 | > 1% |
| 积压数量 | 待处理事件数量 | > 10000 |

### 5.2 监控仪表板

```
事件发布速率：{值}
事件处理速率：{值}
平均处理延迟：{值}
失败率：{值}
积压数量：{值}
```

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | YYYY-MM-DD | 初始版本 | {作者} |
