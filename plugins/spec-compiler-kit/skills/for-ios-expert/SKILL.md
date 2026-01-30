---
name: for-ios-expert
description: iOS 技术专家知识库，提供 MVVM 分层架构、SwiftUI 开发、并发编程、性能优化等核心技术。
---

# iOS 技术专家 Skill

## 概述

本知识库为 iOS 技术专家提供 MVVM 分层架构、SwiftUI 开发、并发编程、性能优化等核心技术知识。

---

## 目录结构

```
for-ios-expert/
├── SKILL.md                           # 本文件
├── architecture/                      # 架构规范
│   └── ios-mvvm-layers.md            # iOS MVVM 分层架构
└── references/                        # 技术参考文档
    ├── swift-concurrency.md          # Swift 并发编程
    ├── combine.md                    # Combine 响应式编程
    ├── data-persistence.md           # 数据持久化
    ├── swiftui-mvvm.md               # SwiftUI + MVVM 最佳实践
    ├── project-structure.md          # 项目结构详细说明
    ├── solid-principles.md           # SOLID 原则
    ├── testing.md                    # 测试
    ├── performance.md                # 性能优化
    └── case-matching.md              # Swift case matching
```

---

## 快速导航

### 核心技术

| 主题 | 文件 | 描述 |
|------|------|------|
| **MVVM 分层架构** | `architecture/ios-mvvm-layers.md` | View → ViewModel → Service → Gateway |
| **Swift 并发编程** | `references/swift-concurrency.md` | async/await、Actor、TaskGroup、Sendable |
| **Combine 框架** | `references/combine.md` | Publisher/Subscriber、Operators |
| **数据持久化** | `references/data-persistence.md` | UserDefaults、Core Data、SwiftData |
| **SwiftUI + MVVM** | `references/swiftui-mvvm.md` | 状态管理、ViewModel 设计 |
| **SOLID 原则** | `references/solid-principles.md` | 单一职责、开闭原则、依赖倒置 |
| **性能优化** | `references/performance.md` | 渲染优化、内存优化、启动时间 |
| **测试** | `references/testing.md` | 单元测试、集成测试、UI 测试 |

### 各层职责

**View 层**
- SwiftUI 视图定义
- 用户交互处理
- 绑定 ViewModel 状态

**ViewModel 层**
- @Published 状态管理
- 业务流程编排
- 调用 Service 层
- 错误处理

**Service 层**
- 业务逻辑实现
- 数据模型转换
- 不变量校验

**Gateway 层**
- 网络请求
- 响应解析
- 缓存策略
- 离线支持

---

## 命名规范

| 层         | 类命名           | 示例                |
| ---------- | ---------------- | ------------------- |
| View       | XxxView          | MembershipView     |
| ViewModel  | XxxViewModel     | MembershipViewModel |
| Service    | XxxService       | MembershipService  |
| Gateway    | XxxGateway       | MembershipGateway  |
| API        | XxxAPI           | MembershipAPI      |

---

## 依赖方向

```
View → ViewModel → Service → Gateway
```

单向依赖，上层依赖下层。

---

## 相关 Agent

- `agents/ios-expert/AGENT.md` - iOS 技术专家 Agent
