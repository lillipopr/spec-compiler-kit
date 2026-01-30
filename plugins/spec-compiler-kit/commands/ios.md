---
description: 调用 iOS 专家，实现 iOS 代码/Review/Bugfix。遵循 iOS MVVM 分层架构（View → ViewModel → Service → Gateway → Network），确保 SwiftUI 最佳实践和并发安全。
---

# /ios - iOS 工程师命令

此命令调用 **ios-expert** Agent，处理 iOS 代码的实现、审查和 Bug 修复。

## 此命令的作用

1. **实现 iOS 代码** - 基于规格文档生成 MVVM 分层代码
2. **Review 代码** - 检查 MVVM 架构规范、SwiftUI 最佳实践
3. **修复 Bug** - 分析根因、设计修复方案、验证修复

## 何时使用

使用 `/ios` 时：
- 已有规格文档，需要实现 iOS 代码
- 需要审查 iOS 代码质量
- 需要修复 iOS Bug
- 需要验证 MVVM 分层架构规范

## iOS MVVM 分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        iOS MVVM 分层架构                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  View            │ SwiftUI 视图、用户交互                         │
│  ─────────────────────────────────────────────────────────────  │
│  ViewModel       │ @Published 状态管理、业务编排、调用 Service     │
│  ─────────────────────────────────────────────────────────────  │
│  Service         │ 业务逻辑、数据转换、不变量校验                   │
│  ─────────────────────────────────────────────────────────────  │
│  Gateway         │ 接口聚合、缓存策略、离线支持                     │
│  ─────────────────────────────────────────────────────────────  │
│  Network         │ HTTP 请求、响应解析、错误映射                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 工作流程

### 1. 实现 iOS 代码

**前提条件**：已有规格文档

**输入**：规格文档路径

**执行流程**：
1. 调用 `ios-expert` Agent
2. 分析规格文档中的 iOS 部分
3. 遵循 iOS MVVM 分层架构：
   ```
   View → ViewModel → Service → Gateway → Network
   ```
4. 生成各层代码：
   - View 层：SwiftUI 视图、用户交互
   - ViewModel 层：状态管理、业务编排
   - Service 层：业务逻辑、数据转换
   - Gateway 层：接口聚合、缓存策略
   - Network 层：HTTP 请求、响应解析
5. 确保代码质量：
   - 遵循 SwiftUI 最佳实践
   - 遵循 Swift 编码规范
   - 使用 @Published 状态管理
   - Actor 并发安全

**产出**：iOS 代码实现

### 2. Review 代码

**输入**：待审查的代码路径

**执行流程**：
1. 调用 `ios-expert` Agent
2. 检查 MVVM 架构规范
3. 验证 SwiftUI 最佳实践
4. 检查代码质量：
   - 命名规范
   - 内存管理（强引用检查）
   - 并发安全（Sendable、Actor）
   - 错误处理
5. 检查性能：
   - 视图渲染优化
   - 网络请求优化
   - 内存占用
6. 输出审查报告

**产出**：代码审查报告

### 3. 修复 Bug

**输入**：Bug 描述或测试失败信息

**执行流程**：
1. 调用 `ios-expert` Agent
2. 分析 Bug 根本原因
3. 设计修复方案
4. 实现修复代码
5. 添加/更新测试用例
6. 验证修复

**产出**：修复后的代码 + 测试用例

## 架构分层

```
┌─────────────────────────────────────────────────────────────────┐
│                        iOS MVVM 分层架构                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  View            │ SwiftUI 视图、用户交互                         │
│  ─────────────────────────────────────────────────────────────  │
│  ViewModel       │ @Published 状态管理、业务编排、调用 Service     │
│  ─────────────────────────────────────────────────────────────  │
│  Service         │ 业务逻辑、数据转换、不变量校验                   │
│  ─────────────────────────────────────────────────────────────  │
│  Gateway         │ 接口聚合、缓存策略、离线支持                     │
│  ─────────────────────────────────────────────────────────────  │
│  Network         │ HTTP 请求、响应解析、错误映射                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 命名规范

| 层 | 类命名 | 示例 |
|----|--------|------|
| View | `XxxView` | `MembershipView` |
| ViewModel | `XxxViewModel` | `MembershipViewModel` |
| Service | `XxxService` | `MembershipService` |
| Gateway | `XxxGateway` | `MembershipGateway` |
| Network | `XxxAPI` | `MembershipAPI` |

## 技术栈

- **UI**: SwiftUI
- **状态管理**: @Published, @State, @ObservedObject
- **并发**: async/await, Actor, Sendable
- **网络**: URLSession
- **依赖注入**: DependencyContainer

## 质量标准

| 检查项 | 标准 |
|--------|------|
| 架构分层 | 严格遵循 MVVM 分层 |
| SwiftUI | 遵循 SwiftUI 最佳实践 |
| 并发安全 | Actor 隔离、Sendable 符合 |
| 内存管理 | 无内存泄漏、无强引用循环 |
| 测试覆盖率 | 80%+ |

## 与其他命令的集成

**前置命令：**
- `/spec` - 创建规格文档（iOS 实现的输入）

**配合命令：**
- `/tdd` - 编写/补充测试用例

## 相关 Agent

此命令调用位于以下位置的 `ios-expert` Agent：
`./agents/ios-expert.md`

并可引用位于以下位置的 `for-ios-expert` Skill：
`./skills/for-ios-expert/SKILL.md`

以及位于以下位置的 iOS MVVM 分层规范：
`./rules/architecture/ios-mvvm-layers.md`

## 示例

```
用户: /ios

Claude: 请选择场景：
1. 实现 iOS 代码
2. Review 代码
3. 修复 Bug

用户: 1

Claude: 请提供规格文档路径...

[调用 ios-expert Agent，生成 MVVM 分层代码]
```
