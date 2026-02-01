# Task 管理规范

> **核心理念**：Task-Driven - 每个步骤都是 Task，保证不漏掉

---

## 为什么需要 Task 管理

### 问题分析

| 问题 | 说明 | 影响 |
|------|------|------|
| **步骤遗漏** | 手动执行容易漏步骤 | 质量问题 |
| **进度不透明** | 不知道执行到哪 | 焦虑 |
| **依赖混乱** | 任务顺序错误 | 报错 |
| **重试困难** | 失败后不知道从哪开始 | 效率低 |

### Task 管理的优势

| 优势 | 说明 | 效果 |
|------|------|------|
| **不遗漏** | 每个步骤都是 Task | 保证完整 |
| **进度可见** | 实时显示任务状态 | 透明 |
| **依赖管理** | 自动处理依赖顺序 | 正确 |
| **失败重试** | 精确重试单个任务 | 高效 |

---

## Task 定义

### Task 结构

```yaml
id: "T{序号}"
subject: "任务标题"
description: "详细描述"
activeForm: "正在执行任务"
dependencies: ["T1", "T2"]
qualityGate:
  type: "score|checklist|manual"
  standard: "≥60 分|所有项通过|人工确认"
  maxRetries: 3
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识，格式 T{序号} |
| `subject` | string | ✅ | 任务标题 |
| `description` | string | ✅ | 详细描述 |
| `activeForm` | string | ✅ | 执行中显示的文本 |
| `dependencies` | string[] | ❌ | 依赖的任务 ID 列表 |
| `qualityGate` | object | ❌ | 质量关卡定义 |
| `qualityGate.type` | string | ❌ | 质量关卡类型 |
| `qualityGate.standard` | string | ❌ | 质量标准 |
| `qualityGate.maxRetries` | number | ❌ | 最大重试次数 |

---

## Task 类型

### 1. 分析型 Task

**特点**：输入数据，输出分析结果

```yaml
id: "T1"
subject: "PRD 分析与摘要"
description: "从 PRD 文档中提取关键信息，生成轻量级摘要"
activeForm: "正在分析 PRD 并生成摘要"
dependencies: []
qualityGate:
  type: "none"
input:
  prdFile: "prd.md"
output:
  summaryFile: "output/prd-summary.md"
```

**执行流程**：
```
1. 读取 PRD 文件
2. 分析功能概述
3. 分析核心实体
4. 分析业务流程
5. 分析外部接口
6. 生成摘要文件
```

### 2. 生成型 Task

**特点**：基于输入生成内容，经历 3×PDCA 循环

```yaml
id: "T2"
subject: "第一章 PDCA #1 - Principles 检测"
description: "基于 principles 生成并检测问题"
activeForm: "正在执行第一章 PDCA #1"
dependencies: ["T1"]
qualityGate:
  type: "principles"
  standard: "修复所有 principles 问题"
  maxRetries: 3
input:
  prdSummary: "output/prd-summary.md"
  instructionFile: "chapters/chapter-01-bounded-context.md"
  principleFile: "principles/bounded-context.md"
output:
  contentFile: "output/chapter-01-v1.md"
  issuesFile: "output/chapter-01-issues-principles.md"
```

**执行流程**：
```
1. 准备上下文
2. 生成内容
3. 检测问题
4. 修复问题
5. 验证质量关卡
```

### 3. 交互型 Task

**特点**：需要用户确认才能继续

```yaml
id: "T5"
subject: "第一章人工 Review"
description: "等待人类审核确认第一章内容"
activeForm: "正在等待第一章 Review"
dependencies: ["T4"]
qualityGate:
  type: "manual"
  standard: "人工确认"
input:
  chapterFile: "output/chapter-01.md"
  scoreFile: "output/chapter-01-score.md"
  issuesFiles:
    - "output/chapter-01-issues-principles.md"
    - "output/chapter-01-issues-checklists.md"
output: {}
action:
  type: "prompt"
  message: "请审核第一章内容，输入 '继续' 或提出修改意见"
```

**执行流程**：
```
1. 显示 Review 提示
2. 等待用户输入
3. 处理用户反馈
4. 根据反馈决定下一步
```

### 4. 组装型 Task

**特点**：读取多个文件，组装最终输出

```yaml
id: "T-final"
subject: "文档组装"
description: "读取所有章节文件，使用模板组装最终文档"
activeForm: "正在组装最终文档"
dependencies: ["T5", "T9", "T13", "T17", "T21"]
qualityGate:
  type: "checklist"
  standard: "所有章节已填充"
input:
  templateFile: "assets/templates/domain-design-template.md"
  chapters:
    - "output/chapter-01.md"
    - "output/chapter-02.md"
    - "output/chapter-03.md"
    - "output/chapter-04.md"
    - "output/chapter-05.md"
output:
  finalFile: "output/{功能名称}-领域设计文档.md"
