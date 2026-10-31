// Original vector illustrations for AnataDesu. No external images or fonts.
// Rebuild all eight worlds and six fates with: node scripts/create-destiny-art.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = fileURLToPath(new URL('../public/images/destiny/', import.meta.url));
mkdirSync(directory, { recursive: true });
const worlds = {
  naruto: { name: 'aldea shinobi', accent: '#f3a168', light: '#f5c89a' },
  jujutsu: { name: 'estación de Tokio', accent: '#b4a0f0', light: '#d9c9ff' },
  titan: { name: 'ciudad amurallada', accent: '#a9bb8c', light: '#e1d8b3' },
  bleach: { name: 'ciudad de las almas', accent: '#88c9df', light: '#d1eff3' },
  onepiece: { name: 'mar de las islas', accent: '#f1bd65', light: '#ffe6af' },
  demonslayer: { name: 'bosque de glicinas', accent: '#c494c9', light: '#efcee5' },
  dragonball: { name: 'valle de las montañas', accent: '#eeaa5e', light: '#ffe1a0' },
  alchemist: { name: 'ciudad de la alquimia', accent: '#d2ae7d', light: '#f4dfb7' },
};
const fates = {
  triumph: { name: 'un amanecer de victoria con todo el equipo a salvo', top: '#152335', mid: '#b8785e', horizon: '#f4d69c', sun: '#ffe4ac' },
  guardian: { name: 'un refugio luminoso que protege a los supervivientes', top: '#122832', mid: '#54726c', horizon: '#c0ccad', sun: '#e8e5bc' },
  strategist: { name: 'un mapa de luz que revela el camino de la victoria', top: '#111b34', mid: '#315169', horizon: '#7eafb9', sun: '#badfe8' },
  loss: { name: 'un compañero recordado en un pequeño memorial bajo la lluvia', top: '#202031', mid: '#795365', horizon: '#c8947d', sun: '#e6b49a' },
  sacrifice: { name: 'una figura que se desvanece en luz mientras protege a dos supervivientes', top: '#211e31', mid: '#9a654f', horizon: '#e5bc83', sun: '#fff1c7' },
  fallen: { name: 'un objeto abandonado en un paisaje nocturno vacío', top: '#0c1422', mid: '#27384a', horizon: '#60768a', sun: '#b6ccd6' },
};

