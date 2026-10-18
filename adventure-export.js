const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const COLORS = { paper: '#fbf7e8', ink: '#244d39', muted: '#637462', line: '#d6ddc5', green: '#315c42', mint: '#edf3df', gold: '#e7c77c', white: '#fffef8' };
const wordSegmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ko', { granularity: 'word' }) : null;
const letterSegmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null;

function cleanText(value, fallback = '') {
  return String(value ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim() || fallback;
}

function font(ctx, size, weight = 400) { ctx.font = `${weight} ${size}px ${FONT}`; }

/** Preserve paragraphs and prefer word boundaries; long Korean words still fit. */
function wrapText(ctx, text, width) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) { lines.push(''); continue; }
    const words = wordSegmenter ? [...wordSegmenter.segment(paragraph)].map(item => item.segment) : paragraph.split(/(\s+)/);
    let line = '';
    for (const word of words) {
      if (ctx.measureText(line + word).width <= width) { line += word; continue; }
      if (line.trim()) { lines.push(line.trimEnd()); line = ''; }
      const token = word.trimStart();
      if (ctx.measureText(token).width <= width) { line = token; continue; }
      const letters = letterSegmenter ? [...letterSegmenter.segment(token)].map(item => item.segment) : [...token];
      for (const letter of letters) {
        if (line && ctx.measureText(line + letter).width > width) { lines.push(line); line = ''; }
        line += letter;
      }
    }
    if (line.trim()) lines.push(line.trimEnd());
  }
  return lines.length ? lines : [''];
}

function paintLines(ctx, lines, x, y, lineHeight) {
  for (const [index, line] of lines.entries()) ctx.fillText(line, x, y + index * lineHeight);
}

function rounded(ctx, x, y, width, height, radius, fill, stroke = null) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function sameOriginURL(value) {
  const url = new URL(value, document.baseURI);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== location.origin || url.username || url.password) {
    throw new Error('탐구 그림은 이 앱에 저장된 이미지로만 만들 수 있어.');
  }
  return url;
}

async function localBlob(value) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(sameOriginURL(value), { signal: controller.signal, redirect: 'error', credentials: 'same-origin' });
    if (!response.ok) throw new Error('탐구 그림을 불러오지 못했어. 연결을 확인하고 다시 저장해 줘.');
    return await response.blob();
  } finally { clearTimeout(timer); }
}

function blobDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('탐구 그림을 읽지 못했어.'));
    reader.readAsDataURL(blob);
  });
}

function svgDataText(value) {
  const comma = value.indexOf(',');
  const header = value.slice(0, comma), body = value.slice(comma + 1);
  if (/;base64/i.test(header)) {
    return new TextDecoder().decode(Uint8Array.from(atob(body), char => char.charCodeAt(0)));
  }
  return decodeURIComponent(body);
}

