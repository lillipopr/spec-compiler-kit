---
description: 调用资深产品经理，处理 PRD 的创建/修改/Review。分析需求可行性、编写完整 PRD、验证需求清晰度。
---

# /prd - 产品经理命令

此命令调用 **product-manager** Agent，处理产品需求文档（PRD）的全生命周期。

## 此命令的作用

1. **创建 PRD** - 从模糊需求到结构化 PRD 文档
2. **修改 PRD** - 分析变更影响范围，更新文档
3. **Review PRD** - 检查完整性、清晰度、可测试性

## 何时使用

使用 `/prd` 时：
- 有新功能需求，需要编写 PRD
- 需要修改现有 PRD
- 需要审查 PRD 质量
- 需求描述模糊，需要结构化整理

## 工作流程

执行命令后，会提示选择场景：

### 1. 创建 PRD

**输入**：功能描述、用户故事、业务背景

**执行流程**：
1. 调用 `product-manager` Agent
2. 分析需求可行性
3. 编写完整的 PRD 文档
4. 包含：功能描述、用户故事、验收标准、业务规则

**产出**：《产品需求文档.md》

### 2. 修改 PRD

**输入**：现有 PRD 文档、变更说明

**执行流程**：
1. 调用 `product-manager` Agent
2. 分析变更影响范围
3. 更新 PRD 文档
4. 标记变更版本

**产出**：更新后的 PRD 文档

### 3. Review PRD

**输入**：待审查的 PRD 文档

**执行流程**：
1. 调用 `product-manager` Agent
2. 检查 PRD 完整性
3. 验证需求清晰度
4. 确认验收标准可测试
5. 输出审查报告

**产出**：PRD 审查报告

## 质量闸口

| 检查项 | 标准 |
|--------|------|
| 需求清晰 | 功能描述明确，无歧义 |
| 边界明确 | 明确做什么和不做什么 |
| 验收标准 | 每个需求都有可测试的验收标准 |
| 用户价值 | 清晰描述用户价值 |
| 业务规则 | 明确业务规则和约束 |

## 与其他命令的集成

**后续命令：**
- `/ddd` - 创建 DDD 设计文档（基于 PRD）
- `/spec` - 创建规格文档（基于 PRD 和 DDD 设计）

## 相关 Agent

此命令调用位于以下位置的 `product-manager` Agent：
`./agents/product-manager.md`

并可引用位于以下位置的 `for-product-manager` Skill：
`./skills/for-product-manager/SKILL.md`

## 示例

```
用户: /prd

Claude: 请选择场景：
1. 创建 PRD
2. 修改 PRD
3. Review PRD

用户: 1

Claude: 请描述要创建的功能需求...

[调用 product-manager Agent，创建 PRD]
```
