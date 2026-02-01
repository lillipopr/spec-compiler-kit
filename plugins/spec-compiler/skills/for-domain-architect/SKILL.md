---
name: for-domain-architect
description: 资深领域架构师，将 PRD 转化为领域设计文档。支持 5 章结构生成、质量评分、任务工作流、上下文优化。

当用户询问以下问题时触发：
- "领域建模"
- "DDD 设计"
- "聚合设计"
- "限界上下文"
- "领域事件"
- "DDD 架构设计"
---

# 资深领域架构师 Skill

## 核心能力

将 PRD 文档转化为《领域设计文档》，按 **5 个章节**顺序生成：

1. **第一章：限界上下文设计** - 业务能力分析、上下文划分、上下文映射
2. **第二章：聚合设计** - 聚合总览、聚合根设计、实体设计、值对象设计（包含事件发布设计）
3. **第三章：领域服务设计** - 领域服务判断、服务列表、服务详细设计
4. **第四章：应用层设计** - 应用服务列表、用户行为列表、系统行为列表、事件处理
5. **第五章：入口层设计** - Controller 层、MQ 层、Task 层（Starter 层）

---

## 质量保证机制

**90 分及格线**：每章独立评分 ≥60 分，综合评分 ≥90 分交付。

```
综合评分 = Chapter-1 × 15% + Chapter-2 × 30% + Chapter-3 × 10% +
           Chapter-4 × 20% + Chapter-5 × 10% + 设计一致性 × 15%
```

---

## 基于 Task 工具的工作流

### 为什么使用 Task 工具

| 优势 | 说明 |
|------|------|
| ✅ **进度可见** | 实时显示任务进度，不再黑盒 |
| ✅ **质量可控** | 每步验证质量，问题早发现 |
| ✅ **错误隔离** | 失败任务不影响其他，单点重试 |
| ✅ **上下文隔离** | 每个任务独立上下文，避免撑爆 |

### 任务树（7 个独立任务）

```
根任务：生成领域设计文档
│
├─ [T1] PRD 分析与摘要（依赖：无）
│   └─ 输出：prd-summary.md（轻量级摘要）
│
├─ [T2] 第一章：限界上下文设计（依赖：T1）
│   ├─ 输出：chapter-01.md + summary + score
│   └─ 质量关卡：≥60 分
│
├─ [T3] 第二章：聚合设计（依赖：T2）
│   ├─ 输出：chapter-02.md + summary + score
│   └─ 质量关卡：≥60 分
│
├─ [T4] 第三章：领域服务设计（依赖：T3）
│   ├─ 输出：chapter-03.md + summary + score
│   └─ 质量关卡：≥60 分
│
├─ [T5] 第四章：应用层设计（依赖：T4）
│   ├─ 输出：chapter-04.md + summary + score
│   └─ 质量关卡：≥60 分
│
├─ [T6] 第五章：入口层设计（依赖：T5）
│   ├─ 输出：chapter-06.md + summary + score
│   └─ 质量关卡：≥60 分
│
├─ [T7] 综合评分（依赖：T2-T6）
│   ├─ 输入：所有章节评分
│   ├─ 输出：score-report.md
│   └─ 质量关卡：≥90 分
│
└─ [T8] 文档组装（依赖：T7）
    ├─ 输入：所有章节文件
    ├─ 输出：{功能名称}-领域设计文档.md
    └─ 质量关卡：最终审查
```

### 上下文优化

通过 PRD 摘要 + 逐章生成 + 文件持久化，节省 64% 的上下文（从 50,000 tokens 降至 18,000 tokens）。

---

## 章节生成指令

| 章节 | 文件 | 说明 |
|------|------|------|
| 第一章 | [chapters/chapter-01-bounded-context.md](chapters/chapter-01-bounded-context.md) | 限界上下文设计 |
| 第二章 | [chapters/chapter-02-aggregate.md](chapters/chapter-02-aggregate.md) | 聚合设计（包含事件发布） |
| 第三章 | [chapters/chapter-03-domain-service.md](chapters/chapter-03-domain-service.md) | 领域服务设计 |
| 第四章 | [chapters/chapter-04-application.md](chapters/chapter-04-application.md) | 应用层设计（包含事件处理） |
| 第五章 | [chapters/chapter-06-starter.md](chapters/chapter-06-starter.md) | 入口层设计（Starter 层） |

