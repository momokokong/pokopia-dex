#!/usr/bin/env python3
"""Translate habitat names to zh/es using Google Translate directly"""
import json
import sys
import urllib.request
import urllib.parse

def google_translate(text, target_lang):
    """Simple Google Translate API call (free endpoint)"""
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        'client': 'gtx',
        'sl': 'en',
        'tl': target_lang,
        'dt': 't',
        'q': text
    }
    full_url = url + '?' + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            # Extract translated text from response
            result = ''
            for segment in data[0]:
                if segment[0]:
                    result += segment[0]
            return result
    except Exception as e:
        print(f"    Error: {e}")
        return None

def main():
    data_file = sys.argv[1] if len(sys.argv) > 1 else 'data/habitat-data.json'
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Collect missing translations
    missing_ids = []
    for hid in sorted(data.keys(), key=lambda x: int(x)):
        name = data[hid].get('name', {})
        if not name.get('zh') or not name.get('es'):
            missing_ids.append((hid, name.get('en', '')))
    
    print(f"Habitats needing translation: {len(missing_ids)}")
    
    if not missing_ids:
        print("All habitats already have full translations!")
        return
    
    updated = 0
    for i, (hid, en) in enumerate(missing_ids):
        need_zh = 'zh' not in data[hid]['name'] or not data[hid]['name']['zh']
        need_es = 'es' not in data[hid]['name'] or not data[hid]['name']['es']
        
        if need_zh:
            zh = google_translate(en, 'zh-TW')
            if zh:
                data[hid]['name']['zh'] = zh
                updated += 1
            import time; time.sleep(0.15)
        
        if need_es:
            es = google_translate(en, 'es')
            if es:
                data[hid]['name']['es'] = es
                updated += 1
            time.sleep(0.15)
        
        if (i + 1) % 10 == 0:
            print(f"  Progress: {i+1}/{len(missing_ids)}")
    
    # Write back
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nDone! Updated {updated} translations in {data_file}")
    
    # Verify
    all_ok = True
    for hid in sorted(data.keys(), key=lambda x: int(x)):
        name = data[hid].get('name', {})
        if not name.get('zh') or not name.get('es'):
            print(f"  ⚠️  #{hid} still missing translation")
            all_ok = False
    
    if all_ok:
        print("All 205 habitats now have zh + es translations!")

if __name__ == '__main__':
    main()
