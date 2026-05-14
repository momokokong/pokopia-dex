# PokopiaDex 待辦事項

> 最後更新：2026-05-12 (由 愛蝦 更新)

## 🟡 待開始 (Upcoming)

- [ ] **猜謎遊戲模式 (Quiz Mode)**：
  - **玩法 A — 看圖猜名**：顯示一張寶可夢圖片，三個選項選正確名字（名字可為中/英/西任一語言）。
  - **玩法 B — 看圖猜敘述**：顯示一張寶可夢圖片，三個選項選正確的 Pokopia 敘述（敘述可為中/英/西任一語言）。
  - **玩法 C — 看名猜圖**：反過來顯示一個名字（中/英/西隨機），三個寶可夢圖片選出正確的那隻。
  - **玩法 D — 看敘述猜名**：顯示一段 Pokopia 敘述（中/英/西隨機），三個名字選項選出正確答案。
  - 語言組合可由設定控制（例如：題目語言固定、選項語言隨機、或全隨機）。
  - 計分機制、連續答對 combo、與 Badge 系統連動。
- [ ] **語音播放速度控制 (0.8x 慢速)**：
  - 新增播放速度選項（0.8x / 1x），讓小孩跟著慢速唸。
  - 技術方案：使用 HTML5 Audio `playbackRate` 屬性控制播放速度，Karaoke 逐字高亮時間軸需同步調整（`currentTime * 1000 / playbackRate` 或依比例縮放 timestamps）。
  - 需修改 `detail.html` 的 `playKaraokeAudio()` 與 `habitat-detail.html` 的 `playHabitatKaraokeAudio()` 兩處邏輯。
- [ ] **三語對照模式**：實作卡片同時顯示中英西三語名稱的渲染模式。
- [ ] **Badge 獎勵系統**：邏輯實作（目前僅有 UI 頁面殼）。
- [ ] **設定頁面完整化**：語言偏好、三語模式開關、資料匯出/匯入。
- [ ] **跨裝置相容性測試**：確認在手機/平板上運作正常。

## 🚫 暫緩 (Deprioritized)

- [ ] PWA 部署到 Cloudflare Pages（目前用 GitHub Pages 即可）。
- [ ] Firebase Firestore 整合：Google Auth 登入與收集狀態同步（單機優先）。

## ✅ 已完成 (Completed)

- **資料層**:
  - [x] 爬蟲全量 303 隻寶可夢資料。
  - [x] 303/303 中英西三語名稱與 AI 翻譯描述。
  - [x] 205 個棲息地資料與圖片動態載入。
  - [x] 205/205 棲息地三語名稱翻譯。
  - [x] pokemon.json 資料修正（#043 Oddish, #075 Graveler）。
- **核心功能 (UI)**:
  - [x] 6 頁核心頁面架構 (index, detail, habitats, habitat-detail, badges, settings)。
  - [x] 語言切換系統。
  - [x] PWA 基礎配置 (manifest, Service Worker)。
  - [x] `detail.html` 導航箭頭 (prev/next)。
- **語音系統**:
  - [x] 方案 1：Web Speech API 逐詞播放（Fallback）。
  - [x] 方案 2：edge-tts 批次預產生 1524 個音檔 + JSON 時間軸。
  - [x] `detail.html` 整合方案 2 卡拉 OK 高亮播放。
  - [x] `habitat-detail.html` 名稱 + 描述皆接入 edge-tts 音檔。
- **驗證系統**:
  - [x] `verify.js`：純 Node.js MP3 parser，驗證 303 寶可夢音檔（909 組全過）。
  - [x] `verify-habitat.js`：驗證 205 棲息地音檔（615 組全過）。
- **部署**:
  - [x] GitHub Pages：https://momokokong.github.io/pokopia-dex/

## 📁 關鍵路徑 (Linux/Ubuntu)

| 項目 | 路徑 | 備註 |
|------|------|------|
| 專案根目錄 | `/home/momokokong/.openclaw/workspace/pokopia-dex/` | |
| 寶可夢資料 | `data/pokemon.json` | |
| 棲息地資料 | `data/habitat-data.json` | 三語完整 |
| 寶可夢音檔 | `output/karaoke/{id}/{lang}/` | 303 隻 |
| 棲息地音檔 | `output/habitat_karaoke/{id}/{lang}/` | 205 個 |
| 驗證腳本 | `scripts/verify.js` / `verify-habitat.js` | 純 Node.js |
| TTS 虛擬環境 | `venv/` | edge-tts |
| GitHub | `momokokong/pokopia-dex` (master) | |
| 線上版 | https://momokokong.github.io/pokopia-dex/ | GitHub Pages |
