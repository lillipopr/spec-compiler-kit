# 工作流文档索引

> 领域架构师工作流系统完整指南

---

## 工作流概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      领域架构师工作流系统                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  输入：PRD 文档                                                           │
│    ↓                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ [生成流程](workflow-generation.md)                               │    │
│  │   PRD → 第一章 → 第二章 → 第三章 → 第四章 → 第五章 → 第六章         │    │
│  │   每章生成后自检评分 ≥60 分                                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│    ↓                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ [评估流程](workflow-evaluation.md)                                │    │
│  │   章节评分 + 综合评分 → 总分 ≥90 分通过，<90 分需修改               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│    ↓                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 用户 Review → 提出修改意见                                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│    ↓                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ [修改流程](workflow-modification.md)                              │    │
│  │   增量修改 → 重新评分 → 总分 ≥90 分交付，支持多轮迭代                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│    ↓                                                                     │
│  交付：《{功能名称} - 领域设计文档》                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 快速导航

### 按角色导航

| 角色 | 推荐文档 | 说明 |
|------|---------|------|
| **首次使用者** | [工作流总览](workflow-main.md) | 了解完整工作流程 |
| **生成文档** | [生成流程](workflow-generation.md) | 按步骤生成领域设计文档 |
| **评分评估** | [评估流程](workflow-evaluation.md) | 对文档进行评分和质量评估 |
| **修改优化** | [修改流程](workflow-modification.md) | 基于反馈迭代修改文档 |

### 按问题导航

