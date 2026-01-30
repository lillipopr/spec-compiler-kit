# 端到端接口设计文档模板（3.0 增强）

> 本模板用于 Phase 4 产出物，一份文档串联所有端。
> **3.0 核心升级**：每个接口包含完整规格（入参/返回值/用例/约束/状态转移/错误处理/具体逻辑）。

---

```markdown
# {功能名称} - 端到端接口设计文档

## 1. 数据流全景图

```

用户操作 → [iOS View] → [iOS ViewModel] → [iOS Service] → [iOS Gateway]
                                                              ↓
                                                         HTTP Request
                                                              ↓
         [后端 Controller] → [后端 Application] → [后端 Domain] → [后端 Mapper]
                                                              ↓
                                                           Database

```

## 2. 行为接口清单

### API-01: {接口名称}

#### 基本信息

| 项目          | 内容                             |
|--------------|----------------------------------|
| **HTTP 方法** | POST                             |
| **路径**      | /api/v1/{端}/{resource}/{action} |
| **认证**      | Bearer Token                     |
| **幂等性**    | 是/否                             |
| **对应行为**  | {用户行为/系统行为}：{行为名称}       |

#### 请求参数

| 字段 | 类型 | 必填 | 说明 | 约束 |
|------|------|------|------|------|
| {field1} | {type} | 是/否 | {说明} | {INV-XX} |
| {field2} | {type} | 是/否 | {说明} | {INV-XX} |

#### 返回结果

| 字段 | 类型 | 说明 |
|------|------|------|
| {field1} | {type} | {说明} |
| {field2} | {type} | {说明} |

#### 对应用例

| 用例编号 | 用例名称 | 类型 |
|---------|---------|------|
| Case-XX | {用例名称} | 正向/Bad Case |

#### 承载的约束/不变量

| 不变量  | 描述   | 校验位置             |
|--------|-------|---------------------|
| INV-XX | {描述} | {Controller/Domain} |

#### 状态转移

| 前置状态 | 触发条件  | 目标状态 |
|---------|---------|---------|
| {S0}    | {条件}   | {S1}    |

#### 错误处理

| 错误码     | HTTP 状态码    | 触发条件 | 对应约束           | 错误信息   |
|-----------|---------------|---------|------------------|-----------|
| {ERR_001} | {400/404/409} | {条件}   | {INV-XX/禁止态-X} | {错误信息} |

#### 具体逻辑（伪代码）

```

FUNCTION {action}({params}) -> {Result}
    // 1. 参数校验
    VALIDATE {field} IS NOT NULL

    // 2. 前置条件检查
    entity = LOAD {Entity} BY {id}
    ASSERT entity.state == {expectedState}  // INV-XX

    // 3. 业务逻辑
    {业务处理步骤}

    // 4. 状态转移
    entity.state = {newState}

    // 5. 持久化
    SAVE entity

    // 6. 返回结果
    RETURN {Result}
END FUNCTION

```

---

## 3. 后端实现

### 3.1 分层设计

| 层级         | 类名             | 方法        | 职责              | 承载约束  |
|-------------|------------------|------------|------------------|----------|
| Controller  | {Xxx}Controller  | {method}() | 接收请求、参数验证  | {INV-XX} |
| Application | {Xxx}Application | {method}() | 跨领域编排         | -        |
| Domain      | {Xxx}Domain      | {method}() | 业务逻辑、不变量校验 | {INV-XX} |
| Mapper      | {Xxx}Mapper      | {method}() | 数据持久化         | -        |

### 3.2 实体设计

| 实体       | 表名       | 承载不变量 |
|-----------|------------|-----------|
| {Entity1} | {t_table1} | {INV-XX} |
| {Entity2} | {t_table2} | {INV-XX} |

### 3.3 代码结构

```

controller/
├── {Xxx}Controller.java
├── param/
│   └── {Xxx}Param.java
└── result/
    └── {Xxx}DTO.java

application/
├── {Xxx}Application.java
└── impl/
    └── {Xxx}ApplicationImpl.java

domain/
├── {Xxx}Domain.java
└── impl/
    └── {Xxx}DomainImpl.java

entity/
└── {Entity}.java

mapper/
└── {Xxx}Mapper.java

```

---

## 4. iOS 实现

### 4.1 分层设计

| 层级       | 类名           | 方法        | 职责     | 承载约束  |
|-----------|----------------|------------|---------|----------|
| View      | {Xxx}View      | {action}() | UI 交互  | -        |
| ViewModel | {Xxx}ViewModel | {method}() | 状态管理  | -        |
| Service   | {Xxx}Service   | {method}() | 业务逻辑  | {INV-XX} |
| Gateway   | {Xxx}API       | {method}() | API 调用 | -        |

### 4.2 DTO 映射

| 后端 DTO    | iOS Model   | 映射说明 |
|------------|-------------|---------|
| {Xxx}DTO   | {Xxx}DTO    | {映射说明} |
| {Xxx}Param | {Xxx}Param  | {映射说明} |

### 4.3 代码结构

```

Root/
├── Views/
│   └── {Xxx}View.swift
├── ViewModels/
│   └── {Xxx}ViewModel.swift
├── Services/
│   └── {Xxx}Service.swift
│   └── Impl/
│        └── {Xxx}ServiceImpl.swift
├── Gateways/
│   └── {Xxx}API.swift
│   └── Impl/
│        └── {Xxx}APIImpl.swift
└── Models/
    └── {Xxx}.swift

```

---

## 5. 前端实现（Vue 3）

### 5.1 分层设计

| 层级 | 文件 | 方法 | 职责 | 承载约束 |
|------|------|------|------|---------|
| View | {Xxx}View.vue | {action}() | UI 交互 | - |
| Composable | use{Xxx}.ts | {method}() | 状态管理 | - |
| Service | {xxx}Service.ts | {method}() | 业务逻辑 | {INV-XX} |
| API | {xxx}Api.ts | {method}() | API 调用 | - |

### 5.2 代码结构

```

src/
├── views/
│   └── {feature}/
│       └── {Xxx}View.vue
├── composables/
│   └── use{Xxx}.ts
├── services/
│   └── {xxx}Service.ts
├── api/
│   └── {xxx}Api.ts
└── types/
    └── {xxx}.ts

```

---

## 6. 跨端一致性检查

| 检查项 | 后端 | iOS | 前端 |
|--------|------|-----|------|
| {INV-01} 校验位置 | {Domain} | {Service} | {Service} |
| {INV-02} 校验位置 | {Domain} | {Service} | {Service} |
| 错误码映射 | ✅ | ✅ | ✅ |
| 状态码一致 | ✅ | ✅ | ✅ |
| DTO 字段一致 | ✅ | ✅ | ✅ |

---

## 7. 审核检查点

- [ ] 每个行为都有完整的接口规格
- [ ] 每个接口可追溯到用例
- [ ] 每个接口标注承载的约束/不变量
- [ ] 每个接口有状态转移说明
- [ ] 每个接口有完整的错误处理
- [ ] 每个接口有具体逻辑（伪代码）
- [ ] 分层职责清晰分离
- [ ] 文件名、类名、方法名明确无歧义
- [ ] 外部依赖明确列出
- [ ] 跨端一致性检查通过
```
