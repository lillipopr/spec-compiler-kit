---
description: Vue3 前端分层架构规范
---

# Vue3 前端分层架构

## 分层结构

```
┌─────────────────────────────────────────────────────────────┐
│   视图层 (View Layer)                                        │
│  - Vue Component: .vue 组件文件                             │
│  - 职责: UI 渲染、用户交互、绑定状态                          │
│  - 约束: 只负责展示，不包含业务逻辑，通过 props/emits 通信 │
└─────────────────────────────────────────────────────────────┘
                            ↓ 依赖
┌─────────────────────────────────────────────────────────────┐
│   组合式函数层 (Composable Layer)                           │
│  - Composable: useXxx.ts 组合式函数                         │
│  - 职责: 状态管理、业务编排、调用 Service、错误处理        │
│  - 约束: 通过 reactive/ref 定义状态，通过依赖注入获取 Service │
└─────────────────────────────────────────────────────────────┘
                            ↓ 依赖
┌─────────────────────────────────────────────────────────────┐
│   服务层 (Service Layer)                                    │
│  - Service: xxxService.ts                                   │
│  - 职责: 业务逻辑实现、数据转换、不变量校验                │
│  - 约束: 不依赖具体实现，通过 API 获取数据                  │
└─────────────────────────────────────────────────────────────┘
                            ↓ 依赖
┌─────────────────────────────────────────────────────────────┐
│   API 层 (API Layer)                                        │
│  - API: xxxApi.ts                                           │
│  - 职责: HTTP 请求、响应解析、拦截器、错误映射             │
└─────────────────────────────────────────────────────────────┘
```

## 关键原则

- View 不直接依赖 Service，通过 Composable 间接访问
- Composable 通过依赖注入获取 Service，不依赖具体实现
- Service 通过 API 获取数据，隔离后端接口变化
- 依赖只能向下流动，上层不依赖下层实现

## 命名规范

| 层            | 文件/类命名                | 示例                                 |
| ------------- | ------------------------- | ------------------------------------ |
| View          | XxxView.vue               | MembershipView.vue                  |
| Composable    | useXxx.ts                 | useMembership.ts                    |
| Service       | xxxService.ts             | membershipService.ts                |
| API           | xxxApi.ts                 | membershipApi.ts                    |
| Type          | Xxx.type.ts / Xxx.types.ts | Membership.type.ts / Membership.types.ts |

## 依赖方向

```
View → Composable → Service → API
```

单向依赖，上层依赖下层。
