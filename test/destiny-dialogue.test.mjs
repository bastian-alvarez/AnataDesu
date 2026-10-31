import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { worlds } from '../public/destiny-data.js';
import { newAdventure, getAdventure, getEnding, choose, chronicle, restoreAdventure } from '../public/destiny-engine.js';
import { dialogueCharacters, getSceneDialogue, getEndingDialogue, getReplyLabel } from '../public/destiny-dialogue.js';

function safeChoices(world) {
  return {origin:world.origins[2].id,skill:world.skills[0].id,promise:'people',memory:'signals',training:'control',mission:'scout',travel:'pace',branch:'technique',companion:'bond',camp:'rest',dialogue:'respect',clue:'decode',pact:'reject',trap:'secure',triage:'self',scout2:'mark',enemy:'question',crossroads:'adapt',crisis:'coordinate',aftermath:'focus',reckoning:'limits',finale:'unite'};
}

test('characters from each world speak throughout the long story without changing the saved game', () => {
  for(const world of worlds) {
    let save=newAdventure(world.id,'long');const choices=safeChoices(world),seen=new Set();
    while(!getAdventure(save).ending) {
      const state=getAdventure(save),before=JSON.stringify(state);
      const dialogue=getSceneDialogue(state);
      assert.ok(dialogue?.speaker?.name && dialogue.text.length>20);
      assert.match(dialogue.speaker.image,/^\.\/images\/[a-z/]+\.jpg$/);
      seen.add(dialogue.speaker.id);
      assert.equal(JSON.stringify(state),before);
      save=choose(save,choices[state.nodeId]);
      assert.deepEqual(restoreAdventure(JSON.stringify(save)),save);
    }
    assert.ok(seen.size>=2);
    assert.ok(getEndingDialogue(getAdventure(save),getEnding(getAdventure(save))));
  }
});

test('Kakashi asks the first jutsu and reacts differently to each actual selected technique', () => {
  const replies=new Set();
  for(const skill of worlds[0].skills) {
    let save=choose(newAdventure('naruto','standard'),'uchiha');
    let state=getAdventure(save),dialogue=getSceneDialogue(state);
    assert.equal(dialogue.speaker.id,'kakashi');
    assert.match(dialogue.text,/primer jutsu/);
    assert.equal(getReplyLabel(state.nodeId,skill),`Quiero aprender ${skill.label}.`);
    save=choose(save,skill.id);state=getAdventure(save);dialogue=getSceneDialogue(state);
    assert.equal(dialogue.reaction.speaker.id,'kakashi');
    replies.add(dialogue.reaction.text);
    assert.equal(state.skill,skill.id);
  }
  assert.equal(replies.size,4);
});

test('Sakura says goodbye in the last moments, while death and the real choices remain in the chronicle', () => {
  let save=newAdventure('naruto','short');
  for(const choice of ['hyuga','clones','scout','reckless','gamble'])save=choose(save,choice);
  const state=getAdventure(save),ending=getEnding(state),dialogue=getEndingDialogue(state,ending);
  assert.equal(state.health,0);assert.equal(state.ending,'fallen');
  assert.equal(dialogue.speaker.id,'sakura');
  assert.match(dialogue.label,/ÚLTIMOS INSTANTES/);
  assert.match(dialogue.direction,/camilla/);
  assert.match(dialogue.text,/mano/);
  const text=chronicle(save);
  assert.match(text,/Sakura Haruno/);assert.match(text,/murió/);assert.match(text,/Kakashi Hatake/);
  assert.equal(getAdventure(save).health,0);
});

test('mourning dialogue acknowledges the dead companion and victory has a different tone', () => {
  for(const world of worlds) {
    let loss=newAdventure(world.id,'short'),victory=newAdventure(world.id,'short');
    for(const id of [world.origins[2].id,world.skills[0].id,'scout','reckless','alone','retreat'])loss=choose(loss,id);
    for(const id of [world.origins[2].id,world.skills[0].id,'scout','technique','coordinate','unite'])victory=choose(victory,id);
    const dead=getAdventure(loss),happy=getAdventure(victory);
    const mourning=getEndingDialogue(dead,getEnding(dead)),celebration=getEndingDialogue(happy,getEnding(happy));
    assert.equal(dead.companionHealth,0);
    assert.ok(mourning.text.includes(dead.companion));
    assert.match(mourning.text,/murió|no volvió|no pude salvar/i);
    assert.notEqual(mourning.text,celebration.text);
    assert.notEqual(mourning.label,celebration.label);
  }
});

test('all speaker portraits are local JPEGs with source attribution, without expanding the quiz catalogue', () => {
  const credits=[...JSON.parse(readFileSync(new URL('../public/asset-credits.json',import.meta.url))),...JSON.parse(readFileSync(new URL('../public/speaker-asset-credits.json',import.meta.url)))];
  for(const speaker of dialogueCharacters) {
    const bytes=readFileSync(new URL('../public/'+speaker.image.slice(2),import.meta.url));
    assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);
    assert.ok(credits.some(credit=>credit.local===speaker.image.slice(1)));
  }
  assert.equal(JSON.parse(readFileSync(new URL('../public/asset-credits.json',import.meta.url))).length,48);
  assert.equal(getSceneDialogue(null),null);
});
