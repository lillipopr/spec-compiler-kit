---
name: for-domain-architect
description: 资深领域架构师，将 PRD 转化为领域设计文档。支持 5 章结构生成、Checklists 驱动的 PDCA 循环、人工 Review、12 任务工作流。当用户需要进行领域建模、DDD 设计、聚合设计、限界上下文划分时触发。
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

**检查清单驱动**：每章通过检查清单验证，确保内容完整且符合要求。

---

## 工作流概览

### 核心理念
| 优势 | 说明 |
|------|------|
| ✅ 进度可见 | 实时显示任务进度，不再黑盒 |
| ✅ 质量可控 | 每步验证质量，问题早发现 |
| ✅ 错误隔离 | 失败任务不影响其他，单点重试 |
| ✅ 上下文隔离 | 每个任务独立上下文，避免 token 撑爆 |

### 执行流程
```
PRD 文档 → Roadmap 生成 → PRD 摘要 → 逐章生成（5 章 × Checklists）
→ 文档组装
```

### 任务结构（12 个任务）
- **T1**: PRD 分析与摘要
- **T2-T3**: 第一章 - 限界上下文设计（2 个任务：PDCA + Review）
- **T4-T5**: 第二章 - 聚合设计（2 个任务：PDCA + Review）
- **T6-T7**: 第三章 - 领域服务设计（2 个任务：PDCA + Review）
- **T8-T9**: 第四章 - 应用层设计（2 个任务：PDCA + Review）
- **T10-T11**: 第五章 - 入口层设计（2 个任务：PDCA + Review）
- **T12**: 文档组装

每章经历 **1 个 PDCA 循环**：
- **PDCA**: Checklists 检测（基于检查清单检测并修复问题）

每章完成后需要 **人工 Review** 确认。

---

## 执行指引（必读）

### 第一步：执行前准备

**必须先读取以下工作流文档**（按顺序）：

1. 📖 [工作流索引](references/workflow/README.md) - 快速导航和常见问题
2. 📖 [Roadmap 工作流](references/workflow/roadmap-workflow.md) - Roadmap 生成和进度展示
3. 📖 [PDCA 章节生成](references/workflow/pdca-chapter-generation.md) - Checklists 驱动的 PDCA 循环
4. 📖 [Task 管理规范](references/workflow/task-management.md) - Task 定义和执行规范

### 第二步：生成 Roadmap

在执行任务前，先生成完整的 Roadmap 并展示给用户确认：

```
# 领域设计文档生成 Roadmap

## 概览
- **目标**：从 PRD 生成领域设计文档
- **预计步骤**：12 个任务
- **质量关卡**：每章通过检查清单

## 执行计划
（详见 roadmap-workflow.md 中的模板）
```

### 第三步：创建任务（TaskCreate）

创建 **12 个任务**，任务依赖关系：

```
T1: PRD 分析与摘要（无依赖）
  ↓
T2-T3: 第一章（T2 依赖 T1）
  ↓
T4-T5: 第二章（依赖 T3）
  ↓
T6-T7: 第三章（依赖 T5）
  ↓
T8-T9: 第四章（依赖 T7）
  ↓
T10-T11: 第五章（依赖 T9）
  ↓
T12: 文档组装（依赖 T11）
```

### 第四步：执行任务循环

使用 TaskList 找到下一个可执行任务，执行流程：

1. **标记为 in_progress**（TaskUpdate）
2. **执行任务**（根据任务类型执行）
3. **质量检查**（根据质量关卡类型）
4. **更新状态**（completed / pending / failed）
5. **显示进度**

### 第五步：处理人工 Review

当遇到人工 Review 任务时：
1. 显示当前章节的完成情况
2. 等待用户确认
3. 根据用户反馈决定下一步

### 第六步：文档组装

1. 使用模板组装最终文档
2. 输出文档路径

---

## 参考资料

### 工作流文档（必读）

