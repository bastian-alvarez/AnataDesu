import { writeFile } from 'node:fs/promises';
import { characters, questions } from '../public/data.js';

// Proyecta perfiles editoriales en puntuaciones alcanzables por escenas reales.
// No usa el ranking para elegir respuestas ni altera las preguntas.
let seed = 20261029;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const profile = answers => Array.from({ length: 5 }, (_, dim) => answers.reduce((sum, answer, index) => sum + questions[index].options[answer].values[dim], 0) / questions.length);
const profiles = {}, witnesses = {};
for (const character of characters) {
  const target = character.editorialVector || character.vector;
  const candidates = [];
  const error = answers => profile(answers).reduce((sum, value, index) => sum + (value - target[index]) ** 2, 0);
  for (let trial = 0; trial < 80; trial++) {
    const answers = questions.map(() => Math.floor(random() * 4));
    let best = error(answers);
    for (let pass = 0; pass < 12; pass++) {
      let improved = false;
      for (let index = 0; index < questions.length; index++) {
        let choice = answers[index];
        for (let option = 0; option < 4; option++) {
          answers[index] = option;
          const score = error(answers);
          if (score < best - 1e-8) { choice = option; best = score; improved = true; }
        }
        answers[index] = choice;
      }
      if (!improved) break;
    }
    candidates.push({ answers, error: best, profile: profile(answers) });
    // Alternativas cercanas evitan perfiles idénticos entre personajes parecidos.
    for (let variant = 0; variant < 5; variant++) {
      const nearby = [...answers]; nearby[Math.floor(random() * questions.length)] = Math.floor(random() * 4);
      candidates.push({ answers: nearby, error: error(nearby), profile: profile(nearby) });
    }
  }
  candidates.sort((a, b) => a.error - b.error || a.answers.join('').localeCompare(b.answers.join('')));
  const chosen = candidates.find(candidate => Object.values(profiles).every(other => candidate.profile.reduce((sum, value, index) => sum + (value - other[index]) ** 2, 0) > .025));
  if (!chosen) throw new Error(`No hay un perfil distinto para ${character.id}`);
  profiles[character.id] = chosen.profile.map(value => Number(value.toFixed(6)));
  witnesses[character.id] = chosen.answers;
}
await writeFile(new URL('../public/profile-anchors.js', import.meta.url), '// Perfiles editoriales calibrados a la escala de las escenas; no son medidas clínicas.\nexport const profileAnchors = ' + JSON.stringify(profiles, null, 2) + ';\n');
await writeFile(new URL('../test/result-witnesses.json', import.meta.url), JSON.stringify(witnesses, null, 2) + '\n');
console.log(`${characters.length} perfiles calibrados, con ejemplos de respuestas alcanzables.`);
