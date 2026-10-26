"""Resize existing project artwork for its maximum game display size, no new art."""
from pathlib import Path
from PIL import Image
import json
root = Path(__file__).resolve().parents[1]
source = json.loads((root / 'docs/reviews/phaser-asset-input.json').read_text(encoding='utf-8'))
destination = root / 'assets/game'
destination.mkdir(exist_ok=True)
converted = {}
metadata = []
for key, relative in list(source['ART'].items()) + [('bg'+str(i), p) for i,p in enumerate(source['SCENES'])]:
    if relative in converted:
        continue
    target = destination / (key + '.webp')
    with Image.open(root / relative) as image:
        original = image.size
        bound = (1024,1024) if key=='walk' else (1536,1024) if key=='forestMap' else (1280,800) if key.startswith('bg') else (640,640)
        image.thumbnail(bound, Image.Resampling.LANCZOS)
        image.save(target,'WEBP',quality=87,method=6)
        metadata.append({'source':relative,'output':target.relative_to(root).as_posix(),'before':original,'after':image.size,'bytes':target.stat().st_size})
    converted[relative] = target.relative_to(root).as_posix()
art={k:converted[v] for k,v in source['ART'].items()}
scenes=[converted[p] for p in source['SCENES']]
(root / 'src' / 'game-assets.js').write_text('// Resized copies of existing project illustrations. Sources: assets/game/manifest.json\nexport const ART='+json.dumps(art,ensure_ascii=False,indent=2)+';\nexport const SCENES='+json.dumps(scenes,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
(destination / 'manifest.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(metadata)} images, {sum(x["bytes"] for x in metadata):,} bytes; originals preserved.')
