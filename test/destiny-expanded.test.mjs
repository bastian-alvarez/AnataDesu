import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { worlds, durations } from '../public/destiny-data.js';
import { newAdventure, getAdventure, getEnding, choose, requirement, restoreAdventure, chronicle } from '../public/destiny-engine.js';
import { createStoryAudio } from '../public/destiny-audio.js';

function play(world, duration, overrides = {}) {
  let save = newAdventure(world.id, duration.id);
  const safe = { origin: world.origins[2].id, skill: world.skills[0].id, promise: 'people', memory: 'signals', training: 'control', mission: 'scout', travel: 'pace', branch: 'technique', companion: 'bond', camp: 'rest', dialogue: 'respect', clue: 'decode', pact: 'reject', trap: 'secure', triage: 'self', scout2: 'mark', enemy: 'question', crossroads: 'adapt', crisis: 'coordinate', aftermath: 'focus', reckoning: 'limits', finale: 'unite' };
  while (!getAdventure(save).ending) {
    const state = getAdventure(save);
    save = choose(save, overrides[state.nodeId] || safe[state.nodeId]);
  }
  return save;
}

test('eight worlds and three genuinely different story lengths finish with everyone unharmed', () => {
  assert.equal(worlds.length, 8);
  assert.deepEqual(durations.map(d => d.decisions), [6,12,22]);
  for (const world of worlds) for (const duration of durations) {
    const save = play(world,duration);
    const state = getAdventure(save);
    assert.equal(state.history.length,duration.decisions);
    assert.equal(state.ending,'triumph');
    assert.equal(state.health,8);
    assert.equal(state.companionHealth,6);
    assert.ok(chronicle(save).includes(world.name));
    if(duration.id === 'long') for(const node of ['memory','dialogue','pact','triage','enemy','reckoning']) assert.ok(state.history.some(entry=>entry.node===node));
    if(duration.id === 'short') assert.ok(!state.history.some(entry=>entry.node==='dialogue'));
  }
});

test('all seven outcomes have reachable witnesses in every world and duration', () => {
  for (const world of worlds) for (const duration of durations) {
    const cases = [
      ['triumph',{}], ['strategist',{finale:'outsmart'}], ['retreat',{finale:'retreat'}],
      ['sacrifice',{finale:'sacrifice'}], ['fallen',{branch:'reckless',triage:'breath',crisis:'gamble'}],
      ['loss',{branch:'reckless',crisis:'alone',finale:'retreat'}],
      ['guardian',{origin:world.origins[1].id,skill:world.skills[2].id,mission:'assault',branch:'technique',crisis:'gamble',finale:'protect'}],
    ];
    for(const [ending,overrides] of cases) {
      const save=play(world,duration,overrides);const state=getAdventure(save);
      assert.equal(state.ending,ending,`${world.id}/${duration.id}/${ending}`);
      const epilogue=getEnding(state);
      assert.ok(epilogue.title && epilogue.text && epilogue.alt);
      assert.ok(existsSync(new URL('../public/'+epilogue.image.slice(2),import.meta.url)));
      if(ending==='fallen'||ending==='sacrifice')assert.equal(state.health,0);
      if(ending==='loss')assert.equal(state.companionHealth,0);
      if(ending==='fallen')assert.ok(state.step<state.total);
    }
  }
});

test('a dead companion stays dead through healing, dialogue, reload and the epilogue', () => {
  const world=worlds[0];let save=newAdventure(world.id,'long');
  const overrides={trap:'abandon',triage:'friend',crisis:'coordinate',finale:'retreat'};
  const reference=play(world,durations[2],overrides);
  while(getAdventure(save).nodeId!=='triage') save=choose(save,reference.choices[save.choices.length].choice);
  let state=getAdventure(save);assert.equal(state.companionHealth,0);
  assert.match(state.node.text,/está vacío/);
  assert.ok(state.history.at(-1).outcome.includes(`${state.companion} murió`));
  save=restoreAdventure(JSON.stringify(save));save=choose(save,'friend');
  assert.equal(getAdventure(save).companionHealth,0);
  while(!getAdventure(save).ending)save=choose(save,reference.choices[save.choices.length].choice);
  state=getAdventure(save);assert.equal(state.ending,'loss');
  assert.ok(getEnding(state).text.includes(`${state.companion} murió`));
  assert.ok(requirement({effect:{},requires:{companionAlive:true}},state).length);
});

test('fatal injury ends the adventure immediately and undo restores the real previous state', () => {
  const world=worlds[0];const save=play(world,durations[0],{branch:'reckless',crisis:'gamble'});
  const state=getAdventure(save);assert.equal(state.ending,'fallen');
  assert.throws(()=>choose(save,'retreat'));
  const previous={...save,choices:save.choices.slice(0,-1)};
  assert.equal(getAdventure(previous).health,4);
  assert.equal(getAdventure(previous).ending,null);
  assert.equal(getAdventure(choose(previous,'coordinate')).health,4);
  assert.equal(getAdventure(choose(choose(previous,'coordinate'),'retreat')).ending,'retreat');
});

