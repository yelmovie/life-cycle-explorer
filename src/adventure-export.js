const FIELD_FONT_FALLBACK = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

function cleanText(value, fallback = '') {
  const text=String(value ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');return text.trim()?text:fallback;
}

/** Preserve spaces and every paragraph, wrapping between words by measured width; only an over-long word breaks inside. */
function wrapText(ctx,text,width){
 const lines=[];
 for(const paragraph of text.split('\n')){
  let line='';
  for(const word of paragraph.split(/(?<=\s)/)){
   if(line&&ctx.measureText(line+word.trimEnd()).width>width){lines.push(line.trimEnd());line='';}
   for(const letter of [...word]){if(line&&ctx.measureText(line+letter).width>width&&letter.trim()){lines.push(line);line='';}line+=letter;}
  }
  lines.push(line.trimEnd());
 }
 return lines.length?lines:[''];
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
const HAND = '"Research Hand", "Jua", ' + FIELD_FONT_FALLBACK;
const ROUND = '"Jua", ' + FIELD_FONT_FALLBACK;
const NOTE = { paper: '#fffdf3', rule: '#d9e7ef', margin: '#f3b9ae', ink: '#2c4a3b', pencil: '#3b4a6b', tape: 'rgba(247,214,120,.72)', mint: '#e6f1dc', pink: '#fbe3df', card: '#ffffff', edge: '#e4d9bf' };

function handFont(ctx, size) { ctx.font = `400 ${size}px ${HAND}`; }
function roundFont(ctx, size) { ctx.font = `400 ${size}px ${ROUND}`; }
function tape(ctx, x, y, width, angle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = NOTE.tape; ctx.fillRect(-width / 2, -17, width, 34);
  ctx.strokeStyle = 'rgba(214,170,70,.35)'; ctx.lineWidth = 2; ctx.strokeRect(-width / 2, -17, width, 34); ctx.restore();
}
function flower(ctx, x, y, r, color) {
  ctx.fillStyle = color; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * .72, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#f6c84c'; ctx.beginPath(); ctx.arc(x, y, r * .62, 0, Math.PI * 2); ctx.fill();
}
function star(ctx, x, y, r, color) {
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  ctx.closePath(); ctx.fill();
}
function leaf(ctx, x, y, size, angle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = '#8cbf6a'; ctx.beginPath(); ctx.ellipse(0, 0, size, size * .45, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5e9348'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-size * .9, 0); ctx.lineTo(size * .9, 0); ctx.stroke(); ctx.restore();
}
/** Hand-written lines that sit on ruled guide lines, like a child's notebook entry. */
function ruledWriting(ctx, lines, x, y, width, lineHeight, minLines) {
  ctx.strokeStyle = NOTE.rule; ctx.lineWidth = 2;
  for (let i = 0; i < Math.max(minLines, lines.length); i++) { const base = y + (i + 1) * lineHeight - 8; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + width, base); ctx.stroke(); }
  ctx.fillStyle = NOTE.pencil; paintLines(ctx, lines, x + 6, y + 6, lineHeight);
}

/** A printable A4-shaped notebook page: the child's title, four taped photo cards in a 2×2 grid, and their own writing. */
export async function exportStorybook({ title, summary, cards, plan, limits } = {}) {
  if (!Array.isArray(cards) || !cards.length || cards.length > 6) throw new Error('탐구 카드 1~6장을 골라 줘.');
  const heading = cleanText(title, '나의 생명관찰노트');
  const conclusion = cleanText(summary);
  const records = cards.map((card, index) => ({
    title: cleanText(card?.title, `관찰 기록 ${index + 1}`),
    region: cleanText(card?.region),
    caption: cleanText(card?.caption),
    image: card?.image,
  }));
  if (heading.length > (limits?.title??200) || conclusion.length > (limits?.summary??1600) || records.some(card => card.title.length > 240 || card.caption.length > (limits?.caption??2000))) {
    throw new Error('한 장에 담기에는 글이 너무 길어. 핵심 발견을 조금 더 짧게 정리해 줘.');
  }
  await Promise.all([document.fonts?.load?.(`40px ${HAND}`), document.fonts?.load?.(`40px ${ROUND}`)].map(p => Promise.resolve(p).catch(() => {})));
  const [images] = await Promise.all([Promise.all(records.map(card => loadArtwork(card.image))), document.fonts?.ready]);
  const canvas = document.createElement('canvas');
  canvas.width = 1800;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이 브라우저에서 결과 그림을 만들 수 없어.');
  const W = canvas.width, margin = 110, gap = 46, columns = records.length === 1 ? 1 : 2;
  const cardWidth = (W - margin * 2 - gap * (columns - 1)) / columns, inner = cardWidth - 64, imageHeight = 330, line = 54;
  handFont(ctx, 76); const titleLines = wrapText(ctx, heading, W - margin * 2 - 40);
  const cardsTop = 330 + (titleLines.length - 1) * 86;
  const layouts = records.map(card => {
    roundFont(ctx, 34); const titleLines = wrapText(ctx, card.title, inner - 80);
    handFont(ctx, 38); const captionLines = card.caption ? wrapText(ctx, card.caption, inner - 12) : [];
    return { titleLines, captionLines, writeLines: Math.max(3, captionLines.length) };
  });
  const rows = [];
  for (let i = 0; i < records.length; i += columns) {
    const items = layouts.slice(i, i + columns);
    const head = Math.max(...items.map(item => item.titleLines.length * 44)) + 70;
    rows.push({ start: i, head, height: head + imageHeight + 92 + Math.max(...items.map(item => item.writeLines)) * line + 36 });
  }
  handFont(ctx, 40); const summaryLines = conclusion ? wrapText(ctx, conclusion, W - margin * 2 - 90) : [];
  const summaryWrite = Math.max(2, summaryLines.length), planItems = [['관찰할 생물', plan?.subject], ['언제', plan?.when], ['무엇을 기록할까', plan?.what]];
  const planLayouts = planItems.map(([, text]) => { handFont(ctx, 38); return wrapText(ctx, cleanText(text), W - margin * 2 - 420); });
  const summaryTop = cardsTop + rows.reduce((sum, row) => sum + row.height + gap, 0) + 10;
  const summaryHeight = 110 + summaryWrite * line, planTop = summaryTop + summaryHeight + 34;
  const planHeight = 100 + planLayouts.reduce((sum, lines) => sum + Math.max(1, lines.length) * line + 14, 0);
  // A4 portrait proportions so it prints on one page; long writing grows the page instead of shrinking the text.
  const outputHeight = Math.max(Math.ceil(W * 297 / 210), Math.ceil(planTop + planHeight + 150));
  if (outputHeight > 16000) throw new Error('기록이 너무 길어 결과 그림에 담기 어려워. 설명을 조금 줄여 줘.');
  canvas.height = outputHeight;
  ctx.textBaseline = 'top';

  // Paper, ruled lines, a red margin line and spiral binding.
  ctx.fillStyle = NOTE.paper; ctx.fillRect(0, 0, W, outputHeight);
  ctx.strokeStyle = NOTE.rule; ctx.lineWidth = 2;
  for (let y = 150; y < outputHeight; y += line) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.strokeStyle = NOTE.margin; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(72, 96); ctx.lineTo(72, outputHeight); ctx.stroke();
  for (let x = 90; x < W - 40; x += 92) {
    ctx.fillStyle = '#e9e1cc'; ctx.beginPath(); ctx.arc(x, 52, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, 34, 22, Math.PI * .15, Math.PI * .95); ctx.stroke();
  }

  // Header: notebook label, the child's own title, name and date blanks.
  rounded(ctx, margin, 108, 410, 58, 29, NOTE.mint, '#bcd6a8');
  leaf(ctx, margin + 40, 137, 18, -.5);
  roundFont(ctx, 32); ctx.fillStyle = '#3f6b45'; ctx.fillText('나의 생명관찰노트', margin + 72, 120);
  roundFont(ctx, 28); ctx.fillStyle = NOTE.ink;
  const now = new Date(), date = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}.`;
  ctx.fillText('이름:', W - margin - 600, 124); ctx.fillText(`날짜: ${date}`, W - margin - 270, 124);
  ctx.strokeStyle = '#9aa79a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W - margin - 520, 160); ctx.lineTo(W - margin - 300, 160); ctx.stroke();
  handFont(ctx, 76); ctx.fillStyle = NOTE.ink; paintLines(ctx, titleLines, margin, 196, 86);
  star(ctx, W - margin - 30, 230, 26, '#f6c84c'); flower(ctx, W - margin - 100, 262, 12, '#f4a7b9');

  let top = cardsTop;
  for (const row of rows) {
    for (let column = 0; column < columns && row.start + column < records.length; column++) {
      const index = row.start + column, card = records[index], layout = layouts[index], x = margin + column * (cardWidth + gap);
      ctx.save(); ctx.shadowColor = 'rgba(90,70,30,.16)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      rounded(ctx, x, top, cardWidth, row.height, 22, NOTE.card); ctx.restore();
      rounded(ctx, x, top, cardWidth, row.height, 22, 'rgba(0,0,0,0)', NOTE.edge);
      tape(ctx, x + cardWidth / 2, top + 2, 150, index % 2 ? .05 : -.06);
      ctx.fillStyle = index % 2 ? '#f08a6c' : '#5e9e6b'; ctx.beginPath(); ctx.arc(x + 62, top + 62, 30, 0, Math.PI * 2); ctx.fill();
      roundFont(ctx, 32); ctx.fillStyle = '#fff'; const number = String(index + 1); ctx.fillText(number, x + 62 - ctx.measureText(number).width / 2, top + 45);
      roundFont(ctx, 34); ctx.fillStyle = NOTE.ink; paintLines(ctx, layout.titleLines, x + 108, top + 44, 44);
      if (card.region) { roundFont(ctx, 24); const w = ctx.measureText(card.region).width + 34; rounded(ctx, x + cardWidth - w - 28, top + 20, w, 40, 20, NOTE.pink); ctx.fillStyle = '#b4544a'; ctx.fillText(card.region, x + cardWidth - w - 11, top + 28); }
      const artTop = top + row.head;
      rounded(ctx, x + 32, artTop, inner, imageHeight, 16, NOTE.mint);
      const image = images[index], scale = Math.min((inner - 30) / image.naturalWidth, (imageHeight - 24) / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      ctx.drawImage(image, x + 32 + (inner - width) / 2, artTop + (imageHeight - height) / 2, width, height);
      const textTop = artTop + imageHeight + 26;
      roundFont(ctx, 26); ctx.fillStyle = '#5e9e6b'; ctx.fillText('✎ 내가 쓴 글', x + 34, textTop);
      handFont(ctx, 38); ruledWriting(ctx, layout.captionLines, x + 34, textTop + 48, inner, line, row.height - row.head - imageHeight - 110 > 0 ? Math.floor((row.height - row.head - imageHeight - 110) / line) : 3);
    }
    top += row.height + gap;
  }

  rounded(ctx, margin, summaryTop, W - margin * 2, summaryHeight, 24, '#fff7e0', '#efd99a');
  star(ctx, margin + 46, summaryTop + 48, 20, '#f2b33d');
  roundFont(ctx, 32); ctx.fillStyle = '#8a5a12'; ctx.fillText('내가 알아낸 것', margin + 78, summaryTop + 30);
  handFont(ctx, 40); ruledWriting(ctx, summaryLines, margin + 44, summaryTop + 82, W - margin * 2 - 88, line, summaryWrite);

  rounded(ctx, margin, planTop, W - margin * 2, planHeight, 24, '#eef6ff', '#bcd3ea');
  flower(ctx, margin + 46, planTop + 50, 11, '#9cc4ef');
  roundFont(ctx, 32); ctx.fillStyle = '#2f5c86'; ctx.fillText('앞으로의 관찰 약속', margin + 78, planTop + 32);
  let planY = planTop + 92;
  planItems.forEach(([label], i) => {
    const lines = planLayouts[i];
    ctx.strokeStyle = '#6f93b8'; ctx.lineWidth = 3; ctx.strokeRect(margin + 44, planY + 6, 30, 30);
    roundFont(ctx, 30); ctx.fillStyle = '#2f5c86'; ctx.fillText(label, margin + 92, planY + 6);
    handFont(ctx, 38); ruledWriting(ctx, lines, margin + 380, planY - 6, W - margin * 2 - 420, line, 1);
    planY += Math.max(1, lines.length) * line + 14;
  });

  const footerTop = outputHeight - 92;
  leaf(ctx, margin + 20, footerTop + 18, 22, .4); leaf(ctx, margin + 56, footerTop + 4, 16, -.6); flower(ctx, W - margin - 20, footerTop + 16, 13, '#f4a7b9'); star(ctx, W - margin - 70, footerTop + 20, 16, '#f6c84c');
  roundFont(ctx, 24); ctx.fillStyle = '#7d8a7c'; const foot = '생명 시계 연구실 · 내가 관찰하고 기록한 노트 (모형 활동)';
  ctx.fillText(foot, (W - ctx.measureText(foot).width) / 2, footerTop + 4);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('결과 그림을 저장하지 못했어. 다시 시도해 줘.')), 'image/png'));
}
