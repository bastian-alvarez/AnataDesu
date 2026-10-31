import test from 'node:test';
import assert from 'node:assert/strict';
import { worlds } from '../public/destiny-legacy-data.js';
import { newAdventure, getAdventure, choose, requirement, restoreAdventure, chronicle } from '../public/destiny-legacy.js';

test('all four worlds have playable routes, meaningful costs and four reachable endings', () => {
  for (const world of worlds) {
    const endings = new Set();
    const nodes = new Set();
    let completed = 0;
    const visit = save => {
      const state = getAdventure(save);
      nodes.add(state.nodeId);
      for (const value of Object.values(state.stats)) assert.ok(value >= 0 && value <= 10);
      if (state.ending) { endings.add(state.ending); completed++; assert.equal(save.choices.length, 7); return; }
      const available = state.node.choices.filter(choice => !requirement(choice, state).length);
      assert.ok(available.length > 0, `Dead end: ${world.id}/${state.nodeId}`);
      for (const choice of available) {
        assert.ok(choice.label && choice.detail);
        visit(choose(save, choice.id));
      }
    };
    visit(newAdventure(world.id));
    assert.deepEqual([...endings].sort(), ['guardian', 'legend', 'strategist', 'survivor']);
    for (const route of ['scout', 'rescue', 'assault']) assert.ok(nodes.has(route));
    assert.ok(completed > 100);
  }
});

test('techniques, allies and clues unlock only choices actually earned', () => {
  for (const world of worlds) {
    let save = choose(choose(newAdventure(world.id), world.origins[0].id), world.skills[0].id);
    save = choose(save, 'scout');
    assert.equal(requirement(getAdventure(save).node.choices[0], getAdventure(save)).length, 0);
    save = choose(save, 'technique');
    save = choose(save, 'ally');
    let state = getAdventure(save);
    assert.equal(requirement(state.node.choices.find(c => c.id === 'trust'), state).length, 0);
    assert.equal(requirement(state.node.choices.find(c => c.id === 'intel'), state).length, 0);

    let other = choose(choose(newAdventure(world.id), world.origins[0].id), world.skills[1].id);
    other = choose(other, 'scout');
    assert.throws(() => choose(other, 'technique'));
    other = choose(choose(other, 'observe'), 'plan');
    state = getAdventure(other);
    assert.equal(requirement(state.node.choices.find(c => c.id === 'intel'), state).length, 0);
    assert.ok(requirement(state.node.choices.find(c => c.id === 'trust'), state).length);
  }
});

test('saves are reconstructed, corrupted histories rejected, undo restores resources', () => {
  let save = choose(choose(newAdventure('naruto'), 'uchiha'), 'fuego');
  save = choose(save, 'assault');
  const before = getAdventure(save);
  const after = choose(save, 'technique');
  assert.equal(getAdventure(after).stats.energy, before.stats.energy - 1);
  assert.deepEqual(getAdventure({ ...after, choices: after.choices.slice(0, -1) }), before);
  assert.deepEqual(restoreAdventure(JSON.stringify(after)), after);
  assert.equal(restoreAdventure('{broken'), null);
  assert.equal(restoreAdventure(JSON.stringify({ ...after, worldId: '__proto__' })), null);
  assert.equal(restoreAdventure(JSON.stringify({ ...after, choices: [{ node: 'finale', choice: 'legend' }] })), null);
  assert.equal(restoreAdventure(JSON.stringify({ ...after, choices: [...after.choices, null] })), null);
  assert.deepEqual(getAdventure({ ...after, stats: { energy: 99 } }).stats, getAdventure(after).stats);
});

test('energy requirements prevent overspending and final choices need their stated stats', () => {
  const state = getAdventure(newAdventure('naruto'));
  const insufficient = { ...state, stats: { ...state.stats, energy: 0 } };
  assert.ok(requirement({ effect: { energy: -2 } }, insufficient).length);
  assert.ok(requirement({ effect: {}, requires: { courage: 6 } }, state).length);
});

test('finished chronicles contain the actual choices and world, with a playable link', () => {
  let save = newAdventure('bleach');
  for (const choice of ['rukongai', 'kido', 'rescue', 'carry', 'ally', 'trust', 'guardian']) save = choose(save, choice);
  const state = getAdventure(save);
  assert.equal(state.ending, 'guardian');
  const text = chronicle(save);
  assert.match(text, /Bleach/);
  assert.match(text, /El farol de las almas/);
  assert.match(text, /Rukongai/);
  assert.match(text, /Kidō de contención/);
  assert.match(text, /AnataDesu\/#\/destino/);
  assert.throws(() => choose(save, 'survivor'));
  assert.throws(() => chronicle(newAdventure('naruto')));
});