---

## 参考资料

### 工作流文档

| 文件 | 说明 | 优先级 |
|------|------|--------|
| [references/workflow/README.md](references/workflow/README.md) | **工作流索引**：快速导航和常见问题 | ⭐⭐⭐ |
| [references/workflow/task-based-workflow.md](references/workflow/task-based-workflow.md) | **Task 工具工作流**：任务拆分与执行 | ⭐⭐⭐ |
| [references/workflow/context-optimization.md](references/workflow/context-optimization.md) | **上下文优化**：避免上下文撑爆 | ⭐⭐⭐ |
| [references/workflow/workflow-generation.md](references/workflow/workflow-generation.md) | 生成流程：从 PRD 到领域设计文档 | ⭐⭐ |
| [references/workflow/workflow-evaluation.md](references/workflow/workflow-evaluation.md) | 评估流程：章节评分 + 综合评分 | ⭐⭐ |
| [references/workflow/workflow-modification.md](references/workflow/workflow-modification.md) | 修改流程：基于反馈的迭代修改 | ⭐⭐ |

### 设计原则（按章节分类）

| 章节 | 原则文件 | 说明 |
|------|---------|------|
| 第一章 | [references/principles/bounded-context.md](references/principles/bounded-context.md) | 限界上下文相关原则 |
| 第二章 | [references/principles/aggregate.md](references/principles/aggregate.md) | 聚合相关原则（包含事件发布） |
| 第三章 | [references/principles/domain-service.md](references/principles/domain-service.md) | 领域服务相关原则 |
| 第四章 | [references/principles/application.md](references/principles/application.md) | 应用层相关原则（包含事件处理） |
| 第五章 | [references/principles/starter.md](references/principles/starter.md) | 入口层（Starter 层）相关原则 |

### 命名约定

| 文件 | 说明 |
|------|------|
| [references/naming-conventions.md](references/naming-conventions.md) | **命名约定**：领域服务、应用服务、领域事件、接口路径、请求参数 |

### 检查清单（每章完成后自检）

| 文件 | 对应章节 |
|------|----------|
| [references/checklists/chapter-01-checklist.md](references/checklists/chapter-01-checklist.md) | 第一章 |
| [references/checklists/chapter-02-checklist.md](references/checklists/chapter-02-checklist.md) | 第二章 |
| [references/checklists/chapter-03-checklist.md](references/checklists/chapter-03-checklist.md) | 第三章 |
| [references/checklists/chapter-04-checklist.md](references/checklists/chapter-04-checklist.md) | 第四章 |
| [references/checklists/chapter-06-checklist.md](references/checklists/chapter-06-checklist.md) | 第五章 |
| [references/checklists/final-review-checklist.md](references/checklists/final-review-checklist.md) | 最终审查 |

### 评分标准（每章完成后使用）

| 文件 | 对应章节 | 满分 |
|------|----------|------|
| [references/scoring/chapter-01-scoring.md](references/scoring/chapter-01-scoring.md) | 第一章 | 100 |
| [references/scoring/chapter-02-scoring.md](references/scoring/chapter-02-scoring.md) | 第二章 | 100 |
| [references/scoring/chapter-03-scoring.md](references/scoring/chapter-03-scoring.md) | 第三章 | 100 |
| [references/scoring/chapter-04-scoring.md](references/scoring/chapter-04-scoring.md) | 第四章 | 100 |
| [references/scoring/chapter-06-scoring.md](references/scoring/chapter-06-scoring.md) | 第五章 | 100 |
| [references/scoring/design-consistency-scoring.md](references/scoring/design-consistency-scoring.md) | 设计一致性 | 100 |

### 输出模板

| 文件 | 说明 |
|------|------|
| [assets/templates/domain-design-template.md](assets/templates/domain-design-template.md) | **领域设计文档模板**（最终产出） |

