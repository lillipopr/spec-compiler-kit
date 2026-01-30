#!/bin/bash
# 将 spec-compiler-kit 重组为 Marketplace 结构

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== 重组为 Marketplace 结构 ===${NC}"

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. 创建 plugins 目录
echo "1. 创建 plugins 目录..."
mkdir -p plugins/spec-compiler-kit

# 2. 移动插件内容到子目录
echo "2. 移动插件内容..."
mv agents plugins/spec-compiler-kit/
mv commands plugins/spec-compiler-kit/
mv skills plugins/spec-compiler-kit/
mv tools plugins/spec-compiler-kit/
mv rules plugins/spec-compiler-kit/ 2>/dev/null || true

# 3. 移动 .claude-plugin 内容（保留 marketplace.json）
echo "3. 重组 .claude-plugin..."
mkdir -p plugins/spec-compiler-kit/.claude-plugin
mv .claude-plugin/plugin.json plugins/spec-compiler-kit/.claude-plugin/
mv .claude-plugin/hooks plugins/spec-compiler-kit/.claude-plugin/
mv .claude-plugin/scripts plugins/spec-compiler-kit/.claude-plugin/
mv .claude-plugin/HOOKS.md plugins/spec-compiler-kit/.claude-plugin/
mv .claude-plugin/PUBLISHING.md plugins/spec-compiler-kit/.claude-plugin/
mv .claude-plugin/VERSIONING.md plugins/spec-compiler-kit/.claude-plugin/
mv .claude-plugin/README.md plugins/spec-compiler-kit/.claude-plugin/ 2>/dev/null || true

# 4. 更新根目录的 marketplace.json
echo "4. 更新 marketplace.json..."
cat > .claude-plugin/marketplace.json << 'JSON'
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "spec-compiler-kit-marketplace",
  "owner": {
    "name": "zxq",
    "email": "zxq@olzx-ai.com",
    "url": "https://github.com/lillipopr"
  },
  "metadata": {
    "description": "Spec Compiler Kit Marketplace - 将模糊需求编译为确定性规格文档",
    "version": "2.0.0"
  },
  "plugins": [
    {
      "name": "spec-compiler-kit",
      "description": "规格编译器套件：将模糊需求编译为确定性规格文档，实现'人管变化，AI 写实现'",
      "version": "2.0.0",
      "source": "./plugins/spec-compiler-kit",
      "strict": false,
      "author": {
        "name": "zxq",
        "email": "zxq@olzx-ai.com",
        "url": "https://github.com/lillipopr"
      },
      "homepage": "https://github.com/lillipopr/spec-compiler-kit",
      "repository": {
        "type": "git",
        "url": "https://github.com/lillipopr/spec-compiler-kit.git"
      },
      "bugs": "https://github.com/lillipopr/spec-compiler-kit/issues",
      "license": "MIT",
      "skills": ["./skills/"],
      "commands": ["./commands/"],
      "agents": ["./agents/"],
      "hooks": ["./.claude-plugin/hooks/"],
      "category": "workflow",
      "keywords": [
        "spec",
        "compiler",
        "ddd",
        "modeling",
        "architecture",
        "tdd",
        "phase",
        "review",
        "hooks",
        "workflow"
      ],
      "tags": [
        "spec",
        "compiler",
        "ddd",
        "modeling",
        "architecture",
        "tdd",
        "java",
        "swift",
        "vue",
        "phase-review",
        "architecture-check"
      ]
    }
  ]
}
JSON

echo ""
echo -e "${GREEN}✓ 重组完成！${NC}"
echo ""
echo "新目录结构："
echo "  spec-compiler-kit/"
echo "  ├── .claude-plugin/marketplace.json"
echo "  ├── plugins/spec-compiler-kit/    # 插件内容"
echo "  │   ├── .claude-plugin/plugin.json"
echo "  │   ├── agents/"
echo "  │   ├── commands/"
echo "  │   └── skills/"
echo "  ├── README.md"
echo "  └── install.sh"
echo ""
echo -e "${YELLOW}请检查变更后提交：${NC}"
echo "  git status"
echo "  git add ."
echo "  git commit -m 'feat: 重组为 Marketplace 结构'"
