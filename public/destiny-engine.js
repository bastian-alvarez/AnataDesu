import { getEndingDialogue, speakerForNode } from './destiny-dialogue.js';
import { worlds, durations, statNames, fateArt } from './destiny-data.js';
import { storyNode } from './destiny-stories.js';
import * as legacy from './destiny-legacy.js';

export const DESTINY_KEY = 'anata-desu:destiny:v2';
export const LEGACY_DESTINY_KEY = 'anata-desu:destiny:v1';
const has = (object, key) => Object.hasOwn(object, key);
const durationFor = id => durations.find(item => item.id === id);
export function newAdventure(worldId, duration = 'standard') {
  if (!worlds.some(world => world.id === worldId) || !durationFor(duration)) throw new Error('Configuración desconocida');
  return { version: 2, worldId, duration, choices: [] };
}
export function requirement(choice, state) {
  if (state.legacy) return legacy.requirement(choice, state);
  const reasons = [];
  for (const [key, value] of Object.entries(choice.requires || {})) {
    if (key === 'skill' && state.skill !== value) reasons.push(`Requiere ${state.world.skills.find(item => item.id === value)?.label}`);
    if (key === 'flag' && !state.flags.includes(value)) reasons.push(value === 'intel' ? 'Necesitas una pista investigada' : 'Necesitas haber preparado un plan');
    if (key === 'flags' && !value.every(flag => state.flags.includes(flag))) reasons.push('Necesitas información y un vínculo de equipo');
    if (key === 'companionAlive' && state.companionHealth <= 0) reasons.push('Tu compañero ya no puede acompañarte');
    if (has(statNames, key) && state.stats[key] < value) reasons.push(`Requiere ${statNames[key]} ${value}/10`);
  }
  if ((choice.effect.energy || 0) < 0 && state.stats.energy < -choice.effect.energy && !reasons.some(reason => reason.startsWith('Requiere Reserva'))) reasons.push(`Requiere Reserva ${-choice.effect.energy}/10`);
  return reasons;
}
function resolveIntent(state, intent) {
  if (intent === 'sacrifice') { state.health = 0; return 'sacrifice'; }
  if (intent === 'duel' && (state.health < 4 || state.stats.courage < 6)) { state.health = 0; return 'fallen'; }
  state.objectiveWon = intent !== 'retreat';
  if (state.companionHealth <= 0) return 'loss';
  if (intent === 'retreat') return 'retreat';
  if (['unite','protect'].includes(intent) && !state.flags.includes('wounded') && !state.flags.includes('companion-wounded')) return 'triumph';
  if (intent === 'outsmart') return 'strategist';
  return 'guardian';
}
// Reconstruct rules, resources and casualties from validated choices, never from saved stats.
export function getAdventure(save) {
  if (save?.version === 1) {
    const old = legacy.getAdventure(save);
    return { ...old, legacy: true, duration: 'legacy', step: old.history.length, total: 7, chapters: 5, health: null, companionHealth: null, companion: old.flags.includes('ally') ? old.world.cast[0] : null };
  }
  const duration = durationFor(save?.duration);
  const world = worlds.find(item => item.id === save?.worldId);
  if (!save || save.version !== 2 || !world || !duration || !Array.isArray(save.choices) || save.choices.length > duration.decisions) throw new Error('Partida inválida');
  const state = { worldId: world.id, world, duration: duration.id, nodeId: 'origin', origin: null, skill: null, route: null, stats: { courage: 2, cunning: 2, bonds: 2, energy: 5 }, health: 8, companionHealth: 6, companion: world.story.companion, flags: [], history: [], ending: null, objectiveWon: false, step: 0, total: duration.decisions, chapters: duration.decisions - 2 };
  const addFlag = flag => { if (!state.flags.includes(flag)) state.flags.push(flag); };
  for (const step of save.choices) {
    if (!step || state.ending || step.node !== state.nodeId) throw new Error('Secuencia inválida');
    const node = storyNode(state.nodeId, world, state);
    const choice = node.choices.find(item => item.id === step.choice);
    if (!choice || requirement(choice, state).length) throw new Error('Decisión no disponible');
    const events = [];
    if (node.id === 'origin') state.origin = choice.id;
    if (node.id === 'skill') state.skill = choice.id;
    if (choice.companion) {
      if (choice.companion !== state.companion && state.companionHealth > 0) state.companionHealth = 6;
      state.companion = choice.companion;
    }
    if (choice.route) state.route = choice.route;
    for (const [key, value] of Object.entries(choice.effect)) {
      if (has(statNames, key)) state.stats[key] = Math.min(10, Math.max(0, state.stats[key] + value));
      else if (key === 'health') {
        if (value < 0) addFlag('wounded');
        state.health = Math.min(8, Math.max(0, state.health + value));
      } else if (key === 'companionHealth' && state.companionHealth > 0) {
        if (value < 0) addFlag('companion-wounded');
        state.companionHealth = Math.min(6, Math.max(0, state.companionHealth + value));
        if (state.companionHealth === 0) { addFlag('companion-dead'); events.push(`${state.companion} murió. Su pérdida será parte de todo lo que ocurra después.`); }
      }
    }
    if (choice.flag) addFlag(choice.flag);
    for (const flag of choice.flags || []) addFlag(flag);
    let outcome = choice.outcome || (node.id === 'origin' ? `Tu historia comenzó en ${choice.label}.` : `Entrenaste ${choice.label}.`);
    if (state.health === 0) { state.ending = 'fallen'; events.push('Tu protagonista murió antes de completar la misión.'); }
    else if (choice.intent) { state.ending = resolveIntent(state, choice.intent); state.intent = choice.intent; }
    if (state.ending === 'sacrifice') events.push('Tu protagonista dio su vida para sostener la salida de los supervivientes.');
    if (state.ending === 'fallen' && choice.intent) events.push('Tu cuerpo no pudo resistir la última técnica.');
    if (events.length) outcome += ` ${events.join(' ')}`;
    state.history.push({ node: node.id, title: node.title, choice: choice.label, outcome, effect: choice.effect, events, mood: events.length ? 'loss' : choice.risk ? 'danger' : node.mood });
    state.step++;
    state.nodeId = state.ending || duration.sequence[state.step];
    if (!state.nodeId) throw new Error('Historia sin desenlace');
  }
  const current = state.ending ? null : storyNode(state.nodeId, world, state);
  return { ...state, node: current ? { ...current, chapter: Math.max(0, state.step - 1) } : null };
}
export function choose(save, choiceId) {
  if (save?.version === 1) return legacy.choose(save, choiceId);
  const state = getAdventure(save);
  if (!state.node || !state.node.choices.some(choice => choice.id === choiceId && requirement(choice, state).length === 0)) throw new Error('Decisión no disponible');
  const next = { version: 2, worldId: save.worldId, duration: save.duration, choices: [...save.choices, { node: state.nodeId, choice: choiceId }] };
  getAdventure(next);
  return next;
}
export function restoreAdventure(raw) {
  try {
    const save = JSON.parse(raw);
    getAdventure(save);
    return { version: save.version, worldId: save.worldId, ...(save.version === 2 ? { duration: save.duration } : {}), choices: save.choices.map(({ node, choice }) => ({ node, choice })) };
  } catch { return null; }
}
const endingTitles = {
  naruto: ['El amanecer de Konoha','La aldea que sostuvo tu nombre','La sombra que cerró el sello','Una cinta sin dueño','La última luz del sello','El silencio entre los cedros'],
  jujutsu: ['Todos bajaron del último tren','La estación volvió a respirar','El anuncio que nunca sonó','El asiento que quedó vacío','Tu última parada','Un nombre en los altavoces'],
  titan: ['Todos cruzaron el portón','Las alas del regreso','El mapa de la libertad','Una insignia bajo la lluvia','La bengala que encendiste al final','El cielo al otro lado del muro'],
  bleach: ['El distrito de los mil faroles','La luz que protegiste','El hilo que cerró dos mundos','Un farol para quien no vuelve','El último nombre que pronunciaste','El cordón junto a la grieta'],
  onepiece: ['El mar devolvió a todos','La bandera que resistió la marea','El mapa que venció al Cobre','Un compás que ya no señala a casa','Tu luz en el último faro','El puerto que no alcanzaste'],
  demonslayer: ['Todos vieron el amanecer','Las glicinas resistieron la noche','La mecha que dejó de arder','Un cuenco que nadie devolverá','El alba que regalaste','La noche guardó tu nombre'],
  dragonball: ['El valle sin una sola herida','La ciudad bajo tu escudo','La fuerza de un golpe pequeño','Dos esterillas, una vacía','El ki que sostuvo la ciudad','El límite que no pudiste cruzar'],
  alchemist: ['El reloj volvió a andar para todos','La ciudad que aprendiste a sostener','La respuesta en el canal de retorno','Una nota que quedó sin respuesta','El precio que elegiste pagar','Las agujas se movieron sin ti'],
};
export function getEnding(state) {
  if (!state.ending) return null;
  if (state.legacy) {
    const [title, text] = state.world.endings[state.ending];
    const fate = ({ legend: 'triumph', survivor: 'retreat' })[state.ending] || state.ending;
    return { title, text, fate, image: `./images/destiny/${state.worldId}-${fateArt(fate)}.svg`, alt: `Ilustración simbólica de ${state.world.name}: ${title}.` };
  }
  const s = state.world.story;
  const name = state.companion;
  const index = ['triumph','guardian','strategist','loss','sacrifice','fallen'].indexOf(state.ending);
  const title = state.ending === 'retreat' ? 'El camino que aún no termina' : endingTitles[state.worldId][index];
  const lastCause = (state.history.at(-1)?.outcome || '').replace(/ Tu protagonista murió antes de completar la misión\.| Tu cuerpo no pudo resistir la última técnica\./g,'');
  const descriptions = {
    triumph: `Lograste ${s.goal}. ${name} vuelve contigo sin una sola herida. La información que reuniste, el cuidado del equipo y el plan compartido evitaron que alguien tuviera que pagar con su cuerpo. Hay celebraciones, abrazos y una historia que podrán contar juntos. Esta vez, nadie falta.`,
    guardian: `Lograste ${s.goal}. ${name} sale contigo de la zona de peligro. ${state.flags.includes('wounded') || state.flags.includes('companion-wounded') ? 'Las heridas de la misión necesitarán tiempo y cuidados; una victoria no borra lo vivido.' : 'El último esfuerzo agotó tus reservas. Necesitarás descanso antes de la próxima misión.'} Pero cuando los supervivientes se reúnen, pueden mirarte a los ojos. Elegiste terminar la defensa y conservar un camino de regreso.`,
    strategist: `Lograste ${s.goal} utilizando lo que descubriste sobre ${s.object}. El enemigo esperaba un último golpe y encontró un plan que ya no podía detener. ${name} vuelve contigo. ${state.flags.includes('wounded') || state.flags.includes('companion-wounded') ? 'Las heridas siguen ahí, aunque esta vez no hubo que añadir otra pérdida.' : 'La precisión y la paciencia permitieron resolver el final sin herir al equipo.'}`,
    loss: `${state.objectiveWon ? `Lograste ${s.goal}, pero` : 'El repliegue permitió volver a los supervivientes, pero'} ${name} murió durante la misión. Conservas ${s.token} y una decisión que ya no puedes cambiar dentro de esta historia. Habrá personas agradecidas por tu ayuda; también habrá un lugar vacío cuando cuentes cómo regresaste. La pérdida no desaparece con la última victoria.`,
    sacrifice: `Tu protagonista murió sosteniendo la salida mientras los supervivientes escapaban. ${state.companionHealth > 0 ? `${name} lleva consigo ${s.token} y la memoria de tu último acto.` : `La muerte de ${name} tampoco se borra: quienes regresan llevan la historia de ambos.`} No viviste para escuchar el agradecimiento de quienes salvaste. Tu historia termina aquí; las vidas que protegiste continúan.`,
    fallen: `Moriste antes de completar la misión. ${lastCause} El enemigo conserva el control sobre ${s.object}. ${state.companionHealth > 0 ? `${name} vuelve con los supervivientes y ${s.token}, decidido a contar lo que ocurrió.` : `${name} también murió; los refuerzos encontrarán los rastros de ambos.`} Tu nombre quedará en el recuerdo de quienes regresen.`,
    retreat: `Decidiste replegarte con ${name} y los supervivientes. El enemigo conserva ${s.object}; la misión necesitará refuerzos. Llevas información que el siguiente equipo no tenía y todavía puedes mirar a tu compañero cuando hable del futuro. No resolviste todo, pero dejaste una oportunidad para volver.`,
  };
  return { title, text: descriptions[state.ending], fate: state.ending, image: `./images/destiny/${state.worldId}-${fateArt(state.ending)}.svg`, alt: `Ilustración simbólica de ${state.world.name}: ${title}.` };
}
export function chronicle(save) {
  const state = getAdventure(save);
  const ending = getEnding(state);
  if (!ending) throw new Error('La historia aún no termina');
  const encounter = getEndingDialogue(state, ending);
  return `MI DESTINO EN ANATADESU\n${state.world.name} · ${ending.title}\n${state.legacy ? 'Primera edición' : durationFor(state.duration).name}\n\n${ending.text}\n\n${encounter ? `${encounter.label}\n${encounter.direction}\n${encounter.speaker.name}: «${encounter.text}»\n\n` : ''}MI CAMINO\n${state.history.map((entry, index) => `${index + 1}. ${entry.title} — ${speakerForNode(state.worldId,entry.node)?.name || 'Tu decisión'}: ${entry.choice}${entry.events?.length ? ` — ${entry.events.join(' ')}` : ''}`).join('\n')}\n\nUna aventura alternativa de fans. Crea la tuya en https://bastian-alvarez.github.io/AnataDesu/#/destino`;
}
