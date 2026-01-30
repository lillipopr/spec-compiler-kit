# Phase 4: 端到端接口设计（串联各端）

> **3.0 核心升级**：接口设计完整化，每个接口包含入参/返回值/用例/约束/状态转移/错误处理/具体逻辑。

## 目标

从问题建模推导出端到端的接口设计，确保各端实现一致、接口契约统一。

**关键原则**：一份文档串联所有端，而非各端独立设计。

## 3.0 核心变化

### 2.0 vs 3.0

| 维度 | 2.0 设计 | 3.0 设计 |
|------|---------|---------|
| 接口定义 | 骨架式（只有入参/返回值） | **完整规格**（入参/返回值/用例/约束/状态转移/错误处理/逻辑） |
| 行为接口 | 简单列表 | **每个行为对应完整接口规格** |
| 错误处理 | 简单错误码 | **错误码 + 触发条件 + 对应约束** |
| 具体逻辑 | 无 | **伪代码或步骤描述** |

---

## 文档结构

```
1. 数据流全景图        # 端到端数据流
2. 行为接口清单        # 每个行为对应的完整接口规格（3.0 增强）
3. 后端实现           # 后端分层设计
4. iOS 实现           # iOS 分层设计
5. 前端实现           # Vue 3 分层设计
6. 跨端一致性检查      # 确保各端实现一致
```

---

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

### 数据流说明

| 阶段 | 数据形态 | 说明 |
|------|---------|------|
| 用户操作 | UI Event | 按钮点击、表单提交 |
| iOS Gateway | HTTP Request | JSON 请求体 |
| 后端 Controller | XxxParam | 请求参数对象 |
| 后端 Domain | Entity | 领域实体 |
| 后端 Controller | XxxDTO | 响应数据对象 |
| iOS Gateway | HTTP Response | JSON 响应体 |
| iOS ViewModel | Model | 领域模型 |
| iOS View | UI State | UI 状态 |

---

## 2. 行为接口清单（3.0 增强）

> **3.0 核心升级**：每个行为接口包含完整规格，不再是简单的骨架。

### 接口规格模板

```markdown
### API-XX: {接口名称}

#### 基本信息

| 项目 | 内容 |
|------|------|
| **HTTP 方法** | POST |
| **路径** | /api/v1/{resource}/{action} |
| **认证** | Bearer Token |
| **幂等性** | 是/否 |
| **对应行为** | {用户行为/系统行为名称} |

#### 请求参数

| 字段 | 类型 | 必填 | 说明 | 约束 |
|------|------|------|------|------|
| {field1} | {type} | 是 | {说明} | {约束，如 INV-01} |
| {field2} | {type} | 否 | {说明} | {约束} |

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

| 不变量 | 描述 | 校验位置 |
|--------|------|---------|
| INV-XX | {描述} | Domain 层 |

#### 状态转移

| 前置状态 | 触发条件 | 目标状态 |
|---------|---------|---------|
| {S0} | {条件} | {S1} |

#### 错误处理

| 错误码 | HTTP 状态码 | 触发条件 | 对应约束 | 错误信息 |
|-------|------------|---------|---------|---------|
| {ERR_001} | 400 | {条件} | INV-XX | {错误信息} |
| {ERR_002} | 409 | {条件} | 禁止态-X | {错误信息} |

#### 具体逻辑（伪代码）

```
FUNCTION {action}({params}) -> {Result}
    // 1. 参数校验
    VALIDATE {field1} IS NOT NULL
    
    // 2. 前置条件检查
    entity = LOAD {Entity} BY {id}
    ASSERT entity.state == {expectedState}  // INV-XX
    
    // 3. 业务逻辑
    entity.{action}({params})
    
    // 4. 状态转移
    entity.state = {newState}
    
    // 5. 持久化
    SAVE entity
    
    // 6. 返回结果
    RETURN {Result}
END FUNCTION
```
```

---

### 示例：创建订单接口

