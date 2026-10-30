import { characters, dimensions, questions, universes } from './data.js';
import { legacyWeights, legacyProfiles } from './legacy-v1.js';

export const defaultPreferences = () => ({ mode: 'all', seriesIds: [] });

export function validatePreferences(value) {
  if (!value || !['all', 'familiar', 'discovery'].includes(value.mode) || !Array.isArray(value.seriesIds)) return false;
  if (new Set(value.seriesIds).size !== value.seriesIds.length || !Array.from(value.seriesIds).every(id => universes.some(universe => universe.id === id))) return false;
  return value.mode === 'all' || (value.seriesIds.length > 0 && (value.mode !== 'discovery' || value.seriesIds.length < universes.length));
}

export function getCandidateCharacters(preferences = defaultPreferences()) {
  if (!validatePreferences(preferences)) throw new TypeError('Selecciona al menos un universo válido.');
  if (preferences.mode === 'all') return characters;
  const names = new Set(universes.filter(universe => preferences.seriesIds.includes(universe.id)).map(universe => universe.name));
  return characters.filter(character => preferences.mode === 'familiar' ? names.has(character.anime) : !names.has(character.anime));
}

export function validateProfile(profile) {
  return Array.isArray(profile) && profile.length === dimensions.length && Array.from(profile).every(value => Number.isFinite(value) && value >= 1 && value <= 5);
}

const distance = (a, b) => Math.sqrt(a.reduce((sum, value, dim) => sum + (value - b[dim]) ** 2, 0) / dimensions.length);
const traitsFor = profile => dimensions.map((dimension, index) => ({ ...dimension, value: Math.round(profile[index] / 5 * 100), index })).sort((a, b) => b.value - a.value || a.index - b.index);

export function validateAnswers(answers, { partial = false } = {}) {
  return Array.isArray(answers) && answers.length === questions.length && Array.from(answers).every((answer, index) => (partial && answer === null) || (Number.isInteger(answer) && answer >= 0 && answer < questions[index].options.length));
}

export function getResultFromProfile(profile, preferences = defaultPreferences()) {
  if (!validateProfile(profile)) throw new TypeError('El perfil debe contener cinco puntuaciones válidas.');
  const pool = getCandidateCharacters(preferences);
  if (!pool.length) throw new RangeError('No hay personajes en esta selección.');
  const ranking = pool.map(character => {
    const delta = distance(character.vector, profile);
    return { character, distance: delta, affinity: Math.round(Math.max(0, 1 - delta / 4) * 100) };
  }).sort((a, b) => a.distance - b.distance || a.character.id.localeCompare(b.character.id));
  return { character: ranking[0].character, affinity: ranking[0].affinity, ranking: ranking.slice(0, 3), traits: traitsFor(profile), profile, edition: 'v2', preferences };
}

export function getResult(answers, preferences = defaultPreferences()) {
  if (!validateAnswers(answers)) throw new TypeError(`Completa las ${questions.length} preguntas antes de calcular el resultado.`);
  const profile = dimensions.map((_, dim) => answers.reduce((sum, answer, index) => sum + questions[index].options[answer].values[dim], 0) / questions.length);
  return getResultFromProfile(profile, preferences);
}

export function migrateLegacyResult(answers) {
  if (!Array.isArray(answers) || answers.length !== legacyWeights.length || !Array.from(answers).every(answer => Number.isInteger(answer) && answer >= 0 && answer < 4)) return null;
  const profile = dimensions.map((_, dim) => answers.reduce((sum, answer, index) => sum + legacyWeights[index][answer][dim], 0) / legacyWeights.length);
  const winner = [...legacyProfiles].sort((a, b) => distance(a.vector, profile) - distance(b.vector, profile) || a.id.localeCompare(b.id))[0];
  return { id: winner.id, profile };
}

export function getArchivedResult(archive) {
  if (!archive || !validateProfile(archive.profile) || !legacyProfiles.some(character => character.id === archive.id)) return null;
  const ranking = legacyProfiles.map(item => {
    const delta = distance(item.vector, archive.profile);
    return { character: characters.find(character => character.id === item.id), distance: delta, affinity: Math.round(Math.max(0, 1 - delta / 4) * 100) };
  }).sort((a, b) => a.distance - b.distance || a.character.id.localeCompare(b.character.id));
  if (ranking[0].character.id !== archive.id) return null;
  return { character: ranking[0].character, affinity: ranking[0].affinity, ranking: ranking.slice(0, 3), traits: traitsFor(archive.profile), profile: archive.profile, edition: 'v1', preferences: defaultPreferences() };
}

