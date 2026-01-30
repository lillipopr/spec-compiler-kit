#!/usr/bin/env node

/**
 * Architecture Layer Check Hook
 *
 * 触发条件：编辑 *.java, *.swift, *.vue, *.ts 文件
 * 优先级：high（警告不阻止）
 *
 * 检查代码是否违反分层架构规范，输出违规警告
 */

const fs = require('fs');
const path = require('path');

/**
 * 架构规则定义
 */
const ARCHITECTURE_RULES = {
  java: {
    name: 'DDD 分层',
    layers: ['Controller', 'Application', 'Domain', 'Gateway', 'Mapper'],
    allowedDependencies: {
      'Controller': ['Application'],
      'Application': ['Domain'],
      'Domain': [],
      'Gateway': ['Domain'],
      'Mapper': ['Domain']
    },
    rule: 'Controller → Application → Domain ← Gateway, Mapper(Gateway)'
  },
  swift: {
    name: 'MVVM 分层',
    layers: ['View', 'ViewModel', 'Service', 'Gateway', 'Network'],
    allowedDependencies: {
      'View': ['ViewModel'],
      'ViewModel': ['Service'],
      'Service': ['Gateway'],
      'Gateway': ['Network'],
      'Network': []
    },
    rule: 'View → ViewModel → Service → Gateway → Network'
  },
  vue: {
    name: 'Vue 3 前端分层',
    layers: ['View', 'Composable', 'Service', 'API', 'Request'],
    allowedDependencies: {
      'View': ['Composable'],
      'Composable': ['Service'],
      'Service': ['API'],
      'API': ['Request'],
      'Request': []
    },
    rule: 'View → Composable → Service → API → Request'
  },
  typescript: {
    name: 'TypeScript 通用分层',
    layers: ['Controller', 'Service', 'Repository', 'Model'],
    allowedDependencies: {
      'Controller': ['Service'],
      'Service': ['Repository', 'Model'],
      'Repository': ['Model'],
      'Model': []
    },
    rule: 'Controller → Service → Repository → Model'
  }
};

/**
 * 根据文件路径确定文件类型和所属层
 * @param {string} filePath - 文件路径
 * @returns {object} { type: string, layer: string|null }
 */
function detectFileLayer(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Java 文件
  if (ext === '.java') {
    const pathLower = normalizedPath.toLowerCase();
    if (pathLower.includes('/controller/')) return { type: 'java', layer: 'Controller' };
    if (pathLower.includes('/application/') || pathLower.includes('/appservice/')) return { type: 'java', layer: 'Application' };
    if (pathLower.includes('/domain/') || pathLower.includes('/entity/')) return { type: 'java', layer: 'Domain' };
    if (pathLower.includes('/gateway/') || pathLower.includes('/infra/')) return { type: 'java', layer: 'Gateway' };
    if (pathLower.includes('/mapper/') || pathLower.includes('/dao/')) return { type: 'java', layer: 'Mapper' };
  }

  // Swift 文件
  if (ext === '.swift') {
    const pathLower = normalizedPath.toLowerCase();
    if (pathLower.includes('/views/') || pathLower.includes('/view/')) return { type: 'swift', layer: 'View' };
    if (pathLower.includes('/viewmodels/') || pathLower.includes('/viewmodel/')) return { type: 'swift', layer: 'ViewModel' };
    if (pathLower.includes('/services/') || pathLower.includes('/service/')) return { type: 'swift', layer: 'Service' };
    if (pathLower.includes('/gateways/') || pathLower.includes('/gateway/')) return { type: 'swift', layer: 'Gateway' };
    if (pathLower.includes('/network/') || pathLower.includes('/api/')) return { type: 'swift', layer: 'Network' };
  }

  // Vue 文件
  if (ext === '.vue') {
    return { type: 'vue', layer: 'View' };
  }

  // TypeScript 文件
  if (ext === '.ts' || ext === '.tsx') {
    const pathLower = normalizedPath.toLowerCase();
    // Vue 项目
    if (pathLower.includes('/views/') || pathLower.includes('/view/')) return { type: 'vue', layer: 'View' };
    if (pathLower.includes('/composables/') || pathLower.includes('/composable/')) return { type: 'vue', layer: 'Composable' };
    if (pathLower.includes('/services/') || pathLower.includes('/service/')) return { type: 'vue', layer: 'Service' };
    if (pathLower.includes('/api/')) return { type: 'vue', layer: 'API' };
    if (pathLower.includes('/utils/request')) return { type: 'vue', layer: 'Request' };
    // 通用 TypeScript
    if (pathLower.includes('/controller/')) return { type: 'typescript', layer: 'Controller' };
    if (pathLower.includes('/service/')) return { type: 'typescript', layer: 'Service' };
    if (pathLower.includes('/repository/')) return { type: 'typescript', layer: 'Repository' };
    if (pathLower.includes('/model/')) return { type: 'typescript', layer: 'Model' };
  }

  return { type: null, layer: null };
}

