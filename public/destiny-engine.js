import { worlds, getNodes, statNames } from './destiny-data.js';

export const DESTINY_KEY = 'anata-desu:destiny:v1';
export function newAdventure(worldId) {
  if (!worlds.some(world => world.id === worldId)) throw new Error('Universo desconocido');
  return { version: 1, worldId, choices: [] };
}

export function requirement(choice, state) {
  const reasons = [];
  const world = worlds.find(item => item.id === state.worldId);
  for (const [key, value] of Object.entries(choice.requires || {})) {
    if (key === 'skill' && state.skill !== value) reasons.push(`Requiere ${world.skills.find(item => item.id === value)?.label}`);
    else if (key === 'flag' && !state.flags.includes(value)) reasons.push(value === 'ally' ? 'Necesitas haber elegido un aliado' : 'Necesitas haber investigado el punto débil');
    else if (key in statNames && state.stats[key] < value) reasons.push(`Requiere ${statNames[key]} ${value}/10`);
  }
  if ((choice.effect.energy || 0) < 0 && state.stats.energy < -choice.effect.energy && !reasons.some(reason => reason.startsWith('Requiere Reserva'))) reasons.push(`Requiere Reserva ${-choice.effect.energy}/10`);
  return reasons;
}

// Replay is the sole source of truth: edited saves cannot inject stats or skip chapters.
export function getAdventure(save) {
  if (!save || save.version !== 1 || !Array.isArray(save.choices) || save.choices.length > 8) throw new Error('Partida inválida');
  const world = worlds.find(item => item.id === save.worldId);
  if (!world) throw new Error('Universo desconocido');
  const nodes = getNodes(world);
  const state = { worldId: world.id, nodeId: 'origin', origin: null, skill: null, stats: { courage: 2, cunning: 2, bonds: 2, energy: 5 }, flags: [], history: [], ending: null };
  for (const step of save.choices) {
    if (!step || state.ending || step.node !== state.nodeId) throw new Error('Secuencia inválida');
    const node = nodes[state.nodeId];
    const choice = node.choices.find(item => item.id === step.choice);
    if (!choice || requirement(choice, state).length) throw new Error('Decisión no disponible');
    if (node.id === 'origin') state.origin = choice.id;
    if (node.id === 'skill') state.skill = choice.id;
    for (const [key, value] of Object.entries(choice.effect)) state.stats[key] = Math.min(10, Math.max(0, state.stats[key] + value));
    if (choice.flag && !state.flags.includes(choice.flag)) state.flags.push(choice.flag);
    state.history.push({ node: node.id, title: node.title, choice: choice.label, outcome: choice.outcome || (node.id === 'origin' ? `Tu historia comenzó en ${choice.label}.` : node.id === 'skill' ? `Entrenaste ${choice.label}. Esa decisión abrió un camino propio.` : ''), effect: choice.effect });
    state.nodeId = choice.next;
    if (world.endings[choice.next]) state.ending = choice.next;
  }
  return { ...state, world, node: state.ending ? null : nodes[state.nodeId] };
}

export function choose(save, choiceId) {
  const state = getAdventure(save);
  if (!state.node || !state.node.choices.some(choice => choice.id === choiceId && requirement(choice, state).length === 0)) throw new Error('Decisión no disponible');
  const next = { ...save, choices: [...save.choices, { node: state.nodeId, choice: choiceId }] };
  getAdventure(next);
  return next;
}

export function restoreAdventure(raw) {
  try {
    const save = JSON.parse(raw);
    getAdventure(save);
    return { version: 1, worldId: save.worldId, choices: save.choices.map(({ node, choice }) => ({ node, choice })) };
  } catch { return null; }
}

export function chronicle(save) {
  const state = getAdventure(save);
  if (!state.ending) throw new Error('La historia aún no termina');
  const ending = state.world.endings[state.ending];
  return `MI DESTINO EN ANATADESU\n${state.world.name} · ${ending[0]}\n\n${ending[1]}\n\nMI CAMINO\n${state.history.map((entry, index) => `${index + 1}. ${entry.title}: ${entry.choice}`).join('\n')}\n\nUna aventura alternativa de fans. Crea la tuya en https://bastian-alvarez.github.io/AnataDesu/#/destino`;
}
