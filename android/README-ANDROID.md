# 📱 PokopiaDex Android App (Capacitor) 建置與封裝指南

本目錄包含 **PokopiaDex (`com.pokopia.dex`)** 的 Capacitor Android 原生專案結構，專為兒童平板與行動裝置最佳化，支援：
- **離線三語圖鑑與語音學習**：透過 `dist/` 打包所有 303 隻寶可夢資料、圖片與 Web Speech TTS 離線降級。
- **原生震動回饋 (`Haptics` / `navigator.vibrate`)**：收集寶可夢、猜謎答對、解鎖徽章時觸發觸覺回饋 (`js/native.js`)。
- **Android 硬體返回鍵 3 層優先路由**：先關閉開啟中的屬性抽屜/設定彈窗 → 內頁返回首頁 `index.html` → 首頁 2 秒內雙擊退出 App。
- **防黑屏常亮 (`Screen Wake Lock`)**：播放卡拉 OK 語音或猜謎挑戰時防止平板螢幕自動休眠。
- **沉浸式全螢幕 (`MainActivity.java`)**：隱藏系統底部導覽列，減少孩童誤觸離開 App。

---

## 🛠️ 環境需求 (Prerequisites)

1. **Node.js**：v18+ 或 v20+
2. **JDK**：Java 17 (Android Gradle Plugin 8.x 需求)
3. **Android SDK**：Android Studio Hedgehog (2023.1.1) 或更新版本，安裝 **Android SDK Platform 34** 與 **Build-Tools 34.0.0**。

---

## 🚀 步驟一：打包前端靜態資源並同步至 Android (`dist/`)

在專案根目錄執行：

```bash
# 1. 將 HTML/CSS/JS/資料與圖片打包至 dist/
npm run build:web

# 2. (首次或升級 Capacitor 套件時) 安裝 Capacitor 依賴
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/haptics @capacitor/app @capacitor/status-bar @capacitor/splash-screen

# 3. 打包並同步至 android/ 專案
npm run android:sync
```

---

## 📦 步驟二：編譯 Debug / Release APK

### 方法 A：使用指令列 (Command Line Gradle)

```bash
cd android

# 編譯 Debug APK（可直接安裝於測試手機/平板）
./gradlew assembleDebug

# 產出路徑：
# android/app/build/outputs/apk/debug/app-debug.apk
```

若已透過 USB 連接開啟「USB 偵錯」的 Android 平板或手機，可直接安裝：

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 方法 B：使用 Android Studio 圖形介面

1. 在專案根目錄執行 `npx cap open android`，或開啟 Android Studio 選擇 **Open** -> 選取本專案的 `android/` 資料夾。
2. 等待 Gradle Sync 完成。
3. 點選頂部選單 **Build > Build Bundle(s) / APK(s) > Build APK(s)**。
4. 完成後點擊右下角通知的 **locate** 即可取得 APK 檔案。
