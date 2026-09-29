# 部署配置
$SERVER_USER = "root"
$SERVER_HOST = "47.115.57.138"
$SERVER_PATH = "/srv/myapp/statics"
$LOCAL_DIST = "./dist/"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "开始部署前端静态文件..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# 检查dist目录是否存在
if (-not (Test-Path $LOCAL_DIST)) {
    Write-Host "错误: dist目录不存在，请先执行 npm run build" -ForegroundColor Red
    exit 1
}

# 白名单：需要上传的文件和目录
$FilesToUpload = @(
    "index.html",
    "config.js",
    "vite.svg",
    "data/",
    "auth/",
    "detail/",
    "explore/",
    "intro/",
    "menu/"
)

Write-Host "步骤 1/2: 清空服务器上的 assets 目录" -ForegroundColor Cyan
ssh "${SERVER_USER}@${SERVER_HOST}" "rm -rf ${SERVER_PATH}/assets/*"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ assets 目录已清空" -ForegroundColor Green
} else {
    Write-Host "✗ 清空 assets 目录失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤 2/2: 上传新文件" -ForegroundColor Cyan

# 上传 assets 目录
Write-Host "正在上传 assets 目录..." -ForegroundColor Yellow
rsync -avz --progress `
    "${LOCAL_DIST}assets/" `
    "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/assets/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 上传 assets 目录失败" -ForegroundColor Red
    exit 1
}

# 上传白名单中的其他文件和目录
foreach ($item in $FilesToUpload) {
    $localPath = Join-Path $LOCAL_DIST $item
    if (Test-Path $localPath) {
        Write-Host "正在上传 ${item}..." -ForegroundColor Yellow
        rsync -avz --progress `
            "${LOCAL_DIST}${item}" `
            "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ 上传 ${item} 失败" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠ ${item} 不存在，跳过" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "✓ 部署成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "已上传的内容：" -ForegroundColor Green
Write-Host "  - assets/ (完全替换)"
foreach ($item in $FilesToUpload) {
    $localPath = Join-Path $LOCAL_DIST $item
    if (Test-Path $localPath) {
        Write-Host "  - ${item}"
    }
}