```markdown
### API-01: 创建订单

#### 基本信息

| 项目 | 内容 |
|------|------|
| **HTTP 方法** | POST |
| **路径** | /api/v1/orders/create |
| **认证** | Bearer Token |
| **幂等性** | 否（每次创建新订单） |
| **对应行为** | 用户行为：用户下单 |

#### 请求参数

| 字段 | 类型 | 必填 | 说明 | 约束 |
|------|------|------|------|------|
| items | Array<OrderItem> | 是 | 订单项列表 | INV-01: 至少一个商品 |
| items[].productId | String | 是 | 商品ID | INV-02: 商品必须存在 |
| items[].quantity | Integer | 是 | 购买数量 | INV-03: 数量 > 0 |

#### 返回结果

| 字段 | 类型 | 说明 |
|------|------|------|
| orderId | String | 订单ID |
| status | String | 订单状态（O0: 待支付） |
| totalAmount | Long | 订单金额（分） |
| createdAt | DateTime | 创建时间 |

#### 对应用例

| 用例编号 | 用例名称 | 类型 |
|---------|---------|------|
| Case-01 | 正常创建订单 | 正向 |
| Case-02 | 商品不存在 | Bad Case |
| Case-03 | 库存不足 | Bad Case |
| Case-04 | 购买数量为0 | Bad Case |

#### 承载的约束/不变量

| 不变量 | 描述 | 校验位置 |
|--------|------|---------|
| INV-01 | 订单至少包含一个商品 | Controller 层 |
| INV-02 | 商品必须存在 | Domain 层 |
| INV-03 | 购买数量 > 0 | Controller 层 |
| INV-04 | 库存数量 >= 购买数量 | Domain 层 |
| INV-05 | 订单金额 = Σ(商品单价 × 数量) | Domain 层 |

#### 状态转移

| 前置状态 | 触发条件 | 目标状态 |
|---------|---------|---------|
| 无（新建） | 创建成功 | O0 待支付 |

#### 错误处理

| 错误码 | HTTP 状态码 | 触发条件 | 对应约束 | 错误信息 |
|-------|------------|---------|---------|---------|
| ORDER_001 | 400 | items 为空 | INV-01 | 订单至少包含一个商品 |
| ORDER_002 | 404 | 商品不存在 | INV-02 | 商品不存在: {productId} |
| ORDER_003 | 400 | quantity <= 0 | INV-03 | 购买数量必须大于0 |
| ORDER_004 | 409 | 库存不足 | INV-04 | 库存不足: {productId} |

#### 具体逻辑（伪代码）

```
FUNCTION createOrder(userId, items) -> OrderDTO
    // 1. 参数校验
    ASSERT items IS NOT EMPTY  // INV-01
    FOR EACH item IN items:
        ASSERT item.quantity > 0  // INV-03
    
    // 2. 加载商品信息并校验
    products = []
    FOR EACH item IN items:
        product = LOAD Product BY item.productId
        IF product IS NULL:
            THROW "ORDER_002: 商品不存在"  // INV-02
        IF product.stock < item.quantity:
            THROW "ORDER_004: 库存不足"  // INV-04
        products.ADD(product)
    
    // 3. 计算订单金额
    totalAmount = 0
    FOR i = 0 TO items.LENGTH:
        totalAmount += products[i].price * items[i].quantity  // INV-05
    
    // 4. 创建订单实体
    order = NEW Order(
        id = GENERATE_ID(),
        userId = userId,
        status = "O0",  // 待支付
        totalAmount = totalAmount,
        createdAt = NOW()
    )
    
    // 5. 创建订单项
    FOR i = 0 TO items.LENGTH:
        orderItem = NEW OrderItem(
            orderId = order.id,
            productId = items[i].productId,
            quantity = items[i].quantity,
            price = products[i].price
        )
        order.items.ADD(orderItem)
    
    // 6. 持久化
    SAVE order
    
    // 7. 返回结果
    RETURN OrderDTO(order)
END FUNCTION
```
```

---

## 3. 后端实现

### 3.1 分层设计

| 层级 | 类名 | 方法 | 职责 | 承载约束 |
|------|------|------|------|---------|
| Controller | OrderController | createOrder() | 接收请求、参数验证 | INV-01, INV-03 |
| Application | OrderApplication | createOrder() | 跨领域编排 | - |
| Domain | OrderDomain | create() | 业务逻辑、不变量校验 | INV-02, INV-04, INV-05 |
| Mapper | OrderMapper | insert() | 数据持久化 | - |

