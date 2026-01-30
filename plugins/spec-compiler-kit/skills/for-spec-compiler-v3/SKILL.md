---
name: for-spec-compiler-v4
description: 规格编译器 4.0 完整知识库，提供从领域设计文档到规格编译文档的完整方法论、SOP、模板和平台指南。
---

# 规格编译器 4.0 Skill（Spec Compiler 4.0）

## 概述

本知识库为规格编译器提供从领域设计文档到确定性规格文档的完整方法论体系，实现"人管变化，AI 写实现"。

## 核心理念

**人管变化，AI 写实现**

```
传统模式：需求 → 人写代码 → 测试 → 交付
新范式：  需求 → 人写文档 → AI 编译代码 → 测试 → 交付
```

## 知识体系

```
规格编译能力体系
│
├── Phase 1: 问题建模（Problem Modeling）
│   ├── 实体抽取（DDD 原则）
│   ├── 状态定义
│   ├── 不变量定义
│   └── 状态转移图
│
├── Phase 2: 约束定义（Constraint Definition）
│   ├── 约束伪代码/DSL
│   ├── 各端实现位置
│   ├── 状态转移表
│   └── 禁止态定义
│
├── Phase 3: 用例设计（Use Case Design）
│   ├── 正向用例
│   ├── Bad Case
│   ├── 边界用例
│   └── 用例覆盖矩阵
│
└── Phase 4: 端到端接口设计（E2E Interface Design）
    ├── 完整接口规格
    ├── 各端实现位置
    └── 接口契约一致性
```

## 目录结构

### 标准作业流程（SOP）
| 文件 | 说明 |
|------|------|
| [sop/phase-1-modeling.md](sop/phase-1-modeling.md) | Phase 1: 问题建模 SOP |
| [sop/phase-2-constraints.md](sop/phase-2-constraints.md) | Phase 2: 约束定义 SOP |
| [sop/phase-3-use-cases.md](sop/phase-3-use-cases.md) | Phase 3: 用例设计 SOP |
| [sop/phase-4-e2e-design.md](sop/phase-4-e2e-design.md) | Phase 4: 端到端接口设计 SOP |

### 方法论（Methodology）
| 文件 | 说明 |
|------|------|
| [methodology/entity-extraction.md](methodology/entity-extraction.md) | DDD 实体抽取方法论 |
| [methodology/invariants.md](methodology/invariants.md) | 不变量定义方法 |
| [methodology/intent-vs-fact.md](methodology/intent-vs-fact.md) | 意图 vs 事实 |
| [methodology/state-space-design.md](methodology/state-space-design.md) | 状态空间设计 |
| [methodology/evaluation-systems.md](methodology/evaluation-systems.md) | 判断型/评估型系统特化 |

### 模式与原则（Patterns & Principles）
| 目录 | 说明 |
|------|------|
| [patterns/](patterns/) | 设计模式和反模式 |

### 场景 SOP（Scenarios）
| 文件 | 说明 |
|------|------|
| [scenarios/new-feature.md](scenarios/new-feature.md) | 新功能开发 SOP |
| [scenarios/feature-change.md](scenarios/feature-change.md) | 功能变更 SOP |
| [scenarios/bug-fix.md](scenarios/bug-fix.md) | Bug 修复 SOP |
| [scenarios/feature-deprecation.md](scenarios/feature-deprecation.md) | 功能下线 SOP |

### 平台指南（Platforms）
| 文件 | 说明 |
|------|------|
| [platforms/java-ddd.md](platforms/java-ddd.md) | 后端 DDD 分层架构 |
| [platforms/ios-mvvm.md](platforms/ios-mvvm.md) | iOS MVVM 分层架构 |
| [platforms/vue-frontend.md](platforms/vue-frontend.md) | Vue 3 前端分层架构 |

