# Controller 模板

## 规范

- 只使用 POST 请求
- 参数必须封装成 XxxParam
- 统一返回 ApiResponse<XxxDTO>
- 使用 @Valid 校验参数
- 使用 @RequestBody 接收参数

## 模板

```java
@RestController
@RequestMapping("/api/memberships")
@RequiredArgsConstructor
@Tag(name = "会员管理", description = "会员相关接口")
public class MembershipController {

    private final MembershipApplication membershipApplication;

    @PostMapping("/create")
    @Operation(summary = "创建会员")
    public ApiResponse<MembershipDTO> createMembership(@Valid @RequestBody CreateMembershipParam param) {
        MembershipDTO result = membershipApplication.createMembership(param);
        return ApiResponse.success(result);
    }

    @PostMapping("/query")
    @Operation(summary = "查询会员")
    public ApiResponse<List<MembershipDTO>> queryMemberships(@Valid @RequestBody QueryMembershipsParam param) {
        List<MembershipDTO> result = membershipApplication.queryMemberships(param);
        return ApiResponse.success(result);
    }

    @PostMapping("/update")
    @Operation(summary = "更新会员")
    public ApiResponse<MembershipDTO> updateMembership(@Valid @RequestBody UpdateMembershipParam param) {
        MembershipDTO result = membershipApplication.updateMembership(param);
        return ApiResponse.success(result);
    }

    @PostMapping("/delete")
    @Operation(summary = "删除会员")
    public ApiResponse<Void> deleteMembership(@Valid @RequestBody DeleteMembershipParam param) {
        membershipApplication.deleteMembership(param);
        return ApiResponse.success();
    }
}
```

## Param 模板

```java
@Data
@Schema(description = "创建会员参数")
public class CreateMembershipParam {

    @NotBlank(message = "用户ID不能为空")
    @Schema(description = "用户ID", example = "user_123")
    private String userId;

    @NotNull(message = "会员等级不能为空")
    @Schema(description = "会员等级", example = "PLUS")
    private MembershipLevel level;

}
```

## DTO 模板

```java
@Data
@Builder
@Schema(description = "会员信息")
public class MembershipDTO {

    @Schema(description = "会员ID")
    private String id;

    @Schema(description = "用户ID")
    private String userId;

    @Schema(description = "会员等级")
    private MembershipLevel level;

    @Schema(description = "会员状态")
    private MembershipStatus status;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    public static MembershipDTO from(Membership membership) {
        return MembershipDTO.builder()
            .id(membership.getId())
            .userId(membership.getUserId())
            .level(membership.getLevel())
            .status(membership.getStatus())
            .createdAt(membership.getCreatedAt())
            .build();
    }
}
```

## ApiResponse 模板

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    @Builder.Default
    private boolean success = true;

    private String code;

    private String message;

    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .build();
    }

    public static <T> ApiResponse<T> success() {
        return ApiResponse.<T>builder()
            .success(true)
            .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .code(code)
            .message(message)
            .build();
    }
}
```