### 3.2 实体设计

| 实体 | 表名 | 承载不变量 |
|------|------|-----------|
| Order | t_order | INV-01, INV-05 |
| OrderItem | t_order_item | INV-03 |

### 3.3 代码结构

```
controller/
├── OrderController.java
├── param/
│   └── CreateOrderParam.java
└── result/
    └── OrderDTO.java

application/
├── OrderApplication.java
└── impl/
    └── OrderApplicationImpl.java

domain/
├── OrderDomain.java
└── impl/
    └── OrderDomainImpl.java

entity/
├── Order.java
└── OrderItem.java

mapper/
├── OrderMapper.java
└── OrderItemMapper.java
```

---

## 4. iOS 实现

### 4.1 分层设计

| 层级 | 类名 | 方法 | 职责 | 承载约束 |
|------|------|------|------|---------|
| View | OrderView | submitOrder() | UI 交互 | - |
| ViewModel | OrderViewModel | createOrder() | 状态管理 | - |
| Service | OrderService | createOrder() | 业务逻辑 | INV-01, INV-03 |
| Gateway | OrderGateway | postOrder() | API 调用 | - |

### 4.2 DTO 映射

| 后端 DTO | iOS Model | 映射说明 |
|----------|-----------|---------|
| OrderDTO | Order | 1:1 映射 |
| OrderItemDTO | OrderItem | 1:1 映射 |

### 4.3 代码结构

```
Features/Order/
├── Views/
│   └── OrderView.swift
├── ViewModels/
│   └── OrderViewModel.swift
├── Services/
│   └── OrderService.swift
├── Gateways/
│   └── OrderGateway.swift
└── Models/
    ├── Order.swift
    └── OrderItem.swift
```

---

## 5. 前端实现（Vue 3）

### 5.1 分层设计

| 层级 | 文件 | 方法 | 职责 | 承载约束 |
|------|------|------|------|---------|
| View | OrderView.vue | submitOrder() | UI 交互 | - |
| Composable | useOrder.ts | createOrder() | 状态管理 | - |
| Service | orderService.ts | createOrder() | 业务逻辑 | INV-01, INV-03 |
| API | orderApi.ts | postOrder() | API 调用 | - |

### 5.2 代码结构

```
src/
├── views/
│   └── order/
│       └── OrderView.vue
├── composables/
│   └── useOrder.ts
├── services/
│   └── orderService.ts
├── api/
│   └── orderApi.ts
└── types/
    └── order.ts
```

---

## 6. 跨端一致性检查

### 检查清单

| 检查项 | 后端 | iOS | 前端 |
|--------|------|-----|------|
| INV-01 校验位置 | Controller | Service | Service |
| INV-02 校验位置 | Domain | - | - |
| INV-03 校验位置 | Controller | Service | Service |
| INV-04 校验位置 | Domain | - | - |
| INV-05 校验位置 | Domain | - | - |
| 错误码映射 | ✅ | ✅ | ✅ |
| 状态码一致 | ✅ | ✅ | ✅ |
| DTO 字段一致 | ✅ | ✅ | ✅ |

### 一致性规则

1. **不变量校验位置**：后端在 Domain 层，客户端在 Service 层
2. **错误码映射**：所有端使用相同的错误码
3. **状态码一致**：所有端使用相同的状态枚举
4. **DTO 字段一致**：字段名、类型、含义完全一致

---

## 闸口检查

Phase 4 完成后，必须通过以下检查：

- [ ] 每个行为都有完整的接口规格
- [ ] 每个接口都可追溯到具体用例
- [ ] 每个接口都标注承载的约束/不变量
- [ ] 每个接口都有状态转移说明
- [ ] 每个接口都有完整的错误处理
- [ ] 每个接口都有具体逻辑（伪代码）
- [ ] 分层职责清晰，无越界调用
- [ ] 文件名、类名、方法名无歧义
- [ ] 外部依赖已明确列出
- [ ] **跨端一致性检查通过**

---

**上一步** → [Phase 3: 用例设计](phase-3-use-cases.md)
