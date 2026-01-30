---
description: iOS MVVM 分层架构规范
---

# iOS MVVM 分层架构

## 分层结构

```
┌─────────────────────────────────────────────────────┐
│ View          │ SwiftUI 视图、用户交互              │
├─────────────────────────────────────────────────────┤
│ ViewModel     │ 状态管理、业务编排、调用 Service    │
├─────────────────────────────────────────────────────┤
│ Service       │ 业务逻辑、数据转换                  │
├─────────────────────────────────────────────────────┤
│ Gateway       │ 接口聚合、缓存策略                  │
├─────────────────────────────────────────────────────┤
│ Network       │ HTTP 请求、响应解析                 │
└─────────────────────────────────────────────────────┘
```

## 各层职责

### View 层
- SwiftUI 视图定义
- 用户交互处理
- 绑定 ViewModel 状态

### ViewModel 层
- @Published 状态管理
- 业务流程编排
- 调用 Service 层
- 错误处理

### Service 层
- 业务逻辑实现
- 数据模型转换
- 不变量校验

### Gateway 层
- 多接口聚合
- 缓存策略
- 离线支持

### Network 层
- HTTP 请求封装
- 响应解析
- 错误映射

## 命名规范

| 层 | 类命名 | 示例 |
|----|--------|------|
| View | XxxView | MembershipView |
| ViewModel | XxxViewModel | MembershipViewModel |
| Service | XxxService | MembershipService |
| Gateway | XxxGateway | MembershipGateway |
| Network | XxxAPI | MembershipAPI |

## 依赖方向

```
View → ViewModel → Service → Gateway → Network
```

单向依赖，上层依赖下层。
