# 搜索工具

## 概述

提供文件内容搜索、模式匹配、正则表达式等搜索功能。

## 工具列表

### 1. 搜索文件

#### 功能
根据文件名模式搜索文件。

#### 参数
- `pattern`: 文件名模式（必填，支持通配符 * ?）
- `path`: 搜索路径（可选，默认当前目录）
- `recursive`: 是否递归搜索（可选，默认 true）

#### 返回
- 匹配的文件路径列表
- 错误信息（如果失败）

#### 示例
```typescript
// 搜索所有 .md 文件
const files = await searchFiles('*.md', '/path/to/dir');

// 搜索所有 agent 文件
const agents = await searchFiles('spec-*-agent.md', '/agents');
```

---

### 2. 搜索文件内容

#### 功能
在文件内容中搜索指定文本或正则表达式。

#### 参数
- `pattern`: 搜索模式（必填，支持正则表达式）
- `path`: 搜索路径（可选，默认当前目录）
- `filePattern`: 文件名模式过滤（可选）
- `caseSensitive`: 是否区分大小写（可选，默认 false）

#### 返回
- 匹配结果列表（文件路径、行号、匹配内容）
- 错误信息（如果失败）

#### 示例
```typescript
// 搜索包含 "TODO" 的所有文件
const results = await searchContent('TODO', '/path/to/dir');

// 使用正则搜索邮箱
const emails = await searchContent('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b');
```

---

### 3. 替换文件内容

#### 功能
在文件中替换指定文本。

#### 参数
- `path`: 文件路径（必填）
- `search`: 搜索模式（必填）
- `replace`: 替换文本（必填）
- `useRegex`: 是否使用正则表达式（可选，默认 false）

#### 返回
- 替换后的文件内容
- 替换数量统计
- 错误信息（如果失败）

#### 示例
```typescript
// 替换文本
const result = await replaceContent('/path/to/file.md', 'old', 'new');

// 使用正则替换
const result = await replaceContent('/path/to/file.md', '\\d+', 'X', { useRegex: true });
```

---

### 4. 获取文件信息

#### 功能
获取文件的元数据信息。

#### 参数
- `path`: 文件路径（必填）

#### 返回
- 文件信息（大小、修改时间、权限等）
- 错误信息（如果失败）

#### 示例
```typescript
const info = await getFileInfo('/path/to/file.md');
console.log(info.size, info.modifiedAt, info.permissions);
```

---

## 使用场景

- Agent 需要查找特定文件
- Agent 需要在代码中搜索特定模式
- Agent 需要批量替换文件内容
- Agent 需要获取文件统计信息

## 注意事项

1. **性能考虑**：大目录搜索时注意性能
2. **索引缓存**：频繁搜索可考虑建立索引
3. **正则安全**：验证正则表达式，防止 ReDoS
4. **编码处理**：正确处理不同编码的文件