const fill = (d, color, opacity = 1, extra = '') => `<path d="${d}" fill="${color}" opacity="${opacity}" ${extra}/>`;
const line = (d, color, width = 1, opacity = 1, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" ${extra}/>`;
const circle = (x, y, r, color, opacity = 1, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" ${/\bopacity=/.test(extra) ? '' : `opacity="${opacity}"`} ${extra}/>`;
const rect = (x, y, w, h, color, opacity = 1, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" ${/\bopacity=/.test(extra) ? '' : `opacity="${opacity}"`} ${extra}/>`;
const group = (content, transform = '', opacity = 1) => `<g transform="${transform}" opacity="${opacity}">${content}</g>`;
function random(seed) { let value = seed; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; }; }

function sky(world, fate, worldIndex, fateIndex) {
  const rand = random(9127 + worldIndex * 733 + fateIndex * 439);
  let result = rect(0, 0, 1200, 700, 'url(#sky)');
  result += circle(780, 290, 250, 'url(#aura)', .9);
  const sunX = fateIndex === 3 ? 220 : fateIndex === 5 ? 920 : 780;
  const sunY = fateIndex === 5 ? 170 : fateIndex === 3 ? 305 : 285;
  result += circle(sunX, sunY, fateIndex === 5 ? 52 : 98, fate.sun, fateIndex === 5 ? .72 : .8);
  result += circle(sunX, sunY, fateIndex === 5 ? 62 : 113, 'none', 1, `stroke="${fate.sun}" stroke-width=".7" opacity=".3"`);
  if (fateIndex === 5) result += circle(sunX - 19, sunY - 12, 48, fate.top, .96);
  const clouds = [
    'M-20 182C110 148 164 185 270 161S438 132 567 153 690 141 762 132L762 143C633 170 599 179 476 167S310 193 218 183 78 201-20 198Z',
    'M676 207C759 189 809 218 876 200S1030 169 1220 207L1220 220C1100 194 989 204 893 218S762 209 676 217Z',
    'M-30 325C111 302 164 335 317 316S501 291 599 307L599 319C486 309 452 327 323 330S109 322-30 343Z',
  ];
  clouds.forEach((d, i) => result += fill(d, fate.sun, .09 - i * .015));
  for (let i = 0; i < 55; i++) result += circle(Math.round(rand() * 1200), Math.round(rand() * 420), rand() * 1.3 + .4, '#f4e4c8', .15 + rand() * .35);
  result += line('M0 395Q260 340 540 380T1200 365', world.light, 1, .12);
  return result;
}

function mountainRange(accent) {
  return fill('M0 399 83 338 117 352 205 231 264 306 346 244 406 298 477 218 570 314 657 252 736 291 840 179 911 274 1024 234 1086 321 1153 294 1200 317V570H0Z', '#253645', .7)
    + fill('m179 270 26-39 26 37-20-12-13 12-10-4Zm279-22 19-30 23 31-19-12-10 11Zm362-35 20-34 34 49-32-18-7 13Z', accent, .24)
    + fill('M0 430 121 354 199 409 311 326 414 401 517 355 610 423 750 319 881 393 1012 344 1103 407 1200 365V560H0Z', '#20303b', .78);
}

function roof(x, y, width, height, color, accent, windows = 3) {
  let result = rect(x, y, width, height, color);
  result += fill(`M${x - 13} ${y + 4}l${width / 2 + 13}-${Math.min(width / 3, 30)} ${width / 2 + 13} ${Math.min(width / 3, 30)}-12 8H${x - 5}Z`, '#17252f');
  result += line(`M${x - 4} ${y + 5}h${width + 8}`, accent, 2, .3);
  for (let i = 0; i < windows; i++) result += rect(x + 13 + i * (width - 24) / windows, y + 17, Math.max(4, width / windows - 12), 14, accent, .45);
  return result;
}

function torii(x, y, scale, accent) {
  return group(
    fill('M-112 0Q0 21 112 0l-5 18Q0 35-107 18Z', '#24313a')
    + fill('M-103 3Q0 19 103 3l-1 4Q0 25-103 8Z', accent, .7)
    + rect(-93, 45, 186, 12, '#233039')
    + fill('M-72 18h17l-9 197h-23ZM55 18h17l15 197H64Z', '#26323a')
    + line('M-63 57-6 57M8 57h56', accent, 2, .6)
    + rect(-9, 27, 18, 46, accent, .5), `translate(${x} ${y}) scale(${scale})`);
}

function naruto(world) {
  let result = mountainRange(world.light);
  result += fill('M174 340 187 240 221 215 234 165 280 145 305 160 320 132 375 151 420 130 468 162 493 148 549 174 564 213 589 242 601 352Z', '#364452', .72);
  // Carved faces in the distant cliff, intentionally abstract.
  for (let i = 0; i < 4; i++) {
    const x = 250 + i * 87;
    result += fill(`M${x} 203q25-35 48 2l-1 53-12 19-22-9-16-26Z`, '#57616a', .45);
    result += line(`M${x + 5} 225h13m11 0h12m-19 1-4 17h9m-13 10h17`, '#233542', 2, .65);
  }
  for (let i = 0; i < 12; i++) result += roof(i * 104 - 20, 384 + (i % 3) * 22, 105, 140, i % 2 ? '#31404a' : '#3a464d', world.accent, 4);
  result += torii(926, 338, .9, world.accent);
  result += fill('M0 490Q145 448 293 495T548 493 818 476 1200 489V700H0Z', '#182830');
  result += line('M0 493Q145 451 293 498T548 496 818 479 1200 492', world.accent, 2, .35);
  return result;
}

function jujutsu(world) {
  let result = '';
  for (let i = 0; i < 15; i++) {
    const x = i * 86 - 25, y = 210 + (i * 49 % 130), w = 60 + (i * 17 % 30);
    result += rect(x, y, w, 320, i % 2 ? '#253144' : '#2d3a4b');
    result += line(`M${x + w / 2} ${y}v-32`, world.accent, 1, .32);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) result += rect(x + 10 + c * 17, y + 22 + r * 29, 6, 11, world.light, (r + c + i) % 3 ? .22 : .5);
  }
  result += fill('M-10 381Q600 302 1210 374l-3 30Q600 337-10 412Z', '#1a2839');
  result += line('M0 384Q600 312 1200 377', world.accent, 3, .5);
  result += rect(220, 385, 760, 150, '#29394a');
  result += fill('M174 386 600 326 1026 386 1012 404 600 354 188 405Z', '#152434');
  result += rect(475, 403, 251, 132, '#11212f');
  for (let i = 0; i < 6; i++) result += rect(252 + i * 134, 404, 14, 143, '#43515b');
  result += line('M0 531H1200M0 544H1200', world.accent, 2, .4);
  result += fill('M451 526 748 526 1183 700H16Z', '#172737');
  result += line('M499 528 295 700M699 528 926 700', world.accent, 2, .2);
  for (let i = 0; i < 3; i++) result += rect(330 + i * 250, 417, 56, 3, world.light, .65);
  return result;
}

function titan(world) {
  let result = mountainRange(world.light);
  result += rect(-10, 226, 1220, 257, '#43505a');
  result += fill('M0 226h1200v12H0Z', '#778086', .5);
  for (let i = 0; i < 17; i++) result += fill(`M${i * 79 - 28} 225h25l17 261h-59Z`, '#2d3d47', .75);
  for (let i = 0; i < 7; i++) result += line(`M0 ${250 + i * 34}h1200`, '#142c39', 1, .4);
  result += fill('M488 494V345q112-130 224 0v149Z', '#142936');
  result += line('M480 491V345q120-146 240 0v146', '#99a195', 8, .58);
  for (let i = 0; i < 7; i++) result += line(`M${508 + i * 31} 333v158`, '#43505a', 4, .85);
  result += roof(37, 470, 174, 115, '#3d4850', world.accent, 5);
  result += roof(187, 504, 170, 110, '#283b47', world.accent, 4);
  result += roof(886, 471, 184, 130, '#35454d', world.accent, 5);
  result += roof(1048, 438, 170, 145, '#3b4850', world.accent, 4);
  result += line('M93 420v-88M1048 409v-90', '#243643', 4);
  result += fill('M95 335q65-24 90 6-60 13-90 41ZM1050 322q56-25 84-1-61 19-84 40Z', world.accent, .72);
  result += fill('M0 599 366 550 490 517H712l164 52 324 32V700H0Z', '#172832');
  return result;
}

function bleach(world) {
  let result = mountainRange(world.light);
  result += fill('M0 436Q180 422 357 440T707 432 1200 430V700H0Z', '#1c3847');
  for (let i = 0; i < 8; i++) {
    result += roof(i * 160 - 10, 354 + i % 2 * 17, 153, 98, '#80908d', world.accent, 4);
    result += rect(i * 160 + 3, 414 + i % 2 * 17, 127, 35, '#344d59');
  }
  result += torii(600, 232, 1.25, world.accent);
  result += fill('M452 476Q600 446 749 476l73 224H374Z', '#263c47');
  for (let i = 0; i < 9; i++) result += line(`M${445 - i * 7} ${496 + i * 22}h${310 + i * 15}`, world.light, 1, .16);
  result += line('M384 490Q600 438 818 490M385 497Q600 445 817 497', world.accent, 3, .4);
  for (let i = 0; i < 9; i++) result += line(`M${i * 157 - 60} ${477 + i % 2 * 34}h${100 - i % 3 * 16}`, world.light, 2, .16);
  return result;
}

function onepiece(world) {
  let result = fill('M0 402Q300 363 600 405T1200 398V700H0Z', '#274551');
  result += fill('M-50 405 51 327 112 337 173 247 223 336 304 351 362 414Z', '#354b4c');
  result += fill('M876 406 924 345 985 353 1048 270 1085 353 1150 335 1240 409Z', '#334b50');
  result += fill('M64 351q40-20 78-10l29-40 24 41 33 12Z', '#668578', .5);
  for (let i = 0; i < 20; i++) result += line(`M${i * 74 - 60} ${438 + (i * 31 % 140)}q45-15 105-1`, world.light, 1.5, .18);
  result += line('M319 284q280-20 559 25M401 204q240-10 417 16', '#d0c4a1', 2, .5);
  result += rect(590, 131, 12, 346, '#40514d');
  result += rect(792, 204, 9, 277, '#40514d');
  result += fill('M611 170q135 14 156 159-65-21-156 2Z', '#e9d9b3', .82);
  result += fill('M577 188q-108 29-117 132 48-18 117 9Z', '#d9d3b9', .77);
  result += fill('M810 243q81 32 85 116l-85-10Z', '#d6cfb7', .7);
  result += line('M607 178q70 46 146 143M576 196q-49 55-105 114', '#766e5e', 1, .5);
  result += fill('M335 424q248 75 583-19l-61 124q-211 79-429-2Z', '#243943');
  result += line('M350 432q236 69 549-11', world.accent, 5, .7);
  for (let i = 0; i < 9; i++) result += circle(443 + i * 43, 476 + Math.sin(i / 2) * 10, 8, '#94a9a7', .4);
  result += fill('M591 131q73-27 102 8-64 9-102 44Z', world.accent, .86);
  result += fill('M0 589Q200 535 388 589T766 574 1200 579V700H0Z', '#172e3b');
  result += line('M0 588Q200 534 388 588T766 573 1200 578', world.light, 3, .2);
  return result;
}

function demonslayer(world) {
  let result = mountainRange(world.light);
  result += fill('M0 466Q200 405 400 457T800 428 1200 460V700H0Z', '#223d40');
  for (let i = 0; i < 8; i++) {
    const x = i < 4 ? i * 84 - 30 : 965 + (i - 4) * 89;
    result += fill(`M${x} 512q30-200 10-447h28q-6 244 8 455Z`, '#172c37');
    result += line(`M${x + 28} 220q-40-76-100-100m111 197q42-82 105-103`, '#203340', 9);
    result += fill(`M${x - 100} 125q40-60 109-29 80-21 129 52-62 28-139-1-70 34-99-22Z`, '#294647');
  }
  for (let i = 0; i < 25; i++) {
    const x = (i * 93 + 21) % 1200, y = 75 + i % 4 * 23;
    result += line(`M${x} ${y}q-10 46 0 ${54 + i % 5 * 12}`, '#556474', 1, .45);
    for (let j = 0; j < 5; j++) result += circle(x + Math.sin(j + i) * 6, y + 27 + j * 10, 8 - j * .9, j % 2 ? world.light : world.accent, .32 + j * .04);
  }
  result += fill('M268 518q332-177 664 0l-18 19q-316-152-628 0Z', '#273e45');
  result += line('M268 502q332-180 664 0M273 494q327-180 654 0', world.accent, 4, .5);
  for (let i = 0; i < 13; i++) {
    const x = 280 + i * 53, y = 490 - Math.sin(i / 12 * Math.PI) * 87;
    result += line(`M${x} ${y}v38`, '#263c41', 7);
  }
  result += fill('M0 613Q160 538 367 596T711 595 1200 564V700H0Z', '#182e34');
  return result;
}

function dragonball(world) {
  let result = fill('M0 510V290l73-90 65 95 75-78 68 87 60-179 73-41 77 49 35 184 87-92 46 58 63-191 68-30 52 29 54 215 72-77 64 80 53-39 83 60V700H0Z', '#3e5757', .86);
  result += fill('M322 243 341 125 414 84 448 110 398 152 371 228ZM758 177l14-75 68-30 52 29-55 5-26 38Z', world.light, .19);
  result += fill('M0 456 150 371 319 446 410 341 531 418 690 367 868 442 1033 377 1200 433V700H0Z', '#314c4b');
  result += fill('M0 544Q250 450 491 512T900 505 1200 513V700H0Z', '#244047');
  result += fill('M124 518v-78q0-90 96-90t96 90v78Z', '#a4b7ad', .9);
  result += line('M125 442h191M143 402h154', '#4b6b69', 3, .7);
  result += rect(193, 457, 47, 61, '#27444c');
  result += rect(152, 444, 25, 22, world.light, .6, 'rx="5"');
  result += rect(262, 444, 25, 22, world.light, .6, 'rx="5"');
  result += line('M220 351v-42m-10 3h20', '#a4b7ad', 5);
  result += circle(220, 304, 10, world.accent, .8);
  result += fill('M915 528q14-102 55-135 33 45 34 135Z', '#527066');
  result += line('M970 396v131', '#2c4a4c', 2, .4);
  return result;
}

function alchemist(world) {
  let result = '';
  for (let i = 0; i < 12; i++) {
    const x = i * 114 - 40, y = 295 + i % 4 * 24;
    result += rect(x, y, 105, 235, i % 2 ? '#46505a' : '#354650');
    result += fill(`M${x - 4} ${y}l55-33 56 33Z`, '#20323e');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) result += rect(x + 12 + c * 22, y + 17 + r * 36, 9, 17, world.light, .2 + (r + i) % 3 * .1);
  }
  result += rect(84, 231, 17, 170, '#394752');
  result += rect(1086, 190, 20, 230, '#394752');
  result += fill('M91 234q-73-35-41-65 30-24-2-59 60 7 50 55-5 35 17 52Z', '#73818a', .19);
  result += fill('M1093 194q-20-56 20-68t-7-69q64 21 44 72t-26 58Z', '#73818a', .16);
  result += fill('M447 513V303q153-182 306 0v210h-39V318q-114-142-228 0v195Z', '#68726f', .9);
  result += line('M467 511V310q133-161 266 0v201', world.accent, 4, .65);
  for (let i = 0; i < 7; i++) result += line(`M${451 + i * 50} ${294 - Math.sin(i / 6 * Math.PI) * 80}l-13 24`, '#253b48', 2, .7);
  result += circle(599, 244, 31, '#293f49');
  result += circle(599, 244, 22, 'none', 1, `stroke="${world.accent}" stroke-width="2" opacity=".6"`);
  result += line('M599 228v18l11 7', world.light, 2, .65);
  result += fill('M0 571 453 510H748l452 61V700H0Z', '#213440');
  for (let i = 0; i < 8; i++) result += line(`M${400 - i * 53} ${540 + i * 21}h${408 + i * 106}`, world.light, 1, .12);
  return result;
}