```

**执行流程**：
```
1. 读取模板文件
2. 读取所有章节文件
3. 填充模板内容
4. 生成目录
5. 验证完整性
6. 保存最终文件
```

---

## Task 依赖管理

### 依赖树

```
根任务：生成领域设计文档
│
├─ [T1] PRD 分析与摘要（依赖：无）
│
├─ [T2] 第一章 PDCA #1（依赖：T1）
├─ [T3] 第一章 PDCA #2（依赖：T2）
├─ [T4] 第一章 PDCA #3（依赖：T3）
├─ [T5] 第一章人工 Review（依赖：T4）
│
├─ [T6] 第二章 PDCA #1（依赖：T5）
├─ [T7] 第二章 PDCA #2（依赖：T6）
├─ [T8] 第二章 PDCA #3（依赖：T7）
├─ [T9] 第二章人工 Review（依赖：T8）
│
├─ [T10-T13] 第三章（依赖：T9）
├─ [T14-T17] 第四章（依赖：T13）
├─ [T18-T21] 第五章（依赖：T17）
│
└─ [T-final] 文档组装（依赖：T21）
```

### 依赖规则

| 规则 | 说明 | 示例 |
|------|------|------|
| **顺序依赖** | 必须按顺序执行 | T2 依赖 T1 |
| **并行独立** | 无依赖可并行 | （暂无） |
| **聚合依赖** | 依赖多个任务 | T-final 依赖所有章节 |
| **交互阻塞** | 交互型任务阻塞后续 | T5 阻塞 T6 |

### 依赖验证

```
function canExecute(task, completedTasks) {
  // 检查所有依赖是否完成
  for (const dep of task.dependencies) {
    if (!completedTasks.includes(dep)) {
      return false;
    }
  }
  return true;
}
```

---

## Task 执行流程

### 完整流程

```
1. 初始化任务列表
   - 创建所有任务
   - 定义任务依赖
   - 设置初始状态（pending）

2. 执行任务循环
   while (存在待执行任务) {
     a. 找到下一个可执行任务（pending + 无依赖）
     b. 标记为 in_progress
     c. 执行任务
     d. 质量检查
     e. 根据结果更新状态
        - 通过 → completed
        - 不通过 → pending（重试） 或 failed
     f. 更新进度显示
   }

3. 处理失败任务
   - 记录失败信息
   - 提示用户处理
```

### 任务状态

| 状态 | 图标 | 说明 | 可转换到 |
|------|------|------|----------|
| **pending** | ⏳ | 待执行 | in_progress |
| **in_progress** | 🔄 | 执行中 | completed, pending, failed |
| **completed** | ✅ | 已完成 | - |
| **failed** | ❌ | 失败 | pending（人工干预后） |

### 状态转换图

```
pending → in_progress → completed
   ↑              ↓
   └────────────── failed (可重试)
```

---

## 质量关卡处理

### 质量关卡类型

| 类型 | 验证方式 | 标准 |
|------|---------|------|
| **none** | 无验证 | - |
| **principles** | 检测原则问题 | 修复所有问题 |
| **checklist** | 检查清单验证 | 所有项通过 |
| **score** | 评分验证 | ≥60 分 |
| **manual** | 人工确认 | 用户确认 |

### 质量关卡执行

```
function checkQualityGate(task, result) {
  const gate = task.qualityGate;

  switch (gate.type) {
    case 'none':
      return { passed: true };

    case 'score':
      if (result.score >= 60) {
        return { passed: true };
      } else {
        return { passed: false, message: `评分 ${result.score} < 60` };
      }

    case 'checklist':
      if (result.allItemsPassed) {
        return { passed: true };
      } else {
        return { passed: false, message: '检查清单未全部通过' };
      }

    case 'principles':
      if (result.noIssues) {
        return { passed: true };
      } else {
        return { passed: false, message: '存在原则问题' };
      }

    case 'manual':
      // 交互型任务，等待用户确认
      return { passed: 'waiting_for_user' };
  }
}
```

### 重试机制

```
function executeTask(task) {
  let attempt = 0;

  while (attempt < task.qualityGate.maxRetries) {
    attempt++;

    // 标记为 in_progress
    updateTaskStatus(task.id, 'in_progress');

    // 执行任务
    const result = doExecute(task);

    // 质量检查
    const qualityResult = checkQualityGate(task, result);

    if (qualityResult.passed === true) {
      // 通过
      updateTaskStatus(task.id, 'completed');
      return { status: 'completed', result };
    } else if (qualityResult.passed === 'waiting_for_user') {
      // 等待用户
      return { status: 'waiting', result };
    } else {
      // 不通过，重试
      if (attempt < task.qualityGate.maxRetries) {
        updateTaskStatus(task.id, 'pending');
        continue;
      } else {
        // 达到最大重试次数
        updateTaskStatus(task.id, 'failed');
        return { status: 'failed', message: qualityResult.message };
      }
    }
  }
}
```

---

## 进度显示

### 任务列表

```
==================================================
任务进度：5/21 (24%)
==================================================
✅ 已完成: 5
🔄 进行中: 1
⏳ 待执行: 15
==================================================
✅ T1: PRD 分析与摘要
✅ T2-T5: 第一章 - 限界上下文设计 [Review 通过]
🔄 T6: 第二章 PDCA #1 [执行中]
⏳ T7-T9: 第二章 PDCA #2-3 + Review
⏳ T10-T13: 第三章
⏳ T14-T17: 第四章
⏳ T18-T21: 第五章
⏳ T-final: 文档组装
==================================================
```

### 单个任务详情

```
🔄 T6: 第二章 PDCA #1 - Principles 检测

