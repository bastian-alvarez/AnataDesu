import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { characters, universes, questions } from '../public/data.js';
import { getResult, getResultFromProfile, getCandidateCharacters, validatePreferences, getNarrative, migrateLegacyResult, getArchivedResult } from '../public/engine.js';
import { createFriendCode, parseFriendCode, compareProfiles } from '../public/compatibility.js';
import { freshSession, restoreSession, serializeSession, STORAGE_KEY, LEGACY_KEY } from '../public/session.js';

const witnesses = JSON.parse(await readFile(new URL('./result-witnesses.json', import.meta.url)));
const memoryStorage = values => ({ getItem: key => values[key] ?? null });

test('Los 21 universos cubren el catálogo y las escenas incluyen decisiones explicables', () => {
  assert.equal(universes.length, 21);
  assert.equal(new Set(universes.map(universe => universe.id)).size, universes.length);
  assert.equal(universes.reduce((sum, universe) => sum + universe.count, 0), characters.length);
  for (const universe of universes) assert.ok(characters.some(character => character.id === universe.cover && character.anime === universe.name));
  assert.equal(new Set(questions.map(question => question.chapter)).size, questions.length);
  for (const question of questions) for (const option of question.options) assert.ok(option.insight.length > 25);
});

test('Elegir universos cambia los candidatos y conserva las puntuaciones', () => {
  const all = getResult(witnesses.frieren);
  const known = { mode: 'familiar', seriesIds: ['naruto'] };
  const discovery = { mode: 'discovery', seriesIds: ['naruto'] };
  assert.equal(getCandidateCharacters(known).length, 5);
  assert.ok(getCandidateCharacters(known).every(character => character.anime === 'Naruto'));
  assert.ok(getCandidateCharacters(discovery).every(character => character.anime !== 'Naruto'));
  assert.equal(getCandidateCharacters(discovery).length, characters.length - 5);
  assert.deepEqual(getResult(witnesses.frieren, known).profile, all.profile);
  assert.equal(getResult(witnesses.frieren, known).character.anime, 'Naruto');
  const single = getResult(witnesses.frieren, { mode: 'familiar', seriesIds: ['chihiro'] });
  assert.equal(single.character.id, 'chihiro');
  assert.equal(single.ranking.length, 1);
});

test('No se aceptan selecciones imposibles, duplicadas o desconocidas', () => {
  for (const invalid of [null, {}, {mode:'x',seriesIds:[]}, {mode:'familiar',seriesIds:[]}, {mode:'all',seriesIds:['unknown']}, {mode:'familiar',seriesIds:['naruto','naruto']}, {mode:'familiar',seriesIds:Array(1)}, {mode:'discovery',seriesIds:universes.map(universe => universe.id)}]) {
    assert.equal(validatePreferences(invalid), false);
    assert.throws(() => getCandidateCharacters(invalid));
  }
});

test('El relato se conecta con los rasgos y con decisiones que realmente se eligieron', () => {
  const result = getResult(witnesses.armin);
  const narrative = getNarrative(result, witnesses.armin);
  assert.equal(narrative.aspects.length, 3);
  assert.ok(narrative.evidence.length >= 1);
  for (const evidence of narrative.evidence) assert.equal(evidence.text, questions[evidence.index].options[witnesses.armin[evidence.index]].insight);
  const different = getNarrative(getResult(witnesses.ryuk), witnesses.ryuk);
  assert.notDeepEqual(narrative.aspects, different.aspects);
});

test('Un código de amigo comparte solo el personaje y cinco puntuaciones redondeadas', () => {
  const result = getResult(witnesses.naruto);
  const code = createFriendCode(result);
  const parsed = parseFriendCode(code);
  assert.equal(parsed.character.id, result.character.id);
  assert.deepEqual(parsed.scores, result.profile.map(value => Math.round(value / 5 * 100)));
  assert.equal(code.includes('answers'), false);
  assert.equal(code.split('.').length, 4);
  assert.equal(parseFriendCode(`https://example.com/#/duo?amigo=${encodeURIComponent(code)}`).code, code);
  for (const invalid of ['', null, code.slice(0,-1), code.replace('.naruto.', '.noexistente.'), code.replace(/\.\d/, '.999'), '<script>alert(1)</script>', 'x'.repeat(1300), 'https://example.com/#/resultado/naruto']) assert.equal(parseFriendCode(invalid), null);
});

test('El dúo es simétrico y sus extremos van del 0 al 100', () => {
  const a = createFriendCode(getResult(witnesses.luffy));
  const b = createFriendCode(getResult(witnesses.l));
  const first = compareProfiles(a,b), reversed = compareProfiles(b,a);
  assert.equal(first.affinity, reversed.affinity);
  assert.equal(first.title, reversed.title);
  assert.equal(compareProfiles(a,a).affinity,100);
  const low = createFriendCode({ character: characters[0], profile: [1,1,1,1,1] });
  const high = createFriendCode({ character: characters[1], profile: [5,5,5,5,5] });
  assert.equal(compareProfiles(low,high).affinity,0);
  assert.throws(() => compareProfiles('invalid', a));
  assert.throws(() => createFriendCode({character:characters[0],profile:Array(5)}));
  const forged = {...parseFriendCode(a), scores:[0,0,0,0,0]};
  assert.equal(compareProfiles(forged,b).affinity,first.affinity);
});

test('La actualización conserva el personaje y afinidad de la primera edición', () => {
  const legacyAnswers = [2,0,0,0,0,0,0,2,0,0,0,0];
  const archive = migrateLegacyResult(legacyAnswers);
  assert.equal(archive.id,'naruto');
  const old = getArchivedResult(archive);
  assert.equal(old.character.id,'naruto');
  assert.equal(old.edition,'v1');
  const restored = restoreSession(memoryStorage({[LEGACY_KEY]:JSON.stringify({version:1,answers:legacyAnswers,current:11})}));
  assert.deepEqual(restored.archive,archive);
  assert.ok(restored.answers.every(answer => answer === null));
  assert.equal(restored.configured,false);
  assert.deepEqual(getNarrative(old).evidence,[]);
  assert.equal(getArchivedResult({...archive,id:'gojo'}),null);
});

test('La nueva sesión guarda selección, invitación y progreso sin mezclar ediciones', () => {
  const friend = createFriendCode(getResult(witnesses.nami));
  const state = { ...freshSession(), answers: [0,...Array(11).fill(null)], current:1, configured:true, preferences:{mode:'discovery',seriesIds:['naruto']}, pendingFriend:friend };
  const restored = restoreSession(memoryStorage({[STORAGE_KEY]:serializeSession(state)}));
  assert.deepEqual(restored.answers,state.answers);
  assert.deepEqual(restored.preferences,state.preferences);
  assert.equal(restored.pendingFriend,friend);
  assert.equal(restored.current,1);
  assert.equal(restored.configured,true);
  const badVersion = {...JSON.parse(serializeSession(state)),questionSet:'future'};
  assert.ok(restoreSession(memoryStorage({[STORAGE_KEY]:JSON.stringify(badVersion)})).answers.every(answer => answer === null));
  assert.doesNotThrow(() => restoreSession({getItem:()=>{throw new Error('Storage disabled');}}));
  assert.equal(restoreSession({getItem:()=>{throw new Error('Storage disabled');}}).storageAvailable,false);
  assert.throws(() => getResultFromProfile([NaN,3,3,3,3]));
});
