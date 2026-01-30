---
name: for-domain-architect
description: 资深领域架构师完整知识库，提供从业务需求到领域设计的完整方法论、SOP、原则、模式、检查清单和模板。
---

# 资深领域架构师 Skill

## 概述

本知识库为资深领域架构师提供从业务需求到 DDD 领域设计的完整方法论体系，涵盖战略设计和战术设计的全流程。

## 知识体系

```
领域架构师能力体系
│
├── 战略设计（Strategic Design）
│   ├── 业务能力分析
│   ├── 限界上下文划分
│   ├── 上下文映射
│   └── 架构愿景
│
├── 战术设计（Tactical Design）
│   ├── 聚合设计
│   ├── 实体与值对象
│   ├── 领域事件
│   ├── 领域服务
│   └── 仓储接口
│
└── 设计评审
    ├── 设计原则检查
    ├── 聚合边界验证
    ├── 一致性分析
    └── 可追溯性审查
```

## 目录结构

### 标准作业流程（SOP）
| 文件 | 说明 |
|------|------|
| [sop/sop-bc-analysis.md](sop/sop-bc-analysis.md) | 业务能力分析 SOP |
| [sop/sop-context-partition.md](sop/sop-context-partition.md) | 限界上下文划分 SOP |
| [sop/sop-aggregate-design.md](sop/sop-aggregate-design.md) | 聚合设计 SOP |
| [sop/sop-domain-modeling.md](sop/sop-domain-modeling.md) | 领域建模 SOP |

### 方法论（Methodology）
| 文件 | 说明 |
|------|------|
| [methodology/entity-extraction.md](methodology/entity-extraction.md) | 实体抽取方法论 |
| [methodology/vo-design.md](methodology/vo-design.md) | 值对象设计方法论 |
| [methodology/aggregate-design.md](methodology/aggregate-design.md) | 聚合设计方法论 |
| [methodology/context-mapping.md](methodology/context-mapping.md) | 上下文映射方法论 |
| [methodology/domain-event.md](methodology/domain-event.md) | 领域事件设计方法论 |

### 原则（Principles）
| 文件 | 说明 |
|------|------|
| [principles/ddd-principles.md](principles/ddd-principles.md) | DDD 核心原则 |
| [principles/aggregate-principles.md](principles/aggregate-principles.md) | 聚合设计原则 |
| [principles/modeling-principles.md](principles/modeling-principles.md) | 领域建模原则 |

### 设计模式（Patterns）
| 文件 | 说明 |
|------|------|
| [patterns/ddd-patterns.md](patterns/ddd-patterns.md) | DDD 战略设计模式 |
| [patterns/tactical-patterns.md](patterns/tactical-patterns.md) | DDD 战术设计模式 |

### 检查清单（Checklists）
| 文件 | 说明 |
|------|------|
| [checklists/bc-checklist.md](checklists/bc-checklist.md) | 业务能力检查清单 |
| [checklists/context-checklist.md](checklists/context-checklist.md) | 上下文划分检查清单 |
| [checklists/aggregate-checklist.md](checklists/aggregate-checklist.md) | 聚合设计检查清单 |
| [checklists/review-checklist.md](checklists/review-checklist.md) | 设计审查清单 |

### 模板（Templates）
| 文件 | 说明 |
|------|------|
| [templates/tpl-ddd-design.md](templates/tpl-ddd-design.md) | DDD 设计文档模板 |
| [templates/tpl-context-partition.md](templates/tpl-context-partition.md) | 上下文划分模板 |
| [templates/tpl-aggregate.md](templates/tpl-aggregate.md) | 聚合设计模板 |
| [templates/tpl-domain-event.md](templates/tpl-domain-event.md) | 领域事件模板 |

### 阶段说明（Stages）
| 文件 | 说明 |
|------|------|
| [stages/02-ddd-design.md](stages/02-ddd-design.md) | Stage 2: DDD 设计阶段 |

### 领域知识（Knowledge）
| 文件 | 说明 |
|------|------|
| [knowledge/bounded-context.md](knowledge/bounded-context.md) | 限界上下文详解 |
| [knowledge/aggregate-lifecycle.md](knowledge/aggregate-lifecycle.md) | 聚合生命周期 |
| [knowledge/ubiquitous-language.md](knowledge/ubiquitous-language.md) | 通用语言 |

## 核心能力

### 战略设计能力
- 业务能力分解与分析
- 限界上下文识别与划分
- 上下文映射关系设计
- 领域类型识别（核心域/支撑域/通用域/泛化域）

### 战术设计能力
- 聚合根识别与设计
- 实体与值对象区分
- 领域事件设计与建模
- 领域服务识别
- 仓储接口设计

### 设计评审能力
- DDD 设计原则验证
- 聚合边界合理性审查
- 一致性边界分析
- 上下文映射正确性验证

## 设计流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      DDD 设计完整流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 业务能力分析（Business Capability Analysis）                 │
│     ├─ 识别业务能力                                             │
│     ├─ 能力分解与分组                                           │
│     └─ 能力与团队对齐                                           │
│                                                                 │
│  2. 限界上下文划分（Bounded Context Partitioning）              │
│     ├─ 按业务能力划分                                           │
│     ├─ 按组织结构对齐                                           │
│     ├─ 按数据所有权划分                                         │
│     └─ 确定上下文类型                                           │
│                                                                 │
│  3. 上下文映射（Context Mapping）                               │
│     ├─ 识别上下游关系                                           │
│     ├─ 确定映射模式（O/C, D, ACL, PL, CF）                      │
│     └─ 设计防腐层                                               │
│                                                                 │
│  4. 聚合设计（Aggregate Design）                                │
│     ├─ 识别聚合根                                               │
│     ├─ 确定聚合边界                                             │
│     ├─ 设计聚合内部结构                                         │
│     └─ 定义聚合间引用                                           │
│                                                                 │
│  5. 领域建模（Domain Modeling）                                 │
│     ├─ 实体识别与设计                                           │
│     ├─ 值对象识别与设计                                         │
│     ├─ 领域事件设计                                             │
│     ├─ 领域服务识别                                             │
│     └─ 仓储接口设计                                             │
│                                                                 │
│  6. 设计评审（Design Review）                                   │
│     ├─ 检查清单验证                                             │
│     ├─ 原则符合性审查                                           │
│     └─ 可追溯性检查                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 相关 Agent
- [`agents/domain-architect/AGENT.md`](../../../agents/domain-architect/AGENT.md) - 领域架构师 Agent
