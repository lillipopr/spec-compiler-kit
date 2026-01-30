# Service 模板

## 基础模板

```typescript
/**
 * @description Service 描述
 * @author 作者
 */

import { injectable } from 'tsyringe'

@injectable()
export class XxxService {
  constructor(
    // 依赖注入
  ) {}

  async method(): Promise<ReturnType> {
    // 实现
  }
}
```

---

## 用户服务模板

```typescript
/**
 * @description 用户服务
 * 负责用户相关的业务逻辑
 * @author Your Name
 */

import { injectable } from 'tsyringe'
import type { UserAPI } from '@/api/userApi'
import type { User, CreateUserDTO, UpdateUserDTO, GetUserParams } from '@/models/user'

interface UserListResult {
  data: User[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

@injectable()
export class UserService {
  constructor(
    private readonly userAPI: UserAPI
  ) {}

  /**
   * 获取用户列表
   * @param params 查询参数
   * @returns 用户列表和分页信息
   */
  async getUsers(params: GetUserParams): Promise<UserListResult> {
    const response = await this.userAPI.getUsers(params)

    // DTO 转换为领域模型
    const data = response.data.map(this.toDomain)

    return {
      data,
      meta: response.meta
    }
  }

  /**
   * 根据 ID 获取用户
   * @param userId 用户 ID
   * @returns 用户信息
   * @throws {NotFoundException} 用户不存在
   */
  async getUserById(userId: string): Promise<User> {
    const response = await this.userAPI.getUserById(userId)

    if (!response.data) {
      throw new NotFoundException(`用户 ${userId} 不存在`)
    }

    return this.toDomain(response.data)
  }

  /**
   * 创建用户
   * @param data 创建用户 DTO
   * @returns 创建的用户
   * @throws {BusinessException} 邮箱已存在
   */
  async createUser(data: CreateUserDTO): Promise<User> {
    // 业务规则验证
    await this.validateEmailUnique(data.email)

    const response = await this.userAPI.createUser(data)
    return this.toDomain(response.data)
  }

  /**
   * 更新用户
   * @param userId 用户 ID
   * @param data 更新用户 DTO
   * @returns 更新后的用户
   */
  async updateUser(userId: string, data: UpdateUserDTO): Promise<User> {
    // 业务规则验证
    await this.validateUserExists(userId)
    if (data.email) {
      await this.validateEmailUnique(data.email, userId)
    }

    const response = await this.userAPI.updateUser(userId, data)
    return this.toDomain(response.data)
  }

  /**
   * 删除用户
   * @param userId 用户 ID
   */
  async deleteUser(userId: string): Promise<void> {
    // 业务规则验证
    await this.validateUserExists(userId)
    await this.validateUserCanBeDeleted(userId)

    await this.userAPI.deleteUser(userId)
  }

  /**
   * 批量删除用户
   * @param userIds 用户 ID 列表
   */
  async batchDeleteUsers(userIds: string[]): Promise<void> {
    await Promise.all(
      userIds.map(id => this.deleteUser(id))
    )
  }

  // ==================== 私有方法 ====================

  /**
   * DTO 转换为领域模型
   */
  private toDomain(dto: UserDTO): User {
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      role: dto.role,
      status: dto.status,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    }
  }

  /**
   * 验证邮箱唯一性
   */
  private async validateEmailUnique(
    email: string,
    excludeUserId?: string
  ): Promise<void> {
    const existing = await this.userAPI.getUserByEmail(email)
    if (existing && existing.id !== excludeUserId) {
      throw new BusinessException('邮箱已被使用')
    }
  }

  /**
   * 验证用户存在
   */
  private async validateUserExists(userId: string): Promise<void> {
    const user = await this.userAPI.getUserById(userId)
    if (!user) {
      throw new NotFoundException(`用户 ${userId} 不存在`)
    }
  }

  /**
   * 验证用户可删除
   */
  private async validateUserCanBeDeleted(userId: string): Promise<void> {
    // 检查用户是否有未完成的订单
    // const hasActiveOrders = await this.orderAPI.hasActiveOrders(userId)
    // if (hasActiveOrders) {
    //   throw new BusinessException('用户有未完成的订单，无法删除')
    // }
  }
}

// ==================== 自定义异常 ====================
class BusinessException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BusinessException'
  }
}

class NotFoundException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundException'
  }
}
```

---

## 认证服务模板

```typescript
/**
 * @description 认证服务
 * 负责用户登录、登出、Token 管理等
 * @author Your Name
 */

import { injectable } from 'tsyringe'
import type { AuthAPI } from '@/api/authApi'
import type { LoginDTO, RegisterDTO, TokenPair } from '@/models/auth'

@injectable()
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token'
  private readonly REFRESH_TOKEN_KEY = 'refresh_token'

  constructor(
    private readonly authAPI: AuthAPI
  ) {}

  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns 用户信息和 Token
   */
  async login(credentials: LoginDTO): Promise<{
    user: User
    tokens: TokenPair
  }> {
    const response = await this.authAPI.login(credentials)

    // 存储 Token
    this.storeTokens(response.data.tokens)

    return {
      user: response.data.user,
      tokens: response.data.tokens
    }
  }

  /**
   * 用户注册
   * @param data 注册信息
   * @returns 用户信息和 Token
   */
  async register(data: RegisterDTO): Promise<{
    user: User
    tokens: TokenPair
  }> {
    const response = await this.authAPI.register(data)

    // 存储 Token
    this.storeTokens(response.data.tokens)

    return {
      user: response.data.user,
      tokens: response.data.tokens
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      await this.authAPI.logout()
    } finally {
      // 无论 API 调用成功与否，都清除本地 Token
      this.clearTokens()
    }
  }

  /**
   * 刷新 Token
   * @returns 新的 Token 对
   */
  async refreshToken(): Promise<TokenPair> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await this.authAPI.refreshToken(refreshToken)

    // 更新 Token
    this.storeTokens(response.data)

    return response.data
  }

  /**
   * 获取当前 Token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // ==================== 私有方法 ====================

  private storeTokens(tokens: TokenPair): void {
    localStorage.setItem(this.TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken)
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }
}
```

