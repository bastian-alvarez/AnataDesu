import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { characters, dimensions, questions } from '../public/data.js';
import { getResult, getExplanation, validateAnswers } from '../public/engine.js';

test('Los 48 personajes tienen imágenes locales, fuentes y perfiles completos', async () => {
  assert.equal(characters.length, 48);
  assert.equal(new Set(characters.map(character => character.id)).size, 48);
  const credits = JSON.parse(await readFile(new URL('../public/asset-credits.json', import.meta.url)));
  for (const character of characters) {
    assert.equal(character.vector.length, dimensions.length);
    assert.ok(character.vector.every(value => value >= 1 && value <= 5));
    assert.ok(character.description && character.strengths && character.growth);
    const credit = credits.find(item => item.key === character.id);
    assert.ok(credit?.source.startsWith('https://myanimelist.net/character/'));
    await access(new URL(`../public/images/${character.id}.jpg`, import.meta.url));
  }
});

test('Las 12 preguntas tienen cuatro opciones con valores válidos', () => {
  assert.equal(questions.length, 12);
  for (const question of questions) {
    assert.equal(question.options.length, 4);
    for (const option of question.options) {
      assert.equal(option.values.length, 5);
      assert.ok(option.values.every(value => Number.isFinite(value) && value >= 1 && value <= 5));
    }
  }
});

test('No se calcula un resultado con respuestas incompletas o manipuladas', () => {
  for (const invalid of [null, {}, [], Array(12), Array(12).fill(null), Array(12).fill(4), Array(12).fill(-1), Array(12).fill('1'), Array(11).fill(0), Array(13).fill(0)]) {
    assert.equal(validateAnswers(invalid), false);
    assert.throws(() => getResult(invalid), TypeError);
  }
  assert.equal(validateAnswers(Array(12).fill(null), { partial: true }), true);
  assert.equal(validateAnswers(Array(12).fill(0)), true);
});

test('La afinidad coincide con la fórmula publicada y el ranking está ordenado', () => {
  const answers = [0, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2];
  const result = getResult(answers);
  assert.deepEqual(getResult(answers), result);
  assert.equal(result.ranking.length, 3);
  assert.equal(result.character.id, result.ranking[0].character.id);
  for (let index = 0; index < dimensions.length; index++) {
    const expected = answers.reduce((sum, answer, question) => sum + questions[question].options[answer].values[index], 0) / questions.length;
    assert.equal(result.profile[index], expected);
  }
  for (const item of result.ranking) {
    assert.equal(item.affinity, Math.round((1 - item.distance / 4) * 100));
    assert.ok(item.affinity >= 0 && item.affinity <= 100);
  }
  assert.ok(result.ranking[0].distance <= result.ranking[1].distance);
  assert.ok(result.ranking[1].distance <= result.ranking[2].distance);
  assert.equal(getExplanation(result).length, 2);
  assert.equal(getExplanation(result)[0].label, result.traits[0].label);
});

test('Los 48 personajes son resultados alcanzables con respuestas reales', async () => {
  const examples = JSON.parse(await readFile(new URL('./result-witnesses.json', import.meta.url)));
  assert.deepEqual(Object.keys(examples).sort(), characters.map(character => character.id).sort());
  for (const [expected, answers] of Object.entries(examples)) assert.equal(getResult(answers).character.id, expected);
});