function person(x, y, scale = 1, pose = 'stand', color = '#111e28', accent = '#d0b795') {
  if (pose === 'kneel') return group(
    circle(-3, -108, 13, color)
    + fill('M-13-93q18-7 29 10l9 40 27 13-1 16H4l-19-21-11-3-17 23h-26l7-15 27-13Z', color)
    + line('M7-79 32-61 42-62', accent, 4, .6)
    + fill('M-16-96q-22 26-34 73l22-6 21-38Z', color), `translate(${x} ${y}) scale(${scale})`);
  let arms = pose === 'raised'
    ? fill('M-15-135-43-161l-7-30-11 3 4 41 35 37ZM16-136l37-39 10-29 10 4-8 35-42 57Z', color)
    : pose === 'shield'
      ? fill('M-17-136-58-125l-30-19-8 9 33 26 47-5ZM16-135l40-16 32 9 4-10-35-13-46 7Z', color)
      : fill('M-18-136-31-94l-1 31 11 1 10-54ZM18-134l16 34 1 36-10 1-10-50Z', color);
  return group(
    fill('M-10-137q-19 20-32 81l-18 11q36 0 47-18l14-39 17 50 32 12q-25-49-31-86Z', color, .75)
    + arms + fill('M-17-139q17-8 35 0l8 74-17 8H-9l-18-8Z', color)
    + fill('M-18-69h37l-4 64 9 5H2L-3-54-8-2l-17 2 4-8Z', color)
    + circle(0, -158, 15, color)
    + fill('M-15-158q-5-23 6-21l8-7 6 7 10-3-1 13 7 7-13-3-12 2Z', color)
    + line('M-16-133q16 8 33 0M-15-73h33', accent, 3, .7)
    + fill('M-16-134q-11-6-17-4l7 9-10 9 22-7Z', accent, .8), `translate(${x} ${y}) scale(${scale})`);
}

