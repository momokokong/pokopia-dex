# PokopiaDex 產品需求規格書 (PRD)

> **專案代號**：PokopiaDex  
> **目標客群**：兒童學習者、三語（中/英/西）初學者、寶可夢愛好者家長與師長  
> **專案目標**：打造零後端、免登入、兼具互動學習樂趣與離線可用性的 Trilingual Pokédex，支援 PWA 網頁端與 **Android App (APK / Google Play)** 跨平台發布。  
> **版本**：v1.2 (2026-11)  
> **執行方式**：依據此 PRD 拆解 Ticket，由開發 Subagent 與 QA 測試 Subagent 採 Feature Branch 獨立驗證並推進。

---

## 一、 核心目標與價值主張

1. **三語沉浸學習 (Trilingual Immersion)**：中（繁體）、英、西三種語言無縫切換，並提供**三語同時對照檢視**與高品質發音跟讀。
2. **遊戲化激勵體系 (Gamification)**：
   - 完整猜謎挑戰（4 種題型、Combo 計分、多語題型配置）。
   - 徽章系統（即時條件檢測、解鎖動畫、成就音效）。
3. **雙端發布：Web PWA + 原生 Android App (Capacitor / TWA)**：
   - 保留靜態網頁特性，同時以 **Capacitor** 或 **Trusted Web Activity (TWA)** 打包為 Android 原生 App。
   - 解決兒童在平板/手機上安裝方便性，支援全螢幕、離線音訊、原生震動與音效。
4. **無痛同步與隱私至上**：
   - 本地儲存（`localStorage` / Native Storage），透過 QR Code / 文字進度碼跨裝置同步，免帳號、保護兒童隱私。
5. **架構健全與自動化品質保證**：
   - 模組化抽出共用多語系與業務邏輯。
   - 導入 **Vitest**（單元測試）與 **Playwright**（E2E / 整合測試），由 QA Subagent 嚴格把關。

---

## 二、 功能範疇詳細規格 (Epics & Features)

### Epic 1: 專案基礎架構、測試環境與程式碼重構 (Core & Infra)
- **1.1 測試與工程骨架搭建**：
  - 配置 `package.json`、`npm test`、`vitest` (含 jsdom) 與 `playwright`。
  - 建立 GitHub Actions CI 範本，自動執行 Unit & Integration 測試。
- **1.2 檔案與歷史包袱清理**：
  - 清理過渡性檔案（如 `.bak`、`scrape.log`、`tunnel_new.pid`、未使用的過渡 json）。
  - 更新 `.gitignore` 與 `.gitattributes`。
- **1.3 核心邏輯模組化與多語系 (i18n) 抽離**：
  - 建立 `js/i18n.js` 與語系檔案，統一管理所有頁面的字典與語系切換事件。
  - 將 `app.js` 拆分出業務核心：`storage.js`（收集進度與徽章存取）、`speech.js`（卡拉 OK / Web Speech 播放控制）、`badges-engine.js`（徽章邏輯判定）。
  - 讓所有模組皆能被 Vitest 獨立進行單元測試。

---

### Epic 2: 三語對照模式 (Trilingual View Mode)
- **2.1 圖鑑首頁三語模式**：
  - 在全域設定或導航列提供「三語同時顯示」切換開關。
  - 卡片呈現格式：主語言置頂高亮，副語言（例如英、西）依序清晰並列，避免版面破版或文字溢出。
- **2.2 詳細資訊頁 (detail.html) 三語並列與連續跟讀**：
  - 寶可夢名稱、屬性標籤、棲息地與生境敘述支援三語分欄/並列呈現。
  - 一鍵「三語依序播放」功能（中文 -> 英文 -> 西班牙文依次發音），支援 0.8x / 1.0x 語速。

---

### Epic 3: 猜謎挑戰遊戲模式完整化 (Quiz Challenge Mode)
- **3.1 題型 A：看圖猜名 (Image to Name)**：
  - 隨機抽選 1 隻目標寶可夢圖片，隨機產生 3 個選項。
- **3.2 題型 B：看名猜圖 (Name to Image)**：
  - 題目顯示特定語言名稱（支援設定題目語言），選項呈現 3 張寶可夢卡片圖片。
