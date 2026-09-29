"""Generate Dutch dictation MP3s with Gemini TTS through OpenRouter.

Set OPENROUTER_API_KEY in the environment or .env.local, then run `npm run audio`.
"""

import argparse
import json
import os
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "audio"
MODEL = "google/gemini-3.1-flash-tts-preview"
VOICE = "Kore"
STYLE_TAG = "[slowly, clearly articulated, with warm and gentle natural Dutch intonation]"


def generate_mp3(key, word):
    payload = {
        "model": MODEL,
        "input": f"{STYLE_TAG} {word['text']}",
        "voice": VOICE,
        "response_format": "pcm",
    }
    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/audio/speech",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "X-Title": "Dictee oefenen audio",
        },
        method="POST",
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                content_type = response.headers.get("Content-Type", "")
                data = response.read()
            break
        except urllib.error.HTTPError as error:
            if error.code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(2 ** attempt)
                continue
            detail = error.read(1000).decode("utf-8", errors="replace")
            raise SystemExit(f"{word['id']}: OpenRouter returned HTTP {error.code}: {detail}") from None

    if not content_type.startswith("audio/") or len(data) < 1000:
        raise SystemExit(f"{word['id']}: unexpected response ({content_type}, {len(data)} bytes)")
    # Gemini 3.1 returns headerless 24 kHz, 16-bit mono PCM.
    return subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", "pipe:0", "-codec:a", "libmp3lame", "-qscale:a", "2", "-f", "mp3", "pipe:1"],
        input=data,
        capture_output=True,
        check=True,
    ).stdout


def validate_mp3(path):
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    duration = float(probe.stdout.strip())
    if not (0.5 < duration < 20) or path.stat().st_size <= 1000:
        raise SystemExit(f"Invalid audio: {path.name} ({duration:.2f}s)")
    return duration


def main():
    parser = argparse.ArgumentParser(description="Generate Dutch dictation audio")
    parser.add_argument("--ids", nargs="+", help="Generate only these word IDs")
    args = parser.parse_args()

    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        local_env = ROOT / ".env.local"
        if local_env.exists():
            for line in local_env.read_text().splitlines():
                if line.startswith("OPENROUTER_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"\'')
                    break
    if not key:
        raise SystemExit("OPENROUTER_API_KEY is required in the environment or .env.local")

    words = json.loads(
        subprocess.check_output(
            ["node", "--input-type=module", "-e", "import {words} from './src/words.js'; console.log(JSON.stringify(words))"],
            cwd=ROOT,
            text=True,
        )
    )
    if len({word["id"] for word in words}) != len(words):
        raise SystemExit("Duplicate word IDs")
    if args.ids:
        selected_ids = set(args.ids)
        unknown = selected_ids - {word["id"] for word in words}
        if unknown:
            raise SystemExit(f"Unknown word IDs: {', '.join(sorted(unknown))}")
        selected = [word for word in words if word["id"] in selected_ids]
    else:
        selected = words

    with tempfile.TemporaryDirectory(prefix="dictee-gemini-") as temporary:
        staged = Path(temporary)
        for index, word in enumerate(selected, start=1):
            target = staged / f"{word['id']}.mp3"
            target.write_bytes(generate_mp3(key, word))
            duration = validate_mp3(target)
            print(f"{index}/{len(selected)} {word['id']}: {duration:.2f}s", flush=True)

        for word in selected:
            (staged / f"{word['id']}.mp3").replace(OUTPUT / f"{word['id']}.mp3")

    manifest = {"model": MODEL, "voice": VOICE, "style_tag": STYLE_TAG, "words": {word["id"]: word["text"] for word in words}}
    (OUTPUT / "generation.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    )
    print(f"Updated {len(selected)} MP3 files in {OUTPUT}")


if __name__ == "__main__":
    main()
