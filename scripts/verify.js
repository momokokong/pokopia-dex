#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Ensure we resolve paths from the repo root, not scripts/
const REPO_ROOT = path.resolve(__dirname, '..');

const defaultSampleIds = [1, 2, 3];
const supportedLangs = ['en', 'es', 'zh'];

function existsSync(filepath) {
  return fs.existsSync(filepath);
}

// ── Pure Node.js MP3 duration parser (no ffprobe needed) ────────────────────

// MPEG1 Layer 3 bitrate table (kbps), indexed by bitrate_index (0-15)
// MPEG1 = version 1, MPEG2 = version 2/2.5
const BITRATE_TABLE = {
  mpeg1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
  mpeg2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]
};

const SAMPLE_RATE_TABLE = {
  mpeg1: [44100, 48000, 32000],
  mpeg2: [22050, 24000, 16000],
  mpeg25: [11025, 12000, 8000]
};

function findFirstFrame(buf) {
  // Sync word: 11 bits of 1 (0xFFE0 or 0xFFF for 2 bytes)
  for (let i = 0; i < buf.length - 1; i++) {
    if (buf[i] === 0xFF && (buf[i + 1] & 0xE0) === 0xE0) {
      return i;
    }
  }
  return -1;
}

function parseMp3Duration(buf) {
  const syncOffset = findFirstFrame(buf);
  if (syncOffset < 0) return null;

  const header = buf.slice(syncOffset, syncOffset + 4);
  if (header.length < 4) return null;

  // Byte 1 (after sync): version, layer
  const versionBits = (header[1] >> 3) & 0x03;
  const layerBits = (header[1] >> 1) & 0x03;
  const bitrateIdx = (header[2] >> 4) & 0x0F;
  const sampleRateIdx = (header[2] >> 2) & 0x03;
  const paddingBit = (header[2] >> 1) & 0x01;

  // Determine version
  let version;
  if (versionBits === 3) version = 'mpeg1';
  else if (versionBits === 2) version = 'mpeg2';
  else if (versionBits === 0) version = 'mpeg25';
  else return null; // reserved

  // Layer must be 3 (MPEG Layer III), value 01 = Layer III
  if (layerBits !== 1) return null;

  // Bitrate
  const bitrateTable = version === 'mpeg1' ? BITRATE_TABLE.mpeg1 : BITRATE_TABLE.mpeg2;
  const bitrateKbps = bitrateTable[bitrateIdx];
  if (bitrateKbps === 0) return null;

  // Sample rate
  const srTable = version === 'mpeg1' ? SAMPLE_RATE_TABLE.mpeg1 : version === 'mpeg2' ? SAMPLE_RATE_TABLE.mpeg2 : SAMPLE_RATE_TABLE.mpeg25;
  const sampleRate = srTable[sampleRateIdx];
  if (!sampleRate) return null;

  // Frame size
  const samplesPerFrame = version === 'mpeg1' ? 1152 : 576;
  const frameSize = Math.floor((samplesPerFrame / 8) * (bitrateKbps * 1000) / sampleRate) + paddingBit;
  if (frameSize <= 0) return null;

  // Total frames (estimate from file size)
  const dataSize = buf.length - syncOffset;
  const totalFrames = Math.floor(dataSize / frameSize);

  // Duration
  const durationMs = (totalFrames * samplesPerFrame) / sampleRate * 1000;
  return Math.round(durationMs);
}

function getMp3DurationMs(mp3Path) {
  try {
    // Read only first 64KB + last 64KB to find frames; usually enough for CBR MP3
    const fd = fs.openSync(mp3Path, 'r');
    const fileSize = fs.fstatSync(fd).size;

    // Read first chunk (contains first valid frame)
    const headSize = Math.min(fileSize, 65536);
    const headBuf = Buffer.alloc(headSize);
    fs.readSync(fd, headBuf, 0, headSize, 0);

    // Find and parse first frame to get bitrate/sample rate
    const syncOffset = findFirstFrame(headBuf);
    if (syncOffset < 0) { fs.closeSync(fd); return null; }

    // Read the actual header bytes starting at sync offset
    const headerBuf = Buffer.alloc(4);
    fs.readSync(fd, headerBuf, 0, 4, syncOffset);

    // For duration, we need the whole file to count frames (or use file size/frame size)
    // Since edge-tts produces CBR MP3, we can just use file size and first frame info
    const fullStats = fs.fstatSync(fd);
    fs.closeSync(fd);

    // Re-read full file for safety (edge-tts files are small)
    const wholeBuf = fs.readFileSync(mp3Path);
    return parseMp3Duration(wholeBuf);
  } catch (e) {
    return null;
  }
}