test('the same risky order injures a healthy companion but kills one wounded by an earlier choice', () => {
  const world=worlds[0],duration=durations[0];
  const healthy=getAdventure(play(world,duration,{crisis:'alone',finale:'retreat'}));
  const wounded=getAdventure(play(world,duration,{branch:'reckless',crisis:'alone',finale:'retreat'}));
  assert.equal(healthy.companionHealth,2);
  assert.equal(healthy.ending,'retreat');
  assert.equal(wounded.companionHealth,0);
  assert.equal(wounded.ending,'loss');
});

test('replay rejects forged stats, skipped chapters, changed duration and invalid saves', () => {
  const world=worlds[0];const completed=play(world,durations[2]);
  assert.equal(restoreAdventure(JSON.stringify({...completed,duration:'short'})),null);
  assert.equal(restoreAdventure(JSON.stringify({...completed,worldId:'__proto__'})),null);
  assert.equal(restoreAdventure(JSON.stringify({...completed,choices:[{node:'finale',choice:'unite'}]})),null);
  assert.equal(restoreAdventure(JSON.stringify({...completed,choices:[...completed.choices,null]})),null);
  assert.equal(restoreAdventure('broken'),null);
  assert.equal(getAdventure({...completed,health:0,companionHealth:0}).health,8);
  assert.deepEqual(restoreAdventure(JSON.stringify(completed)),completed);
  assert.throws(()=>newAdventure('naruto','infinite'));
});

test('the first edition restores and continues with its original rules and ending', () => {
  const save={version:1,worldId:'bleach',choices:[{node:'origin',choice:'rukongai'},{node:'skill',choice:'kido'},{node:'mission',choice:'rescue'},{node:'rescue',choice:'carry'},{node:'camp',choice:'ally'},{node:'crisis',choice:'trust'}]};
  const state=getAdventure(restoreAdventure(JSON.stringify(save)));
  assert.equal(state.legacy,true);assert.equal(state.nodeId,'finale');
  const final=getAdventure(choose(save,'guardian'));
  assert.equal(getEnding(final).title,'El farol de las almas');
  assert.match(chronicle(choose(save,'guardian')),/Primera edición/);
});

test('varied routes keep a valid next decision and cannot revive the dead or spend negative energy', () => {
  let seed=94731;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(const world of worlds)for(const duration of durations)for(let run=0;run<12;run++) {
    let save=newAdventure(world.id,duration.id),wasDead=false;
    while(!getAdventure(save).ending) {
      const state=getAdventure(save);
      assert.ok(state.health>0);
      assert.ok(state.stats.energy>=0 && state.stats.energy<=10);
      if(wasDead)assert.equal(state.companionHealth,0);
      wasDead ||= state.companionHealth===0;
      const available=state.node.choices.filter(choice=>requirement(choice,state).length===0);
      assert.ok(available.length>0);
      save=choose(save,available[Math.floor(random()*available.length)].id);
      assert.deepEqual(restoreAdventure(JSON.stringify(save)),save);
    }
    assert.ok(getEnding(getAdventure(save)).text);
  }
});

test('all original illustrations exist and contain accessible, self-contained vector art', () => {
  for(const world of worlds)for(const fate of ['triumph','guardian','strategist','loss','sacrifice','fallen']) {
    const art=readFileSync(new URL(`../public/images/destiny/${world.id}-${fate}.svg`,import.meta.url),'utf8');
    assert.match(art,/<svg/);assert.match(art,/<title/);assert.match(art,/<desc/);
    assert.doesNotMatch(art,/<script|<foreignObject|(?:href|src)=[\"']https?:/i);
  }
});

test('sound is opt-in, bounded in volume, stops when disabled, and degrades without Web Audio', async () => {
  const unsupported=createStoryAudio({});assert.equal(await unsupported.enable(),false);assert.equal(unsupported.play('danger'),false);
  const scheduled=[];let stopped=0;
  class FakeAudio {
    state='running';currentTime=0;destination={};
    createOscillator(){return{frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(time){scheduled.push(time);},stop(){stopped++;}};}
    createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(value){assert.ok(value<=.12);},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  }
  const audio=createStoryAudio({AudioContext:FakeAudio});assert.equal(audio.play('victory'),false);
  assert.equal(await audio.enable(),true);audio.setVolume(100);assert.equal(audio.volume,1);
  assert.equal(audio.play('victory'),true);assert.ok(scheduled.length>0);
  audio.disable();assert.ok(stopped>0);assert.equal(audio.play('danger'),false);
});
