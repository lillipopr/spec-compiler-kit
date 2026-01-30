# Hooks 可执行化实现

本目录包含 spec-compiler-kit 插件的可执行 Hook 脚本。

## 文件结构

```
.claude-plugin/
├── hooks/
│   └── hooks.json                    # Hook 配置文件
└── scripts/
    └── hooks/
        ├── phase-review-check.js     # Phase 审查闸口脚本
        ├── architecture-check.js     # 架构分层检查脚本
        └── README.md                 # 本文件
```

## Hook 列表

### 1. Phase Review Check（Phase 审查闸口）

**文件**: `phase-review-check.js`

**触发条件**: 编辑 `*.spec.md` 或 `PRD.md` 文件

**优先级**: Critical（阻止操作）

**功能**:
- 检查用户是否跳过了 Phase 审查
- 确保 Phase N+1 编辑前，Phase N 已审查通过
- 阻止编辑未通过前置审查的 Phase

**审查状态标记格式**:
```markdown
<!-- REVIEW STATUS: APPROVED - 2025-01-31T10:00:00.000Z - zxq -->
审查意见：实体定义完整，状态转移清晰。
```

**状态值**:
- `APPROVED` - 审查通过
- `DRAFT` - 草稿状态
- `REVIEWING` - 审查中
- `REJECTED` - 审查未通过

---

### 2. Architecture Check（架构分层检查）

**文件**: `architecture-check.js`

**触发条件**: 编辑 `*.java`, `*.swift`, `*.vue`, `*.ts`, `*.tsx` 文件

**优先级**: High（警告不阻止）

**功能**:
- 检查代码是否违反分层架构规范
- 输出违规依赖警告

**支持的语言和架构**:

| 语言 | 架构类型 | 依赖规则 |
|------|----------|----------|
| Java | DDD 分层 | Controller → Application → Domain ← Gateway, Mapper |
| Swift | MVVM 分层 | View → ViewModel → Service → Gateway → Network |
| Vue | 前端分层 | View → Composable → Service → API → Request |
| TypeScript | 通用分层 | Controller → Service → Repository → Model |

---

## 配置

在 `plugin.json` 中配置：

```json
{
  "config": {
    "phaseReviewRequired": true,
    "architectureCheckStrict": false
  }
}
```

---

## 验证测试

### 测试 Phase 审查闸口

```bash
# 创建测试规格文档（Phase 1 未审查）
cat > test.spec.md << 'EOF'
# Phase 1: 问题建模
<!-- REVIEW STATUS: DRAFT -->

## 实体定义
...

# Phase 2: 约束定义
...
EOF

# 尝试编辑 Phase 2 内容
# 预期：Hook 阻止编辑，显示错误消息
```

### 测试架构分层检查

```bash
# 创建违规的 Java Controller（直接 import Mapper）
cat > UserController.java << 'EOF'
package com.example.controller;
import com.example.mapper.UserMapper;  // 违规！
...
EOF

# 预期：Hook 输出警告，不阻止编辑
```

---

## 调试

如果 Hook 未触发，请检查：

1. **环境变量**: 确保 `CLAUDE_PLUGIN_ROOT` 正确设置
2. **Node.js 版本**: 需要 Node.js 14+
3. **文件权限**: 确保脚本有可执行权限（`chmod +x`）
4. **配置路径**: `hooks.json` 必须在 `.claude-plugin/hooks/` 目录下

---

## 开发说明

### stdin/stdout 协议

所有 Hook 脚本遵循以下协议：

1. **输入**: 从 stdin 读取 JSON 数据
2. **处理**: 解析数据并执行检查逻辑
3. **输出**:
   - 允许操作：`console.log(JSON.stringify(data))` + `exit(0)`
   - 阻止操作：`console.error(message)` + `exit(1)`
   - 警告：`console.error(message)` + 透传数据 + `exit(0)`

### 错误处理

- **解析错误**: 透传数据，避免阻塞用户操作
- **未预期错误**: 透传数据，记录到 stderr
- **Critical Hook**: 可以阻止操作（exit 1）
- **Warning Hook**: 必须透传数据（exit 0）