function lantern(x, y, accent, scale = 1) {
  return group(circle(0, 0, 33, 'url(#lanternGlow)', .75) + rect(-9, -16, 18, 25, accent, .82, 'rx="4"')
    + line('M-11-17h22M-11 10h22M0-21v-10', '#202f39', 3)
    + line('M-4-13v18M4-13v18', '#fff0c1', 1, .4), `translate(${x} ${y}) scale(${scale})`);
}

function token(worldId, x, y, scale = 1) {
  let result;
  if (worldId === 'naruto') result = fill('M-84-9q64-12 141 6l31 27-45-8q-77-17-120 1Z', '#755b56') + rect(-43, -14, 78, 31, '#a4ada9', .85, 'rx="5"') + line('M-22 1q13-18 27 0t-11 5q-9-9 2-14M23-7v16', '#30444b', 2);
  if (worldId === 'jujutsu') result = line('M-57 25Q-49-44-3-27t58 43', '#a69cb6', 3) + fill('M-24-14 29-11 22 42-30 37Z', '#c7c0bb') + line('M-13-1h27m-17 7 14 7-19 11 21 8', '#67556b', 3) + circle(-48, 16, 9, '#866c99');
  if (worldId === 'titan') result = fill('M-42-16 0-31 43-14 37 28 0 46-39 26Z', '#8b9d91') + line('M-25-6 2 25 26-10M-21 6 2 29 24 1M-12-5 2 12 13-9', '#344e54', 4) + fill('M-36 28-19 30-29 48-45 43Z', '#796b5c');
  if (worldId === 'bleach') result = line('M-90 24 74-24', '#aec7cc', 7) + line('M-93 25-54 13', '#4c6872', 10) + line('M-51 1-43 28', '#b49d7d', 7) + fill('M76-27 100-37 85-18Z', '#cce3e5');
  if (worldId === 'onepiece') result = fill('M-75 19q4-26 72-26t78 24q-73 24-150 2Z', '#c2a36c') + fill('M-46 8q2-59 44-59T45 9q-45 18-91-1Z', '#d6b879') + fill('M-44-4q44 13 88-1l2 14q-44 17-92-2Z', '#a65e52') + line('M-33-20q31 14 66 0M-20-38q18 8 40 0', '#aa8d5d', 1, .6);
  if (worldId === 'demonslayer') result = line('M-92 21 81-19', '#b3c1b5', 6) + line('M-94 22-47 12', '#5d5969', 10) + circle(-42, 11, 15, 'none', 1, 'stroke="#bd9cae" stroke-width="6"') + line('M-86 17-78 27M-73 14-65 24M-60 11-52 21', '#a1a597', 2);
  if (worldId === 'dragonball') result = circle(0, -1, 32, '#d79b57') + circle(-8, -11, 16, '#f5c982', .4) + fill('M-2-18 2-8 13-8 5-1 8 10-2 4-11 10-8-1-16-8-6-8Z', '#a66544') + line('M21-21 12-9 20 3 15 17', '#775e52', 1, .65);
  if (worldId === 'alchemist') result = circle(0, -2, 34, '#a8b2ad') + circle(0, -2, 27, '#354c55') + circle(0, -2, 24, '#c1c7b6') + line('M0-22v21l14 9M-20-2h4M20-2h-4M0 18v-4', '#566b6a', 2) + line('M4-37q28-30 66-12t27 25', '#b6b9a2', 3) + rect(-6, -45, 12, 10, '#a8b2ad', 1, 'rx="3"');
  return group(result, `translate(${x} ${y}) scale(${scale})`);
}

