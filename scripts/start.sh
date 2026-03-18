#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

cd "${COZE_WORKSPACE_PATH}"

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."

# 尝试使用 standalone 模式启动，如果不存在则使用普通模式
if [ -f ".next/standalone/server.js" ]; then
    echo "Using standalone server..."
    cd .next/standalone
    PORT=${DEPLOY_RUN_PORT} node server.js
else
    echo "Using next start..."
    npx next start --port ${DEPLOY_RUN_PORT}
fi
