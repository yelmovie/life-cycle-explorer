"""Prepare the image_gen atlases already created by the interrupted session."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
import json

root = Path(__file__).resolve().parent.parent
source = root / 'assets/expedition/source'
out = source.parent
atlases = {
    'jihoon-actions.png': ['guideLook', 'guideCare', 'guideTime', 'guideStory'],
    'explorer-tools.png': ['timeWheel', 'plantSensor', 'seasonCompass', 'storyCamera'],
}
map_file = out / 'forest-world.webp'
entries = [{'source': 'source/forest-world.png', 'path': map_file.name,
            'size': list(Image.open(map_file).size), 'bytes': map_file.stat().st_size}]
for filename, names in atlases.items():
    image = Image.open(source / filename).convert('RGBA')
    width, height = image.size
    for index, name in enumerate(names):
        x, y = index % 2 * (width // 2), index // 2 * (height // 2)
        bounds = (x, y, x + width // 2, y + height // 2)
        if filename == 'explorer-tools.png':
            # Generated props cross the nominal cell edges. Extract the connected
            # object so neighboring crank fragments are neither clipped nor leaked.
            mask = image.getchannel('A').point(lambda a: 255 if a > 16 else 0)
            seed = (x + width // 4, y + height // 4)
            if mask.getpixel(seed) != 255:
                raise ValueError(f'No foreground at {name} atlas center')
            ImageDraw.floodfill(mask, seed, 128)
            component = mask.point(lambda a: 255 if a == 128 else 0)
            bounds = component.getbbox()
            isolated = image.copy()
            isolated.putalpha(ImageChops.multiply(image.getchannel('A'), component))
            sprite = isolated.crop(bounds)
        else:
            sprite = image.crop(bounds)
        sprite.thumbnail((512, 512), Image.Resampling.LANCZOS)
        target = out / (name + '.webp')
        sprite.save(target, 'WEBP', quality=90, method=6)
        entries.append({'source': 'source/' + filename, 'frame': index, 'bounds': list(bounds),
                        'path': target.name, 'size': list(sprite.size), 'bytes': target.stat().st_size})
(out / 'manifest.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(entries)} sprites; originals preserved.')
