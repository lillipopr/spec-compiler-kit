# 命名约定

本文档定义了领域设计中的标准命名约定，确保团队协作的一致性。

## 领域服务命名

```
格式：{聚合名} + Domain

示例：
✅ MembershipDomain
✅ CouponDomain
✅ OrderDomain
❌ MembershipService
```

## 应用服务命名

```
格式：{聚合名} + Application

示例：
✅ MembershipApplication
✅ CouponApplication
❌ MembershipApplicationService
```

## 领域事件命名

```
格式：{聚合根} + {过去式动词} + Event

示例：
✅ MembershipActivatedEvent
✅ OrderPaidEvent
❌ ActivateMembershipEvent
```

## 接口路径命名

```
格式：/api/{版本}/{端}/{聚合名}/{动作}

示例：
✅ POST /api/v1/m/wallet/freeze
✅ POST /api/v1/c/user/login
```

## 请求参数命名

```
格式：{动作} + {聚合名} + Param

示例：
✅ CreateMembershipParam
✅ FreezeWalletParam
❌ CreateMembershipRequest
✅ 使用对象类型，不使用原始类型（string, number）
```

## 设计原则

所有命名约定遵循以下原则：

1. **语义化**：命名应清晰表达其含义
2. **一致性**：同类元素使用相同的命名模式
3. **简洁性**：避免冗余后缀（如 Service、Manager）
4. **类型化**：参数使用对象类型而非原始类型

## 参考来源

- DDD 领域驱动设计
- RESTful API 设计规范
- 项目约定（POST 统一请求、XxxParam 入参、ApiResponse<XxxDTO> 响应）
