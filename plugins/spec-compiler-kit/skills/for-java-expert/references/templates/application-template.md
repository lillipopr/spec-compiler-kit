# Application 模板

## 规范

- 定义 Application 接口
- 实现 ApplicationImpl
- 职责：业务编排、数据查询、数据持久化、DTO 转换
- 使用 @Transactional 管理事务
- 依赖 Repository 和 Domain

## 接口模板

```java
public interface MembershipApplication {
    MembershipDTO createMembership(CreateMembershipParam param);
    MembershipDTO getMembership(GetMembershipParam param);
    List<MembershipDTO> queryMemberships(QueryMembershipsParam param);
    void updateMembership(UpdateMembershipParam param);
    void deleteMembership(DeleteMembershipParam param);
}
```

## 实现模板

```java
@Service
@RequiredArgsConstructor
public class MembershipApplicationImpl implements MembershipApplication {

    // 数据访问
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;

    // 业务计算
    private final MembershipDomain membershipDomain;

    @Override
    @Transactional
    public MembershipDTO createMembership(CreateMembershipParam param) {
        // 1. 数据查询（Application 层）
        boolean emailExists = userRepository.existsByEmail(param.getEmail());

        // 2. 业务计算（Domain 层）
        Membership membership = membershipDomain.createMembership(
            param.getUserId(),
            param.getLevel(),
            emailExists
        );

        // 3. 数据持久化（Application 层）
        Membership savedMembership = membershipRepository.save(membership);

        // 4. DTO 转换（Application 层）
        return MembershipDTO.from(savedMembership);
    }

    @Override
    public MembershipDTO getMembership(GetMembershipParam param) {
        return membershipRepository.findById(param.getId())
            .map(MembershipDTO::from)
            .orElseThrow(() -> new NotFoundException("会员不存在"));
    }

    @Override
    public List<MembershipDTO> queryMemberships(QueryMembershipsParam param) {
        List<Membership> memberships = membershipRepository.query(param);
        return memberships.stream()
            .map(MembershipDTO::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateMembership(UpdateMembershipParam param) {
        Membership membership = membershipRepository.findById(param.getId())
            .orElseThrow(() -> new NotFoundException("会员不存在"));

        // 业务计算
        membershipDomain.updateMembership(membership, param.getLevel());

        // 数据持久化
        membershipRepository.save(membership);
    }

    @Override
    @Transactional
    public void deleteMembership(DeleteMembershipParam param) {
        membershipRepository.deleteById(param.getId());
    }
}
```

## Repository 模板

```java
// 接口
public interface MembershipRepository {
    Membership save(Membership membership);
    Optional<Membership> findById(String id);
    List<Membership> query(QueryMembershipsParam param);
    boolean existsByUserId(String userId);
    void deleteById(String id);
}

// 实现
@Repository
@RequiredArgsConstructor
public class MembershipRepositoryImpl implements MembershipRepository {

    private final MembershipMapper membershipMapper;

    @Override
    public Membership save(Membership membership) {
        MembershipPO po = MembershipPO.from(membership);
        if (po.getId() == null) {
            membershipMapper.insert(po);
        } else {
            membershipMapper.updateById(po);
        }
        return po.toDomain();
    }

    @Override
    public Optional<Membership> findById(String id) {
        return Optional.ofNullable(membershipMapper.selectById(id))
            .map(MembershipPO::toDomain);
    }

    @Override
    public List<Membership> query(QueryMembershipsParam param) {
        return membershipMapper.selectList(
            new LambdaQueryWrapper<MembershipPO>()
                .eq(MembershipPO::getUserId, param.getUserId())
                .eq(MembershipPO::getStatus, param.getStatus())
        ).stream().map(MembershipPO::toDomain).collect(Collectors.toList());
    }

    @Override
    public boolean existsByUserId(String userId) {
        return membershipMapper.selectCount(
            new LambdaQueryWrapper<MembershipPO>()
                .eq(MembershipPO::getUserId, userId)
                .in(MembershipPO::getStatus, MembershipStatus.ACTIVE, MembershipStatus.SUSPENDED)
        ) > 0;
    }

    @Override
    public void deleteById(String id) {
        membershipMapper.deleteById(id);
    }
}
```