描述：基于 principles 生成并检测问题

依赖：
  ✅ T5: 第一章人工 Review

质量关卡：
  类型：principles
  标准：修复所有 principles 问题
  当前：第 1 次尝试

进度：
  ✅ 准备上下文
  ✅ 生成内容
  🔄 检测问题
  ⏳ 修复问题
  ⏳ 验证质量
```

### 章节级别进度

```
第二章：聚合设计
├─ ✅ T6: PDCA #1 - Principles 检测（3 问题 → 已修复）
├─ ✅ T7: PDCA #2 - Checklists 检测（2 项不通过 → 已修复）
├─ 🔄 T8: PDCA #3 - Scoring 检测（评分中...）
└─ ⏳ T9: 人工 Review
```

---

## Task 持久化

### 文件结构

```
output/
├── tasks.json              # 任务列表和状态
├── task-history.json       # 任务执行历史
├── task-errors.json        # 错误记录
```

### tasks.json 格式

```json
{
  "tasks": [
    {
      "id": "T1",
      "subject": "PRD 分析与摘要",
      "status": "completed",
      "startTime": "2024-02-01T10:00:00Z",
      "endTime": "2024-02-01T10:05:00Z",
      "retryCount": 0
    }
  ],
  "currentTaskId": "T6",
  "progress": {
    "completed": 5,
    "inProgress": 1,
    "pending": 15
  }
}
```

### task-history.json 格式

```json
{
  "history": [
    {
      "taskId": "T2",
      "attempt": 1,
      "startTime": "2024-02-01T10:06:00Z",
      "endTime": "2024-02-01T10:10:00Z",
      "result": "completed",
      "outputFiles": [
        "output/chapter-01-v1.md",
        "output/chapter-01-issues-principles.md"
      ]
    }
  ]
}
```

---

## 错误处理

### 错误类型

| 错误类型 | 说明 | 处理方式 |
|---------|------|----------|
| **文件不存在** | 输入文件缺失 | 中止任务，提示用户 |
| **解析错误** | 文件格式错误 | 中止任务，记录错误 |
| **质量不达标** | 未通过质量关卡 | 重试（最多 3 次） |
| **用户取消** | 用户主动取消 | 标记为 cancelled |

### 错误恢复

```
function handleError(task, error) {
  // 记录错误
  logError(task.id, error);

  // 根据错误类型处理
  switch (error.type) {
    case 'FILE_NOT_FOUND':
      // 文件缺失，提示用户
      return { action: 'abort', message: `文件 ${error.file} 不存在` };

    case 'PARSE_ERROR':
      // 解析错误，提示用户
      return { action: 'abort', message: `文件 ${error.file} 格式错误` };

    case 'QUALITY_GATE_FAILED':
      // 质量不达标，重试
      if (task.retryCount < task.qualityGate.maxRetries) {
        return { action: 'retry', message: '重试中...' };
      } else {
        return { action: 'fail', message: '达到最大重试次数' };
      }

    case 'USER_CANCELLED':
      // 用户取消
      return { action: 'cancel', message: '用户取消' };
  }
}
```

---

## 最佳实践

### DO ✅

- ✅ 每个步骤都定义为一个 Task
- ✅ 明确定义任务依赖关系
- ✅ 设置合理的质量关卡
- ✅ 实时更新任务状态
- ✅ 持久化任务状态

### DON'T ❌

- ❌ 将多个步骤合并为一个 Task
- ❌ 不定义依赖关系
- ❌ 不设置质量关卡
- ❌ 不更新任务状态
- ❌ 不持久化任务状态

---

## 总结

通过 Task 管理：

1. **不遗漏**：每个步骤都是 Task，保证完整
2. **进度可见**：实时显示任务状态和进度
3. **依赖正确**：自动处理任务依赖
4. **质量可控**：每个任务都有质量关卡
5. **失败重试**：精确重试单个任务，提高效率

Task 管理是整个工作流系统的基础，确保每个步骤都保质保量完成。
