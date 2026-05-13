#!/usr/bin/env python3
"""Generate edge-tts karaoke audio + JSON for all 205 habitat names."""
import asyncio
import json
import os
import sys

VOICE_MAP = {
    "zh": "zh-TW-HsiaoChenNeural",
    "en": "en-US-AnaNeural",
    "es": "es-MX-JorgeNeural",
}

async def generate_single(text, lang, output_dir, voice=None):
    """Generate MP3 + word-level JSON for a single text."""
    try:
        import edge_tts
    except ImportError:
        print("ERROR: edge-tts not installed. Run: pip install edge-tts")
        sys.exit(1)

    if not text or not text.strip():
        print(f"  ⚠️  Empty text for {lang}, skipping")
        return False

    voice = voice or VOICE_MAP[lang]
    communicate = edge_tts.Communicate(text, voice, boundary="WordBoundary")

    word_timestamps = []
    audio_data = bytearray()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            start_ms = chunk["offset"] / 10000
            duration_ms = chunk["duration"] / 10000
            word_timestamps.append({
                "text": chunk["text"],
                "startMs": round(start_ms, 2),
                "durationMs": round(duration_ms, 2),
            })

    if not audio_data:
        print(f"  ⚠️  No audio data for {lang}, skipping")
        return False

    os.makedirs(output_dir, exist_ok=True)

    audio_path = os.path.join(output_dir, f"audio_{lang}.mp3")
    json_path = os.path.join(output_dir, f"karaoke_{lang}.json")

    with open(audio_path, "wb") as f:
        f.write(audio_data)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(word_timestamps, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {lang}: {len(word_timestamps)} words, {len(audio_data)} bytes")
    return True


async def process_habitat(hid, habitat, output_base, langs):
    """Process a single habitat for all languages."""
    name = habitat.get("name", {})
    en_name = name.get("en", f"#{int(hid)}")
    
    print(f"Processing habitat #{hid} {en_name}...")
    
    for lang in langs:
        text = name.get(lang, "")
        if not text:
            print(f"  ⚠️  No {lang} name, skipping")
            continue
        
        int_hid = int(hid)
        output_dir = os.path.join(output_base, f"{int_hid:03d}", lang)
        await generate_single(text, lang, output_dir)


async def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-file", default="data/habitat-data.json")
    parser.add_argument("--output-dir", default="output/habitat_karaoke")
    parser.add_argument("--langs", nargs="+", default=["zh", "en", "es"])
    parser.add_argument("--start-id", type=int, default=0)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    with open(args.data_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} habitats from {args.data_file}")
    print(f"Languages: {args.langs}")
    print(f"Output: {args.output_dir}")
    print("-" * 50)

    # Filter by start-id, sorted numerically
    items = sorted(data.items(), key=lambda x: int(x[0]))
    if args.start_id > 0:
        items = [(k, v) for k, v in items if int(k) >= args.start_id]
    if args.limit > 0:
        items = items[:args.limit]

    print(f"Processing {len(items)} habitats")
    print()

    for hid, habitat in items:
        await process_habitat(hid, habitat, args.output_dir, args.langs)
        print()

    print("=" * 50)
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