- **3.3 題型 C：看敘述猜寶可夢 (Description to Name)**：
  - 顯示該寶可夢生境敘述（支援中/英/西），挑選正確名稱。
- **3.4 題型 D：聽音辨名 (Audio to Name)**：
  - 播放該語言音檔，由玩家聽語音選出正確寶可夢。
- **3.5 遊戲規則與設定控制**：
  - 可自選題目/選項語言（全隨機、特定語言對照等）。
  - 計分系統：答對 +100 分，連續答對 Combo 加乘，答錯終止 Combo。
  - 答題結束後結算分數，並與徽章系統連動。

---

### Epic 4: 徽章成就系統完整化 (Badge System & Rewards)
- **4.1 徽章解鎖判斷引擎 (Badge Engine)**：
  - 收集數量徽章：10 隻、30 隻、60 隻、100 隻、150 隻、200 隻、250 隻、全 303 隻。
  - 特殊成就：屬性專家（收集 10 隻同屬性）、棲息地獵人（探索 50 個生境）、夜貓子（深夜 22:00~05:00 使用）、早起鳥兒（早晨 05:00~08:00 使用）、答題大師（Quiz 連對 10 題）。
- **4.2 即時解鎖通知與視覺/音效效果**：
  - 觸發條件當下跳出可愛 Toast / 彈窗慶祝動畫（Confetti）。
  - 徽章頁面進度條與卡片即時點亮。

---

### Epic 5: PWA 離線優化與語音 Fallback 健全化
- **5.1 Service Worker 資源最佳化**：
  - 音檔按需快取（Runtime Caching with LRU），核心介面與資料預快取。
- **5.2 離線語音優雅降級**：
  - 若音檔快取未命中且無網路，自動無縫回退至 Web Speech API 本地合成發音。
- **5.3 跨裝置進度碼 (QR / Text) 相容性防護**：
  - 包含版本控制標頭與格式檢查，匯入失敗時提供清楚提示。

---

### Epic 6: Android App 打包與原生體驗整合 (Android Native Packaging)
- **6.1 打包技術選型（Capacitor 方案）**：
  - 採用 `@capacitor/core` 與 `@capacitor/android`：
    - 將目前的純前端靜態 assets 直接封裝進 Android 專案原生 WebView。
    - 支援完全離線載入本機 HTML/CSS/JS/JSON。
- **6.2 原生體驗強化**：
  - 狀態列與沉浸式導覽列（Immersive Fullscreen）。
  - 支援 Android 硬體 Back 按鈕事件處理（避免直接退出 App）。
  - 原生觸覺震動回饋（Haptics / Vibration）於答對題目或解鎖徽章時觸發。
  - 螢幕休眠鎖（Keep-awake）：在聽音或跟讀時避免平板黑屏。
- **6.3 Android 專案建置與 CI 自動化出包**：
  - 建立 `android/` 目錄、配置 `AndroidManifest.xml`、圖示與 Splash Screen。
  - 撰寫自動化腳本或 GitHub Actions 產出 Debug APK。

---

## 三、 品質標準與測試策略 (Testing & QA)

1. **Unit Tests (Vitest)**：
   - 覆蓋率目標：核心模組（`storage`、`i18n`、`badges-engine`、`quiz-engine`）邏輯覆蓋率 >= 85%。
2. **Integration / E2E Tests (Playwright)**：
   - 模擬不同行動裝置尺寸（Mobile & Tablet）。
   - 跨語系切換正常無破版。
   - 寶可夢卡片收集/取消收集能同步反映在 Storage 與 Badges 進度。
   - 猜謎模式 4 種題型完整答題迴圈（從開始題庫、答題、計分到結束畫面）。
   - 進度碼產生與匯入還原完整測試。
3. **工作流 (Subagent Pipeline)**：
   - **Step 1**：依據 Ticket 建立 Feature Branch (`feat/issue-<id>-...`)。
   - **Step 2**：由開發 Agent 實作程式碼並撰寫 Unit Test。
   - **Step 3**：由 QA Subagent 執行 Vitest + Playwright 整合驗收。
   - **Step 4**：通過驗證後，合併至主分支，並將 Ticket 標記為完成。
