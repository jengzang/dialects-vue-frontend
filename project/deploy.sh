#!/bin/bash

# 部署配置
SERVER_USER="root"                    # 服务器用户名
SERVER_HOST="47.115.57.138"           # 服务器IP
SERVER_PATH="/srv/myapp/statics"      # 服务器上的目标路径
LOCAL_DIST="./dist/"                  # 本地dist目录

# SSH 密码配置（可选，不推荐）
# 如果设置了 SERVER_PASSWORD，将使用 sshpass 自动填充密码
# 留空则使用 SSH 密钥认证（推荐）
SERVER_PASSWORD=""  # 在这里填写密码，或者留空使用 SSH 密钥

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 构建 SSH/scp 命令前缀
if [ -n "$SERVER_PASSWORD" ]; then
    # 使用 sshpass（需要先安装：apt-cyg install sshpass）
    SSH_CMD="sshpass -p '$SERVER_PASSWORD' ssh"
    SCP_CMD="sshpass -p '$SERVER_PASSWORD' scp"
    echo -e "${YELLOW}使用密码认证模式${NC}"
else
    # 使用 SSH 密钥认证（推荐）
    SSH_CMD="ssh"
    SCP_CMD="scp"
    echo -e "${YELLOW}使用 SSH 密钥认证模式${NC}"
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}开始部署前端静态文件...${NC}"
echo -e "${YELLOW}========================================${NC}"

# 检查dist目录是否存在
if [ ! -d "$LOCAL_DIST" ]; then
    echo -e "${RED}错误: dist目录不存在，请先执行 npm run build${NC}"
    exit 1
fi

# 白名单：需要上传的文件和目录
FILES_TO_UPLOAD=(
    "index.html"
    "config.js"
    "vite.svg"
    "参考表.xlsx"
    "auth/"
    "detail/"
    "explore/"
    "intro/"
    "menu/"
    "villagesML/"
)

echo -e "${BLUE}步骤 1/2: 清空服务器上的 assets 目录${NC}"
$SSH_CMD "${SERVER_USER}@${SERVER_HOST}" "rm -rf ${SERVER_PATH}/assets/*"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ assets 目录已清空${NC}"
else
    echo -e "${RED}✗ 清空 assets 目录失败${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}步骤 2/2: 上传新文件${NC}"

# 上传 assets 目录（完整同步）
echo -e "${YELLOW}正在上传 assets 目录...${NC}"
$SCP_CMD -r "${LOCAL_DIST}assets" "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 上传 assets 目录失败${NC}"
    exit 1
fi

# 上传白名单中的其他文件和目录
for item in "${FILES_TO_UPLOAD[@]}"; do
    if [ -e "${LOCAL_DIST}${item}" ]; then
        echo -e "${YELLOW}正在上传 ${item}...${NC}"

        # 判断是文件还是目录
        if [ -d "${LOCAL_DIST}${item}" ]; then
            # 目录：使用 -r 递归上传
            $SCP_CMD -r "${LOCAL_DIST}${item}" "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
        else
            # 文件：直接上传
            $SCP_CMD "${LOCAL_DIST}${item}" "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
        fi

        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ 上传 ${item} 失败${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠ ${item} 不存在，跳过${NC}"
    fi
done

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}✓ 部署成功！${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}已上传的内容：${NC}"
echo -e "  - assets/ (完全替换)"
for item in "${FILES_TO_UPLOAD[@]}"; do
    if [ -e "${LOCAL_DIST}${item}" ]; then
        echo -e "  - ${item}"
    fi
done
