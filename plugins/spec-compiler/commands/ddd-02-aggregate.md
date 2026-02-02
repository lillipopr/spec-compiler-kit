---
description: 调用聚合设计Skill，根据限界上下文设计文档生成聚合设计文档。支持两阶段工作流：先生成大纲版讨论优化，定稿后生成详细版。
calls-skill: spec-compiler:ddd-02-aggregate-skill
---

# /ddd-02-aggregate - 聚合设计命令

此命令调用 **ddd-02-aggregate-skill** Skill，从限界上下文设计文档生成聚合设计文档。

## 使用场景

- 已有限界上下文设计文档，需要生成聚合设计
- 需要识别聚合根、实体、值对象
- 需要设计聚合边界和引用关系
- 需要划分领域服务

## 技术说明

**Command 类型**：直接调用 Skill（非 Agent）

**Skill 路径**：`{CLAUDE_PLUGIN_ROOT}/skills/ddd-02-aggregate/SKILL.md`

**优势**：
- 更轻量：无需启动独立 Agent 进程
- 更快速：直接在当前会话中执行
- 更可控：Skill 包含完整流程指引，便于调试和优化
