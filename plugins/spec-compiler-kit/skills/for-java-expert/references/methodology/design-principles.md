# 其他设计原则

## DRY 原则（Don't Repeat Yourself）

### 核心思想

> 每一块知识都必须在系统中只有一个单一、明确的表示。

### 识别重复代码的类型

| 重复类型 | 示例 | 解决方案 |
|----------|------|----------|
| **逻辑重复** | 相同的计算逻辑出现在多处 | 提取公共方法 |
| **数据来源重复** | 从不同地方获取相同数据 | 统一数据来源 |
| **结构重复** | 相似的 if-else 结构 | 使用策略模式 |
| **代码块重复** | 复制粘贴的代码片段 | 提取方法/工具类 |

### 实践案例

**问题**：进度计算逻辑重复

```java
// ❌ 违反 DRY
public AssessmentStartResultDTO startAssessment(StartAssessmentParam param) {
    int totalQuestions = (int) assessmentNodeList.stream()
        .filter(i -> AssessmentNodeType.isQuestion(i.getNodeType())).count();
    ProgressDTO progress = new ProgressDTO();
    progress.setCurrent(1);
    progress.setTotal(totalQuestions);
    progress.setPercentage(totalQuestions > 0 ? (int) (1.0 * 100 / totalQuestions) : 0);
    return result;
}

private AssessmentStartResultDTO buildStartResultFromExisting(/* ... */) {
    QuestionBank questionBank = questionBankMapper.findByBankId(bankId);
    int totalQuestions = questionBank.getTotalQuestions() != null
        ? questionBank.getTotalQuestions() : 0;
    List<UserAnswer> answers = userAnswerMapper.findByAssessmentId(userId, assessmentId);
    int answeredCount = answers.size();
    ProgressDTO progress = new ProgressDTO();
    progress.setCurrent(answeredCount);
    progress.setTotal(totalQuestions);
    progress.setPercentage(totalQuestions > 0 ? (int) (answeredCount * 100.0 / totalQuestions) : 0);
    return result;
}

// ✅ 遵循 DRY
private ProgressDTO calculateProgress(String userId, String assessmentId, String bankId) {
    QuestionBank questionBank = questionBankMapper.findByBankId(bankId);
    int totalQuestions = questionBank.getTotalQuestions() != null
        ? questionBank.getTotalQuestions() : 0;
    List<UserAnswer> answers = userAnswerMapper.findByAssessmentId(userId, assessmentId);
    int answeredCount = answers.size();

    ProgressDTO progress = new ProgressDTO();
    progress.setCurrent(answeredCount);
    progress.setTotal(totalQuestions);
    progress.setPercentage(totalQuestions > 0 ? (int) (answeredCount * 100.0 / totalQuestions) : 0);
    return progress;
}
```

---

## KISS 原则（Keep It Simple, Stupid）

### 核心思想

> 保持代码简单、直接、易读。简单的设计比复杂的设计更优越。

### 复杂度来源与简化策略

| 复杂度来源 | 简化策略 |
|------------|----------|
| 过度抽象 | 只在有重复时才抽象，一次性的代码直接写 |
| 过度设计 | 预留扩展点，但不提前实现 |
| 嵌套过深 | 使用早返回（guard clause）减少嵌套 |
| 过长方法 | 拆分为小方法，但不要过度拆分 |
| 晦涩命名 | 使用清晰、直白的命名 |

### 实践案例

```java
// ❌ 复杂：嵌套过深
public void process(Order order) {
    if (order != null) {
        if (order.getStatus() != null) {
            if (order.getStatus() == OrderStatus.PENDING) {
                if (order.getAmount() != null && order.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                    // 实际逻辑
                }
            }
        }
    }
}

// ✅ 简化：早返回
public void process(Order order) {
    if (order == null) {
        return;
    }
    if (order.getStatus() != OrderStatus.PENDING) {
        return;
    }
    if (order.getAmount() == null || order.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
        return;
    }
    // 实际逻辑
}
```

---

## YAGNI 原则（You Aren't Gonna Need It）

### 核心思想

> 不要为可能不会出现的需求做设计。

### 常见过度设计信号

| 信号 | 说明 | 正确做法 |
|------|------|----------|
| 🔴 提前定义接口 | 只有一个实现也要定义接口 | 等有第二个实现再抽接口 |
| 🔴 过度分层 | 简单 CRUD 也搞 5 层 | 复杂度决定分层，简单 3 层足够 |
| 🔴 过度配置 | 可配化一切 | 只配置真正需要变化的参数 |
| 🔴 过度解耦 | 一个方法拆成 5 个类 | 保持合理的内聚性 |

### 实践案例

```java
// ❌ 过度设计：只有一个实现也定义接口
public interface OrderService {
    Order createOrder(CreateOrderParam param);
}

@Service
public class OrderServiceImpl implements OrderService {
    // 只有一个实现，接口是多余的
}

// ✅ 正确：直接使用类
@Service
public class OrderApplication {
    // 等有第二个实现再抽接口
    public Order createOrder(CreateOrderParam param) {
        // 实现逻辑
    }
}
```

---

## 原则优先级

当原则冲突时，按以下优先级决策：

1. **KISS > DRY** - 宁可重复，也不要过度抽象
2. **YAGNI > 扩展性** - 不要为未来可能不需要的需求设计
3. **SOLID > 设计模式** - 理解原则比套用模式更重要

### 实践建议

```
重复 3 次 → 提取（DRY）
重复 2 次 → 观察等待
重复 1 次 → 保持简单（KISS）

复杂业务 → SOLID + DDD
简单 CRUD → 保持简单（YAGNI）
```
