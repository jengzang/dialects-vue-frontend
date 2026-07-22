# 三端構建與驗證指南

本指南說明 Web、iOS、Android 三端如何構建、在哪個目錄執行，以及如何用腳本化命令替代手動記憶。

## 執行目錄

日常前端命令仍然統一在 `project/` 下執行：

```bash
cd dialects-vue-frontend/project
```

原生工程配置位於倉庫根目錄：

- `android/`：Android Capacitor 工程與 Gradle 配置。
- `ios/`：iOS Capacitor 工程與 Xcode 配置。

不要把原生工程放回 `project/android` 或 `project/ios`。`project/` 只承載前端源碼、Vite 構建、測試與腳本。

## 構建命令

僅構建前端產物時使用：

```bash
npm run build:web
npm run build:ios
npm run build:android
```

差異如下：

- `npm run build:web`：等同於 Web 生產構建，保留完整 Web 功能與 Web 靜態資源。
- `npm run build:ios`：使用 `ios` mode 構建 WebView 產物，然後執行 native dist prune / audit。
- `npm run build:android`：使用 `android` mode 構建 WebView 產物，然後執行 native dist prune / audit。

`build:ios` 和 `build:android` 只負責前端 WebView 產物，不會完整編譯 Xcode 或 Gradle 原生 App。

## 完整驗證命令

需要確認平台 App 可構建時使用：

```bash
npm run verify:platform:web
npm run verify:platform:ios
npm run verify:platform:android
npm run verify:platform:acceptance
npm run verify:platform:all
```

驗證範圍如下：

| 命令 | 執行內容 |
| --- | --- |
| `npm run verify:platform:web` | 執行 `npm run build:web` |
| `npm run verify:platform:ios` | 執行 `npm run build:ios`、`npx cap sync`、`xcodebuild` |
| `npm run verify:platform:android` | 執行 `npm run build:android`、`npx cap sync`、`./gradlew assembleDebug` |
| `npm run verify:platform:acceptance` | 從平台能力矩陣輸出 Web / iOS / Android 驗收清單，並檢查清單配置是否有重複或缺字段 |
| `npm run verify:platform:all` | 依序驗證 Web、iOS、Android |

## Praat 真機 / 模擬器交互驗收

`npm run verify:platform:acceptance` 會輸出來自 `project/src/platform/featureMatrix.js` 的機器可讀驗收清單，並檢查 Android / iOS 的 native smoke 狀態。它用於固定每端需要驗收的能力，不會替代人工在 iOS Simulator、Android Emulator 或真機中的點擊操作；如果沒有連接設備或沒有 booted simulator，腳本會明確提示原因。

Praat 三端當前至少需要覆蓋：

- Web：瀏覽器文件選擇、瀏覽器錄音、Web Audio 解碼 / 分段、提交 Praat 分析。
- iOS：Capacitor FilePicker 文件選擇、Capacitor AudioRecorder 錄音保存、麥克風權限拒絕態、Web Audio 解碼 / 分段、提交 Praat 分析。
- Android：Capacitor FilePicker 文件選擇、Capacitor AudioRecorder 錄音保存、`RECORD_AUDIO` 權限拒絕態、Web Audio 解碼 / 分段、提交 Praat 分析。

原生交互驗收時，應同時覆蓋取消文件選擇、拒絕麥克風權限、錄音 URI 讀取失敗提示，以及超大音頻不通過 FilePicker `readData` 一次性讀入的內存風險。

Android App 構建完成後，可按腳本輸出的路徑安裝並打開：

```bash
adb install -r ../android/app/build/outputs/apk/debug/app-debug.apk
adb shell monkey -p top.yzup.dialects -c android.intent.category.LAUNCHER 1
```

iOS Simulator App 構建完成且已有 booted simulator 後，可按腳本輸出的路徑安裝並打開：

```bash
xcrun simctl install booted build/ios-derived/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted top.yzup.dialects
```

## iOS 驗證

iOS 驗證需要本機已安裝 Xcode 與可用 simulator runtime。默認 destination 是：

```text
generic/platform=iOS Simulator
```

如需指定 simulator，可以設置 `IOS_SIMULATOR_DESTINATION`：

```bash
IOS_SIMULATOR_DESTINATION="platform=iOS Simulator,id=8CC133EE-70BF-444B-BCD5-BA19608E5304" \
npm run verify:platform:ios
```

如需走代理下載或解析依賴，可以顯式傳入代理環境變量：

```bash
HTTPS_PROXY=http://127.0.0.1:7897 \
HTTP_PROXY=http://127.0.0.1:7897 \
ALL_PROXY=socks5://127.0.0.1:7897 \
npm run verify:platform:ios
```

## Android 驗證

Android 驗證需要本機已安裝 Android Studio / Android SDK，以及 Gradle 可使用的 JDK。推薦使用 JDK 21：

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) \
ANDROID_HOME="$HOME/Library/Android/sdk" \
ANDROID_SDK_ROOT="$HOME/Library/Android/sdk" \
npm run verify:platform:android
```

驗證腳本會默認把 `$HOME/Library/Android/sdk/platform-tools` 與 `$HOME/Library/Android/sdk/emulator` 補到 `PATH`，方便找到 `adb`、emulator 和相關 SDK 工具。

## 平台差異與產物檢查

三端差異由 `project/src/platform/`、平台能力矩陣、Vite build mode 與 native dist prune / audit 共同控制。當前原則是：

- Praat 保留在 Web、iOS、Android 三端，native 端使用 Capacitor 錄音能力。
- 文件導入 / 導出在 native 端走 Capacitor FilePicker、Filesystem、Share 等真實插件能力。
- 地圖繪製保留在 Web 端，native 端不打包地圖繪製專用靜態資源。
- native dist audit 會檢查 Web-only 地圖繪製資源是否被誤打進 native 產物，例如 `data/国界面.kmz`。

## 注意事項

- `build:*` 會先執行 `npm run seo:sitemap`，可能更新 `project/public/sitemap.xml`。如果只是本地驗證，不準備提交 SEO 時間戳變化，提交前應還原該文件。
- 修改三端能力差異後，至少運行相關 Vitest 測試、對應 `build:*`，以及需要的平台 `verify:platform:*`。
- 只改 Web 功能時仍要確認 native capability / prune 規則不會把 native App 構建破壞。
