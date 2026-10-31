import { worlds, durations, statNames, fateLabels } from './destiny-data.js';
import { DESTINY_KEY, LEGACY_DESTINY_KEY, newAdventure, getAdventure, getEnding, choose, requirement, restoreAdventure, chronicle } from './destiny-engine.js';
import { createStoryAudio } from './destiny-audio.js';
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paragraphs = text => text.split('\n\n').map(part => `<p>${esc(part)}</p>`).join('');
const effects = (choice, world) => Object.entries(choice.effect).map(([key, value]) => `<span class="${value < 0 && (key === 'health' || key === 'companionHealth') ? 'destiny-cost' : ''}">${value > 0 ? '+' : '−'}${Math.abs(value)} ${esc(key === 'energy' ? world.energy : key === 'health' ? 'Vida propia' : key === 'companionHealth' ? 'Vida del compañero' : statNames[key])}</span>`).join('');
const art = world => `<img src="${world.image ? `./images/${world.image}.jpg` : `./images/destiny/${world.id}-guardian.svg`}" alt="" loading="lazy" width="225" height="350"><span class="destiny-kanji" lang="ja" aria-hidden="true">${world.japanese}</span>`;
export function createDestiny({ app, header, footer, showDialog, toast }) {
  let save = null;
  let draftWorld = null;
  let draftDuration = 'standard';
  let storageFailed = false;
  const audio = createStoryAudio();
  try { save = restoreAdventure(localStorage.getItem(DESTINY_KEY)) || restoreAdventure(localStorage.getItem(LEGACY_DESTINY_KEY)); } catch { storageFailed = true; }
  function persist() {
    try {
      if (save) localStorage.setItem(DESTINY_KEY, JSON.stringify(save)); else localStorage.removeItem(DESTINY_KEY);
      localStorage.removeItem(LEGACY_DESTINY_KEY);
    } catch { storageFailed = true; toast('La partida se conservará solo mientras esta pestaña esté abierta.'); }
  }
  function soundControls() {
    return `<div class="destiny-sound"><button class="destiny-sound-toggle" data-destiny="sound" aria-pressed="${audio.enabled}" aria-label="${audio.enabled ? 'Desactivar' : 'Activar'} efectos de sonido"><span aria-hidden="true">${audio.enabled ? '◖))' : '◖×'}</span><span>Sonido ${audio.enabled ? 'activado' : 'apagado'}</span></button><label for="destiny-volume">Volumen</label><input id="destiny-volume" type="range" min="0" max="100" step="5" value="${Math.round(audio.volume * 100)}" aria-label="Volumen de efectos" ${audio.enabled ? '' : 'disabled'}></div>`;
  }
  const shell = content => `${header()}${content}${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
  function vitality(state, compact = false) {
    if (state.legacy) return '';
    return `<div class="destiny-vitality ${compact ? 'destiny-vitality-mobile' : ''}" aria-label="Estado del equipo"><div class="${state.health <= 3 ? 'critical' : ''}"><span>Tu vida</span><b>${state.health}<small>/8</small></b><i style="--life:${state.health / 8 * 100}%"></i></div><div class="${state.companionHealth === 0 ? 'fallen' : state.companionHealth <= 2 ? 'critical' : ''}"><span>${esc(state.companion)}</span><b>${state.companionHealth === 0 ? 'Falleció' : `${state.companionHealth}<small>/6</small>`}</b><i style="--life:${state.companionHealth / 6 * 100}%"></i></div></div>`;
  }
  function dossier(state) {
    const { world } = state;
    return `<aside class="destiny-dossier" aria-label="Ficha de tu personaje"><div class="destiny-dossier-art">${art(world)}<span>EXPEDIENTE / ${esc(world.short)}</span></div><p class="eyebrow">${esc(world.place)}</p><h2>Tu protagonista</h2>${vitality(state)}<dl class="destiny-identity"><div><dt>Origen</dt><dd>${esc(world.origins.find(item => item.id === state.origin)?.label || 'Por elegir')}</dd></div><div><dt>Técnica</dt><dd>${esc(world.skills.find(item => item.id === state.skill)?.label || 'Por elegir')}</dd></div><div><dt>Compañero</dt><dd>${esc(state.companion || 'Por descubrir')}${state.companionHealth === 0 ? ' · En tu memoria' : ''}</dd></div></dl><div class="destiny-stats">${Object.entries(state.stats).map(([key, value]) => `<div><span>${esc(key === 'energy' ? world.energy : statNames[key])}<b>${value}<small>/10</small></b></span><div class="destiny-meter" role="meter" aria-label="${esc(key === 'energy' ? world.energy : statNames[key])}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="10"><i style="width:${value * 10}%"></i></div></div>`).join('')}</div><p class="destiny-local">${storageFailed ? 'Guardado en esta pestaña. El navegador no permite guardar la partida.' : 'Guardado automático en este navegador.'}</p></aside>`;
  }
  function intro() {
    return `<div class="destiny-intro"><p class="eyebrow coral">ELIGE TU DESTINO / NUEVOS HORIZONTES</p><div class="destiny-title-row"><h1>UNA VIDA.<br><span class="outlined">MIL DESTINOS.</span></h1><span class="destiny-orbit" aria-hidden="true">運<small>TU HISTORIA<br>TUS DECISIONES</small></span></div><p>Ocho mundos. Héroes que regresan. Nombres que se recuerdan.<br><strong>Lo que hagas escribirá el final.</strong></p><div class="destiny-facts"><span>01 · Elige un mundo</span><span>02 · Decide cuánto vivirlo</span><span>03 · Afronta tu destino</span></div></div>`;
  }
  function selection() {
    if (draftWorld) {
      const world = worlds.find(item => item.id === draftWorld);
      return `<main id="main" class="destiny-page container" style="--world:${world.color}"><button class="text-button" data-destiny="back-worlds">← Elegir otro mundo</button><div class="destiny-setup-layout"><div class="destiny-setup-art">${art(world)}<span>${esc(world.name)}</span></div><section class="destiny-duration-setup"><p class="eyebrow">${esc(world.name)} / ANTES DE EMPEZAR</p><h1>¿CUÁNTO QUIERES<br><span class="outlined">VIVIR ESTA HISTORIA?</span></h1><p>${esc(world.premise)}</p><fieldset class="destiny-durations"><legend>Elige la duración de tu aventura</legend>${durations.map(duration => `<label class="destiny-duration ${draftDuration === duration.id ? 'selected' : ''}"><input type="radio" name="destiny-duration" value="${duration.id}" ${draftDuration === duration.id ? 'checked' : ''}><span><b>${duration.name}</b><strong>${duration.time}</strong><small>${duration.decisions} decisiones · ${duration.description}</small></span><i aria-hidden="true">↗</i></label>`).join('')}</fieldset><p class="destiny-stakes">Las decisiones pueden causar heridas, la muerte de tu compañero o la de tu protagonista. También puedes lograr que todos regresen ilesos. Los riesgos importantes estarán señalados.</p><button class="button button-primary" data-destiny="start">Comenzar mi historia ↗</button><p class="destiny-duration-note">Tiempos orientativos según tu ritmo de lectura. Puedes guardar y continuar. La duración se mantiene durante esta partida.</p></section></div>${soundControls()}</main>`;
    }
    return `<main id="main" class="destiny-page container">${intro()}<section aria-labelledby="worlds-title"><div class="destiny-section-label"><h2 id="worlds-title">¿DÓNDE EMPIEZA TU HISTORIA?</h2><span>8 mundos · 3 duraciones · finales que dejan huella</span></div><div class="destiny-worlds">${worlds.map((world, index) => `<button class="destiny-world" data-destiny="world" data-world="${world.id}" style="--world:${world.color}"><div class="destiny-world-art">${art(world)}<span class="destiny-world-number">${String(index + 1).padStart(2,'0')}</span><span class="destiny-world-tag">${world.short}</span></div><div class="destiny-world-copy"><h3>${world.name}</h3><p>${world.premise}</p><span>Escribir mi historia ↗</span></div></button>`).join('')}</div></section><div class="destiny-features"><span>6, 12 o 22 decisiones</span><span>Ilustraciones de tu desenlace</span><span>Efectos de sonido opcionales</span></div><p class="destiny-disclaimer">Aventuras originales de fans en universos alternativos, con compañeros creados para el juego. Hay peligro, pérdidas y sacrificios sin imágenes gráficas. Cada decisión se procesa en tu dispositivo.</p></main>`;
  }
  function journal(state) {
    return `<details class="destiny-journal"><summary>Tu diario de aventura <span>${state.history.length} ${state.history.length === 1 ? 'decisión' : 'decisiones'} ↓</span></summary><ol>${state.history.map(entry => `<li class="${entry.events?.length ? 'destiny-event' : ''}"><small>${esc(entry.title)}</small><strong>${esc(entry.choice)}</strong><p>${esc(entry.outcome)}</p></li>`).join('')}</ol></details>`;
  }
  function scene(state) {
    const latest = state.history.at(-1);
    const ending = getEnding(state);
    const world = state.world;
    const duration = durations.find(item => item.id === state.duration);
    const progress = state.ending ? 5 : Math.min(4, Math.floor(state.step / state.total * 5));
    const content = ending ? `<figure class="destiny-ending-art"><img src="${ending.image}" alt="${esc(ending.alt)}" width="1200" height="700"><figcaption>${esc(world.name)} / ${esc(fateLabels[ending.fate])}</figcaption></figure><p class="eyebrow">TU DESENLACE / ${esc(fateLabels[ending.fate])}</p><h1>${esc(ending.title)}</h1><div class="destiny-story">${paragraphs(ending.text)}</div><div class="destiny-ending-seal"><span aria-hidden="true">✦</span><div><b>Este final lo construiste tú.</b><p>${esc(state.history[0]?.choice || '')} · ${esc(state.history[1]?.choice || '')}<br>${state.history.length} decisiones vividas${state.health === 0 && state.step < state.total ? ' · La misión terminó antes de tiempo' : ''}</p></div></div><div class="destiny-turning-points"><h2>Lo que cambió tu historia</h2>${state.history.filter(entry => entry.events?.length || Object.hasOwn(entry.effect,'health') || Object.hasOwn(entry.effect,'companionHealth')).slice(-3).map(entry => `<article><b>${esc(entry.choice)}</b><p>${esc(entry.outcome)}</p></article>`).join('') || `<article><p>La preparación, las pistas y la forma en que cuidaste al equipo guiaron tu último movimiento.</p></article>`}</div><div class="destiny-ending-actions"><button class="button button-primary" data-destiny="share">Copiar mi historia ↗</button><a class="button button-outline" href="${ending.image}" download="AnataDesu-${world.id}-${ending.fate}.svg">Guardar ilustración ↓</a><button class="button button-outline" data-destiny="reset">Vivir otra historia</button></div>` : `<p class="eyebrow">${state.node.chapter === 0 ? 'CREA TU PROTAGONISTA' : `CAPÍTULO ${String(state.node.chapter).padStart(2,'0')} / ${state.chapters}`}${state.node.mood === 'danger' ? ' · ENCUENTRO DE RIESGO' : ''}</p><h1>${esc(state.node.title)}</h1>${latest?.outcome ? `<div class="destiny-consequence ${latest.events?.length ? 'destiny-consequence-loss' : ''}" role="status"><b>${latest.events?.length ? 'La historia ha cambiado' : 'Tu decisión dejó huella'}</b><p>${esc(latest.outcome)}</p></div>` : ''}<div class="destiny-story">${paragraphs(state.node.text)}</div><div class="destiny-options" role="group" aria-label="Elige tu siguiente decisión">${state.node.choices.map((choice,index) => { const reasons = requirement(choice,state);return `<button class="destiny-option ${choice.requires?.skill ? 'destiny-exclusive' : ''} ${choice.risk ? 'destiny-risky' : ''}" data-destiny="choose" data-choice="${choice.id}" ${reasons.length ? 'disabled' : ''}><span class="destiny-option-number">${String(index+1).padStart(2,'0')}</span><span class="destiny-option-copy">${choice.requires?.skill ? '<small>TU TÉCNICA / CAMINO EXCLUSIVO</small>' : ''}<strong>${esc(choice.label)}</strong><span>${esc(choice.detail)}</span>${choice.risk ? `<small class="destiny-risk-label">${esc(choice.risk)}</small>` : ''}<span class="destiny-effects">${reasons.length ? `<em>${esc(reasons.join(' · '))}</em>` : effects(choice,world)}</span></span><span class="destiny-option-arrow" aria-hidden="true">↗</span></button>`;}).join('')}</div>`;
    return `<main id="main" class="destiny-page destiny-playing container" style="--world:${world.color}"><div class="destiny-topline"><a href="#/">← AnataDesu</a><span>${esc(world.name)} / ${state.legacy ? 'PRIMERA EDICIÓN' : `${esc(duration.name)} · ${esc(duration.time)}`}</span><button class="text-button" data-destiny="reset">Nueva aventura</button></div>${state.legacy ? '<div class="destiny-legacy-note">Tu aventura de la primera edición se conserva. «Nueva aventura» abre los ocho mundos y las tres duraciones de la nueva edición.</div>' : ''}<div class="destiny-play-tools"><span>${state.ending ? 'Historia terminada' : `Decisión ${state.step + 1} de ${state.total}`}</span>${soundControls()}</div>${vitality(state,true)}<div class="destiny-game-grid"><section class="destiny-scene"><div class="destiny-chapters" aria-label="Progreso de la historia">${['Origen','El camino','Los vínculos','La amenaza','La decisión','Tu destino'].map((label,index) => `<span class="${progress >= index ? 'active' : ''}"><b>0${index}</b>${label}</span>`).join('')}</div><div class="destiny-story-progress" role="progressbar" aria-label="Decisiones vividas" aria-valuenow="${state.step}" aria-valuemin="0" aria-valuemax="${state.total}"><i style="width:${state.step/state.total*100}%"></i></div>${content}<div class="destiny-scene-bottom"><button class="text-button" data-destiny="undo" ${save.choices.length ? '' : 'disabled'}>← Volver una decisión</button><a class="text-link" href="#/">Guardar y salir ↗</a></div>${state.history.length ? journal(state) : ''}</section>${dossier(state)}</div><p class="destiny-disclaimer">Las consecuencias se guardan con tu partida. Volver una decisión también restaura el estado anterior. Los sonidos son originales y opcionales; el volumen se controla arriba.</p></main>`;
  }
  function render(focus = false) {
    const state = save ? getAdventure(save) : null;
    const ending = state ? getEnding(state) : null;
    document.title = ending ? `${ending.title} — AnataDesu` : 'Elige tu destino — AnataDesu';
    app.innerHTML = shell(state ? scene(state) : selection());
    if (focus) { window.scrollTo({top:0,behavior:'instant'}); const heading=app.querySelector('main h1');heading.tabIndex=-1;heading.focus({preventScroll:true}); }
  }
  function askReset() {
    showDialog(`<div class="info-dialog"><p class="eyebrow coral">OTRA VIDA TE ESPERA</p><h2>¿Empezar otra historia?</h2><p>Se reemplazará la aventura actual. Tu test de personalidad y su resultado se conservan.</p><div class="dialog-buttons"><button class="button button-outline" data-action="close-dialog">Seguir mi historia</button><button class="button button-primary" data-destiny="confirm-reset">Elegir otro mundo</button></div></div>`);
  }
  function updateSound() {
    app.querySelector('.destiny-sound').outerHTML = soundControls();
  }
  app.addEventListener('change',event => {
    if(event.target.name === 'destiny-duration') {
      draftDuration=event.target.value;
      app.querySelectorAll('.destiny-duration').forEach(label=>label.classList.toggle('selected',label.querySelector('input').checked));
    }
  });
  app.addEventListener('input',event=>{if(event.target.id==='destiny-volume')audio.setVolume(Number(event.target.value)/100);});
  app.addEventListener('click',async event=>{
    const button=event.target.closest('[data-destiny]');if(!button || button.disabled)return;
    const action=button.dataset.destiny;
    if(action==='sound') {
      if(audio.enabled)audio.disable();else if(await audio.enable())audio.play('select');else toast('Este navegador no permite activar audio. Puedes seguir jugando en silencio.');
      if(app.querySelector('.destiny-sound'))updateSound();return;
    }
    if(action==='world' && !save){draftWorld=button.dataset.world;render(true);}
    if(action==='back-worlds'){draftWorld=null;render(true);}
    if(action==='start' && draftWorld && !save){save=newAdventure(draftWorld,draftDuration);persist();audio.play('discovery');render(true);}
    if(action==='choose' && save){save=choose(save,button.dataset.choice);persist();const state=getAdventure(save);const ending=getEnding(state);audio.play(ending ? ['triumph','guardian','strategist'].includes(ending.fate)?'victory':ending.fate==='retreat'?'quiet':'loss' : state.history.at(-1)?.events?.length?'loss':state.node.mood || 'select');render(true);}
    if(action==='undo' && save?.choices.length){audio.stop();save={...save,choices:save.choices.slice(0,-1)};persist();render(true);}
    if(action==='reset')askReset();
    if(action==='confirm-reset'){app.querySelector('dialog').close();document.body.classList.remove('dialog-open');audio.stop();save=null;draftWorld=null;persist();render(true);}
    if(action==='share' && save){const text=chronicle(save);try{await navigator.clipboard.writeText(text);toast('Historia copiada. Compártela con tu nakama.');}catch{showDialog(`<div class="info-dialog"><h2>Tu historia, lista para compartir</h2><label for="destiny-share">Copia tu crónica</label><textarea id="destiny-share" class="destiny-share" readonly rows="12">${esc(text)}</textarea><button class="button button-primary" data-destiny="select-share">Seleccionar historia</button></div>`);}}
    if(action==='select-share'){const field=app.querySelector('#destiny-share');field.focus();field.select();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.stop();});
  window.addEventListener('hashchange',()=>{if(location.hash!=='#/destino')audio.stop();});
  return {
    render,
    clear(){save=null;draftWorld=null;audio.stop();persist();},
    teaser(){return `<section class="destiny-teaser container" aria-labelledby="destiny-teaser-title"><div><p class="eyebrow coral">AMPLIADO / ELIGE TU DESTINO</p><h2 id="destiny-teaser-title">UNA DECISIÓN.<br>UNA CICATRIZ.<br><span class="outlined">TU HISTORIA.</span></h2><p>Ocho mundos, tres duraciones y decisiones que cambian quién vuelve a casa. Vive una victoria perfecta, una pérdida o un último acto heroico. Tu destino tiene su propia ilustración.</p><a class="button button-primary" href="#/destino">${save?'Continuar mi historia':'Elegir mi destino'} ↗</a></div><div class="destiny-teaser-visual" aria-hidden="true"><span class="destiny-teaser-kanji">運命</span><div class="destiny-path"><span>¿CUÁNTO QUIERES VIVIR?</span><i></i><div><b>UN DESTELLO</b><b>UN EPISODIO</b></div><div><b>UNA SAGA / 15 MIN</b></div><i></i><span>EL FINAL DEPENDE DE TI ↗</span></div><small>8 MUNDOS / SONIDO OPCIONAL</small></div></section>`;},
  };
}
