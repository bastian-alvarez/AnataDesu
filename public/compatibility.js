import { characters, dimensions } from './data.js';

const checksum = text => {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
  return value.toString(36);
};

export function createFriendCode(result) {
  if (!characters.some(character => character.id === result?.character?.id) || !Array.isArray(result?.profile) || result.profile.length !== 5 || !Array.from(result.profile).every(value => Number.isFinite(value) && value >= 1 && value <= 5)) throw new TypeError('Necesitas un resultado válido para crear tu código.');
  const scores = result.profile.map(value => Math.round(value / 5 * 100));
  const payload = `AD2.${result.character.id}.${scores.join('-')}`;
  return `${payload}.${checksum(payload)}`;
}

export function parseFriendCode(input) {
  if (typeof input !== 'string' || input.length > 1200) return null;
  let code = input.trim();
  if (/^https?:\/\//i.test(code)) {
    try {
      const hash = new URL(code).hash.slice(1);
      if (!hash.startsWith('/duo?')) return null;
      code = new URLSearchParams(hash.split('?')[1]).get('amigo') || '';
    } catch { return null; }
  }
  const match = /^(AD2\.([a-z0-9_-]+)\.(\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}))\.([a-z0-9]+)$/.exec(code);
  if (!match || checksum(match[1]) !== match[4]) return null;
  const character = characters.find(character => character.id === match[2]);
  const scores = match[3].split('-').map(Number);
  if (!character || !scores.every(value => Number.isInteger(value) && value >= 20 && value <= 100)) return null;
  return { code, character, scores };
}

export function compareProfiles(own, friend) {
  const first = typeof own === 'string' ? parseFriendCode(own) : own;
  const second = typeof friend === 'string' ? parseFriendCode(friend) : friend;
  if (!first?.code || !second?.code || !parseFriendCode(first.code) || !parseFriendCode(second.code)) throw new TypeError('Los dos códigos deben ser válidos.');
  const a = parseFriendCode(first.code), b = parseFriendCode(second.code);
  const gaps = a.scores.map((value, index) => Math.abs(value - b.scores[index]));
  const rms = Math.sqrt(gaps.reduce((sum, gap) => sum + gap ** 2, 0) / 5);
  const affinity = Math.round(100 * (1 - rms / 80));
  const common = dimensions.map((dimension, index) => ({ ...dimension, average: (a.scores[index] + b.scores[index]) / 2, gap: gaps[index], a: a.scores[index], b: b.scores[index], index })).sort((x, y) => y.average - x.average || x.index - y.index);
  const difference = [...common].sort((x, y) => y.gap - x.gap || x.index - y.index)[0];
  let title, description, type;
  if (Math.max(...gaps) <= 16) {
    type = 'companions'; title = 'Compañeros de la misma órbita'; description = 'Sus formas de actuar tienen bastante en común. Pueden entenderse con pocas explicaciones; buscar perspectivas distintas ayudará a que el dúo siga creciendo.';
  } else if ((a.scores[0] - b.scores[0]) * (a.scores[2] - b.scores[2]) < 0 && gaps[0] + gaps[2] >= 35) {
    type = 'allies'; title = 'El impulso y la brújula'; description = 'Una perspectiva pone en marcha la aventura y la otra ayuda a elegir la ruta. Su mejor versión aparece cuando la iniciativa y la planificación se escuchan.';
  } else if (rms >= 24) {
    type = 'rivals'; title = 'Rivales que abren horizontes'; description = 'Ven el mundo desde ángulos distintos. Esa diferencia puede retar sus certezas y ampliar sus recursos cuando hay respeto y ganas de aprender.';
  } else if (a.scores[3] >= 65 && b.scores[3] >= 65) {
    type = 'adventurers'; title = 'Cómplices de aventura'; description = 'Comparten el deseo de elegir su propia historia. Su conexión gana fuerza cuando hay espacio para explorar y acuerdos claros sobre cómo acompañarse.';
  } else {
    type = 'allies'; title = 'Aliados con sello propio'; description = 'Hay puntos de encuentro y ritmos diferentes. Su potencial está en reconocer qué aporta cada persona y convertir esas diferencias en colaboración.';
  }
  return { a, b, affinity, type, title, description, common: common[0], difference, traits: dimensions.map((dimension, index) => ({ ...dimension, a: a.scores[index], b: b.scores[index] })) };
}
