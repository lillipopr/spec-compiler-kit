# Spec Compiler Kit

规格编译器套件：将模糊需求编译为确定性规格文档，实现"人管变化，AI 写实现"。

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](../../releases/tag/v2.0.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Plugin](https://img.shields.io/badge/Claude_Code-plugin-purple.svg)](#安装)

## 核心理念

```
传统模式：需求 → 人写代码 → 测试 → 交付
新范式：  需求 → 人写文档 → AI 编译代码 → 测试 → 交付
```

- **人负责**：需求定义、领域设计、规格审核、验收
- **AI 负责**：规格建模、工件推导、代码生成、测试实现
- **代码是可替换工件，规格 + 用例才是资产**

## 完整编排流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         完整功能建设流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Stage 1: PRD                                                   │
│  ├─ 执行者: PM                                                   │
│  ├─ 产出: 《产品需求文档》                                         │
│  └─ 闸口: 需求清晰、边界明确、验收标准可测                           │
│           ↓                                                     │
│  Stage 2: DDD Design                                            │
│  ├─ 执行者: 架构师                                                │
│  ├─ 产出: 《DDD 设计文档》                                         │
│  └─ 闸口: 领域边界清晰、聚合设计合理、上下文映射完整                  │
│           ↓                                                     │
│  Stage 3: Spec Modeling                                         │
│  ├─ 执行者: AI + 人工审核                                         │
│  ├─ 产出: 《规格建模文档》                                         │
│  └─ 闸口: 状态完备、不变量完整、用例覆盖（含 Bad Case）              │
│           ↓                                                     │
│  Stage 4: Artifact Derivation                                   │
│  ├─ 执行者: AI + 人工审核                                         │
│  ├─ 产出: 《工件推导文档》                                         │
│  └─ 闸口: 分层清晰、契约一致、可直接编码                            │
│           ↓                                                     │
│  Stage 5: Test Generation                                       │
│  ├─ 执行者: AI + 人工审核                                         │
│  ├─ 产出: 《测试代码》                                            │
│  └─ 闸口: 测试覆盖所有用例、TDD RED 阶段就绪                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 插件结构

### Marketplace 结构（支持 `/plugin marketplace add`）

```
spec-compiler-kit/
├── .claude-plugin/               # Marketplace 配置
│   ├── marketplace.json         # Marketplace 配置（source: "./plugins/spec-compiler-kit"）
│   ├── README.md                # 插件开发指南
│   ├── HOOKS.md                 # Hooks 开发规范
│   ├── VERSIONING.md            # 版本管理规范
│   └── PUBLISHING.md            # 发布流程指南
├── plugins/                      # 【必需】Marketplace 插件目录
│   └── spec-compiler-kit/       # 插件子目录（source 指向这里）
│       ├── .claude-plugin/
│       │   ├── plugin.json      # 插件元数据（v2.0 规范）
│       │   ├── hooks/           # Hooks 配置目录
│       │   │   ├── hooks.json   # Hook 执行配置（PreToolUse）
│       │   │   ├── pre-tool-use/
│       │   │   ├── post-tool-use/
│       │   │   ├── session-start/
│       │   │   └── session-end/
│       │   └── scripts/
│       │       ├── hooks/       # 可执行 Hook 脚本
│       │       │   ├── phase-review-check.js
│       │       │   ├── architecture-check.js
│       │       │   └── README.md
│       │       ├── pre-install.sh
│       │       ├── post-install.sh
│       │       └── pre-uninstall.sh
│       │   ├── commands/            # 【Command 层】用户命令入口
│       │   │   ├── prd.md                   # 产品经理命令
│       │   │   ├── ddd.md                   # 领域架构师命令
│       │   │   ├── spec.md                  # 规格编译器命令
│       │   │   ├── tdd.md                   # TDD 专家命令
│       │   │   ├── java.md                  # Java 工程师命令
│       │   │   ├── ios.md                   # iOS 工程师命令
│       │   │   └── front.md                 # 前端工程师命令
│       │   ├── agents/               # 【Agent 层】按角色命名的执行代理
│       │   │   ├── product-manager.md       # 产品经理
│       │   │   ├── domain-architect.md      # 领域架构师
│       │   │   ├── spec-compiler-v4.md      # 规格编译器
│       │   │   ├── tdd-expert.md            # TDD 专家
│       │   │   ├── java-expert.md           # Java 专家
│       │   │   ├── ios-expert.md            # iOS 专家
│       │   │   └── frontend-expert.md       # 前端专家
│       │   ├── skills/               # 【Skill 层】按角色配备的知识库
│       │   │   ├── for-product-manager/     # 产品经理知识库
│       │   │   ├── for-domain-architect/    # 领域架构师知识库
│       │   │   ├── for-spec-compiler-v4/    # 规格编译器知识库
│       │   │   ├── for-tdd-expert/          # TDD 专家知识库
│       │   │   ├── for-java-expert/         # Java 专家知识库
│       │   │   ├── for-ios-expert/          # iOS 专家知识库
│       │   │   └── for-frontend-expert/     # 前端专家知识库
│       │   ├── tools/                # 【Tools 层】工具封装
│       │   │   ├── file-tools/              # 文件操作工具
│       │   │   ├── search-tools/            # 搜索工具
│       │   │   └── validation-tools/        # 验证工具
│       │   └── rules/                # 【可选】用户规则配置
│       ├── README.md                     # 项目说明
│       ├── CHANGELOG.md                  # 版本变更记录
│       └── install.sh                    # 本地安装脚本
```

### 各层职责说明

| 层级 | 目录 | 职责 | 关系 |
|------|------|------|------|
| **Command 层** | `commands/` | 面向用户的命令入口（`/prd`, `/ddd`, `/spec` 等） | 路由到合适的 Agent |
| **Agent 层** | `agents/` | 实际执行任务、多次 tool 调用、决策、状态管理 | 按角色命名，引用对应 Skill |
| **Skill 层** | `skills/` | 提供领域知识、方法论、SOP、模板、设计模式、原则 | 按角色配备 |
| **Tools 层** | `tools/` | 读写文件、搜索、执行命令等 | 主动操作资源 |

## 使用方式

### 安装

#### 方式一：从 Marketplace 安装（推荐）

```bash
# 添加 Marketplace
/plugin marketplace add https://github.com/lillipopr/spec-compiler-kit

# 安装插件
/plugin install spec-compiler-kit
```

#### 方式二：本地符号链接（推荐用于开发）

```bash
# 克隆仓库
git clone https://github.com/lillipopr/spec-compiler-kit ~/spec-compiler-kit

# 执行安装脚本（自动创建符号链接）
cd ~/spec-compiler-kit
./install.sh

# 或手动创建符号链接（指向 plugins/spec-compiler-kit 子目录）
mkdir -p ~/.claude/plugins/local
ln -s ~/spec-compiler-kit/plugins/spec-compiler-kit ~/.claude/plugins/local/spec-compiler-kit

# 重启 Claude Code 后自动加载
```

### 验证安装

安装后，验证插件是否正确加载：

```bash
# 查看已安装插件
/plugin list

# 查看 Agents
/agent list

# 查看 Skills
/skill list

# 测试命令
/help
```

### 命令

```bash
/prd     # 产品经理：创建/修改/Review PRD
/ddd     # 领域架构师：创建/修改/Review DDD 设计
/spec    # 规格编译器：创建/修改/Review 规格文档（4 Phase）
/tdd     # TDD 专家：编写/执行测试
/java    # Java 工程师：实现/Review/Bugfix 后端代码
/ios     # iOS 工程师：实现/Review/Bugfix iOS 代码
/front   # 前端工程师：实现/Review/Bugfix 前端代码
```

## 命令说明

| 命令 | 调用专家 | 主要功能 | 场景 |
|------|----------|----------|------|
| `/prd` | 产品经理 | 创建/修改/Review PRD | 需求定义 |
| `/ddd` | 领域架构师 | 创建/修改/Review DDD 设计 | 领域建模 |
| `/spec` | 规格编译器 | 创建/修改/Review 规格文档 | 规格建模（4 Phase） |
| `/tdd` | TDD 专家 | 编写/执行测试 | 单测/集成/E2E |
| `/java` | Java 工程师 | 实现/Review/Bugfix | 后端开发 |
| `/ios` | iOS 工程师 | 实现/Review/Bugfix | iOS 开发 |
| `/front` | 前端工程师 | 实现/Review/Bugfix | 前端开发 |

## 支持架构

| 架构类型 | 分层结构 | 规范文件 |
|---------|---------|---------|
| **后端 DDD** | Controller → Application → Domain → Gateway/Infra → Mapper | `java-ddd-layers.md` |
| **iOS MVVM** | View → ViewModel → Service → Gateway → Network | `ios-mvvm-layers.md` |
| **Vue 3** | View → Composable → Service → API → Request | `vue3-layers.md` |

## Hooks 功能

插件包含可执行的 Quality Gate Hooks，在编辑时自动检查合规性：

### Phase 审查闸口（Critical）

**触发条件**：编辑 `*.spec.md` 或 `PRD.md` 文件

**功能**：
- 确保 Phase N+1 编辑前，Phase N 已人工审查通过
- 阻止跳过审查闸口的编辑操作

**审查状态标记**：
```markdown
<!-- REVIEW STATUS: APPROVED - 2025-01-31T10:00:00.000Z - zxq -->
审查意见：实体定义完整，状态转移清晰。
```

### 架构分层检查（High）

**触发条件**：编辑 `*.java`, `*.swift`, `*.vue`, `*.ts`, `*.tsx` 文件

**功能**：
- 检测违反分层架构的依赖关系
- 输出违规警告（不阻止编辑）

**支持架构**：
- **Java DDD**: Controller → Application → Domain ← Gateway, Mapper
- **iOS MVVM**: View → ViewModel → Service → Gateway → Network
- **Vue 3**: View → Composable → Service → API → Request

**警告示例**：
```
⚠️ 架构分层警告：检测到违规依赖
文件: src/main/java/controller/UserController.java
违规: com.example.mapper.UserMapper (Controller 只能调用 Application)
```

> 详细说明请参考 [Hooks 使用指南](plugins/spec-compiler-kit/.claude-plugin/scripts/hooks/README.md)

## 核心原则

### 闸口控制

每个 Stage 完成后**必须等待用户确认**：

```
Stage N 完成 → 输出产出物 → 提醒用户 Review → 等待确认 → 进入 Stage N+1
```

**禁止行为**：
- 不能在用户未确认时自动进入下一 Stage
- 不能跳过 Review 闸口
- 不能假设用户已同意而继续执行

**必须行为**：
- 每个 Stage 完成后明确提醒用户 Review
- 清晰列出 Review 要点
- 等待用户明确的正面确认
- 修改后再次提醒 Review

### 质量闸口

| 闸口 | 检查点 | 不通过则 |
|------|--------|----------|
| **PRD 闸** | 需求清晰、边界明确 | 不进入 DDD 设计 |
| **DDD 闸** | 领域边界清晰、聚合合理 | 不进入规格建模 |
| **建模闸** | 状态完备、不变量完整、用例覆盖 | 不进入工件推导 |
| **工件闸** | 分层清晰、契约一致 | 不允许生成代码 |
| **熵控闸** | 功能下线时删 case + 删代码 | 不允许遗留死代码 |

## 快速开始示例

**输入**：用户订阅会员，每天刷新 100 点券

**Stage 1 PRD**：
- 功能描述、用户故事、验收标准

**Stage 2 DDD**：
- 聚合根：Membership
- 实体：CouponGrant
- 限界上下文：会员上下文、点券上下文

**Stage 3 Spec Modeling**：
- 状态：M0(非会员) → M1(生效中) → M2(已过期)
- 不变量：INV-1 只有 M1 才能发放点券
- 用例：覆盖所有状态转移 + Bad Case

**Stage 4 Artifact Derivation**：
- 后端：Controller/Application/Domain/Gateway 分层
- 接口契约：API 定义、DTO、错误码
- 实现位置映射

## 文件说明

### Agents（执行代理）

- `spec-prd-agent.md` - PRD 产出代理
- `spec-ddd-agent.md` - DDD 设计代理
- `spec-modeling-agent.md` - 规格建模代理
- `spec-artifact-agent.md` - 工件推导代理
- `spec-test-agent.md` - 测试生成代理
- `spec-review-agent.md` - 规格审查代理

### Commands（用户命令）

- `spec.md` - 主入口（智能路由）
- `spec-new.md` - 首次功能建设
- `spec-iter.md` - 功能迭代
- `spec-fix.md` - Bug 修复
- `spec-offline.md` - 功能下线
- `spec-review.md` - 审查规格文档

### Skills（技能库层）

#### spec-compiler/
- `SKILL.md` - 入口：理念 + 流程编排
- `rules/` - 核心原则
- `workflows/` - 完整工作流（按场景）
- `stages/` - 阶段详解（01-prd ~ 05-test-generation）
- `methodology/` - 方法论文档（不变量、实体提取、状态空间设计等）
- `domain/` - 领域特化
- `templates/` - 文档模板

## 文档

| 文档 | 描述 |
|------|------|
| [插件开发指南](.claude-plugin/README.md) | 插件架构、组件说明、开发工作流 |
| [Hooks 开发规范](.claude-plugin/HOOKS.md) | Hook 类型、编写规范、最佳实践 |
| [Hooks 使用指南](plugins/spec-compiler-kit/.claude-plugin/scripts/hooks/README.md) | Hook 脚本使用、配置、调试 |
| [版本管理规范](.claude-plugin/VERSIONING.md) | 版本号格式、发布流程、升级指南 |
| [发布流程指南](.claude-plugin/PUBLISHING.md) | 发布方式、Marketplace 配置、更新流程 |
| [变更记录](CHANGELOG.md) | 版本历史、功能变更、迁移指南 |

## 贡献

欢迎贡献！请查看 [插件开发指南](.claude-plugin/README.md#贡献指南) 了解详情。

## 许可证

[MIT License](./LICENSE)