---

## 文件上传服务模板

```typescript
/**
 * @description 文件上传服务
 * 负责文件上传、进度跟踪、预览等
 * @author Your Name
 */

import { injectable } from 'tsyringe'
import type { UploadAPI } from '@/api/uploadApi'
import type { UploadOptions, UploadResult } from '@/models/upload'

interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

@injectable()
export class UploadService {
  constructor(
    private readonly uploadAPI: UploadAPI
  ) {}

  /**
   * 上传单个文件
   * @param file 文件对象
   * @param options 上传选项
   * @param onProgress 进度回调
   * @returns 上传结果
   */
  async uploadFile(
    file: File,
    options?: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // 验证文件
    this.validateFile(file, options)

    // 准备上传
    const formData = new FormData()
    formData.append('file', file)

    if (options?.path) {
      formData.append('path', options.path)
    }

    // 执行上传
    const response = await this.uploadAPI.upload(formData, (event) => {
      if (onProgress && event.total) {
        const percent = Math.round((event.loaded * 100) / event.total)
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent
        })
      }
    })

    return {
      url: response.data.url,
      filename: response.data.filename,
      size: response.data.size
    }
  }

  /**
   * 批量上传文件
   * @param files 文件列表
   * @param options 上传选项
   * @param onProgress 进度回调
   * @returns 上传结果列表
   */
  async uploadFiles(
    files: File[],
    options?: UploadOptions,
    onProgress?: (current: number, total: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadFile(files[i], options)
      results.push(result)

      if (onProgress) {
        onProgress(i + 1, files.length)
      }
    }

    return results
  }

  /**
   * 获取文件预览 URL
   * @param file 文件对象
   * @returns 预览 URL
   */
  getPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  /**
   * 释放预览 URL
   * @param url 预览 URL
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }

  // ==================== 私有方法 ====================

  /**
   * 验证文件
   */
  private validateFile(file: File, options?: UploadOptions): void {
    // 检查文件大小
    const maxSize = options?.maxSize ?? 10 * 1024 * 1024 // 默认 10MB
    if (file.size > maxSize) {
      throw new Error(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`)
    }

    // 检查文件类型
    if (options?.allowedTypes) {
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!options.allowedTypes.includes(fileExt || '')) {
        throw new Error(`不支持的文件类型，仅支持: ${options.allowedTypes.join(', ')}`)
      }
    }
  }
}
```

---

## 缓存服务模板

```typescript
/**
 * @description 缓存服务
 * 提供内存缓存和 LocalStorage 缓存
 * @author Your Name
 */

interface CacheOptions {
  ttl?: number // 过期时间（毫秒）
  prefix?: string // 键前缀
}

interface CacheItem<T> {
  value: T
  expiresAt: number | null
}

@injectable()
export class CacheService {
  private memoryCache = new Map<string, CacheItem<any>>()
  private defaultPrefix = 'app_cache'

  /**
   * 设置缓存（内存）
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const item: CacheItem<T> = {
      value,
      expiresAt: options?.ttl ? Date.now() + options.ttl : null
    }

    const fullKey = this.getFullKey(key, options?.prefix)
    this.memoryCache.set(fullKey, item)
  }

  /**
   * 获取缓存（内存）
   */
  get<T>(key: string, prefix?: string): T | null {
    const fullKey = this.getFullKey(key, prefix)
    const item = this.memoryCache.get(fullKey)

    if (!item) return null

    // 检查是否过期
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.memoryCache.delete(fullKey)
      return null
    }

    return item.value
  }

  /**
   * 删除缓存（内存）
   */
  delete(key: string, prefix?: string): void {
    const fullKey = this.getFullKey(key, prefix)
    this.memoryCache.delete(fullKey)
  }

  /**
   * 清空缓存（内存）
   */
  clear(): void {
    this.memoryCache.clear()
  }

  /**
   * 设置缓存（LocalStorage）
   */
  setStorage<T>(key: string, value: T, options?: CacheOptions): void {
    const item: CacheItem<T> = {
      value,
      expiresAt: options?.ttl ? Date.now() + options.ttl : null
    }

    const fullKey = this.getFullKey(key, options?.prefix)
    localStorage.setItem(fullKey, JSON.stringify(item))
  }

  /**
   * 获取缓存（LocalStorage）
   */
  getStorage<T>(key: string, prefix?: string): T | null {
    const fullKey = this.getFullKey(key, prefix)
    const json = localStorage.getItem(fullKey)

    if (!json) return null

    try {
      const item: CacheItem<T> = JSON.parse(json)

      // 检查是否过期
      if (item.expiresAt && item.expiresAt < Date.now()) {
        localStorage.removeItem(fullKey)
        return null
      }

      return item.value
    } catch {
      return null
    }
  }

  /**
   * 删除缓存（LocalStorage）
   */
  deleteStorage(key: string, prefix?: string): void {
    const fullKey = this.getFullKey(key, prefix)
    localStorage.removeItem(fullKey)
  }

  // ==================== 私有方法 ====================

  private getFullKey(key: string, prefix?: string): string {
    const actualPrefix = prefix ?? this.defaultPrefix
    return `${actualPrefix}:${key}`
  }
}
```
