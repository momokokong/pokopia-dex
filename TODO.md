# PokopiaDex 待辦事項

> 最後更新：2026-04-26

## 🔴 進行中

- [ ] 用戶驗證 #001~#010 卡拉 OK 高亮效果
- [ ] 確認 T3（UI 正確性）與 T4（跨裝置相容性）測試通過

## 🟡 待開始

- [x] 棲息地頁面整合 edge-tts（habitat-detail.html）
- [ ] habitat-detail.html 前端播放整合
- [ ] AI 翻譯 290 隻寶可夢的 description.zh / description.es
- [ ] PWA 部署到 Cloudflare Pages
- [ ] Firebase Firestore 同步收集狀態
- [ ] Badge 獎勵系統實作
- [ ] 歡迎/登入頁面

## ✅ 已完成

- [x] 爬蟲全量 303 隻寶可夢資料（PokopiaDex + PokeAPI）
- [x] 303/303 中英西三語名稱
- [x] 303/303 中英西描述（AI 翻譯）
- [x] 205 個棲息地動態載入
- [x] 8 個成就徽章
- [x] 語言切換 + 三語顯示模式
- [x] Web Speech API 逐詞播放（方案1）
- [x] edge-tts 預產生 **303 寶可夢** + **205 棲息地** × 3 語言 = **1524 音檔 + 1524 JSON 時間軸**
- [x] detail.html 整合 edge-tts 卡拉 OK（方案2）
- [x] 中文/西班牙文 CP437 亂碼修復
- [x] 國旗修正 🇪🇸 → 🇸🇻（薩爾瓦多）
- [x] 6 頁核心功能（index/detail/habitats/habitat-detail/badges/settings）
- [x] PWA manifest + Service Worker
- [x] 設定頁面
- [x] prev/next 導航箭頭（detail.html）

## 📁 關鍵路徑

| 項目 | 路徑 |
|------|------|
| 專案目錄 | `C:\home\node\.openclaw\workspace\pokopia-dex\` |
| PRD | `notes/ideas/pokopia-pokedex-prd.md` |
| 寶可夢資料 | `pokopia-dex/pokemon.json` |
| TTS 批次腳本 | `pokopia-dex/tools/edge-tts/generate_batch.py` |
| 卡拉 OK 音檔 | `pokopia-dex/output/karaoke/{id}/{lang}/` |
| GitHub | `momokokong/pokopia-dex` (master) |