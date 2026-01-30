# Phase Review Check

## 元数据

- **类型**: PreToolUse
- **优先级**: critical
- **启用状态**: true
- **版本**: 1.0.0

## 触发条件

当用户尝试编辑规格文档（`*.spec.md` 或 `PRD.md`）的下一 Phase 内容时，且当前 Phase 尚未标记为 "APPROVED"。

## 检测逻辑

1. 检查文件名是否匹配 `*.spec.md` 或 `PRD.md`
2. 解析文档中的 Phase 标记：`<!-- REVIEW STATUS: xxx -->`
3. 确定当前正在编辑的 Phase
4. 检查前一 Phase 的审查状态

## 阻止条件

如果以下条件满足，阻止编辑操作：
- 当前正在编辑 Phase N+1
- Phase N 的审查状态不是 "APPROVED"

## 阻止消息

```
⚠️ Phase 审查闸口：请先完成 Phase N 的人工审查

当前 Phase N 状态：{actual_status}
要求状态：APPROVED

请在文档中添加审查通过标记：
<!-- REVIEW STATUS: APPROVED - {timestamp} - {reviewer} -->
审查意见：{review_comments}
```

## 放行条件

以下情况允许编辑：
- 文档不是规格文档
- 正在编辑当前已审查通过的 Phase
- 所有前置 Phase 都已审查通过

## 实现示例

```python
def check_phase_review(document_path, edit_phase):
    # 1. 读取文档
    content = read_file(document_path)

    # 2. 解析 Phase 状态
    phase_statuses = parse_review_statuses(content)

    # 3. 检查前置 Phase
    for phase_num in range(1, edit_phase):
        status = phase_statuses.get(f"Phase_{phase_num}")
        if status != "APPROVED":
            return Block(
                reason=f"Phase {phase_num} 未审查通过",
                current_status=status,
                required_status="APPROVED"
            )

    # 4. 允许编辑
    return Allow()
```

## 配置选项

在 `plugin.json` 中配置：

```json
{
  "config": {
    "phaseReviewRequired": true,
    "phaseDocumentPatterns": ["**/*.spec.md", "**/PRD.md"]
  }
}
```

## 相关文档

- [规格编译器 Phase 规范](../../skills/for-spec-compiler-v4/references/sop/phase-workflow.md)
- [审查检查清单](../../skills/for-spec-compiler-v4/references/checklists/review-checklist.md)