| 文件 | 说明 | 优先级 |
|------|------|--------|
| [references/workflow/README.md](references/workflow/README.md) | **工作流索引**：快速导航和常见问题 | ⭐⭐⭐ |
| [references/workflow/context-optimization.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/workflow/context-optimization.md) | **上下文优化**：避免上下文撑爆 | ⭐⭐⭐ |
| [references/workflow/roadmap-workflow.md](references/workflow/roadmap-workflow.md) | **Roadmap 工作流**：Roadmap 生成和进度展示 | ⭐⭐⭐ |
| [references/workflow/pdca-chapter-generation.md](references/workflow/pdca-chapter-generation.md) | **PDCA 章节生成**：Checklists 驱动的 PDCA 循环 | ⭐⭐⭐ |
| [references/workflow/task-management.md](references/workflow/task-management.md) | **Task 管理规范**：Task 定义和执行规范 | ⭐⭐⭐ |

### 设计原则（按章节分类）

| 章节 | 原则文件 | 说明 |
|------|---------|------|
| 第一章 | [references/principles/bounded-context.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/principles/bounded-context.md) | 限界上下文相关原则 |
| 第二章 | [references/principles/aggregate.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/principles/aggregate.md) | 聚合相关原则（包含事件发布） |
| 第三章 | [references/principles/domain-service.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/principles/domain-service.md) | 领域服务相关原则 |
| 第四章 | [references/principles/application.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/principles/application.md) | 应用层相关原则（包含事件处理） |
| 第五章 | [references/principles/starter.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/principles/starter.md) | 入口层（Starter 层）相关原则 |

### 检查清单（每章完成后自检）

| 文件 | 对应章节 |
|------|----------|
| [references/checklists/chapter-01-checklist.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/checklists/chapter-01-checklist.md) | 第一章 |
| [references/checklists/chapter-02-checklist.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/checklists/chapter-02-checklist.md) | 第二章 |
| [references/checklists/chapter-03-checklist.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/checklists/chapter-03-checklist.md) | 第三章 |
| [references/checklists/chapter-04-checklist.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/checklists/chapter-04-checklist.md) | 第四章 |
| [references/checklists/chapter-05-checklist.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/checklists/chapter-05-checklist.md) | 第五章 |
| [references/checklists/final-review-checklist.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/checklists/final-review-checklist.md) | 最终审查 |

### 输出模板

| 文件 | 说明 |
|------|------|
| [assets/templates/domain-design-template.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/assets/templates/domain-design-template.md) | **领域设计文档模板**（最终产出） |

---

## 使用场景

### 场景 1：创建新的领域设计文档

**输入**：PRD 文档路径
**输出**：`{功能名称}-领域设计文档.md`

**流程**：
1. 创建 12 个任务（TaskCreate）
2. 执行任务循环（实时显示进度）
3. 每章完成后 Checklists 验证
4. 每章完成后人工 Review
5. 组装最终文档

### 场景 2：Review 设计质量

**输入**：现有设计文档
**输出**：评分报告 + 改进建议

**流程**：
1. 使用对应的检查清单自检
2. 生成检查报告
3. 输出改进建议

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

详见：[references/workflow/context-optimization.md](../../../../claude-plugins-olzx/plugins/spec-compiler/skills/for-domain-architect/references/workflow/context-optimization.md)

### Q3：如何确保质量？

**A**：多层次质量保证：
1. **每章自检**：使用检查清单验证
2. **人工 Review**：每章完成后等待用户确认
3. **最终审查**：交付前使用 review-checklist 验证

### Q4：任务失败怎么办？

**A**：自动重试机制
- 每个任务最多重试 3 次
- 3 次失败后标记为 failed
- 用户可以手动干预或调整参数后重试

### Q5：如何查看工作流详情？

**A**：📖 [工作流完整文档](references/workflow/README.md)

包含：
- Roadmap 生成流程
- Checklists 驱动的 PDCA 章节生成详解
- Task 管理规范
- 人工 Review 流程
- 上下文优化策略
