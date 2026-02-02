---
description: 调用领域服务设计Skill，根据《聚合设计》文档生成《领域服务设计》文档。
calls-skill: spec-compiler:ddd-03-domain-service
---

# /ddd-03-domain-service - 领域服务设计命令

此命令调用 **ddd-03-domain-service** Skill，从《聚合设计》文档生成《领域服务设计》文档。

## 使用场景

- 已有《聚合设计》文档，需要生成《领域服务设计》
- 需要识别领域服务（跨聚合用例、计算服务、集成服务）
- 需要设计服务接口和用例
- 需要设计领域事件处理逻辑

## 技术说明

**Command 类型**：直接调用 Skill（非 Agent）

**Skill 路径**：`{CLAUDE_PLUGIN_ROOT}/skills/ddd-03-domain-service/SKILL.md`

**优势**：
- 更轻量：无需启动独立 Agent 进程
- 更快速：直接在当前会话中执行
- 更可控：Skill 包含完整流程指引，便于调试和优化
