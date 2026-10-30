export const cardFormats = {
  portrait: { label: 'Tarjeta · 1080 × 1400', width: 1080, height: 1400 },
  story: { label: 'Historia · 1080 × 1920', width: 1080, height: 1920 },
};
export const cardStyles = { signature: 'Anata original', manga: 'Tinta y papel', universe: 'Mi universo' };

function fitText(ctx, text, x, y, maxWidth, size, family, weight = 700) {
  while (size > 16) { ctx.font = `${weight} ${size}px ${family}`; if (ctx.measureText(text).width <= maxWidth) break; size -= 2; }
  ctx.fillText(text, x, y);
}

export async function createCardBlob(result, { format = 'portrait', style = 'signature' } = {}) {
  if (!cardFormats[format] || !cardStyles[style] || !result?.character) throw new TypeError('Selecciona un formato de tarjeta válido.');
  const { character } = result;
  const { width, height } = cardFormats[format];
  const story = format === 'story';
  const paper = style === 'manga';
  const bg = paper ? '#f2efe7' : '#151617';
  const ink = paper ? '#151617' : '#f2efe7';
  const accent = paper ? '#151617' : style === 'universe' ? character.color : '#ff6846';
  const display = '"Barlow Condensed", Impact, sans-serif';
  const font = '"DM Sans", sans-serif';
  const image = new Image(); image.src = `./images/${character.id}.jpg`; await image.decode();
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  const top = story ? 100 : 54;
  const imageHeight = story ? 1050 : 730;
  if (story) { ctx.fillStyle = accent; ctx.font = `700 25px ${font}`; ctx.fillText('ANATA DESU / TU HISTORIA EN OTRO UNIVERSO', 64, 58); }
  ctx.save(); ctx.beginPath(); ctx.rect(54, top, 972, imageHeight); ctx.clip();
  const scale = Math.max(972 / image.width, imageHeight / image.height);
  const w = image.width * scale, h = image.height * scale;
  if (paper) ctx.filter = 'grayscale(1) contrast(1.15)';
  ctx.drawImage(image, 54 + (972 - w) / 2, top + (imageHeight - h) * .18, w, h);
  ctx.filter = 'none';
  const fade = ctx.createLinearGradient(0, top + imageHeight - 200, 0, top + imageHeight);
  fade.addColorStop(0, paper ? '#f2efe700' : '#15161700'); fade.addColorStop(1, bg); ctx.fillStyle = fade; ctx.fillRect(54, top, 972, imageHeight);
  ctx.restore();
  if (style === 'universe') {
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    ctx.strokeRect(36, top - 18, 1008, imageHeight + 36);
    ctx.fillStyle = accent; ctx.fillRect(78, top + 24, 560, 42);
    ctx.fillStyle = '#151617';
    fitText(ctx, `UNIVERSO / ${character.anime.toUpperCase()}`, 91, top + 52, 532, 20, font, 700);
  }
  const contentY = top + imageHeight + 54;
  ctx.fillStyle = accent; ctx.font = `700 23px ${font}`; ctx.fillText('EN OTRO UNIVERSO, MI ALMA SE PARECE A', 66, contentY);
  ctx.fillStyle = ink; fitText(ctx, character.name.toUpperCase(), 62, contentY + 105, 950, 102, display, 800);
  ctx.fillStyle = accent; fitText(ctx, character.anime, 66, contentY + 158, 940, 30, font, 600);
  ctx.fillStyle = ink; fitText(ctx, character.tag, 66, contentY + 222, 940, 29, font, 400);
  if (story) {
    ctx.fillStyle = accent; ctx.font = `700 23px ${font}`; ctx.fillText('MIS RASGOS MÁS PRESENTES', 66, contentY + 308);
    ctx.fillStyle = ink; fitText(ctx, result.traits.slice(0, 2).map(trait => trait.label).join('  /  '), 66, contentY + 366, 940, 43, display, 700);
    ctx.font = `400 23px ${font}`; ctx.fillText('Cada personalidad tiene más de una historia.', 66, contentY + 422);
  }
  const foot = height - 155;
  ctx.strokeStyle = paper ? '#15161744' : '#f2efe733'; ctx.beginPath(); ctx.moveTo(66, foot - 35); ctx.lineTo(1014, foot - 35); ctx.stroke();
  ctx.fillStyle = ink; ctx.font = `700 35px ${font}`; ctx.fillText('AnataDesu', 66, foot + 28);
  ctx.font = `400 22px ${font}`; ctx.fillText('Tu personalidad tiene su propio universo.', 66, foot + 72);
  ctx.fillStyle = accent; ctx.font = '700 65px sans-serif'; ctx.fillText('✳', 940, foot + 50);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('No se pudo generar la tarjeta.');
  return blob;
}