export function getExplanation(result) {
  const reasons = {
    courage: 'Tus respuestas muestran que sueles dar el paso cuando algo te importa, incluso si hay incertidumbre.',
    empathy: 'Tiendes a considerar cómo se sienten los demás y a cuidar tus vínculos con acciones concretas.',
    strategy: 'Prefieres observar, conectar ideas y entender las opciones antes de decidir.',
    freedom: 'Te importa elegir tu camino, explorar posibilidades y conservar tu autenticidad.',
    resolve: 'Valoras la constancia y te motiva seguir trabajando por aquello que tiene sentido para ti.',
  };
  return result.traits.slice(0, 2).map(trait => ({ label: trait.label, text: reasons[trait.id], icon: trait.icon }));
}

export function getNarrative(result, answers = null) {
  const [courage, empathy, strategy, freedom, resolve] = result.profile;
  const team = {
    courage: ['El motor del equipo', 'Sueles abrir el primer camino cuando la incertidumbre frena al grupo. Tu aporte crece cuando dejas que otras personas ajusten el rumbo contigo.'],
    empathy: ['El refugio del equipo', 'Detectas cómo está la gente y ayudas a que cada persona encuentre un lugar. Haces que colaborar se sienta más seguro.'],
    strategy: ['La brújula del equipo', 'Ordenas la información y conviertes una idea en pasos claros. Tu perspectiva ayuda a decidir sin precipitarse.'],
    freedom: ['La chispa del equipo', 'Cuestionas las rutas de siempre y propones posibilidades nuevas. Aportas aire cuando el grupo necesita cambiar de enfoque.'],
    resolve: ['El sostén del equipo', 'Das continuidad a lo que el grupo empezó con entusiasmo. Tu constancia ayuda a transformar una intención en algo real.'],
  }[result.traits[0].id];
  const conflict = strategy >= 3.5
    ? ['Primero, comprender', `En un conflicto buscas ordenar lo que ocurrió antes de reaccionar.${empathy >= 3.5 ? ' También intentas que las personas se sientan escuchadas.' : ' Explicar tus motivos puede ayudar a que tu claridad no se sienta distante.'}`]
    : empathy >= 3.5
      ? ['Cuidar el puente', 'Te importa el efecto de una discusión sobre el vínculo. Escuchas y buscas reparar, aunque también necesitas expresar lo que tú esperabas.']
      : courage >= 3.5
        ? ['Ponerlo sobre la mesa', 'Prefieres abordar la tensión con franqueza. Una pausa para escuchar puede convertir esa iniciativa en una conversación más útil.']
        : ['Dar espacio para ver mejor', 'Necesitas margen para procesar una tensión antes de responder. Decir cuándo retomarás la conversación ayuda a que esa pausa se entienda.'];
  const bond = empathy >= 3.7
    ? ['Cercanía en pequeños gestos', 'Construyes confianza con atención y presencia. Sentirte escuchado y poder cuidar sin cargar con todo son piezas importantes de tus vínculos.']
    : freedom >= 3.6
      ? ['Cercanía con espacio propio', 'Te sientes a gusto cuando puedes compartir sin perder autonomía. Los vínculos que respetan las decisiones de cada persona te dejan respirar.']
      : resolve >= 3.8
        ? ['Confianza que se demuestra', 'Para ti, estar cuando hace falta dice mucho. Valoras la coherencia entre palabras y acciones, y los acuerdos que se sostienen con el tiempo.']
        : ['Conexiones a tu ritmo', 'La confianza crece cuando puedes mostrarte sin presión. Te favorecen los vínculos donde hay espacio para observar, conversar y cambiar.'];
  const evidence = validateAnswers(answers) && result.edition === 'v2'
    ? result.traits.slice(0, 2).map(trait => questions.map((question, index) => ({ chapter: question.chapter, text: question.options[answers[index]].insight, score: question.options[answers[index]].values[trait.index], index, trait: trait.label })).sort((a, b) => b.score - a.score || a.index - b.index)[0]).filter((item, index, items) => items.findIndex(other => other.index === item.index) === index)
    : [];
  return { aspects: [{ label: 'EN TU EQUIPO', title: team[0], text: team[1], icon: 'bolt' }, { label: 'ANTE EL CONFLICTO', title: conflict[0], text: conflict[1], icon: 'spark' }, { label: 'EN TUS VÍNCULOS', title: bond[0], text: bond[1], icon: 'heart' }], evidence };
}
