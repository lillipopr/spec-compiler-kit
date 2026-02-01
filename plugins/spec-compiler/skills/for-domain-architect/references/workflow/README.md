# 工作流文档索引

> **从这里开始**：本文档提供所有工作流文档的导航和快速链接。

---

## 快速导航

### 我要...

| 需求 | 查看文档 |
|------|---------|
| 了解整体流程 | [Roadmap 工作流](roadmap-workflow.md) |
| 生成章节内容 | [PDCA 章节生成](pdca-chapter-generation.md) |
| 管理 Task 执行 | [Task 管理规范](task-management.md) |
| 处理人工 Review | [人工 Review 流程](human-review-workflow.md) |
| 优化上下文 | [上下文优化策略](context-optimization.md) |
| 查看技术细节 | [Task 实现细节](task-implementation-details.md) |

---

## 核心原则

1. **Roadmap-First**：执行前生成完整 Roadmap，透明展示整体计划
2. **3×PDCA 循环**：每章生成经历 3 个 PDCA 循环，确保质量
3. **Task-Driven**：每个步骤都是 Task，保证不漏掉
4. **Human-in-Loop**：每章完成后人工 Review，及时发现问题

---

## 核心文档

| 文档 | 说明 |
|------|------|
| [roadmap-workflow.md](roadmap-workflow.md) | Roadmap 生成和进度展示 |
| [pdca-chapter-generation.md](pdca-chapter-generation.md) | 3×PDCA 质量循环详解 |
| [task-management.md](task-management.md) | Task 定义和执行规范 |
| [human-review-workflow.md](human-review-workflow.md) | 人工审核交互流程 |
| [context-optimization.md](context-optimization.md) | 上下文优化策略 |
| [task-implementation-details.md](task-implementation-details.md) | Task 实现技术细节 |

---

## 章节生成指令

| 章节 | 生成指令 |
|------|----------|
| 第一章：限界上下文 | [chapter-01-bounded-context.md](../chapter-instructions/chapter-01-bounded-context.md) |
| 第二章：聚合设计 | [chapter-02-aggregate.md](../chapter-instructions/chapter-02-aggregate.md) |
| 第三章：领域服务 | [chapter-03-domain-service.md](../chapter-instructions/chapter-03-domain-service.md) |
| 第四章：应用层 | [chapter-04-application.md](../chapter-instructions/chapter-04-application.md) |
| 第五章：入口层 | [chapter-05-starter.md](../chapter-instructions/chapter-05-starter.md) |

**相关文档**：
- [设计原则](../principles/) - 每章的设计原则
- [检查清单](../checklists/) - 每章的质量检查清单
- [评分标准](../scoring/) - 每章的评分标准

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
