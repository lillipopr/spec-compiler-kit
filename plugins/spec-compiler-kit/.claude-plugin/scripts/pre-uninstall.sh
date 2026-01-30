#!/bin/bash
# Spec Compiler Kit - 卸载前清理脚本
# 版本: 1.0.0

set -e

echo "🧹 Spec Compiler Kit - 卸载前清理..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 确认卸载
confirm_uninstall() {
    echo ""
    echo -e "${YELLOW}⚠️  即将卸载 Spec Compiler Kit${NC}"
    echo ""
    read -p "是否继续? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}✗ 卸载已取消${NC}"
        exit 0
    fi
}

# 备份用户配置
backup_user_config() {
    echo "💾 备份用户配置..."

    backup_dir="$HOME/.claude/spec-compiler-kit-backup-$(date +%Y%m%d-%H%M%S)"

    # 备份用户可能修改的配置
    if [ -d "$HOME/.claude/spec-compiler-kit" ]; then
        mkdir -p "$backup_dir"
        cp -r "$HOME/.claude/spec-compiler-kit" "$backup_dir/" 2>/dev/null || true
        echo -e "${GREEN}✓ 配置已备份到: $backup_dir${NC}"
    fi
}

# 清理临时文件
cleanup_temp_files() {
    echo "🗑️  清理临时文件..."

    temp_dir="$HOME/.claude/spec-compiler-kit/temp"
    cache_dir="$HOME/.claude/spec-compiler-kit/cache"
    logs_dir="$HOME/.claude/spec-compiler-kit/logs"

    for dir in "$temp_dir" "$cache_dir" "$logs_dir"; do
        if [ -d "$dir" ]; then
            rm -rf "$dir"
            echo -e "${GREEN}  ✓ 已清理: $dir${NC}"
        fi
    done

    echo -e "${GREEN}✓ 临时文件清理完成${NC}"
}

# 询问是否清理用户数据
ask_cleanup_data() {
    echo ""
    read -p "是否清理所有用户数据? (含备份、配置等) (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup_all_data
    else
        echo -e "${YELLOW}⚠️  用户数据已保留在: ~/.claude/spec-compiler-kit${NC}"
    fi
}

# 清理所有用户数据
cleanup_all_data() {
    echo "🗑️  清理所有用户数据..."

    data_dir="$HOME/.claude/spec-compiler-kit"

    if [ -d "$data_dir" ]; then
        rm -rf "$data_dir"
        echo -e "${GREEN}✓ 所有用户数据已清理${NC}"
    fi
}

# 显示卸载完成信息
show_uninstall_complete() {
    echo ""
    echo -e "${BLUE}==================================="
    echo "   Spec Compiler Kit 已卸载"
    echo "===================================${NC}"
    echo ""
    echo "感谢使用 Spec Compiler Kit！"
    echo ""
    echo "反馈渠道："
    echo "  GitHub Issues: https://github.com/zxq/spec-compiler-kit/issues"
    echo "  Discussions: https://github.com/zxq/spec-compiler-kit/discussions"
    echo ""
    echo -e "${BLUE}===================================${NC}"
    echo ""
}

# 主清理流程
main() {
    confirm_uninstall
    backup_user_config
    cleanup_temp_files
    ask_cleanup_data
    show_uninstall_complete

    echo -e "${GREEN}✓ 卸载前清理完成${NC}"
}

# 执行清理
main
