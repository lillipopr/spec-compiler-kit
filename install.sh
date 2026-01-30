#!/bin/bash
# Spec Compiler Kit - 本地安装脚本

set -e

PLUGIN_NAME="spec-compiler-kit"
CLAUDE_DIR="$HOME/.claude"
LOCAL_DIR="$CLAUDE_DIR/plugins/local"
TARGET_DIR="$LOCAL_DIR/$PLUGIN_NAME"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Spec Compiler Kit 本地安装 ===${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Marketplace 结构：插件子目录在 plugins/spec-compiler-kit/
PLUGIN_DIR="$SCRIPT_DIR/plugins/spec-compiler-kit"

echo "插件源目录: $PLUGIN_DIR"
echo "目标目录: $TARGET_DIR"

# 创建 local 目录
mkdir -p "$LOCAL_DIR"

# 检查是否已存在
if [ -L "$TARGET_DIR" ]; then
    echo -e "${YELLOW}检测到已有符号链接，删除旧链接...${NC}"
    rm "$TARGET_DIR"
elif [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}检测到已有目录，跳过安装${NC}"
    echo "如需重新安装，请先删除: $TARGET_DIR"
    exit 0
fi

# 创建符号链接
echo "创建符号链接..."
ln -s "$PLUGIN_DIR" "$TARGET_DIR"

# 验证安装
if [ -L "$TARGET_DIR" ]; then
    echo -e "${GREEN}✓ 安装成功！${NC}"
    echo ""
    echo "符号链接: $TARGET_DIR -> $PLUGIN_DIR"
    echo ""
    echo -e "${YELLOW}请重启 Claude Code 以加载插件${NC}"
    echo ""
    echo "验证命令:"
    echo "  /help        # 查看可用命令"
    echo "  /prd         # 产品经理命令"
    echo "  /ddd         # 领域架构师命令"
    echo "  /spec        # 规格编译器命令"
else
    echo "安装失败"
    exit 1
fi
