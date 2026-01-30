# 新功能开发 SOP

## 概述

完整的新功能开发流程，从需求到代码实现。

## Step 1（人）：问题建模

- 定义状态空间
- 定义不变量
- 产出：《问题建模文档》
- **闸口**：没有状态图和不变量，不进入下一步

详见 [02-compilation-phases/phase-1-modeling.md](../02-compilation-phases/phase-1-modeling.md)

## Step 2（人）：可执行约束

- 不变量写成断言
- 状态转移写成表
- 产出：《约束定义文档》

详见 [02-compilation-phases/phase-2-constraints.md](../02-compilation-phases/phase-2-constraints.md)

## Step 3（人+AI）：用例设计

- AI 补充边界用例（不修改原用例）
- 人审核用例完整性
- 产出：《用例文档》
- **闸口**：没有 badcase，不进入 AI 实现

详见 [02-compilation-phases/phase-3-use-cases.md](../02-compilation-phases/phase-3-use-cases.md)

## Step 4（AI）：工件生成

- 生成接口定义
- 生成实现代码
- 生成测试代码
- 产出：代码 + 测试

详见 [02-compilation-phases/phase-4-artifacts.md](../02-compilation-phases/phase-4-artifacts.md)

## Step 5（人）：验收

- 检查所有用例是否通过
- 检查是否引入未定义状态
- 产出：《验收报告》

## Step 6（人）：固化归档

- 更新文档
- 归档到知识库

---

## 参考模板

- 问题建模模板：[07-templates/problem-modeling.md](../07-templates/problem-modeling.md)
- 约束定义模板：[07-templates/constraint-templates.md](../07-templates/constraint-templates.md)
- 用例设计模板：[07-templates/use-case-templates.md](../07-templates/use-case-templates.md)
- 工件设计模板：[07-templates/artifact-templates.md](../07-templates/artifact-templates.md)
