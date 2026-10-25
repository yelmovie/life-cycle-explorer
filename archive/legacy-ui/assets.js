// Stable illustration slots. Replace the renderer behind a slot when 3D assets arrive.
export const ASSETS = Object.freeze({
  vessel: 'assets/generated/m04-vessel.webp',
  soil: 'assets/generated/m04-soil.webp',
  seed0: 'assets/generated/m04-bean-s0.webp',
  seed1: 'assets/generated/m04-bean-s1.webp',
  seed2: 'assets/generated/m04-bean-s2.webp',
  seed3: 'assets/generated/m04-bean-s3.webp',
  lever: 'assets/generated/m04-time-lever.webp',
  lightSensor: 'assets/generated/m05-light-sensor.webp',
  moistureSensor: 'assets/generated/m05-moisture-sensor.webp',
  lamp: 'assets/generated/m05-grow-lamp.webp',
  shade: 'assets/generated/m05-shade-panel.webp',
  clock: 'assets/generated/m10-clock-body.webp',
  ring: 'assets/generated/m10-clock-ring.webp',
  core: 'assets/generated/m10-clock-core.webp',
  egg: 'assets/generated/butterfly-egg.webp',
  caterpillar: 'assets/generated/butterfly-larva.webp',
  chrysalis: 'assets/generated/butterfly-pupa.webp',
  butterfly: 'assets/generated/butterfly-adult.webp',
  frog: 'assets/generated/species-frog.webp',
  chicken: 'assets/generated/species-chicken.webp',
  dog: 'assets/generated/species-dog.webp',
  balsam: 'assets/generated/species-balsam.webp',
  apple: 'assets/generated/species-apple.webp',
  forestMap: 'assets/generated/forest-map.webp',
});

export const SCENES = [
  'assets/optimized/scene-01.webp', 'assets/optimized/scene-02.webp',
  'assets/optimized/scene-03.webp', 'assets/optimized/scene-04.webp',
  'assets/optimized/scene-05.webp', 'assets/optimized/scene-06.webp',
  'assets/optimized/scene-07.webp', 'assets/optimized/scene-08.webp',
  'assets/optimized/scene-09.webp', 'assets/optimized/scene-10.webp',
];

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function assetImage(key, alt = '', className = '') {
  return `<img class="game-asset ${escape(className)}" src="${ASSETS[key]}" alt="${escape(alt)}" width="512" height="512" decoding="async" draggable="false" data-asset="${key}">`;
}

export function illustration(key) {
  return `<svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-art="${key}"><image href="${ASSETS[key]}" x="16" y="2" width="188" height="176" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

let artworkId = 0;
export function plantArtwork(level = 3, roots = true) {
  const stage = Math.min(3, Math.max(0, Math.floor(level)));
  const clip = `plant-top-${++artworkId}`;
  const extraGrowth = Math.max(0, Math.min(2, level - 3));
  const size = stage === 0 ? 30 : stage === 1 ? 64 : stage === 2 ? 94 : 126 + extraGrowth * 20;
  const y = stage === 0 ? 105 : stage === 1 ? 83 : stage === 2 ? 55 : 28 - extraGrowth * 16;
  const positions = [70, 110, 150];
  const plants = positions.map((x, i) => `<image href="${ASSETS['seed' + stage]}" x="${x - size / 2}" y="${y + (i === 1 ? -5 : 0)}" width="${size}" height="${size}"/>`).join('');
  return `<svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-art="plant-${stage}">
    <defs><clipPath id="${clip}"><rect width="220" height="110"/></clipPath></defs>
    <image href="${ASSETS.vessel}" x="40" y="91" width="140" height="87" opacity="${roots ? '.42' : '1'}" preserveAspectRatio="none"/>
    <image href="${ASSETS.soil}" x="52" y="107" width="116" height="54" opacity="${roots ? '.48' : '.9'}" preserveAspectRatio="none"/>
    <g ${roots || stage === 0 ? '' : `clip-path="url(#${clip})"`}>${plants}</g>
  </svg>`;
}

// Inline same-origin images before canvas export so SVG rendering is self-contained.
const embeddedImages = new Map();
export async function embedArtworkImages(svg) {
  const paths = [...new Set([...svg.matchAll(/href="(assets\/[^"]+)"/g)].map(match => match[1]))];
  for (const path of paths) {
    if (!embeddedImages.has(path)) {
      const response = await fetch(path);
      if (!response.ok) throw new Error('Artwork unavailable');
      const blob = await response.blob();
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      embeddedImages.set(path, data);
    }
    svg = svg.replaceAll(`href="${path}"`, `href="${embeddedImages.get(path)}"`);
  }
  return svg;
}