function safeParseJson(content) {
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function validateIdLang(id, lang) {
  const paddedId = String(id).padStart(3, '0');
  const base = path.join(REPO_ROOT, 'output/karaoke', paddedId, lang);
  const mp3Path = path.join(base, 'audio_' + lang + '.mp3');
  const jsonPath = path.join(base, 'karaoke_' + lang + '.json');

  const hasMp3 = existsSync(mp3Path);
  const hasJson = existsSync(jsonPath);

  let result = {
    id: id,
    lang: lang,
    mp3Exists: hasMp3,
    jsonExists: hasJson,
    mp3Size: null,
    jsonSize: null,
    validJson: false,
    audioDuration: null,
    jsonEntries: null,
    error: null
  };

  if (hasMp3) {
    try {
      const stats = fs.statSync(mp3Path);
      result.mp3Size = stats.size;
      // Check if file is too small (likely corrupted/empty)
      if (stats.size < 1000) {
        result.error = 'MP3 file too small (likely empty/corrupted): ' + stats.size + ' bytes';
      }
    } catch (e) {
      result.error = 'Cannot stat MP3: ' + e.message;
    }
  }

  if (hasJson) {
    try {
      const stats = fs.statSync(jsonPath);
      result.jsonSize = stats.size;
    } catch (e) {
      result.jsonSize = 0;
    }

    try {
      const jsonContent = fs.readFileSync(jsonPath, 'utf8');
      const jsonObj = safeParseJson(jsonContent);
      result.validJson = jsonObj !== null;

      if (result.validJson) {
        if (Array.isArray(jsonObj)) {
          result.jsonEntries = jsonObj.length;
          // Check first entry for required fields
          if (jsonObj.length > 0) {
            const first = jsonObj[0];
            if (first.startMs !== undefined && first.durationMs !== undefined) {
              result.hasStartMs = true;
              result.hasDurationMs = true;
            }
            // Calculate total duration from entries
            let maxEnd = 0;
            for (let i = 0; i < jsonObj.length; i++) {
              const entry = jsonObj[i];
              if (entry.startMs !== undefined && entry.durationMs !== undefined) {
                const end = entry.startMs + entry.durationMs;
                if (end > maxEnd) maxEnd = end;
              }
            }
            result.jsonTotalDurationMs = maxEnd;
          }
        } else if (typeof jsonObj === 'object') {
          result.jsonEntries = Object.keys(jsonObj).length;
        }
      }
    } catch (e) {
      result.error = 'JSON parse error: ' + e.message;
    }
  }

  // Read actual MP3 duration by parsing MPEG frame headers (pure Node.js, no ffprobe needed)
  if (hasMp3) {
    result.audioDuration = getMp3DurationMs(mp3Path);
  }

  return result;
}

function scanExistingIds() {
  const karaokeDir = path.join(REPO_ROOT, 'output/karaoke');
  if (!fs.existsSync(karaokeDir)) return [];
  return fs.readdirSync(karaokeDir)
    .filter(name => /^\d{3}$/.test(name))
    .map(name => parseInt(name, 10))
    .sort((a, b) => a - b);
}

function padId(id) {
  return String(id).padStart(3, '0');
}

// Main
const args = process.argv.slice(2);
const useAll = args.includes('--all');
const sampleIds = useAll
  ? scanExistingIds()
  : (args.length > 0 ? args.filter(a => a !== '--all').map(Number) : defaultSampleIds);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const logDir = path.join(REPO_ROOT, 'output', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, 'verify-' + timestamp + '.log');

let totalPassed = 0;
let totalFailed = 0;
let totalMissing = 0;
let totalSkipped = 0;

const lines = [];
function emit(line) {
  console.log(line);
  lines.push(line);
}

emit('=== edge-tts 驗證報告 ===');
emit('掃描時間: ' + new Date().toISOString());
emit('目標: ' + (useAll ? '全部已生成目錄 (' + sampleIds.length + ' 隻)' : '指定樣本 (' + sampleIds.join(', ') + ')'));
emit('');

sampleIds.forEach(function(id) {
  var paddedId = String(id).padStart(3, '0');
  emit('--- ID #' + paddedId + ' ---');

  supportedLangs.forEach(function(lang) {
    var v = validateIdLang(id, lang);
    var status = '✅';
    var issues = [];

    if (!v.mp3Exists) {
      issues.push('缺少 MP3');
      status = '❌';
      totalMissing++;
    }
    if (!v.jsonExists) {
      issues.push('缺少 JSON');
      status = '❌';
      totalMissing++;
    }
    if (!v.validJson) {
      issues.push('JSON 無效');
      status = '❌';
    }
    if (v.mp3Exists && v.mp3Size < 1000) {
      issues.push('MP3 檔案過小');
      status = '❌';
    }
    if (v.jsonEntries !== null && v.jsonEntries === 0) {
      issues.push('JSON 無條目');
      status = '❌';
    }
    if (v.audioDuration && v.jsonTotalDurationMs) {
      var diff = Math.abs(v.audioDuration - v.jsonTotalDurationMs);
      if (diff > 2000) { // > 2 seconds difference
        issues.push('音檔/JSON 時長差異過大: ' + Math.round(diff) + 'ms');
        status = '⚠️ ';
      }
    }
    if (v.error) {
      issues.push(v.error);
      status = '❌';
    }

    if (issues.length === 0) {
      totalPassed++;
      emit('  ' + status + ' ' + lang + ': OK (MP3=' + v.mp3Size + 'B, JSON entries=' + v.jsonEntries + ', audio=' + (v.audioDuration ? Math.round(v.audioDuration) + 'ms' : 'N/A') + ')');
    } else {
      totalFailed++;
      emit('  ' + status + ' ' + lang + ': ' + issues.join(', '));
    }
  });
  emit('');
});

emit('=== 總結 ===');
emit('已檢查寶可夢數: ' + sampleIds.length);
emit('檢查組合數 (3 語言 × N 隻): ' + (sampleIds.length * 3));
emit('通過: ' + totalPassed);
emit('失敗/警告: ' + totalFailed);
emit('遺失檔案: ' + totalMissing);

if (totalFailed === 0 && totalMissing === 0) {
  emit('\n🎉 全部驗證通過！');
} else {
  emit('\n⚠️  發現問題，請檢查上方報告。');
}

// Write to log file
fs.writeFileSync(logPath, lines.join('\n'), 'utf8');
emit('\n📄 Log 已寫入: ' + logPath);

if (totalFailed === 0 && totalMissing === 0) {
  process.exit(0);
} else {
  process.exit(1);
}