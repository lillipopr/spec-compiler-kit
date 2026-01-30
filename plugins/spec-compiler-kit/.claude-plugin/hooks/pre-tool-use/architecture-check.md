# Architecture Layer Check

## 元数据

- **类型**: PreToolUse
- **优先级**: high
- **启用状态**: true
- **版本**: 1.0.0

## 触发条件

当用户编辑代码文件（`*.java`, `*.swift`, `*.vue`, `*.ts`）时。

## 检查规则

### Java (DDD 分层)

```
Controller → Application → Domain ← Gateway
                    ↓
                 Mapper
```

**验证规则**：
- Controller 只能调用 Application
- Application 只能调用 Domain
- Domain 不依赖任何其他层
- Gateway 实现 Domain 定义的接口
- Mapper 只在 Gateway 层使用

### iOS (MVVM 分层)

```
View → ViewModel → Service → Gateway → Network
```

**验证规则**：
- View 只能调用 ViewModel
- ViewModel 只能调用 Service
- Service 只能调用 Gateway
- Gateway 只能调用 Network

### Vue 3 (前端分层)

```
View → Composable → Service → API → Request
```

**验证规则**：
- View 只能调用 Composable
- Composable 只能调用 Service
- Service 只能调用 API
- API 只能调用 Request

## 检测逻辑

```python
def check_architecture_layer(file_path, imports, dependencies):
    # 1. 确定文件所属层
    layer = detect_layer_from_path(file_path)

    # 2. 解析导入和依赖
    imported_modules = parse_imports(imports)
    called_functions = parse_function_calls(dependencies)

    # 3. 检查依赖方向
    violations = []
    for dep in imported_modules + called_functions:
        if not is_valid_dependency(layer, dep):
            violations.append({
                "layer": layer,
                "dependency": dep,
                "rule": get_architecture_rule(layer)
            })

    # 4. 返回结果
    if violations:
        return Warn(violations=violations)
    return Allow()
```

## 警告消息

```
⚠️ 架构分层警告：检测到违规依赖

文件：{file_path}
层级：{layer}

违规依赖：
- {dependency}（{reason}）

架构规则：{rule}

建议：修复依赖或调整文件位置
```

## 配置选项

```json
{
  "config": {
    "architectureCheckStrict": false,
    "architectureRules": {
      "java": "ddd",
      "swift": "mvvm",
      "vue": "frontend"
    }
  }
}
```

## 相关文档

- [Java DDD 分层规范](../../rules/architecture/java-ddd-layers.md)
- [iOS MVVM 分层规范](../../rules/architecture/ios-mvvm-layers.md)
- [Vue 3 前端分层规范](../../rules/architecture/vue3-layers.md)
