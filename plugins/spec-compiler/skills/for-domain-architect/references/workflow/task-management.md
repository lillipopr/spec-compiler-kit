# Task 管理规范

> **核心理念**：Task-Driven - 每个步骤都是 Task，保证不漏掉

---

## 为什么需要 Task 管理

Task 管理解决步骤遗漏、进度不透明、依赖混乱的问题：每个步骤都是 Task，保证不遗漏；实时显示状态，进度透明；自动管理依赖，精确重试提高效率。

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
  type: "checklist|manual"
  standard: "所有项通过|人工确认"
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

**特点**：基于输入生成内容，经历 Checklists 验证

```yaml
id: "T2"
subject: "第一章 PDCA - Checklists 检测"
description: "基于章节指令生成内容，通过检查清单验证"
activeForm: "正在执行第一章 PDCA"
dependencies: ["T1"]
qualityGate:
  type: "checklist"
  standard: "通过所有检查清单项"
  maxRetries: 3
input:
  prdSummary: "output/prd-summary.md"
  instructionFile: "references/chapter-instructions/chapter-01-bounded-context.md"
  checklistFile: "references/checklists/chapter-01-checklist.md"
output:
  contentFile: "output/chapter-01.md"
  issuesFile: "output/chapter-01-issues-checklists.md"
  summaryFile: "output/chapter-01-summary.md"
```

**执行流程**：
```
1. 准备上下文（PRD 摘要 + 章节指令 + 检查清单）
2. 生成内容
3. 检测问题
4. 修复问题
5. 验证质量关卡
```

### 3. 交互型 Task

**特点**：需要用户确认才能继续

```yaml
id: "T3"
subject: "第一章人工 Review"
description: "等待人类审核确认第一章内容"
activeForm: "正在等待第一章 Review"
dependencies: ["T2"]
qualityGate:
  type: "manual"
  standard: "人工确认"
input:
  chapterFile: "output/chapter-01.md"
  issuesFiles:
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
id: "T12"
subject: "文档组装"
description: "读取所有章节文件，使用模板组装最终文档"
activeForm: "正在组装最终文档"
dependencies: ["T3", "T5", "T7", "T9", "T11"]
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
├─ [T2] 第一章 PDCA（依赖：T1）
├─ [T3] 第一章人工 Review（依赖：T2）
│
├─ [T4] 第二章 PDCA（依赖：T3）
├─ [T5] 第二章人工 Review（依赖：T4）
│
├─ [T6] 第三章 PDCA（依赖：T5）
├─ [T7] 第三章人工 Review（依赖：T6）
│
├─ [T8] 第四章 PDCA（依赖：T7）
├─ [T9] 第四章人工 Review（依赖：T8）
│
├─ [T10] 第五章 PDCA（依赖：T9）
├─ [T11] 第五章人工 Review（依赖：T10）
│
└─ [T12] 文档组装（依赖：T11）
```

### 依赖规则

| 规则 | 说明 | 示例 |
|------|------|------|
| **顺序依赖** | 必须按顺序执行 | T2 依赖 T1 |
| **并行独立** | 无依赖可并行 | （暂无） |
| **聚合依赖** | 依赖多个任务 | T12 依赖所有章节 |
| **交互阻塞** | 交互型任务阻塞后续 | T3 阻塞 T4 |

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
| **checklist** | 检查清单验证 | 所有项通过 |
| **manual** | 人工确认 | 用户确认 |

### 质量关卡执行

```
function checkQualityGate(task, result) {
  const gate = task.qualityGate;

  switch (gate.type) {
    case 'none':
      return { passed: true };

    case 'checklist':
      if (result.allItemsPassed) {
        return { passed: true };
      } else {
        return { passed: false, message: '检查清单未全部通过' };
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
任务进度：3/11 (27%)
==================================================
✅ 已完成: 3
🔄 进行中: 1
⏳ 待执行: 7
==================================================
✅ T1: PRD 分析与摘要
✅ T2-T3: 第一章 - 限界上下文设计 [Review 通过]
🔄 T4: 第二章 PDCA [执行中]
⏳ T5: 第二章 Review
⏳ T6-T7: 第三章
⏳ T8-T9: 第四章
⏳ T10-T11: 第五章
⏳ T12: 文档组装
==================================================
```

### 单个任务详情

```
🔄 T4: 第二章 PDCA - Checklists 检测

描述：基于章节指令生成内容，通过检查清单验证

依赖：
  ✅ T3: 第一章人工 Review

质量关卡：
  类型：checklist
  标准：通过所有检查清单项
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
├─ 🔄 T4: PDCA - Checklists 检测（2 项不通过 → 修复中）
└─ ⏳ T5: 人工 Review
```

---

## 实现细节

**Task 持久化和错误处理的详细实现**请参考：[task-implementation-details.md](task-implementation-details.md)

包含内容：
- tasks.json 和 task-history.json 格式定义
- 错误类型和处理逻辑
- 错误恢复代码示例

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
