# 基于 Task 工具的工作流系统

> **目标**：将庞大的生成过程拆分为多个小任务，使用 Task 工具管理，确保每个任务保质保量完成

---

## 为什么需要 Task 工具

### 问题分析

| 问题 | 说明 | 影响 |
|------|------|------|
| **流程庞大** | 5个章节 + 评估 + 修改 = 8+ 步 | 容易遗漏 |
| **上下文限制** | 单次处理所有内容会撑爆 | 无法完成 |
| **质量难控** | 中间环节无法验证 | 最终质量差 |
| **进度不透明** | 不知道当前进度 | 用户体验差 |

### Task 工具的优势

| 优势 | 说明 | 效果 |
|------|------|------|
| **任务拆分** | 每个章节是一个独立任务 | 清晰可控 |
| **进度跟踪** | 实时显示任务进度 | 透明可见 |
| **质量关卡** | 每个任务完成后检查 | 质量保证 |
| **依赖管理** | 自动处理任务依赖 | 顺序正确 |
| **失败重试** | 失败任务可以重试 | 稳定性高 |

---

## 任务拆分策略

### 整体任务树

```
根任务：生成领域设计文档
│
├─ [T1] PRD 分析与摘要（依赖：无）
│
├─ [T2] 第一章：限界上下文设计（依赖：T1）
│
├─ [T3] 第二章：聚合设计（依赖：T2）
│
├─ [T4] 第三章：领域服务设计（依赖：T3）
│
├─ [T5] 第四章：应用层设计（依赖：T4）
│
├─ [T6] 第五章：入口层设计（依赖：T5）
│
├─ [T7] 综合评分（依赖：T1-T6）
│
└─ [T8] 文档组装（依赖：T7）
```

---

## 任务执行流程

### 执行步骤

```
1. 创建任务列表
   - 创建所有任务
   - 定义任务依赖
   - 设置初始状态（pending）

2. 执行任务循环
   - 找到下一个可执行任务（pending + 无依赖）
   - 标记为 in_progress
   - 执行任务（读取指令、生成内容、写入文件）
   - 质量检查（检查清单 + 评分）
   - 检查结果
     - 评分 ≥60 → completed
     - 评分 <60 → pending（重做）

3. 综合评分
   - 读取所有章节评分
   - 计算综合评分
   - 生成评分报告

4. 文档组装
   - 读取所有章节文件
   - 使用模板组装
   - 生成最终文档
```

---

## 详细任务定义

### 任务 1：PRD 分析与摘要

```yaml
id: "task-1"
subject: "PRD 分析与摘要"
description: "从 PRD 文档中提取关键信息，生成轻量级摘要"
activeForm: "正在分析 PRD 并生成摘要"
dependencies: []
input:
  prdFile: "prd.md"
output:
  summaryFile: "output/prd-summary.md"
qualityGate:
  passScore: null  # 无评分要求
```

### 任务 2：第一章 - 限界上下文设计

```yaml
id: "task-2"
subject: "第一章：限界上下文设计"
description: "生成第一章内容：业务能力分析、限界上下文划分、上下文映射"
activeForm: "正在生成第一章：限界上下文设计"
dependencies: ["task-1"]
input:
  prdSummary: "output/prd-summary.md"
  instructionFile: "chapters/chapter-01-bounded-context.md"
  principleFile: "references/principles/bounded-context.md"
output:
  contentFile: "output/chapter-01.md"
  summaryFile: "output/chapter-01-summary.md"
qualityGate:
  checklistFile: "references/checklists/chapter-01-checklist.md"
  scoringFile: "references/scoring/chapter-01-scoring.md"
  passScore: 60
```

### 任务 3-6：第二-五章

格式与任务 2 类似，只需修改：
- `id`：递增（task-3 到 task-6）
- `subject`：对应章节名称
- `dependencies`：依赖前序任务
- `input`：对应的指令和原则文件
- `output`：对应的输出文件

### 任务 7：综合评分

```yaml
id: "task-7"
subject: "综合评分"
description: "基于所有章节的评分，计算综合评分，生成评分报告"
activeForm: "正在计算综合评分"
dependencies: ["task-2", "task-3", "task-4", "task-5", "task-6"]
input:
  chapterScores: ["output/chapter-01-score.md", ...]
output:
  reportFile: "output/score-report.md"
qualityGate:
  passScore: 90
```

**评分公式**：
```
总分 = 第一章×15% + 第二章×30% + 第三章×15% +
       第四章×20% + 第五章×20%
```

### 任务 8：文档组装

```yaml
id: "task-8"
subject: "文档组装"
description: "读取所有章节文件，使用模板组装最终文档"
activeForm: "正在组装最终文档"
dependencies: ["task-7"]
input:
  templateFile: "assets/templates/domain-design-template.md"
  chapters: ["output/chapter-01.md", ...]
output:
  finalFile: "output/{功能名称}-领域设计文档.md"
qualityGate:
  checklistFile: "references/checklists/final-review-checklist.md"
  passScore: null
```

---

## 质量检查机制

### 检查清单验证

每个任务完成后：
1. 读取对应的检查清单文件
2. 逐项检查内容
3. 生成检查报告
4. 验证所有项目通过

### 评分验证

每个章节任务完成后：
1. 读取对应的评分标准文件
2. 逐项评分
3. 计算总分
4. 验证 ≥60 分
5. 不通过则重做

---

## 进度显示

### 实时进度条

```
==================================================
任务进度：3/8 (38%)
==================================================
✅ 已完成: 3
🔄 进行中: 1
⏳ 待执行: 4
==================================================
✅ PRD 分析与摘要
✅ 第一章：限界上下文设计
✅ 第二章：聚合设计
🔄 第三章：领域服务设计
⏳ 第四章：应用层设计
⏳ 第五章：入口层设计
⏳ 综合评分
⏳ 文档组装
```

---

## 错误处理与重试

### 任务失败处理

每个任务最多重试 3 次：

1. 标记为 in_progress
2. 执行任务
3. 质量检查
4. 通过 → 标记为 completed
5. 不通过 → 重试
6. 达到最大重试次数 → 标记为 failed

---

## 核心要点

### 优势对比

| 维度 | 不使用 Task 工具 | 使用 Task 工具 |
|------|-----------------|--------------|
| **进度可见性** | ❌ 黑盒 | ✅ 实时可见 |
| **质量可控性** | ❌ 最后才发现问题 | ✅ 每步验证 |
| **错误处理** | ❌ 全盘重来 | ✅ 单点重试 |
| **上下文管理** | ❌ 容易撑爆 | ✅ 隔离管理 |

### 最佳实践

**DO ✅**：
- ✅ 将大任务拆分为多个小任务
- ✅ 明确定义任务依赖关系
- ✅ 每个任务完成后进行质量检查
- ✅ 实时显示任务进度
- ✅ 失败任务自动重试

**DON'T ❌**：
- ❌ 单个任务包含多个章节
- ❌ 任务依赖关系不明确
- ❌ 任务完成后不进行质量检查
- ❌ 不显示任务进度
- ❌ 任务失败后不处理

---

## 总结

通过 Task 工具，可以将庞大的生成过程拆分为 8 个独立任务：
1. **任务拆分**：每个任务职责单一
2. **依赖管理**：通过 `addBlockedBy` 定义任务依赖
3. **质量关卡**：每个任务完成后进行自检和评分
4. **进度跟踪**：实时显示任务进度
5. **错误处理**：失败任务自动重试，最多3次
6. **上下文隔离**：每个任务独立上下文，避免累积

这样可以确保每个任务保质保量完成，同时保持进度透明和质量可控。
