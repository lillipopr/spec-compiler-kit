# 验证工具

## 概述

提供数据验证、格式检查、约束校验等验证功能。

## 工具列表

### 1. 验证 JSON 格式

#### 功能
验证字符串是否为有效的 JSON 格式。

#### 参数
- `content`: 待验证内容（必填）

#### 返回
- 验证结果（true/false）
- 解析后的 JSON 对象（如果有效）
- 错误信息（如果无效）

#### 示例
```typescript
const result = await validateJson('{"name": "test"}');
if (result.valid) {
  console.log(result.data);
}
```

---

### 2. 验证 Markdown 格式

#### 功能
验证字符串是否为有效的 Markdown 格式。

#### 参数
- `content`: 待验证内容（必填）
- `strict`: 是否严格模式（可选，默认 false）

#### 返回
- 验证结果（true/false）
- 错误位置和原因（如果无效）

#### 示例
```typescript
const result = await validateMarkdown('# Title\\n\\nContent');
if (result.valid) {
  console.log('Markdown is valid');
}
```

---

### 3. 验证文件路径

#### 功能
验证文件路径是否合法和安全。

#### 参数
- `path`: 文件路径（必填）
- `checkExistence`: 是否检查文件存在性（可选，默认 false）

#### 返回
- 验证结果（true/false）
- 标准化后的路径
- 错误信息（如果无效）

#### 示例
```typescript
const result = await validatePath('/path/to/file.md');
if (result.valid) {
  console.log(result.normalizedPath);
}
```

---

### 4. 验证 Agent 定义

#### 功能
验证 Agent 文件是否符合规范。

#### 参数
- `path`: Agent 文件路径（必填）

#### 返回
- 验证结果（true/false）
- 缺失字段列表（如果有）
- 错误信息（如果无效）

#### 示例
```typescript
const result = await validateAgent('/agents/product-manager/AGENT.md');
if (result.valid) {
  console.log('Agent is valid');
} else {
  console.log('Missing fields:', result.missingFields);
}
```

---

### 5. 验证 Skill 定义

#### 功能
验证 Skill 文件是否符合规范。

#### 参数
- `path`: Skill 文件路径（必填）

#### 返回
- 验证结果（true/false）
- 缺失字段列表（如果有）
- 错误信息（如果无效）

#### 示例
```typescript
const result = await validateSkill('/skills/for-product-manager/SKILL.md');
if (result.valid) {
  console.log('Skill is valid');
} else {
  console.log('Missing fields:', result.missingFields);
}
```

---

### 6. 验证命名规范

#### 功能
验证文件/目录命名是否符合项目规范。

#### 参数
- `name`: 待验证名称（必填）
- `type`: 类型（agent/skill/command，必填）

#### 返回
- 验证结果（true/false）
- 建议的命名（如果不符合规范）

#### 示例
```typescript
// 验证 Agent 命名
const result = await validateNaming('product-manager', 'agent');
if (result.valid) {
  console.log('Naming is valid');
}
```

---

### 7. 验证引用完整性

#### 功能
验证 Agent/Skill 文件中的引用路径是否存在。

#### 参数
- `path`: 文件路径（必填）

#### 返回
- 验证结果（true/false）
- 无效引用列表（如果有）

#### 示例
```typescript
const result = await validateReferences('/commands/dev-feature.md');
if (result.valid) {
  console.log('All references are valid');
} else {
  console.log('Invalid references:', result.invalidRefs);
}
```

---

## 使用场景

- Agent 需要验证用户输入格式
- Agent 需要检查配置文件格式
- Agent 需要验证文档结构
- Agent 需要检查引用完整性

## 注意事项

1. **错误友好**：提供清晰的错误提示
2. **性能考虑**：大文件验证时注意性能
3. **编码处理**：正确处理不同编码
4. **安全考虑**：防止恶意输入导致的问题
