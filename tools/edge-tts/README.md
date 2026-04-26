# Edge-TTS Karaoke 測試計畫

## 目標
驗證 edge-tts 的 `WordBoundary` 事件是否能產生足夠精準的逐字時間軸，
用於取代目前的 Web Speech API 方案1。

## 測試階段

### Phase 1：基礎功能驗證（單句測試）
- [ ] 安裝 edge-tts：`pip install edge-tts`
- [ ] 執行 `generate_karaoke.py` 產生中/英/西三語測試音檔 + JSON
- [ ] 檢查 JSON 時間軸是否與實際語音同步
- [ ] 驗證標點符號是否獨立為一個 WordBoundary
- [ ] 比較 `startMs` 與實際聽到的時間點

### Phase 2：前端播放器原型
- [ ] 建立 `test-player.html`：`<audio>` + `requestAnimationFrame`
- [ ] 讀取 JSON 時間軸，渲染帶 `<span data-start>` 的文字
- [ ] 實作高亮邏輯（currentTime 落在哪個字的區間）
- [ ] 比較流暢度 vs 方案1 的逐詞播放

### Phase 3：批次產生驗證（小量）
- [ ] 選 5 隻寶可夢（不同語言長度）
- [ ] 批次產生 `audio/{lang}/{id}.mp3` + `json/{lang}/{id}.json`
- [ ] 檢查總檔案大小、載入時間
- [ ] 測試 Service Worker 快取

### Phase 4：整合決策
- [ ] 若品質滿意 → 擴展到全部 303 隻
- [ ] 若不滿意 → 捨棄此分支，保留方案1

## 快速測試指令

```bash
# 中文測試
python generate_karaoke.py --lang zh --output ./output/zh-test

# 英文測試
python generate_karaoke.py --lang en --output ./output/en-test

# 從 pokemon.json 讀取
python generate_karaoke.py --pokemon-id 25 --lang zh --data-file ../../data/pokemon.json --output ./output/pikachu-zh
```

## Rollback 計畫
- 此目錄 (`tools/edge-tts/`) 完全不影響主程式
- 測試音檔放在 `output/` 子目錄，已加入 `.gitignore`
- 若方案2失敗，直接 `git checkout master` 即可回到方案1
