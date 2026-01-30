#!/usr/bin/env node

/**
 * Phase Review Check Hook
 *
 * 触发条件：编辑 *.spec.md 或 PRD.md 文件
 * 优先级：critical（阻止操作）
 *
 * 检查用户是否跳过了 Phase 审查，确保 Phase N+1 编辑前，Phase N 已审查通过
 */

const fs = require('fs');
const path = require('path');

/**
 * 解析文档中的 Phase 审查状态
 * @param {string} content - 文档内容
 * @returns {Map<string, string>} Phase 名称 -> 审查状态
 */
function parseReviewStatuses(content) {
  const statuses = new Map();

  // 匹配格式：<!-- REVIEW STATUS: STATUS - timestamp - reviewer -->
  // 或者：<!-- REVIEW STATUS: STATUS -->
  const statusRegex = /<!--\s*REVIEW STATUS:\s*(APPROVED|DRAFT|REVIEWING|REJECTED)\s*(?:-\s*([^-\n]+)\s*)?-->/gi;

  let match;
  while ((match = statusRegex.exec(content)) !== null) {
    const status = match[1].toUpperCase();
    const context = match[2] || '';

    // 尝试从上下文中提取 Phase 信息
    // 查找匹配的 Phase 标题
    const beforeMatch = content.substring(0, match.index);
    const phaseMatch = beforeMatch.match(/#+\s*(Phase\s+\d+[:\s]|Phase\s+\d+[：\s])/gi);

    if (phaseMatch) {
      const phaseTitle = phaseMatch[phaseMatch.length - 1].trim().replace(/#+\s*/, '');
      statuses.set(phaseTitle, status);
    }
  }

  return statuses;
}

/**
 * 确定编辑位置所属的 Phase
 * @param {string} content - 文档内容
 * @param {number} editLine - 编辑的行号（如果可用）
 * @returns {string|null} Phase 名称
 */
function detectCurrentPhase(content, editLine) {
  const lines = content.split('\n');

  // 查找所有 Phase 标题
  const phases = [];
  for (let i = 0; i < lines.length; i++) {
    const phaseMatch = lines[i].match(/^#+\s*(Phase\s+\d+[:\s]|Phase\s+\d+[：\s])/i);
    if (phaseMatch) {
      phases.push({
        name: phaseMatch[1].trim(),
        line: i
      });
    }
  }

  // 如果没有行号信息，返回最后一个 Phase
  if (editLine === undefined) {
    return phases.length > 0 ? phases[phases.length - 1].name : null;
  }

  // 根据编辑位置确定所属 Phase
  for (let i = phases.length - 1; i >= 0; i--) {
    if (editLine >= phases[i].line) {
      return phases[i].name;
    }
  }

  return null;
}

/**
 * 提取 Phase 编号
 * @param {string} phaseName - Phase 名称
 * @returns {number|null} Phase 编号
 */
function extractPhaseNumber(phaseName) {
  const match = phaseName.match(/Phase\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * 主检查函数
 * @param {string} filePath - 文件路径
 * @param {string} content - 文档内容
 * @returns {object} 检查结果 { allowed: boolean, message?: string }
 */
function checkPhaseReview(filePath, content) {
  // 检查是否是规格文档
  const isSpecDoc = /\.(spec\.md|PRD\.md)$/i.test(path.basename(filePath));
  if (!isSpecDoc) {
    return { allowed: true };
  }

  // 解析所有 Phase 的审查状态
  const phaseStatuses = parseReviewStatuses(content);

  // 检测当前正在编辑的 Phase
  const currentPhase = detectCurrentPhase(content);
  if (!currentPhase) {
    // 无法确定 Phase，允许编辑
    return { allowed: true };
  }

  const currentPhaseNum = extractPhaseNumber(currentPhase);
  if (currentPhaseNum === null || currentPhaseNum <= 1) {
    // Phase 1 不需要前置审查
    return { allowed: true };
  }

  // 检查所有前置 Phase 是否已审查
  for (let phaseNum = 1; phaseNum < currentPhaseNum; phaseNum++) {
    const phaseName = `Phase ${phaseNum}`;
    const status = phaseStatuses.get(phaseName);

    if (status !== 'APPROVED') {
      // 前置 Phase 未审查通过，阻止编辑
      return {
        allowed: false,
        message: `⚠️ Phase 审查闸口：请先完成 Phase ${phaseNum} 的人工审查

当前 Phase ${phaseNum} 状态：${status || '未标记'}
要求状态：APPROVED

请在文档中添加审查通过标记：
<!-- REVIEW STATUS: APPROVED - ${new Date().toISOString()} - {reviewer} -->
审查意见：{review_comments}`
      };
    }
  }

  return { allowed: true };
}

/**
 * Hook 入口函数
 * 从 stdin 读取 JSON 数据，处理后输出
 */
function main() {
  let inputData = '';

  try {
    // 从 stdin 读取输入数据
    inputData = '';
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
        const result = checkPhaseReview(filePath, content);

        if (result.allowed) {
          // 允许操作，透传数据
          console.log(JSON.stringify(data));
          process.exit(0);
        } else {
          // 阻止操作，输出错误消息
          console.error(result.message);
          process.exit(1);
        }
      } catch (error) {
        // 解析错误，透传数据避免阻塞
        console.error(JSON.stringify(inputData || {}));
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