| 我想... | 查看文档 |
|---------|---------|
| 了解完整工作流程 | [工作流总览](workflow-main.md) |
| 从 PRD 生成设计文档 | [生成流程](workflow-generation.md) |
| 对设计文档评分 | [评估流程](workflow-evaluation.md) |
| 修改设计文档 | [修改流程](workflow-modification.md) |
| 了解如何分析 PRD | [生成流程 - Step 1](workflow-generation.md#step-1prd-分析) |
| 了解如何评分 | [评估流程 - Step 1](workflow-evaluation.md#step-1章节评分) |
| 了解如何修改 | [修改流程 - Step 3](workflow-modification.md#step-3增量修改) |

---

## 核心概念

### 质量关卡

| 关卡 | 位置 | 标准 | 处理 |
|------|------|------|------|
| **关卡1** | 每章生成后 | ≥60 分 | 重生成 |
| **关卡2** | 文档生成后 | ≥90 分 | 修改 |
| **关卡3** | Review 后 | 用户确认 | 迭代 |

### 评分权重

| 章节 | 权重 | 说明 |
|------|------|------|
| 第一章：限界上下文 | 15% | 战略设计基础 |
| 第二章：聚合设计 | 25% | 战术设计核心 |
| 第三章：领域服务 | 10% | 跨聚合协作 |
| 第四章：应用层 | 15% | 用例编排 |
| 第五章：领域事件 | 10% | 异步协作 |
| 第六章：入口层 | 10% | 外部交互 |
| 设计一致性 | 15% | 整体质量 |

### 综合评分公式

```
总分 = Σ(章节分数 × 权重) + 设计一致性分数 × 15%

总分 = 第一章 × 15% + 第二章 × 25% + 第三章 × 10% +
       第四章 × 15% + 第五章 × 10% + 第六章 × 10% +
       设计一致性 × 15%
```

---

## 文档详情

### 1. 工作流总览

**文件**：[workflow-main.md](workflow-main.md)

**内容**：
- 完整工作流程图
- 生成、评估、Review、修改四个阶段
- 质量控制机制
- 支持文档索引

**适合**：首次了解工作流

---

### 2. 生成流程

**文件**：[workflow-generation.md](workflow-generation.md)

**内容**：
- PRD 分析方法
- 六章生成步骤
- 每章自检方法
- 文档组装流程
- 生成优化策略

**适合**：从零开始生成设计文档

**关键步骤**：
1. Step 1：PRD 分析
2. Step 2-7：按章节生成
3. Step 8：组装文档

---

### 3. 评估流程

**文件**：[workflow-evaluation.md](workflow-evaluation.md)

**内容**：
- 章节评分标准
- 设计一致性评分
- 综合评分计算
- 评分报告生成
- 问题报告生成

**适合**：对设计文档进行质量评估

**关键步骤**：
1. Step 1：章节评分
2. Step 2：设计一致性评分
3. Step 3：综合评分

---

### 4. 修改流程

**文件**：[workflow-modification.md](workflow-modification.md)

**内容**：
- 问题定位方法
- 修改方案制定
- 增量修改策略
- 影响分析方法
- 迭代控制机制

**适合**：基于反馈优化设计文档

**关键步骤**：
1. Step 1：问题定位
2. Step 2：制定修改方案
3. Step 3：增量修改
4. Step 4：影响分析
5. Step 5：重新评分

---

## 配套文档

### 章节指令

| 章节 | 指令文件 | 说明 |
|------|---------|------|
| 第一章 | [chapters/chapter-01-bounded-context.md](../chapters/chapter-01-bounded-context.md) | 限界上下文设计指令 |
| 第二章 | [chapters/chapter-02-aggregate.md](../chapters/chapter-02-aggregate.md) | 聚合设计指令 |
| 第三章 | [chapters/chapter-03-domain-service.md](../chapters/chapter-03-domain-service.md) | 领域服务设计指令 |
| 第四章 | [chapters/chapter-04-application.md](../chapters/chapter-04-application.md) | 应用层设计指令 |
| 第五章 | [chapters/chapter-05-domain-event.md](../chapters/chapter-05-domain-event.md) | 领域事件指令 |
| 第六章 | [chapters/chapter-06-starter.md](../chapters/chapter-06-starter.md) | 入口层设计指令 |

### 设计原则

| 章节 | 原则文件 | 说明 |
|------|---------|------|
| 第一章 | [principles/bounded-context.md](../principles/bounded-context.md) | 限界上下文原则 |
| 第二章 | [principles/aggregate.md](../principles/aggregate.md) | 聚合相关原则 |
| 第三章 | [principles/domain-service.md](../principles/domain-service.md) | 领域服务原则 |
| 第四章 | [principles/application.md](../principles/application.md) | 应用层原则 |
| 第五章 | [principles/domain-event.md](../principles/domain-event.md) | 领域事件原则 |
| 第六章 | [principles/starter.md](../principles/starter.md) | 入口层原则 |

### 评分标准

| 文件 | 对应章节 | 满分 |
|------|----------|------|
| [scoring/01-strategic-scoring.md](../scoring/01-strategic-scoring.md) | 第一章 | 100 |
| [scoring/02-tactical-scoring.md](../scoring/02-tactical-scoring.md) | 第二、三、五章 | 100 |
| [scoring/03-constraint-scoring.md](../scoring/03-constraint-scoring.md) | 第二、三、四章 | 100 |
| [scoring/04-use-case-scoring.md](../scoring/04-use-case-scoring.md) | 第二、三、四章 | 100 |

### 检查清单

| 文件 | 对应章节 |
|------|----------|
| [checklists/strategic-checklist.md](../checklists/strategic-checklist.md) | 第一章 |
| [checklists/tactical-checklist.md](../checklists/tactical-checklist.md) | 第二、三、五章 |
| [checklists/usecase-checklist.md](../checklists/usecase-checklist.md) | 第二、三、四章 |
| [checklists/review-checklist.md](../checklists/review-checklist.md) | 最终审查 |

---

## 常见问题

### Q1：工作流程是什么？

**A**：工作流程包括四个阶段：
1. **生成流程**：从 PRD 生成领域设计文档
2. **评估流程**：对文档进行评分和质量评估
3. **Review 流程**：用户 Review 并提出修改意见
4. **修改流程**：基于反馈迭代修改文档

详见：[工作流总览](workflow-main.md)

### Q2：如何生成领域设计文档？

**A**：按照 [生成流程](workflow-generation.md)：
1. 分析 PRD
2. 按章节顺序生成（第一章 → 第六章）
3. 每章完成后自检评分 ≥60 分
4. 组装完整文档

### Q3：如何评估设计文档质量？

**A**：按照 [评估流程](workflow-evaluation.md)：
1. 对每个章节评分（使用对应评分标准）
2. 评估设计一致性
3. 计算综合评分（≥90 分通过）

### Q4：如何修改设计文档？

**A**：按照 [修改流程](workflow-modification.md)：
1. 定位问题章节
2. 制定修改方案
3. 增量修改（只修改问题部分）
4. 影响分析
5. 重新评分

### Q5：评分标准是什么？

**A**：评分标准包括：
- **章节评分**：每章满分 100 分，≥60 分及格
- **综合评分**：加权平均，≥90 分交付

详见：[评估流程 - Step 1](workflow-evaluation.md#step-1章节评分)

### Q6：支持多轮修改吗？

**A**：支持。修改流程支持多轮迭代：
- 每次修改后重新评分
- 直到总分 ≥90 分
- 最多迭代 10 次

---

## 质量保证

### 生成质量保证

- **每章自检**：生成后立即自检评分
- **关卡控制**：<60 分重生成
- **重试机制**：最多重试 3 次

### 评估质量保证

- **客观评分**：使用量化评分标准
- **多维度评估**：章节评分 + 一致性评分
- **问题报告**：明确指出问题和修改建议

### 修改质量保证

- **增量修改**：只修改问题部分
- **影响分析**：检查修改的影响范围
- **迭代控制**：最多迭代 10 次

---

## 更新日志

### v1.0 (2024-02-01)

**新增内容**：
- 创建工作流系统
- 生成流程文档
- 评估流程文档
- 修改流程文档
- 工作流索引文档

**核心特性**：
- 六章顺序生成
- 每章自检评分 ≥60 分
- 综合评分 ≥90 分交付
- 支持多轮迭代修改

---

## 联系与反馈

如有问题或建议，请通过以下方式反馈：
- 提交 Issue
- 发起 Pull Request
- 联系维护者
