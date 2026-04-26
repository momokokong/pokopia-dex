#!/usr/bin/env python3
"""
Batch generate edge-tts karaoke audio + JSON for all 303 Pokemon.
Usage: python generate_batch.py --data-file ../../data/pokemon.json --output-dir ../../output/karaoke
"""

import asyncio
import json
import os
import sys
import argparse

VOICE_MAP = {
    "zh": "zh-TW-HsiaoChenNeural",
    "en": "en-US-AnaNeural",
    "es": "es-MX-JorgeNeural",
}


def load_pokemon(data_file: str):
    """Load pokemon data from JSON (with UTF-8 BOM handling)."""
    with open(data_file, "r", encoding="utf-8-sig") as f:
        data = json.load(f)
    
    if isinstance(data, dict):
        return data.get("pokemon", [])
    elif isinstance(data, list):
        return data
    else:
        raise ValueError(f"Invalid data format in {data_file}")


async def generate_single(text: str, lang: str, output_dir: str, voice: str = None):
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


async def process_pokemon(pokemon: dict, output_base: str, langs: list):
    """Process a single pokemon for all languages."""
    pid = pokemon.get("id", 0)
    name = pokemon.get("name", {}).get("en", f"#{pid}")
    descriptions = pokemon.get("description", {})
    
    print(f"Processing #{pid:03d} {name}...")
    
    for lang in langs:
        text = descriptions.get(lang, "")
        if not text:
            print(f"  ⚠️  No {lang} description, skipping")
            continue
        
        output_dir = os.path.join(output_base, f"{pid:03d}", lang)
        success = await generate_single(text, lang, output_dir)
        if not success:
            print(f"  ❌ Failed to generate {lang} for #{pid}")


async def main():
    parser = argparse.ArgumentParser(description="Batch generate karaoke audio for all Pokemon")
    parser.add_argument("--data-file", type=str, default="../../data/pokemon.json", help="Path to pokemon.json")
    parser.add_argument("--output-dir", type=str, default="../../output/karaoke", help="Output directory")
    parser.add_argument("--langs", nargs="+", choices=["zh", "en", "es"], default=["zh", "en", "es"], help="Languages to generate")
    parser.add_argument("--start-id", type=int, default=1, help="Start from this Pokemon ID")
    parser.add_argument("--end-id", type=int, default=303, help="End at this Pokemon ID")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of Pokemon (0 = all)")
    args = parser.parse_args()

    pokemon_list = load_pokemon(args.data_file)
    print(f"Loaded {len(pokemon_list)} Pokemon")
    print(f"Generating for languages: {args.langs}")
    print(f"Output directory: {args.output_dir}")
    print("-" * 50)

    # Filter by ID range
    filtered = [p for p in pokemon_list if args.start_id <= p.get("id", 0) <= args.end_id]
    
    if args.limit > 0:
        filtered = filtered[:args.limit]
    
    print(f"Processing {len(filtered)} Pokemon (#{args.start_id} to #{args.end_id})")
    print()

    for pokemon in filtered:
        await process_pokemon(pokemon, args.output_dir, args.langs)
        print()

    print("=" * 50)
    print("Batch generation complete!")
    print(f"Output: {args.output_dir}")


if __name__ == "__main__":
    asyncio.run(main())
