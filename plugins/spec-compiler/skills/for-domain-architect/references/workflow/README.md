# 工作流文档索引

> 领域架构师工作流系统 v2.0

---

## 快速导航

| 我想... | 查看文档 |
|---------|---------|
| 了解完整流程 | [Roadmap 工作流](roadmap-workflow.md) |
| 了解章节生成（3×PDCA） | [PDCA 章节生成](pdca-chapter-generation.md) |
| 了解人工 Review | [人工 Review 流程](human-review-workflow.md) |
| 了解 Task 管理 | [Task 管理](task-management.md) |
| 优化上下文 | [上下文优化](context-optimization.md) |

---

## 核心原则

| 原则 | 说明 |
|------|------|
| **Roadmap-First** | 执行前生成完整 Roadmap |
| **3×PDCA 循环** | 每章：Principles → Checklists → Scoring |
| **Human-in-Loop** | 每章完成后人工 Review |
| **Task-Driven** | 每个步骤都是 Task |

---

## 文档说明

### 核心文档

- **[roadmap-workflow.md](roadmap-workflow.md)** - Roadmap 生成和进度展示
- **[pdca-chapter-generation.md](pdca-chapter-generation.md)** - 3×PDCA 质量循环
- **[human-review-workflow.md](human-review-workflow.md)** - 人工审核交互
- **[task-management.md](task-management.md)** - Task 定义和执行
- **[context-optimization.md](context-optimization.md)** - 上下文优化策略

---

## 质量关卡

| 关卡 | 标准 |
|------|------|
| PDCA #1 | 修复所有 principles 问题 |
| PDCA #2 | 通过所有检查清单项 |
| PDCA #3 | ≥60 分 |
| 人工 Review | 用户确认 |

---

## 流程概览

```
PRD 文档
  ↓
Roadmap 生成 → 用户确认
  ↓
PRD 分析与摘要
  ↓
逐章生成（5 章）
  ├─ PDCA #1: Principles 检测
  ├─ PDCA #2: Checklists 检测
  ├─ PDCA #3: Scoring 检测
  └─ 人工 Review
  ↓
文档组装
  ↓
领域设计文档
```
