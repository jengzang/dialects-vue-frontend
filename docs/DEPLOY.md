# 前端项目快速部署指南

## 部署策略说明

本项目采用**白名单 + 增量同步**的部署策略：

✅ **安全性**：只上传指定的文件和目录，不会删除服务器上的其他文件
✅ **高效性**：使用 rsync 增量同步，只传输变化的文件
✅ **智能清理**：只清空 `assets/` 目录（因为每次构建文件名都会变）

### 上传的文件清单（白名单）

- `assets/` - 完全替换（先清空再上传）
- `index.html` - 覆盖
- `config.js` - 覆盖
- `vite.svg` - 覆盖
- `参考表.xlsx` - 覆盖
- `auth/` - 覆盖
- `detail/` - 覆盖
- `explore/` - 覆盖
- `intro/` - 覆盖
- `menu/` - 覆盖
- `villagesML/` - 覆盖

**服务器上的其他文件不会被删除或修改！**

### 当前多入口补充说明（2026-03）

当前构建产物不是单一入口，至少包含以下路径：

- `/`
- `/auth`
- `/explore`
- `/intro`
- `/menu`
- `/villagesML`

其中 `VillagesML` 是独立入口，部署时至少需要保证：

- `/villagesML`
- `/villagesML/*`

都回退到 `villagesML/index.html`，不能错误回退到根目录 `index.html`。

## 一、配置SSH密钥（一次性配置，避免每次输入密码）

### 1. 生成SSH密钥（如果还没有）

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

按提示操作，可以直接回车使用默认路径 `~/.ssh/id_rsa`

### 2. 将公钥复制到服务器

```bash
ssh-copy-id root@47.115.57.138
```

或者手动复制：

```bash
# 查看公钥内容
cat ~/.ssh/id_rsa.pub

# 然后登录服务器，将公钥内容添加到 ~/.ssh/authorized_keys
```

### 3. 测试SSH连接

```bash
ssh root@47.115.57.138
```

如果不需要输入密码就能登录，说明配置成功！

## 二、使用部署脚本

### 方式一：使用 Bash 脚本（推荐 Git Bash 用户）

```bash
# 1. 构建项目
npm run build

# 2. 部署到服务器
bash deploy.sh

# 或者一键构建并部署
npm run deploy
```

### 方式二：使用 PowerShell 脚本（推荐 Windows 用户）

```powershell
# 1. 构建项目
npm run build

# 2. 部署到服务器
.\deploy.ps1
```

## 三、部署过程说明

脚本会按以下步骤执行：

1. **检查 dist 目录**：确保已经构建完成
2. **清空 assets 目录**：删除服务器上 `/srv/myapp/statics/assets/*` 下的所有旧文件
3. **上传 assets 目录**：上传新构建的 assets 文件
4. **上传其他文件**：根据白名单上传其他文件和目录

## 四、文件变动说明

### 每次构建都会变动的文件：
- `assets/` 目录下所有文件（文件名带hash，如 `main.CJuwWg47.js`）
- 所有 HTML 文件（引用的资源hash会变）

### 不会变动的文件：
- `config.js`（无hash）
- `vite.svg`、`参考表.xlsx` 等静态资源
- `detail/` 目录（如果没修改）

rsync会自动识别这些变化，只上传变动的文件。

## 五、修改白名单

如果需要添加或删除上传的文件，编辑部署脚本中的白名单：

### Bash 脚本 (deploy.sh)

```bash
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
    # 在这里添加新的文件或目录
)
```

### PowerShell 脚本 (deploy.ps1)

```powershell
$FilesToUpload = @(
    "index.html",
    "config.js",
    "vite.svg",
    "参考表.xlsx",
    "auth/",
    "detail/",
    "explore/",
    "intro/",
    "menu/",
    "villagesML/"
    # 在这里添加新的文件或目录
)
```

## 六、高级用法

### 只上传特定文件

如果你只想上传某个文件，可以直接使用 rsync：

```bash
# 只上传 index.html
rsync -avz dist/index.html root@47.115.57.138:/srv/myapp/statics/

# 只上传 assets 目录
rsync -avz dist/assets/ root@47.115.57.138:/srv/myapp/statics/assets/
```

### 查看将要上传的文件（不实际上传）

```bash
rsync -avz --dry-run dist/assets/ root@47.115.57.138:/srv/myapp/statics/assets/
```

### 手动清空 assets 目录

```bash
ssh root@47.115.57.138 "rm -rf /srv/myapp/statics/assets/*"
```

## 七、Windows用户注意事项

### 使用 Git Bash（推荐）

Git Bash 自带 rsync 和 ssh，可以直接运行 `deploy.sh`：

```bash
bash deploy.sh
```

### 使用 PowerShell

如果使用 PowerShell，需要先安装 rsync 和 ssh：

1. **安装 OpenSSH**（Windows 10/11 通常已预装）
2. **安装 rsync**：
   ```powershell
   # 使用 Chocolatey
   choco install rsync

   # 或使用 Scoop
   scoop install rsync
   ```

然后运行：
```powershell
.\deploy.ps1
```

### 使用 WSL（Windows Subsystem for Linux）

如果安装了 WSL，可以直接在 WSL 中运行：

```bash
cd /mnt/c/Users/joengzaang/CodeProject/frontend-js/project
bash deploy.sh
```

## 八、常见问题

### Q: rsync命令不存在？
A:
- **Git Bash**: 通常已包含 rsync
- **PowerShell**: 使用 `choco install rsync` 或 `scoop install rsync`
- **WSL**: `sudo apt install rsync`

### Q: 还是需要输入密码？
A: 检查SSH密钥配置：
```bash
# 查看公钥
cat ~/.ssh/id_rsa.pub

# 测试连接
ssh root@47.115.57.138

# 如果还需要密码，重新复制公钥
ssh-copy-id root@47.115.57.138
```

### Q: 如何查看上传了哪些文件？
A: rsync的 `-v` 参数会显示所有传输的文件，`--progress` 会显示进度

### Q: 如何加快上传速度？
A:
1. 使用 `-z` 参数压缩传输（已包含在脚本中）
2. 检查网络带宽
3. 如果文件很大，考虑在服务器上直接构建

### Q: 服务器上有其他项目的文件，会被删除吗？
A: **不会！** 脚本只会：
- 清空 `assets/` 目录
- 覆盖白名单中的文件
- 不会删除其他文件

### Q: 如何回滚到之前的版本？
A: 建议在服务器上做备份：
```bash
# 在服务器上创建备份
ssh root@47.115.57.138 "cp -r /srv/myapp/statics /srv/myapp/statics.backup.$(date +%Y%m%d_%H%M%S)"

# 回滚
ssh root@47.115.57.138 "rm -rf /srv/myapp/statics && mv /srv/myapp/statics.backup.20260206_120000 /srv/myapp/statics"
```

## 九、部署检查清单

部署前检查：
- [ ] 代码已提交到 Git
- [ ] 已执行 `npm run build`
- [ ] dist 目录存在且文件正常
- [ ] SSH 密钥已配置（不需要输入密码）

部署后检查：
- [ ] 访问网站，检查页面是否正常
- [ ] 检查控制台是否有 404 错误
- [ ] 检查静态资源是否加载正常
- [ ] 测试主要功能是否正常
