# Vite 构建工具

## 概述

Vite 是下一代前端构建工具，提供极速的开发服务器启动和热更新。

## 项目配置

### 基础配置

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### 环境变量

```typescript
// .env.development
VITE_API_URL=http://localhost:8080/api
VITE_APP_TITLE=My App Dev

// .env.production
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App

// 使用
const apiUrl = import.meta.env.VITE_API_URL
```

## 插件开发

### 自定义插件

```typescript
// plugins/my-plugin.ts
import type { Plugin } from 'vite'

export function myPlugin(): Plugin {
  return {
    name: 'my-plugin',
    transform(code, id) {
      if (id.endsWith('.vue')) {
        return code.replace(/foo/g, 'bar')
      }
    }
  }
}

// vite.config.ts
import { myPlugin } from './plugins/my-plugin'

export default defineConfig({
  plugins: [vue(), myPlugin()]
})
```

## 性能优化

### 构建优化

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### 依赖预构建

```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios'],
    exclude: ['@vueuse/components']
  }
})
```

### CSS 代码分割

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
```

## 开发体验优化

### 快速刷新

```typescript
export default defineConfig({
  server: {
    hmr: {
      overlay: true
    }
  }
})
```

### 源码映射

```typescript
export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapFileNames: '[name]-[hash].map'
      }
    }
  }
})
```

## 常见问题

### 路径别名

```typescript
// ❌ 错误：import { foo } from '@/foo'
// ✅ 正确：import { foo } from '@/foo'

// vite.config.ts
resolve: {
  alias: {
    '@': resolve(__dirname, './src')
  }
}
```

### 动态导入

```typescript
// ✅ 使用动态导入
const modules = import.meta.glob('./modules/*.ts')
for (const path in modules) {
  modules[path]()
}
```

### SSR 兼容

```typescript
// ✅ 条件导入
import { isClient } from '@/utils/env'

const users = isClient ? await fetchUsers() : []
```

## 监听模式

```typescript
export default defineConfig({
  build: {
    watch: {}
  }
})
```