function foreground(world, fateId, worldId, fate) {
  let result = fill('M0 651Q132 611 279 634T551 613 844 628 1200 603V700H0Z', '#101f2b');
  result += line('M0 651Q132 611 279 634T551 613 844 628 1200 603', world.light, 1.3, .32);
  if (fateId === 'triumph') {
    result += fill('M234 643q328-91 675-4l-14 61H232Z', '#1c2c35');
    result += person(491, 627, .74, 'stand', '#17252f', world.accent);
    result += person(596, 638, 1.05, 'raised', '#11212c', world.accent);
    result += person(735, 630, .84, 'raised', '#1a2932', world.light);
    result += line('M388 638V393M838 638V402', '#172a35', 5);
    result += fill('M389 396q65-24 107 11-56 8-107 45ZM840 406q63-14 102 23-53-7-102 22Z', world.accent, .9);
    for (let i = 0; i < 18; i++) result += fill(`M${245 + i * 39} ${360 + i * 47 % 190}l8-3 7 10-9 3Z`, i % 2 ? world.light : world.accent, .7);
    result += line('M390 618q210-30 446 4', world.light, 1, .35);
  } else if (fateId === 'guardian') {
    result += fill('M274 646q48-333 325-365 265 29 327 365Z', 'url(#shield)', .65);
    result += line('M274 646q48-333 325-365 265 29 327 365', world.light, 2, .68);
    result += line('M301 641q45-299 298-329 242 27 300 329', world.light, .7, .3);
    result += person(459, 634, .55, 'stand', '#25373e', world.light);
    result += person(518, 638, .68, 'stand', '#1b2e37', world.accent);
    result += person(578, 637, .47, 'stand', '#263b42', world.light);
    result += person(722, 647, 1.06, 'shield', '#122531', world.accent);
    result += lantern(356, 563, world.light, 1.1) + lantern(879, 557, world.light, 1.05);
    result += line('M355 644v-105M879 643v-112', '#1b303a', 4);
  } else if (fateId === 'strategist') {
    const points = [[329, 380], [431, 302], [553, 341], [680, 267], [832, 339], [780, 460], [610, 478], [473, 425]];
    result += fill('M252 543 649 452 875 551 453 672Z', '#244352', .9);
    result += fill('M279 545 647 470 844 549 454 650Z', '#a1b9b6', .9);
    result += line('M319 548 458 511 563 549 651 493 788 547 619 579 516 624 422 571Z', '#355f6e', 3, .8);
    result += line('M346 572 644 504M388 601 693 526M465 633 741 546', '#527f86', 1, .6);
    result += line('M330 380 431 302 553 341 680 267 832 339 780 460 610 478 473 425 330 380M431 302 473 425 680 267M553 341 610 478 832 339', world.light, 1.5, .52);
    for (let i = 0; i < points.length; i++) {
      result += circle(...points[i], i === 3 ? 9 : 5, world.light, .9);
      result += circle(...points[i], i === 3 ? 21 : 12, 'none', 1, `stroke="${world.light}" stroke-width="1" opacity=".45"`);
      result += line(`M${points[i][0]} ${points[i][1]}v${540 - points[i][1]}`, world.light, .7, .14, 'stroke-dasharray="4 7"');
    }
    result += person(940, 657, 1.12, 'stand', '#112531', world.accent);
    result += circle(650, 510, 13, 'none', 1, `stroke="${world.accent}" stroke-width="2" opacity=".9"`);
  } else if (fateId === 'loss') {
    result += fill('M389 647 415 591 570 578 638 619 627 661Z', '#34444d');
    result += fill('M415 591 570 578 606 605 449 620Z', '#67716e', .8);
    result += token(worldId, 510, 588, .66);
    result += person(758, 653, 1.23, 'kneel', '#142531', world.accent);
    result += lantern(374, 609, '#edd4a4', .78);
    result += line('M585 616q21-61 23-80M590 604q-21-29-24-51M597 576q31-13 41-29', '#9c9a8b', 3, .85);
    result += fill('M607 540q-20-14-5-25 18 9 5 25ZM568 556q-23 2-18-16 21-6 18 16ZM638 549q-5-24 14-22 11 18-14 22Z', world.light, .9);
  } else if (fateId === 'sacrifice') {
    result += circle(676, 389, 216, 'url(#lanternGlow)', .9);
    result += line('M422 610q30-306 249-336 206 20 252 300', '#ffe6b2', 3, .67);
    result += line('M440 608q32-280 231-308 186 18 232 276', '#fff0c9', 1, .5);
    result += group(person(674, 598, 1.32, 'shield', '#f2d7a7', '#fff1cc'), '', .68);
    result += person(325, 657, .79, 'stand', '#132631', world.accent);
    result += person(411, 658, .61, 'stand', '#1c3039', world.light);
    for (let i = 0; i < 35; i++) result += rect(578 + i * 41 % 210, 292 + i * 59 % 280, 3 + i % 5, 3 + i % 4, '#fff0bc', .25 + i % 5 * .12, `transform="rotate(${i * 19} ${578 + i * 41 % 210} ${292 + i * 59 % 280})"`);
    result += fill('M534 657Q673 607 822 646l-3 27H534Z', '#f1d7aa', .1);
  } else {
    result += fill('M305 656 371 611 587 597 736 651 723 700H296Z', '#1b2c38');
    result += fill('M371 611 587 597 648 617 425 641Z', '#3a4e59', .65);
    result += token(worldId, 528, 618, 1.18);
    result += line('M748 659 768 513 803 488', '#293c46', 7);
    result += fill('M775 515q49-17 91 3l-38 14 23 12-43 6 15 14-54 12Z', world.accent, .37);
    result += line('M799 608q37 1 58-18M769 644q-34-28-48-53', '#879b9d', 1.6, .5);
    result += lantern(926, 630, '#a7c1c8', .42);
  }
  if (fateId === 'loss' || fateId === 'fallen') {
    for (let i = 0; i < 65; i++) {
      const x = i * 109 % 1240, y = i * 137 % 720;
      result += line(`M${x} ${y}l-12 30`, '#c6dde0', .7 + i % 3 * .2, .06 + i % 4 * .025);
    }
    result += line('M69 665h128M858 683h156M460 687h96', world.light, 1, .2);
  }
  for (let i = 0; i < 28; i++) {
    const x = i * 77 % 1220;
    result += line(`M${x} 700q-2-23 ${i % 2 ? -6 : 8}-${10 + i % 4 * 8}m-3 24q9-20 14-20`, '#20333d', 2, .9);
  }
  return result;
}

