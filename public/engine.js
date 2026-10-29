import { characters, dimensions, questions } from './data.js';

export function validateAnswers(answers, { partial = false } = {}) {
  return Array.isArray(answers) && answers.length === questions.length && Array.from(answers).every((answer, index) => (partial && answer === null) || (Number.isInteger(answer) && answer >= 0 && answer < questions[index].options.length));
}

export function getResult(answers) {
  if (!validateAnswers(answers)) throw new TypeError('Completa las 12 preguntas antes de calcular el resultado.');
  const profile = dimensions.map((_, dim) => answers.reduce((sum, answer, index) => sum + questions[index].options[answer].values[dim], 0) / questions.length);
  const ranking = characters.map(character => {
    const distance = Math.sqrt(character.vector.reduce((sum, value, dim) => sum + (value - profile[dim]) ** 2, 0) / dimensions.length);
    return { character, distance, affinity: Math.round(Math.max(0, 1 - distance / 4) * 100) };
  }).sort((a, b) => a.distance - b.distance || a.character.id.localeCompare(b.character.id));
  const traits = dimensions.map((dimension, index) => ({ ...dimension, value: Math.round(profile[index] / 5 * 100), index })).sort((a, b) => b.value - a.value || a.index - b.index);
  return { character: ranking[0].character, affinity: ranking[0].affinity, ranking: ranking.slice(0, 3), traits, profile };
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