/**
 * 解析文件中的 import/依赖语句
 * @param {string} content - 文件内容
 * @param {string} type - 文件类型
 * @returns {Array<string>} 导入的模块/类名列表
 */
function parseImports(content, type) {
  const imports = [];

  if (type === 'java') {
    // Java: import xxx.xxx.ClassName;
    const importRegex = /import\s+([a-zA-Z0-9_.]+)\s*;/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  } else if (type === 'swift') {
    // Swift: import ModuleName
    const importRegex = /import\s+([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  } else if (type === 'vue' || type === 'typescript') {
    // TypeScript/Vue: import xxx from 'xxx'
    const importRegex = /import\s+(?:\{[^}]*\}|\w+|\*\s+as\s+\w+)\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
}

/**
 * 从导入路径推断所属层
 * @param {string} importPath - 导入路径
 * @param {string} type - 文件类型
 * @returns {string|null} 层名称
 */
function inferLayerFromImport(importPath, type) {
  const pathLower = importPath.toLowerCase();

  if (type === 'java') {
    if (pathLower.includes('.controller.')) return 'Controller';
    if (pathLower.includes('.application.') || pathLower.includes('.appservice.')) return 'Application';
    if (pathLower.includes('.domain.') || pathLower.includes('.entity.')) return 'Domain';
    if (pathLower.includes('.gateway.') || pathLower.includes('.infra.')) return 'Gateway';
    if (pathLower.includes('.mapper.') || pathLower.includes('.dao.')) return 'Mapper';
  }

  if (type === 'swift') {
    if (pathLower.includes('viewmodel')) return 'ViewModel';
    if (pathLower.includes('service')) return 'Service';
    if (pathLower.includes('gateway')) return 'Gateway';
    if (pathLower.includes('network') || pathLower.includes('api')) return 'Network';
  }

  if (type === 'vue') {
    if (pathLower.includes('composable')) return 'Composable';
    if (pathLower.includes('service')) return 'Service';
    if (pathLower.includes('api/')) return 'API';
    if (pathLower.includes('request')) return 'Request';
  }

  return null;
}

/**
 * 检查架构违规
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @returns {Array<object>} 违规列表
 */
function checkArchitectureViolations(filePath, content) {
  const violations = [];

  // 检测文件类型和所属层
  const { type, layer } = detectFileLayer(filePath);

  if (!type || !layer) {
    // 无法识别类型或层，跳过检查
    return violations;
  }

  const rules = ARCHITECTURE_RULES[type];
  if (!rules) {
    return violations;
  }

  // 解析导入
  const imports = parseImports(content, type);

  // 检查每个导入是否违反规则
  for (const imp of imports) {
    const depLayer = inferLayerFromImport(imp, type);

    if (depLayer && depLayer !== layer) {
      const allowedDeps = rules.allowedDependencies[layer] || [];

      if (!allowedDeps.includes(depLayer)) {
        violations.push({
          layer,
          dependency: imp,
          dependencyLayer: depLayer,
          rule: rules.rule
        });
      }
    }
  }

  return violations;
}

/**
 * 格式化违规消息
 * @param {string} filePath - 文件路径
 * @param {Array<object>} violations - 违规列表
 * @returns {string} 格式化的警告消息
 */
function formatViolationMessage(filePath, violations) {
  if (violations.length === 0) {
    return '';
  }

  let message = `⚠️ 架构分层警告：检测到违规依赖\n\n文件：${filePath}\n层级：${violations[0].layer}\n\n违规依赖：\n`;

  for (const v of violations) {
    message += `- ${v.dependency}（${v.dependencyLayer}）\n`;
  }

  message += `\n架构规则：${violations[0].rule}\n`;
  message += `建议：移除违规依赖，调整文件位置或通过正确的层进行调用\n`;

  return message;
}

/**
 * Hook 入口函数
 */
function main() {
  let inputData = '';

  try {
    // 从 stdin 读取输入数据
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      inputData += chunk;
    });

    process.stdin.on('end', () => {
      try {
        const data = inputData.trim() ? JSON.parse(inputData) : {};

        // 提取文件路径和内容
        const filePath = data.tool_input?.file_path || data.file_path;
        const content = data.tool_input?.new_content || data.content;

        if (!filePath || !content) {
          // 无法获取必要信息，透传数据
          console.log(JSON.stringify(data));
          process.exit(0);
        }

        // 执行检查
        const violations = checkArchitectureViolations(filePath, content);

        if (violations.length > 0) {
          // 输出警告（到 stderr）
          console.error(formatViolationMessage(filePath, violations));
        }

        // 透传数据（警告不阻止）
        console.log(JSON.stringify(data));
        process.exit(0);
      } catch (error) {
        // 解析错误，透传数据避免阻塞
        console.error(JSON.stringify(inputData || '{}'));
        process.exit(0);
      }
    });
  } catch (error) {
    // 未预期的错误，透传数据避免阻塞
    console.error(JSON.stringify(inputData || '{}'));
    process.exit(0);
  }
}

// 执行
main();