const scenery = { naruto, jujutsu, titan, bleach, onepiece, demonslayer, dragonball, alchemist };
let count = 0;
for (const [worldIndex, [worldId, world]] of Object.entries(worlds).entries()) {
  for (const [fateIndex, [fateId, fate]] of Object.entries(fates).entries()) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700" role="img" aria-labelledby="title desc">
<title id="title">${world.name} — ${fate.name}</title>
<desc id="desc">Ilustración vectorial original y simbólica de una aventura alternativa de AnataDesu. Sin violencia gráfica.</desc>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${fate.top}"/><stop offset=".58" stop-color="${fate.mid}"/><stop offset="1" stop-color="${fate.horizon}"/></linearGradient>
<radialGradient id="aura"><stop stop-color="${fate.sun}" stop-opacity=".3"/><stop offset="1" stop-color="${fate.sun}" stop-opacity="0"/></radialGradient>
<radialGradient id="lanternGlow"><stop stop-color="${fate.sun}" stop-opacity=".85"/><stop offset=".45" stop-color="${fate.sun}" stop-opacity=".22"/><stop offset="1" stop-color="${fate.sun}" stop-opacity="0"/></radialGradient>
<linearGradient id="shield" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${world.light}" stop-opacity=".16"/><stop offset="1" stop-color="${world.light}" stop-opacity="0"/></linearGradient>
<linearGradient id="vignette"><stop stop-color="#0d1925" stop-opacity=".4"/><stop offset=".17" stop-color="#0d1925" stop-opacity="0"/><stop offset=".82" stop-color="#0d1925" stop-opacity="0"/><stop offset="1" stop-color="#0d1925" stop-opacity=".4"/></linearGradient>
<pattern id="grain" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 1h1m3 3h1m-3 2h1" stroke="#e7ddc4" stroke-width=".7" opacity=".1"/></pattern>
</defs>
${sky(world, fate, worldIndex, fateIndex)}
${scenery[worldId](world)}
${foreground(world, fateId, worldId, fate)}
${rect(0, 0, 1200, 700, 'url(#vignette)')}
${rect(0, 0, 1200, 700, 'url(#grain)')}
${rect(20, 20, 1160, 660, 'none', 1, `stroke="${world.light}" stroke-width=".7" opacity=".22"`)}
</svg>`;
    writeFileSync(path.join(directory, `${worldId}-${fateId}.svg`), svg, 'utf8');
    count++;
  }
}
console.log(`Created ${count} original destiny ending illustrations.`);
