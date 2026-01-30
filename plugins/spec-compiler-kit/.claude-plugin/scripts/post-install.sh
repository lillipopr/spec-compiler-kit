#!/bin/bash
# Spec Compiler Kit - 安装后初始化脚本
# 版本: 1.0.0

set -e

echo "🚀 Spec Compiler Kit - 安装后初始化..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 复制 Rules 到用户目录（如果需要）
copy_rules() {
    echo "📋 配置全局规则..."

    # 检查是否需要复制规则
    # 这里可以根据需要实现规则复制逻辑
    # cp -r rules/* ~/.claude/rules/ 2>/dev/null || true

    echo -e "${GREEN}✓ 规则配置完成${NC}"
}

# 验证 Agents 加载
verify_agents() {
    echo "🤖 验证 Agents..."

    agents=(
        "planner"
        "domain-architect"
        "product-manager"
        "spec-compiler-v4"
        "java-expert"
        "ios-expert"
        "frontend-expert"
        "tdd-expert"
    )

    for agent in "${agents[@]}"; do
        if [ -f "agents/${agent}.md" ]; then
            echo -e "${GREEN}  ✓ ${agent}${NC}"
        else
            echo -e "${YELLOW}  ⚠ ${agent} 未找到${NC}"
        fi
    done

    echo -e "${GREEN}✓ Agents 验证完成${NC}"
}

# 验证 Skills 加载
verify_skills() {
    echo "📚 验证 Skills..."

    skill_dirs=(
        "for-spec-compiler-v4"
        "for-domain-architect"
        "for-product-manager"
        "for-java-expert"
        "for-ios-expert"
        "for-frontend-expert"
        "for-tdd-expert"
    )

    for skill in "${skill_dirs[@]}"; do
        if [ -d "skills/${skill}" ]; then
            echo -e "${GREEN}  ✓ ${skill}${NC}"
        else
            echo -e "${YELLOW}  ⚠ ${skill} 未找到${NC}"
        fi
    done

    echo -e "${GREEN}✓ Skills 验证完成${NC}"
}

# 创建临时目录
create_temp_dirs() {
    echo "📁 创建临时目录..."

    mkdir -p ~/.claude/spec-compiler-kit/temp
    mkdir -p ~/.claude/spec-compiler-kit/cache
    mkdir -p ~/.claude/spec-compiler-kit/logs

    echo -e "${GREEN}✓ 临时目录创建完成${NC}"
}

# 显示使用指南
show_usage_guide() {
    echo ""
    echo -e "${BLUE}==================================="
    echo "   Spec Compiler Kit 安装完成！"
    echo "===================================${NC}"
    echo ""
    echo "快速开始："
    echo ""
    echo "  启动规格编译流程："
    echo "    /agent help spec-compiler-v4"
    echo ""
    echo "  查看可用 Agents："
    echo "    /agent list"
    echo ""
    echo "  查看可用 Skills："
    echo "    /skill list"
    echo ""
    echo "  使用快速命令："
    echo "    /dev        - 开发工作流"
    echo "    /dev-feature - 新功能开发"
    echo "    /dev-test   - 测试驱动开发"
    echo ""
    echo "文档："
    echo "  README.md     - 插件开发指南"
    echo "  HOOKS.md      - Hooks 开发规范"
    echo "  VERSIONING.md - 版本管理规范"
    echo "  PUBLISHING.md - 发布流程指南"
    echo ""
    echo -e "${BLUE}===================================${NC}"
    echo ""
}

# 主初始化流程
main() {
    copy_rules
    verify_agents
    verify_skills
    create_temp_dirs
    show_usage_guide

    echo -e "${GREEN}✓ 安装后初始化完成${NC}"
}

# 执行初始化
main
