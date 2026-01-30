# Domain 模板

## 规范

- 定义 Domain 接口
- 实现 DomainImpl
- 职责：纯业务逻辑、业务规则验证、模型计算
- 不依赖 Repository
- 只接收参数进行计算，返回结果

## 接口模板

```java
public interface MembershipDomain {
    Membership createMembership(String userId, MembershipLevel level, boolean emailExists);
    void updateMembership(Membership membership, MembershipLevel newLevel);
    void validateCouponGrant(Membership membership, int amount);
}
```

## 实现模板

```java
@Component
@RequiredArgsConstructor
public class MembershipDomainImpl implements MembershipDomain {

    // 只依赖无状态工具
    private final IdGenerator idGenerator;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Membership createMembership(String userId, MembershipLevel level, boolean emailExists) {
        // 1. 业务规则验证（基于传入参数）
        if (emailExists) {
            throw new DomainException("EMAIL_EXISTS", "邮箱已存在");
        }

        // 2. 纯业务逻辑：构建领域对象
        return Membership.builder()
            .id(idGenerator.generateId())
            .userId(userId)
            .level(level)
            .status(MembershipStatus.ACTIVE)
            .createdAt(LocalDateTime.now())
            .build();
    }

    @Override
    public void updateMembership(Membership membership, MembershipLevel newLevel) {
        // 业务规则验证
        if (membership.getStatus() != MembershipStatus.ACTIVE) {
            throw new DomainException("MEMBERSHIP_NOT_ACTIVE", "只有生效中的会员可以升级");
        }

        if (membership.getLevel().ordinal() >= newLevel.ordinal()) {
            throw new DomainException("INVALID_LEVEL", "只能升级到更高等级");
        }

        // 修改状态（充血模型）
        membership.upgrade(newLevel);
    }

    @Override
    public void validateCouponGrant(Membership membership, int amount) {
        // 业务规则验证
        if (membership.getStatus() != MembershipStatus.ACTIVE) {
            throw new DomainException("MEMBERSHIP_NOT_ACTIVE", "只有生效中的会员可以发放点券");
        }

        if (amount <= 0) {
            throw new DomainException("INVALID_AMOUNT", "点券数量必须大于 0");
        }
    }
}
```

## 实体模板（充血模型）

```java
@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Membership {

    private String id;
    private String userId;
    private MembershipLevel level;
    private MembershipStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;

    // 业务行为（充血模型）
    public void upgrade(MembershipLevel newLevel) {
        if (this.status != MembershipStatus.ACTIVE) {
            throw new DomainException("只有生效中的会员可以升级");
        }
        this.level = newLevel;
    }

    public void suspend() {
        if (this.status != MembershipStatus.ACTIVE) {
            throw new DomainException("只有生效中的会员可以暂停");
        }
        this.status = MembershipStatus.SUSPENDED;
    }

    public void activate() {
        if (this.status != MembershipStatus.SUSPENDED) {
            throw new DomainException("只有暂停的会员可以激活");
        }
        this.status = MembershipStatus.ACTIVE;
    }

    public void expire() {
        if (this.status != MembershipStatus.ACTIVE) {
            throw new DomainException("只有生效中的会员可以过期");
        }
        this.status = MembershipStatus.EXPIRED;
    }

    public boolean isActive() {
        return status == MembershipStatus.ACTIVE;
    }

    public boolean isExpired() {
        return status == MembershipStatus.EXPIRED;
    }
}
```

## 值对象模板

```java
@Getter
@EqualsAndHashCode
public class Money {

    private final BigDecimal amount;
    private final String currency;

    private Money(BigDecimal amount, String currency) {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new DomainException("金额不能为负数");
        }
        this.amount = amount;
        this.currency = currency;
    }

    // 工厂方法
    public static Money of(BigDecimal amount) {
        return new Money(amount, "CNY");
    }

    public static Money of(double amount) {
        return new Money(BigDecimal.valueOf(amount), "CNY");
    }

    // 业务操作
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new DomainException("货币类型不一致");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    public Money subtract(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new DomainException("货币类型不一致");
        }
        return new Money(this.amount.subtract(other.amount), this.currency);
    }

    public Money multiply(BigDecimal multiplier) {
        return new Money(this.amount.multiply(multiplier), this.currency);
    }

    public boolean greaterThan(Money other) {
        return this.amount.compareTo(other.amount) > 0;
    }
}
```

## 领域事件模板

```java
@Getter
public class MembershipCreatedEvent extends DomainEvent {

    private final String membershipId;
    private final String userId;
    private final MembershipLevel level;
    private final LocalDateTime createdAt;

    public MembershipCreatedEvent(String membershipId, String userId, MembershipLevel level) {
        this.membershipId = membershipId;
        this.userId = userId;
        this.level = level;
        this.createdAt = LocalDateTime.now();
    }
}
```

## DomainException 模板

```java
@Getter
public class DomainException extends RuntimeException {

    private final String code;

    public DomainException(String code, String message) {
        super(message);
        this.code = code;
    }

    public DomainException(String message) {
        this("BUSINESS_ERROR", message);
    }
}
```
