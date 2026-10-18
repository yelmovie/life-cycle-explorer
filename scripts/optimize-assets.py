"""Create runtime WebP copies. Keep every generated/adventure PNG master intact."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]


def prepare_image(image: Image.Image, group: str, stem: str) -> tuple[Image.Image, bool]:
    image = ImageOps.exif_transpose(image).convert('RGBA')
    if group == 'adventure' and stem == 'map-walk-sheet':
        if image.width != image.height:
            raise ValueError('map-walk-sheet must be square with a 4 by 4 grid; the source is unchanged.')
        if image.getchannel('A').getextrema()[0] == 255:
            raise ValueError('map-walk-sheet needs transparent alpha; background removal is not performed here.')
        # Preserve the whole sheet, its alpha, and its sixteen equal grid cells.
        # Nearest-neighbour keeps the sprite pixels crisp if normalization is needed.
        if image.size != (2048, 2048):
            image = image.resize((2048, 2048), Image.Resampling.NEAREST)
        return image, True
    if 'storybook' in stem:
        bounds = (1536, 1536)
    elif stem in {'forest-map', 'leaf-world'} or stem.startswith(('stage-', 'background-', 'scene-', 'chapter-')):
        bounds = (1536, 1024)
    else:
        bounds = (768, 768)
    image.thumbnail(bounds, Image.Resampling.LANCZOS)
    return image, False


def optimize() -> None:
    total = 0
    for group in ('generated', 'adventure'):
        source = root / 'assets' / group / 'source'
        output = source.parent
        for path in sorted(source.glob('*.png')):
            destination = output / (path.stem + '.webp')
            with Image.open(path) as original:
                image, lossless = prepare_image(original, group, path.stem)
                if destination.exists() and destination.stat().st_mtime >= path.stat().st_mtime:
                    with Image.open(destination) as previous:
                        same_alpha = (previous.mode == 'RGBA') == (image.getchannel('A').getextrema()[0] < 255)
                        if previous.size == image.size and same_alpha:
                            continue
                output.mkdir(parents=True, exist_ok=True)
                image.save(destination, 'WEBP', lossless=lossless, quality=100 if lossless else 88, method=6)
            total += 1
    print(f'Optimized {total} images; generated and adventure PNG masters retained.')


if __name__ == '__main__':
    optimize()
