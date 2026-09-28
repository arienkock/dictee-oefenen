"""Generate publishable Dutch audio using the CC BY 4.0 Piper MLS voice.

Install piper-tts and ffmpeg, then download nl_NL-mls-medium with
`python -m piper.download_voices --data-dir /tmp/dictee-voice nl_NL-mls-medium`.
Run `python scripts/generate-audio.py /tmp/dictee-voice/nl_NL-mls-medium.onnx`.
"""

import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = Path(__file__).resolve().parents[1]
MODEL = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/dictee-voice/nl_NL-mls-medium.onnx")
WORDS = json.loads(
    subprocess.check_output(
        ["node", "--input-type=module", "-e", "import {words} from './src/words.js'; console.log(JSON.stringify(words))"],
        cwd=ROOT,
        text=True,
    )
)

voice = PiperVoice.load(MODEL)
config = SynthesisConfig(speaker_id=6, length_scale=1.15)
output = ROOT / "audio"
output.mkdir(exist_ok=True)

with tempfile.TemporaryDirectory(prefix="dictee-audio-") as scratch:
    scratch = Path(scratch)
    for word in WORDS:
        wav = scratch / f"{word['id']}.wav"
        mp3 = scratch / f"{word['id']}.mp3"
        with wave.open(str(wav), "wb") as target:
            voice.synthesize_wav(word["text"], target, syn_config=config)
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-qscale:a", "5", str(mp3)],
            check=True,
        )
    for word in WORDS:
        (scratch / f"{word['id']}.mp3").replace(output / f"{word['id']}.mp3")

print(f"Generated {len(WORDS)} Dutch MP3 files with Piper in {output}")