async function selfContainedSVG(value, depth = 0) {
  if (depth > 3) throw new Error('겹친 그림이 너무 많아 저장할 수 없어.');
  const source = /^data:image\/svg\+xml[;,]/i.test(value) ? svgDataText(value) : value;
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('탐구 그림 형식을 확인해 줘.');
  for (const element of [...doc.querySelectorAll('script,foreignObject,iframe,object,embed,style')]) element.remove();
  for (const element of doc.querySelectorAll('*')) {
    for (const attribute of [...element.attributes]) {
      if (/^on/i.test(attribute.name) || attribute.name === 'xml:base') element.removeAttributeNode(attribute);
      else if (/@import/i.test(attribute.value) || [...attribute.value.matchAll(/url\(([^)]*)\)/gi)].some(match => !match[1].trim().replace(/^["']|["']$/g, '').startsWith('#'))) element.removeAttributeNode(attribute);
    }
    for (const name of ['href', 'xlink:href']) {
      if (!element.hasAttribute(name)) continue;
      const href = element.getAttribute(name);
      if (href.startsWith('#')) continue;
      if (element.localName !== 'image') { element.removeAttribute(name); continue; }
      const embedded = await imageBlob(href, depth + 1);
      element.setAttribute(name, await blobDataURL(embedded));
    }
  }
  doc.documentElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const viewBox = (doc.documentElement.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
  if (viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
    if (!doc.documentElement.hasAttribute('width')) doc.documentElement.setAttribute('width', String(viewBox[2]));
    if (!doc.documentElement.hasAttribute('height')) doc.documentElement.setAttribute('height', String(viewBox[3]));
  }
  return new Blob([new XMLSerializer().serializeToString(doc.documentElement)], { type: 'image/svg+xml' });
}

async function imageBlob(value, depth = 0) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('탐구 카드에 사용할 그림이 없어.');
  const image = value.trim();
  if (image.startsWith('<') || /^data:image\/svg\+xml[;,]/i.test(image)) return selfContainedSVG(image, depth);
  if (/^data:image\/(?:png|webp|jpe?g);base64,/i.test(image)) {
    const [header, encoded] = image.split(',', 2);
    return new Blob([Uint8Array.from(atob(encoded), char => char.charCodeAt(0))], { type: header.slice(5, header.indexOf(';')) });
  }
  const blob = await localBlob(image);
  if (blob.type.includes('svg') || /\.svg(?:[?#]|$)/i.test(image)) return selfContainedSVG(await blob.text(), depth);
  if (!/^image\/(?:png|webp|jpe?g|gif|avif)/i.test(blob.type)) throw new Error('지원하지 않는 탐구 그림이야.');
  return blob;
}

async function loadArtwork(value) {
  const blob = await imageBlob(value);
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => { image.src = ''; reject(new Error('탐구 그림 준비가 오래 걸려. 잠시 후 다시 저장해 줘.')); }, 15000);
      image.onload = () => { clearTimeout(timer); resolve(image); };
      image.onerror = () => { clearTimeout(timer); reject(new Error('탐구 그림을 그리지 못했어.')); };
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}

/** Render the student's actual evidence and captions. The caller owns downloading. */
export async function exportStorybook({ title, summary, cards } = {}) {
  if (!Array.isArray(cards) || !cards.length || cards.length > 6) throw new Error('탐구 카드 1~6장을 골라 줘.');
  const heading = cleanText(title, '나의 생명 탐구 이야기');
  const conclusion = cleanText(summary, '아직 한 문장 정리를 적지 않았어.');
  const records = cards.map((card, index) => ({
    title: cleanText(card?.title, `관찰 기록 ${index + 1}`),
    detail: cleanText(card?.detail),
    caption: cleanText(card?.caption, '아직 설명을 적지 않았어.'),
    image: card?.image,
  }));
  if (heading.length > 200 || conclusion.length > 1600 || records.some(card => card.title.length > 240 || card.detail.length > 1200 || card.caption.length > 2000)) {
    throw new Error('한 장에 담기에는 글이 너무 길어. 핵심 발견을 조금 더 짧게 정리해 줘.');
  }
  const [images] = await Promise.all([Promise.all(records.map(card => loadArtwork(card.image))), document.fonts?.ready]);
  const canvas = document.createElement('canvas');
  canvas.width = 1800;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이 브라우저에서 결과 그림을 만들 수 없어.');
  const margin = 84, gap = 30, contentWidth = canvas.width - margin * 2;
  const columns = Math.min(3, records.length), cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const imageHeight = columns === 1 ? 420 : columns === 2 ? 350 : 280;
  font(ctx, 60, 800);
  const titleLines = wrapText(ctx, heading, contentWidth - 12);
  const cardsTop = 172 + titleLines.length * 76;
  const layouts = records.map(card => {
    font(ctx, 28, 700); const titleLines = wrapText(ctx, card.title, cardWidth - 125);
    font(ctx, 22); const detailLines = card.detail ? wrapText(ctx, card.detail, cardWidth - 52) : [];
    font(ctx, 27, 500); const captionLines = wrapText(ctx, card.caption, cardWidth - 52);
    return { titleLines, detailLines, captionLines };
  });
  const rows = [];
  for (let i = 0; i < records.length; i += columns) {
    const items = layouts.slice(i, i + columns);
    const titleHeight = Math.max(80, ...items.map(item => item.titleLines.length * 37 + 40));
    const bodyHeight = Math.max(...items.map(item => item.detailLines.length * 32 + (item.detailLines.length ? 20 : 0) + 42 + item.captionLines.length * 40));
    rows.push({ start: i, titleHeight, height: titleHeight + imageHeight + 30 + bodyHeight + 30 });
  }
  font(ctx, 30, 500); const summaryLines = wrapText(ctx, conclusion, contentWidth - 72);
  const summaryTop = cardsTop + rows.reduce((sum, row) => sum + row.height + gap, 0) + 12;
  const summaryHeight = 110 + summaryLines.length * 44;
  const outputHeight = Math.ceil(summaryTop + summaryHeight + 130);
  if (outputHeight > 16000) throw new Error('기록이 너무 길어 결과 그림에 담기 어려워. 설명을 조금 줄여 줘.');
  canvas.height = outputHeight;
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLORS.paper; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = COLORS.green; ctx.fillRect(0, 0, canvas.width, 18);
  rounded(ctx, margin, 60, 360, 48, 24, COLORS.mint);
  font(ctx, 23, 700); ctx.fillStyle = COLORS.green; ctx.fillText('생명의 숲 · 나의 발견 이야기', margin + 22, 71);
  font(ctx, 60, 800); ctx.fillStyle = COLORS.ink; paintLines(ctx, titleLines, margin, 134, 76);

  let top = cardsTop;
  for (const row of rows) {
    for (let column = 0; column < columns && row.start + column < records.length; column++) {
      const index = row.start + column, layout = layouts[index], x = margin + column * (cardWidth + gap);
      rounded(ctx, x, top, cardWidth, row.height, 26, COLORS.white, COLORS.line);
      rounded(ctx, x + 24, top + 22, 54, 54, 16, COLORS.green);
      font(ctx, 27, 800); ctx.fillStyle = COLORS.white; ctx.fillText(String(index + 1).padStart(2, '0'), x + 34, top + 34);
      font(ctx, 28, 700); ctx.fillStyle = COLORS.ink; paintLines(ctx, layout.titleLines, x + 96, top + 26, 37);
      const artTop = top + row.titleHeight;
      rounded(ctx, x + 20, artTop, cardWidth - 40, imageHeight, 18, COLORS.mint);
      const image = images[index], availableWidth = cardWidth - 72, availableHeight = imageHeight - 32;
      const scale = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      ctx.drawImage(image, x + (cardWidth - width) / 2, artTop + (imageHeight - height) / 2, width, height);
      let textTop = artTop + imageHeight + 24;
      font(ctx, 22); ctx.fillStyle = COLORS.muted; paintLines(ctx, layout.detailLines, x + 26, textTop, 32);
      textTop += layout.detailLines.length * 32 + (layout.detailLines.length ? 20 : 0);
      font(ctx, 20, 700); ctx.fillStyle = COLORS.green; ctx.fillText('나의 발견', x + 26, textTop);
      font(ctx, 27, 500); ctx.fillStyle = COLORS.ink; paintLines(ctx, layout.captionLines, x + 26, textTop + 42, 40);
    }
    top += row.height + gap;
  }
  rounded(ctx, margin, summaryTop, contentWidth, summaryHeight, 24, '#e7edda', COLORS.line);
  font(ctx, 23, 800); ctx.fillStyle = COLORS.green; ctx.fillText('내 탐구를 한 문장으로', margin + 36, summaryTop + 28);
  font(ctx, 30, 500); ctx.fillStyle = COLORS.ink; paintLines(ctx, summaryLines, margin + 36, summaryTop + 76, 44);
  const footerTop = canvas.height - 74;
  ctx.strokeStyle = COLORS.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(margin, footerTop - 22); ctx.lineTo(canvas.width - margin, footerTop - 22); ctx.stroke();
  font(ctx, 22, 600); ctx.fillStyle = COLORS.muted; ctx.fillText('생명 시계 연구실 · 탐구 기록 / 모의 관찰', margin, footerTop);
  font(ctx, 21); const count = `${records.length}개의 기록을 이어 만든 이야기`; ctx.fillText(count, canvas.width - margin - ctx.measureText(count).width, footerTop);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('결과 그림을 저장하지 못했어. 다시 시도해 줘.')), 'image/png'));
}