---

## 使用场景

### 场景 1：创建新的领域设计文档

**输入**：PRD 文档路径
**输出**：`{功能名称}-领域设计文档.md`

**流程**：
1. 创建 7 个任务（TaskCreate）
2. 执行任务循环（实时显示进度）
3. 每个任务完成后自检评分
4. 综合评分 ≥90 分交付

### 场景 2：Review 设计质量

**输入**：现有设计文档
**输出**：评分报告 + 改进建议

**流程**：
1. 使用对应的检查清单自检
2. 使用对应的评分标准评分
3. 生成评分报告
4. 输出改进建议

---

## 核心设计原则

### 理论依据

| 原则 | 来源 | 说明 |
|------|------|------|
| 聚合设计 | Eric Evans DDD | 实体收敛原则 |
| 不变量约束 | Bertrand Meyer | 面向对象软件构造（Design by Contract） |
| 状态机建模 | David Harel | 状态图在软件设计中的应用 |
| 约束优先级 | Michael Jackson | 问题框架方法 |

### 设计质量标准

每个设计元素必须满足：

1. **有理论依据**：能说明为什么这样设计
2. **符合最佳实践**：与业内公认的设计模式一致
3. **可验证**：每个约束可写成 assert，每个用例可转化为测试
4. **可追溯**：设计决策可追溯到 PRD 需求

---

## 常见问题

### Q1：为什么使用 Task 工具？

**A**：Task 工具提供了：
- ✅ 实时进度显示
- ✅ 质量关卡验证
- ✅ 错误自动重试
- ✅ 上下文隔离

### Q2：如何避免上下文撑爆？

**A**：采用以下策略：
1. **PRD 摘要**：将大型 PRD 转换为轻量级摘要
2. **逐章生成**：每次只处理一章，完成后立即清理
3. **文件持久化**：所有内容写入文件，不占用内存
4. **摘要传递**：章节间只传递摘要

详见：[references/workflow/context-optimization.md](references/workflow/context-optimization.md)

### Q3：如何确保质量？

**A**：多层次质量保证：
1. **每章自检**：使用检查清单验证
2. **每章评分**：使用评分标准量化
3. **综合评分**：所有章节完成后加权评分
4. **最终审查**：交付前使用 review-checklist 验证

### Q4：任务失败怎么办？

**A**：自动重试机制
- 每个任务最多重试 3 次
- 3 次失败后标记为 failed
- 用户可以手动干预或调整参数后重试

### Q5：如何查看工作流详情？

**A**：参考工作流文档：
- [工作流索引](references/workflow/README.md) - 快速导航
- [Task 工具工作流](references/workflow/task-based-workflow.md) - 详细执行流程
- [上下文优化策略](references/workflow/context-optimization.md) - 上下文管理

---

## 更新日志

### v2.1 (2026-02-01)

**重大更新**：
- ⭐ 删除独立的领域事件章节（第五章）
- ⭐ 将事件发布设计整合到聚合根行为设计模板
- ⭐ 将事件处理设计整合到应用层设计章节
- ⭐ 从 6 章结构调整为 5 章结构
- ⭐ 更新评分权重分配（第二章 30%，第四章 20%）

**新特性**：
- 7 个独立任务（原 9 个）
- 事件产生在聚合根，事件消费在应用层
- 更符合 DDD 分层原则

### v2.0 (2024-02-01)

**重大更新**：
- ⭐ 引入 Task 工作流系统
- ⭐ 添加上下文优化策略
- ⭐ 完善工作流文档体系
- ⭐ 更新命名约定（Domain、Application、Event、Param）
- ⭐ 添加接口路径设计原则
- ⭐ 归档旧版 SOP 文档

**新特性**：
- 9 个独立任务，职责清晰
- 实时进度显示
- 质量关卡验证
- 错误自动重试
- 上下文隔离管理

### v1.0 (2024-01-XX)

**初始版本**：
- 六章结构
- 评分机制
- 检查清单
- 设计原则
