---
description: 聚合设计模板
---

# {聚合名称} - 聚合设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | YYYY-MM-DD |
| 作者 | {架构师姓名} |
| 所属上下文 | {上下文名称} |

## 1. 聚合概述

### 聚合定义

{用一句话描述这个聚合负责什么}

### 聚合结构

```
{聚合根名称} (聚合根)
├── {实体 1}
│   └── {值对象}
├── {实体 2}
└── {值对象 1}
```

## 2. 聚合根

### 2.1 聚合根定义

| 项目 | 说明 |
|------|------|
| 聚合根名称 | {聚合根名称} |
| 标识类型 | {标识类型} |
| 生命周期 | {生命周期描述} |
| 职责 | {职责描述} |

### 2.2 聚合根属性

| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | {IdType} | Y | 唯一标识 |
| {属性 1} | {类型} | Y/N | {说明} |
| {属性 2} | {类型} | Y/N | {说明} |

### 2.3 聚合根行为

| 行为名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| {行为 1} | {参数} | {返回} | {说明} |
| {行为 2} | {参数} | {返回} | {说明} |

### 2.4 代码示例

```typescript
class {AggregateName} extends AggregateRoot {
  readonly id: {IdType}
  {attributes}

  constructor({params}) {
    super()
    this.id = {id}
    this.{attributes} = {values}
    this.validate()
  }

  // 行为实现
  {method1}({params}): {return} {
    // 不变量验证
    if ({condition}) {
      throw new Error("{error message}")
    }

    // 状态变更
    this.{state} = {newState}

    // 发布事件
    this.addEvent(new {EventName}({data}))
  }
}
```

## 3. 实体

### 3.1 实体清单

| 实体名称 | 局部标识 | 生命周期 | 说明 |
|----------|----------|----------|------|
| {实体 1} | {标识类型} | {生命周期} | {说明} |
| {实体 2} | {标识类型} | {生命周期} | {说明} |

### 3.2 实体详情

#### {实体名称}

| 项目 | 说明 |
|------|------|
| 实体名称 | {实体名称} |
| 局部标识 | {标识类型} |
| 说明 | {说明} |

**属性**：
| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| {属性 1} | {类型} | Y/N | {说明} |

**行为**：
| 行为名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| {行为 1} | {参数} | {返回} | {说明} |

## 4. 值对象

### 4.1 值对象清单

| 值对象名称 | 使用位置 | 说明 |
|------------|----------|------|
| {值对象 1} | {位置} | {说明} |
| {值对象 2} | {位置} | {说明} |

### 4.2 值对象详情

#### {值对象名称}

| 项目 | 说明 |
|------|------|
| 值对象名称 | {值对象名称} |
| 不可变 | ✅ |
| 相等性 | 按属性值 |

**属性**：
| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| {属性 1} | {类型} | Y/N | {说明} |

**行为**：
| 行为名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| {行为 1} | {参数} | {返回} | {说明} |

**代码示例**：
```typescript
class {ValueObjectName} {
  constructor(
    readonly {property1}: {type},
    readonly {property2}: {type}
  ) {
    this.validate()
  }

  private validate(): void {
    // 验证逻辑
  }

  equals(other: {ValueObjectName}): boolean {
    return this.{property1} === other.{property1} &&
           this.{property2} === other.{property2}
  }
}
```

## 5. 不变量

### 5.1 不变量清单

| 不变量 ID | 描述 | 验证位置 |
|-----------|------|----------|
| INV-1 | {不变量描述} | {方法名} |
| INV-2 | {不变量描述} | {方法名} |

### 5.2 不变量详情

#### INV-1: {不变量描述}

**形式化**：
```
{前提条件} ⇒ {必须满足的约束}
```

**验证代码**：
```typescript
private validate{Invariant}(): void {
  if ({condition}) {
    throw new Error("{error message}")
  }
}
```

**测试用例**：
| 用例 | 前提条件 | 操作 | 预期结果 |
|------|----------|------|----------|
| TC-INV-1-01 | {条件} | {操作} | {结果} |

## 6. 领域事件

### 6.1 事件清单

| 事件名称 | 触发时机 | 订阅者 |
|----------|----------|--------|
| {事件 1} | {时机} | {订阅者} |
| {事件 2} | {时机} | {订阅者} |

### 6.2 事件详情

#### {事件名称}

**触发时机**：{时机}

**携带数据**：
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| eventId | string | Y | 事件唯一标识 |
| {字段 1} | {类型} | Y/N | {说明} |

**代码示例**：
```typescript
class {EventName} implements DomainEvent {
  readonly eventId: string
  readonly eventType = "{EventName}"
  readonly occurredAt: Date

  constructor(
    readonly {field1}: {type},
    readonly {field2}: {type}
  ) {
    this.eventId = uuid()
    this.occurredAt = new Date()
  }
}
```

## 7. 聚合间引用

### 7.1 引用关系

| 被引用聚合 | 引用方式 | 引用属性 | 协作方式 |
|------------|----------|----------|----------|
| {聚合 1} | ID 引用 | {属性名} | {方式} |
| {聚合 2} | ID 引用 | {属性名} | {方式} |

### 7.2 协作场景

#### {场景名称}

**描述**：{场景描述}

**协作方式**：
- 方式 1：同步调用
- 方式 2：领域事件
- 方式 3：领域服务

**示例**：
```typescript
// 通过领域事件协作
class {AggregateName} {
  {method}(): void {
    // 状态变更
    this.{state} = {newState}

    // 发布事件
    this.addEvent(new {EventName}({data}))
  }
}
```

## 8. 仓储接口

### 8.1 仓储定义

```typescript
interface {AggregateName}Repository {
  // 基本操作
  save(aggregate: {AggregateName}): Promise<void>
  findById(id: {IdType}): Promise<{AggregateName} | null>

  // 业务查询
  findBy{Criteria}({criteria}): Promise<{AggregateName}[]>
  exists{Criteria}({criteria}): Promise<boolean>

  // 统计
  count({criteria}): Promise<number>
}
```

### 8.2 查询方法

| 方法名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| findBy{Criteria} | {参数} | Promise<{Aggregate}[]> | {说明} |
| exists{Criteria} | {参数} | Promise<boolean> | {说明} |

## 9. 测试用例

### 9.1 单元测试

| 测试用例 | 描述 | 输入 | 预期输出 |
|----------|------|------|----------|
| TC-{AGG}-01 | {描述} | {输入} | {输出} |

### 9.2 不变量测试

| 不变量 | 测试用例 | 描述 |
|--------|----------|------|
| INV-1 | TC-INV-1-01 | {测试描述} |

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | YYYY-MM-DD | 初始版本 | {作者} |
