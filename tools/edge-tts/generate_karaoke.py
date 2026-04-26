#!/usr/bin/env python3
"""
edge-tts Karaoke Data Generator
Generate MP3 + word-level timestamp JSON for Pokopia Pokedex descriptions.

Usage:
    python generate_karaoke.py --text "皮卡丘的頰袋柔軟且有彈性。" --lang zh --output ./test
    python generate_karaoke.py --pokemon-id 25 --lang zh --data-file ../../data/pokemon.json
"""

import asyncio
import argparse
import json
import os
import sys


def parse_args():
    parser = argparse.ArgumentParser(description="Generate karaoke audio + word-level timestamps using edge-tts")
    parser.add_argument("--text", type=str, help="Text to synthesize")
    parser.add_argument("--lang", type=str, choices=["zh", "en", "es"], required=True, help="Language code")
    parser.add_argument("--output", type=str, default="./output", help="Output directory")
    parser.add_argument("--pokemon-id", type=int, help="Pokemon ID to look up from pokemon.json")
    parser.add_argument("--data-file", type=str, default="../../data/pokemon.json", help="Path to pokemon.json")
    return parser.parse_args()


VOICE_MAP = {
    "zh": "zh-TW-HsiaoChenNeural",
    "en": "en-US-AnaNeural",
    "es": "es-MX-JorgeNeural",
}


def get_text_from_pokemon(pid: int, lang: str, data_file: str) -> str:
    """Load description text from pokemon.json by ID.
    
    Supports both formats:
    - {"pokemon": [...]} (wrapped object)
    - [...] (raw array)
    """
    with open(data_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Handle both wrapped object and raw array
    if isinstance(data, dict):
        pokemon_list = data.get("pokemon", [])
    elif isinstance(data, list):
        pokemon_list = data
    else:
        raise ValueError(f"Invalid data format in {data_file}")
    
    for p in pokemon_list:
        if p.get("id") == pid:
            return p.get("description", {}).get(lang, "")
    raise ValueError(f"Pokemon id={pid} not found in {data_file}")


async def generate(text: str, lang: str, output_dir: str):
    """Generate MP3 + word-level JSON using edge-tts."""
    try:
        import edge_tts
    except ImportError:
        print("ERROR: edge-tts not installed. Run: pip install edge-tts")
        sys.exit(1)

    voice = VOICE_MAP[lang]
    communicate = edge_tts.Communicate(text, voice, boundary="WordBoundary")

    word_timestamps = []
    os.makedirs(output_dir, exist_ok=True)

    audio_path = os.path.join(output_dir, f"audio_{lang}.mp3")
    json_path = os.path.join(output_dir, f"karaoke_{lang}.json")

    with open(audio_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # Microsoft returns ticks (100 nanoseconds)
                start_ms = chunk["offset"] / 10000
                duration_ms = chunk["duration"] / 10000
                word_timestamps.append({
                    "text": chunk["text"],
                    "startMs": round(start_ms, 2),
                    "durationMs": round(duration_ms, 2),
                })

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(word_timestamps, f, ensure_ascii=False, indent=2)

    print(f"✅ Audio: {audio_path}")
    print(f"✅ JSON:  {json_path}")
    print(f"   Words: {len(word_timestamps)}")
    if word_timestamps:
        print(f"   Duration: {word_timestamps[-1]['startMs'] + word_timestamps[-1]['durationMs']:.0f} ms")


async def main():
    args = parse_args()

    if args.pokemon_id:
        text = get_text_from_pokemon(args.pokemon_id, args.lang, args.data_file)
        print(f"Loaded description for pokemon #{args.pokemon_id} ({args.lang}):")
    elif args.text:
        text = args.text
    else:
        # Default test text
        text = {
            "zh": "皮卡丘的頰袋柔軟且有彈性，能產生強大的電力。",
            "en": "Pikachu has soft and stretchy cheek sacs that can generate powerful electricity.",
            "es": "Pikachu tiene mejillas suaves y elásticas que pueden generar electricidad poderosa.",
        }[args.lang]

    print(f"Text: {text}")
    print(f"Voice: {VOICE_MAP[args.lang]}")
    print("-" * 40)

    await generate(text, args.lang, args.output)


if __name__ == "__main__":
    asyncio.run(main())
