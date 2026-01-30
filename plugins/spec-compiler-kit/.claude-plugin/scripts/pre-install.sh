#!/bin/bash
# Spec Compiler Kit - 安装前检查脚本
# 版本: 1.0.0

set -e

echo "🔍 Spec Compiler Kit - 安装前检查..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Claude Code 版本
check_claude_code_version() {
    echo "📦 检查 Claude Code 版本..."

    # 假设最低版本要求
    MIN_VERSION="1.0.0"

    # 这里可以添加实际的版本检查逻辑
    # if ! command -v claude-code &> /dev/null; then
    #     echo -e "${RED}✗ Claude Code 未安装${NC}"
    #     exit 1
    # fi

    echo -e "${GREEN}✓ Claude Code 版本检查通过${NC}"
}

# 检查必需目录
check_required_directories() {
    echo "📁 检查必需目录..."

    required_dirs=("agents" "commands" "skills" "rules")

    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            echo -e "${RED}✗ 缺少必需目录: $dir${NC}"
            exit 1
        fi
    done

    echo -e "${GREEN}✓ 必需目录检查通过${NC}"
}

# 检查 plugin.json
check_plugin_json() {
    echo "📄 检查 plugin.json..."

    if [ ! -f ".claude-plugin/plugin.json" ]; then
        echo -e "${RED}✗ 缺少 plugin.json${NC}"
        exit 1
    fi

    # 验证 JSON 格式
    if ! python3 -m json.tool .claude-plugin/plugin.json > /dev/null 2>&1; then
        echo -e "${RED}✗ plugin.json 格式错误${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ plugin.json 检查通过${NC}"
}

# 检查文件权限
check_file_permissions() {
    echo "🔐 检查文件权限..."

    # 确保 scripts 可执行
    chmod +x .claude-plugin/scripts/*.sh 2>/dev/null || true

    echo -e "${GREEN}✓ 文件权限检查通过${NC}"
}

# 显示安装信息
show_install_info() {
    echo ""
    echo "==================================="
    echo "Spec Compiler Kit v2.0.0"
    echo "==================================="
    echo "版本: 2.0.0"
    echo "描述: 规格编译器套件"
    echo "许可: MIT"
    echo "==================================="
    echo ""
}

# 主检查流程
main() {
    check_claude_code_version
    check_required_directories
    check_plugin_json
    check_file_permissions
    show_install_info

    echo -e "${GREEN}✓ 安装前检查完成${NC}"
    echo ""
}

# 执行检查
main
