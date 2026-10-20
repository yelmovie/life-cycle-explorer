"""Prepare the original observation art without changing the generated PNG."""
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent
folder = root / 'assets' / 'field'
source = folder / 'source' / 'observation-clearing-20261021.png'
target = folder / 'observation-clearing.webp'
with Image.open(source) as original:
    before = list(original.size)
    runtime = original.convert('RGB')
    runtime.thumbnail((1600, 1000), Image.Resampling.LANCZOS)
    runtime.save(target, 'WEBP', quality=87, method=6)
entry = {
    'source': 'source/' + source.name,
    'output': target.name,
    'before': before,
    'after': list(runtime.size),
    'originalBytes': source.stat().st_size,
    'bytes': target.stat().st_size,
    'generator': 'OpenAI image_gen (built-in)',
    'generated': '2026-10-21',
    'generationId': 'exec-2b86d132-6b12-4929-918f-39e8ed21269e',
    'reference': '../expedition/forest-world.webp',
    'promptFile': 'prompt.txt',
    'overlaySuggestions': {
        'egg': [0.22, 0.20], 'larva': [0.20, 0.44],
        'pupa': [0.65, 0.28], 'adult': [0.61, 0.50],
        'workbench': [0.50, 0.75]
    },
    'notes': 'No specimen, character, text or UI is painted into the backdrop. Suggestions are normalized coordinates, not scientific observations.'
}
(folder / 'manifest.json').write_text(json.dumps(entry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{target.relative_to(root).as_posix()}: {runtime.width}x{runtime.height}, {target.stat().st_size} bytes; original preserved.')