### 模板（Templates）
| 文件 | 说明 |
|------|------|
| [templates/all-templates.md](templates/all-templates.md) | 所有模板汇总 |
| [templates/e2e-interface-template.md](templates/e2e-interface-template.md) | 端到端接口设计模板 |

### 知识库（Knowledge）
| 文件 | 说明 |
|------|------|
| [knowledge/modeling-in-30-min.md](knowledge/modeling-in-30-min.md) | 30 分钟从模糊到清晰 |

## 核心能力

### Phase 1: 问题建模能力
- DDD 实体抽取（唯一 ID + 生命周期 + 状态转移）
- 状态空间定义
- 不变量识别
- 状态转移图设计

### Phase 2: 约束定义能力
- 约束伪代码/DSL 设计
- 各端实现位置规划
- 状态转移表设计
- 禁止态定义

### Phase 3: 用例设计能力
- 正向用例设计（覆盖所有 Happy Path）
- Bad Case 设计（覆盖所有禁止态）
- 边界用例设计
- 用例覆盖矩阵生成

### Phase 4: 端到端接口设计能力
- 完整接口规格设计（入参/返回值/用例/约束/状态转移/错误处理/逻辑）
- 各端实现位置明确
- 接口契约一致性保证

## 工作流概览（4 Phase + 人工审查闸口）

```
Phase 1: 问题建模 → 产出《问题建模文档》（跨端唯一）
  └─ 闸口：没有状态图和不变量，不进入下一步
  └─ ⚠️ 完成后提醒用户 Review，等待用户确认后继续

Phase 2: 约束定义 → 产出《可执行约束文档》（跨端一致）
  └─ 使用伪代码/DSL，不绑定具体语言
  └─ ⚠️ 完成后提醒用户 Review，等待用户确认后继续

Phase 3: 用例设计 → 产出《用例文档》（跨端一致）
  └─ 闸口：没有 badcase，不允许生成代码
  └─ ⚠️ 完成后提醒用户 Review，等待用户确认后继续

【重要】Phase 1-3 完成后，必须等待用户 Review 通过，才能继续 Phase 4

Phase 4: 端到端设计 → 产出《端到端接口设计文档》（串联各端）
  └─ 一份文档，分章节描述各端实现，接口规格完整
  └─ 仅在用户确认 Phase 1-3 后才开始
```

## 支持的架构

| 架构类型 | 分层结构 |
|---------|---------|
| **后端 DDD** | Controller → Application → Domain → Gateway/Infra → Mapper |
| **移动端 MVVM** | View → ViewModel → Service → Gateway → Network |
| **Vue 3 前端** | View → Composable → Service → API → Request |

## 快速导航

### 按场景

| 场景 | 推荐阅读路径 |
|------|------------|
| **快速入门** | [knowledge/modeling-in-30-min.md](knowledge/modeling-in-30-min.md) |
| **新功能开发** | [sop/](sop/) → [platforms/](platforms/) |
| **Bug 修复** | [scenarios/bug-fix.md](scenarios/bug-fix.md) |
| **功能变更** | [scenarios/feature-change.md](scenarios/feature-change.md) |
| **功能下线** | [scenarios/feature-deprecation.md](scenarios/feature-deprecation.md) |
| **判断型系统** | [methodology/evaluation-systems.md](methodology/evaluation-systems.md) |

### 按深度

| 深度 | 推荐阅读路径 |
|------|------------|
| **快速理解** | [knowledge/modeling-in-30-min.md](knowledge/modeling-in-30-min.md) |
| **完整掌握** | [sop/](sop/) + [methodology/](methodology/) |
| **深入实践** | [platforms/](platforms/) 或 [scenarios/](scenarios/) |

## 相关 Agent
- [`agents/spec-compiler-v4/AGENT.md`](../../../agents/spec-compiler-v4/AGENT.md) - 规格编译器 Agent
- [`agents/domain-architect/AGENT.md`](../../../agents/domain-architect/AGENT.md) - 领域架构师 Agent（上游）
