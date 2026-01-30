# 文件工具

## 概述

提供文件读写、创建、删除、移动等基础文件操作工具。

## 工具列表

### 1. 读取文件

#### 功能
读取指定文件的内容。

#### 参数
- `path`: 文件路径（必填）
- `encoding`: 编码格式（可选，默认 utf-8）

#### 返回
- 文件内容字符串
- 错误信息（如果失败）

#### 示例
```typescript
const content = await readFile('/path/to/file.md');
```

---

### 2. 写入文件

#### 功能
将内容写入指定文件。

#### 参数
- `path`: 文件路径（必填）
- `content`: 文件内容（必填）
- `encoding`: 编码格式（可选，默认 utf-8）

#### 返回
- 写入成功确认
- 错误信息（如果失败）

#### 示例
```typescript
await writeFile('/path/to/file.md', 'Hello, World!');
```

---

### 3. 创建目录

#### 功能
递归创建目录。

#### 参数
- `path`: 目录路径（必填）
- `recursive`: 是否递归创建（可选，默认 true）

#### 返回
- 创建成功确认
- 错误信息（如果失败）

#### 示例
```typescript
await createDir('/path/to/directory');
```

---

### 4. 删除文件/目录

#### 功能
删除指定文件或目录。

#### 参数
- `path`: 文件/目录路径（必填）
- `recursive`: 是否递归删除（可选，用于目录）

#### 返回
- 删除成功确认
- 错误信息（如果失败）

#### 示例
```typescript
await deleteFile('/path/to/file.md');
await deleteDir('/path/to/directory', { recursive: true });
```

---

### 5. 复制文件

#### 功能
复制文件到目标位置。

#### 参数
- `src`: 源文件路径（必填）
- `dest`: 目标文件路径（必填）

#### 返回
- 复制成功确认
- 错误信息（如果失败）

#### 示例
```typescript
await copyFile('/path/to/src.md', '/path/to/dest.md');
```

---

### 6. 移动文件

#### 功能
移动文件到目标位置。

#### 参数
- `src`: 源文件路径（必填）
- `dest`: 目标文件路径（必填）

#### 返回
- 移动成功确认
- 错误信息（如果失败）

#### 示例
```typescript
await moveFile('/path/to/src.md', '/path/to/dest.md');
```

---

### 7. 列出目录

#### 功能
列出目录下的文件和子目录。

#### 参数
- `path`: 目录路径（必填）
- `recursive`: 是否递归列出（可选，默认 false）

#### 返回
- 文件/目录列表
- 错误信息（如果失败）

#### 示例
```typescript
const files = await listDir('/path/to/directory');
```

---

## 使用场景

- Agent 需要读写配置文件
- Agent 需要创建输出目录
- Agent 需要整理文件结构
- Agent 需要备份文件

## 注意事项

1. **路径安全性**：验证路径合法性，防止路径穿越
2. **权限检查**：操作前检查读写权限
3. **错误处理**：提供清晰的错误信息
4. **原子性**：关键操作支持事务回滚
