---
name: for-frontend-expert
description: Vue3 资深前端技术专家知识库，提供 Vue3 分层架构、Composition API、TypeScript、性能优化、工程化等核心知识。
---

# Vue3 前端技术专家 Skill

## 概述

本知识库为 Vue3 资深前端技术专家提供 Vue3 分层架构、Composition API、TypeScript、性能优化、工程化等核心知识。

## 目录结构
- `architecture/`：架构规范（Vue3 分层架构）
- `references/methodology/`：方法论（SOLID、设计原则）
- `references/sop/`：标准作业流程（架构设计工作流、开发工作流）
- `references/domain-knowledge/`：领域知识（Vue3、TypeScript、Vite、Pinia）
- `references/templates/`：代码模板（View、Composable、Service）
- `references/patterns/`：设计模式和最佳实践

## 文件列表

### Architecture（架构规范）
- [Vue3 分层架构](architecture/vue3-layers.md) - View → Composable → Service → API

### Methodology（方法论）
- [SOLID 设计原则](references/methodology/solid.md) - 单一职责、开闭原则、里氏替换、接口隔离、依赖倒置
- [其他设计原则](references/methodology/design-principles.md) - DRY、KISS、YAGNI

### SOP（标准作业流程）
- [架构设计工作流](references/sop/architecture-workflow.md) - 需求分析、架构设计、技术选型
- [开发工作流](references/sop/development-workflow.md) - 编码规范、测试、代码审查

### Domain Knowledge（领域知识）
- [Vue3 核心知识](references/domain-knowledge/vue3.md) - Composition API、响应式原理、生命周期
- [TypeScript 类型系统](references/domain-knowledge/typescript.md) - 类型系统、泛型、工具类型
- [Vite 构建工具](references/domain-knowledge/vite.md) - 构建配置、插件开发、优化策略
- [Pinia 状态管理](references/domain-knowledge/pinia.md) - 状态定义、Getters、Actions

### Templates（代码模板）
- [View 模板](references/templates/view-template.md) - Vue 组件规范
- [Composable 模板](references/templates/composable-template.md) - 组合式函数规范
- [Service 模板](references/templates/service-template.md) - 服务层规范

### Patterns（设计模式）
- [反模式识别](references/patterns/anti-patterns.md) - Props 透传、响应式丢失、过度响应式
- [最佳实践](references/patterns/best-practices.md) - 组合式函数、computed 优化、组件通信

## 快速导航

### 核心内容
- [Vue3 分层架构](architecture/vue3-layers.md)
- [SOLID 原则](references/methodology/solid.md)
- [Vue3 核心知识](references/domain-knowledge/vue3.md)
- [TypeScript 类型系统](references/domain-knowledge/typescript.md)

### 常见任务
- **架构设计**: 见 [架构设计工作流](references/sop/architecture-workflow.md)
- **性能优化**: 见 [Vite 构建优化](references/domain-knowledge/vite.md)
- **代码审查**: 见 [开发工作流](references/sop/development-workflow.md)

### 相关 Agent
- `agents/frontend-expert/AGENT.md`

## 快速参考

### 分层架构
```
View → Composable → Service → API
```

### 命名规范
- View: `XxxView.vue`
- Composable: `useXxx.ts`
- Service: `xxxService.ts`
- API: `xxxApi.ts`
- Type: `Xxx.type.ts` / `Xxx.types.ts`

### 关键原则
1. **View 不直接依赖 Service** - 通过 Composable 间接访问
2. **性能优先** - 优先考虑渲染性能
3. **SOLID 原则** - 单一职责、开闭原则、依赖倒置
4. **DRY** - 相同逻辑只实现一次
