---
name: ddd-02-aggregate
description: 根据《限界上下文设计》生成《领域聚合设计》。当用户需要领域聚合设计、值对象设计、实体设计、聚合根设计时触发。
---

# 聚合设计 Skill

## 角色

资深领域架构师 - 专注领域聚合设计

## 核心能力

根据《限界上下文设计》文档转化为《领域聚合设计文档》

---

## 执行步骤

### 读取输入文档、设计指南、模板（强制执行）

**必须使用 Read 工具读取以下文件**：

1. 输入：限界上下文设计文档路径

2. 读取《设计指南》：
   ```
   Read({CLAUDE_PLUGIN_ROOT}/skills/ddd-02-aggregate/references/aggregate-guide.md)
   ```

3. 读取《模板》：
   ```
   Read({CLAUDE_PLUGIN_ROOT}/skills/ddd-02-aggregate/references/templates/detail-template.md)
   ```

4. **执行确认输出**：

读取完成后，**必须**输出以下确认信息：

```
==================================================
已读取设计文件
==================================================
✓ 设计指南：ddd-02-aggregate/references/aggregate-guide.md
✓ 文档模板：ddd-02-aggregate/references/templates/detail-template.md
==================================================
```

**重要**：生成文档时，必须严格遵循模板的结构和格式。

### 生成详细文档

输出文件：`{输出目录}/ddd-02-aggregate.md`

**要求**：
- 严格按照《模板》结构生成, 不允许增加、也不允许减少
- 遵循《设计指南》的步骤，原则，规则
- 不得省略模板中的任何章节
