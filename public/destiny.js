import { worlds, statNames } from './destiny-data.js';
import { DESTINY_KEY, newAdventure, getAdventure, choose, requirement, restoreAdventure, chronicle } from './destiny-engine.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const effects = (choice, world) => Object.entries(choice.effect).map(([key, value]) => `<span>${value > 0 ? '+' : '−'}${Math.abs(value)} ${esc(key === 'energy' ? world.energy : statNames[key])}</span>`).join('');
const art = world => `${world.image ? `<img src="./images/${world.image}.jpg" alt="" loading="lazy" width="225" height="350">` : '<span class="destiny-blade" aria-hidden="true"></span>'}<span class="destiny-kanji" lang="ja" aria-hidden="true">${world.japanese}</span>`;

export function createDestiny({ app, header, footer, showDialog, toast }) {
  let save = null;
  let storageFailed = false;
  try { save = restoreAdventure(localStorage.getItem(DESTINY_KEY)); } catch { storageFailed = true; }
  function persist() {
    try { if (save) localStorage.setItem(DESTINY_KEY, JSON.stringify(save)); else localStorage.removeItem(DESTINY_KEY); }
    catch { storageFailed = true; toast('Tu aventura se conservará solo mientras esta pestaña esté abierta.'); }
  }
  const shell = content => `${header()}${content}${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
  function dossier(state) {
    const { world } = state;
    return `<aside class="destiny-dossier" aria-label="Ficha de tu personaje"><div class="destiny-dossier-art">${art(world)}<span>EXPEDIENTE / 001</span></div><p class="eyebrow">${esc(world.place)}</p><h2>Tu protagonista</h2><dl class="destiny-identity"><div><dt>Origen</dt><dd>${esc(world.origins.find(item => item.id === state.origin)?.label || 'Por elegir')}</dd></div><div><dt>Técnica</dt><dd>${esc(world.skills.find(item => item.id === state.skill)?.label || 'Por elegir')}</dd></div><div><dt>Aliado</dt><dd>${state.flags.includes('ally') ? esc(world.cast[0]) : 'Por descubrir'}</dd></div></dl><div class="destiny-stats">${Object.entries(state.stats).map(([key, value]) => `<div><span>${esc(key === 'energy' ? world.energy : statNames[key])}<b>${value}<small>/10</small></b></span><div class="destiny-meter" role="meter" aria-label="${esc(key === 'energy' ? world.energy : statNames[key])}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="10"><i style="width:${value * 10}%"></i></div></div>`).join('')}</div><p class="destiny-local">${storageFailed ? 'Guardado en esta pestaña. El navegador no permite guardar la partida.' : 'Guardado automático en este navegador.'}</p></aside>`;
  }
  function render(focus = false) {
    const state = save ? getAdventure(save) : null;
    const world = state?.world;
    document.title = state?.ending ? `${world.endings[state.ending][0]} — AnataDesu` : 'Elige tu destino — AnataDesu';
    let content;
    if (!state) {
      content = `<main id="main" class="destiny-page container"><div class="destiny-intro"><p class="eyebrow coral">NUEVO MINIJUEGO / HISTORIAS ALTERNATIVAS</p><div class="destiny-title-row"><h1>ELIGE TU<br><span class="outlined">DESTINO.</span></h1><span class="destiny-orbit" aria-hidden="true">運<small>TU HISTORIA<br>TUS REGLAS</small></span></div><p>No mires cómo empieza otro anime.<br><strong>Esta vez, escribe el tuyo.</strong></p><div class="destiny-facts"><span>01 · Elige tu mundo</span><span>02 · Crea tu personaje</span><span>03 · Cambia la historia</span></div></div><section aria-labelledby="worlds-title"><div class="destiny-section-label"><h2 id="worlds-title">¿DÓNDE EMPIEZA TU HISTORIA?</h2><span>4 mundos · 4 finales en cada uno · 5–8 min</span></div><div class="destiny-worlds">${worlds.map((item, index) => `<button class="destiny-world" data-destiny="world" data-world="${item.id}" style="--world:${item.color}"><div class="destiny-world-art">${art(item)}<span class="destiny-world-number">0${index + 1}</span><span class="destiny-world-tag">${item.short}</span></div><div class="destiny-world-copy"><h3>${item.name}</h3><p>${item.premise}</p><span>Entrar en este mundo ↗</span></div></button>`).join('')}</div></section><p class="destiny-disclaimer">Aventuras originales de fans en universos alternativos. No siguen la historia oficial y no requieren haber terminado las series. Cada decisión se procesa en tu dispositivo.</p></main>`;
    } else {
      const latest = state.history.at(-1);
      const ending = world.endings[state.ending];
      content = `<main id="main" class="destiny-page destiny-playing container" style="--world:${world.color}"><div class="destiny-topline"><a href="#/">← AnataDesu</a><span>${esc(world.name)} / EPISODIO 01</span><button class="text-button" data-destiny="reset">Cambiar de mundo</button></div><div class="destiny-game-grid"><section class="destiny-scene"><div class="destiny-chapters" aria-label="${state.ending ? 'Aventura terminada' : `Capítulo ${state.node.chapter} de 5`}">${['Tu origen', 'La misión', 'Tu camino', 'El equipo', 'La crisis', 'El destino'].map((label, index) => `<span class="${(state.ending ? 5 : state.node.chapter) >= index ? 'active' : ''}" ${!state.ending && state.node.chapter === index ? 'aria-current="step"' : ''}><b>0${index}</b>${label}</span>`).join('')}</div><p class="eyebrow">${state.ending ? 'FIN DEL EPISODIO / TU DESENLACE' : state.node.chapter === 0 ? 'ANTES DEL PRIMER EPISODIO' : `CAPÍTULO 0${state.node.chapter} / 05`}</p><h1>${esc(ending ? ending[0] : state.node.title)}</h1>${latest?.outcome && !ending ? `<div class="destiny-consequence" role="status"><b>Tu decisión dejó huella</b><p>${esc(latest.outcome)}</p></div>` : ''}<p class="destiny-story">${esc(ending ? ending[1] : state.node.text)}</p>${ending ? `<div class="destiny-ending-seal"><span aria-hidden="true">✦</span><div><b>Este final lo construiste tú.</b><p>${esc(state.history[0].choice)} · ${esc(state.history[1].choice)} · ${state.history.length} decisiones</p></div></div><div class="destiny-ending-actions"><button class="button button-primary" data-destiny="share">Copiar mi historia ↗</button><button class="button button-outline" data-destiny="reset">Vivir otra historia</button></div>` : `<div class="destiny-options" role="group" aria-label="Elige tu siguiente decisión">${state.node.choices.map((choice, index) => { const reasons = requirement(choice, state); const exclusive = choice.requires?.skill; return `<button class="destiny-option ${exclusive ? 'destiny-exclusive' : ''}" data-destiny="choose" data-choice="${choice.id}" ${reasons.length ? 'disabled' : ''}><span class="destiny-option-number">${String(index + 1).padStart(2, '0')}</span><span class="destiny-option-copy">${exclusive ? '<small>TU TÉCNICA / CAMINO EXCLUSIVO</small>' : ''}<strong>${esc(choice.label)}</strong><span>${esc(choice.detail)}</span><span class="destiny-effects">${reasons.length ? `<em>${esc(reasons.join(' · '))}</em>` : effects(choice, world)}</span></span><span class="destiny-option-arrow" aria-hidden="true">↗</span></button>`; }).join('')}</div>`}<div class="destiny-scene-bottom"><button class="text-button" data-destiny="undo" ${save.choices.length ? '' : 'disabled'}>← Volver una decisión</button><a class="text-link" href="#/">Guardar y salir ↗</a></div>${state.history.length ? `<details class="destiny-journal" ${ending ? 'open' : ''}><summary>Tu diario de aventura <span>${state.history.length} ${state.history.length === 1 ? 'decisión' : 'decisiones'} ↓</span></summary><ol>${state.history.map(entry => `<li><small>${esc(entry.title)}</small><strong>${esc(entry.choice)}</strong>${entry.outcome ? `<p>${esc(entry.outcome)}</p>` : ''}</li>`).join('')}</ol></details>` : ''}</section>${dossier(state)}</div><p class="destiny-disclaimer">Historia alternativa creada por fans. Los finales dependen de tus decisiones, tus vínculos y la energía que conserves. Puedes volver atrás para explorar otros caminos.</p></main>`;
    }
    app.innerHTML = shell(content);
    if (focus) { window.scrollTo({ top: 0, behavior: 'instant' }); const heading = app.querySelector('main h1'); heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
  function askReset() {
    showDialog(`<div class="info-dialog"><p class="eyebrow coral">OTRO MUNDO TE ESPERA</p><h2>¿Empezar otra historia?</h2><p>Se borrará la aventura actual. Tu test de personalidad y tu resultado se conservan.</p><div class="dialog-buttons"><button class="button button-outline" data-action="close-dialog">Seguir mi historia</button><button class="button button-primary" data-destiny="confirm-reset">Elegir otro mundo</button></div></div>`);
  }
  app.addEventListener('click', async event => {
    const button = event.target.closest('[data-destiny]');
    if (!button || button.disabled) return;
    const action = button.dataset.destiny;
    if (action === 'world' && !save) { save = newAdventure(button.dataset.world); persist(); render(true); }
    if (action === 'choose' && save) { save = choose(save, button.dataset.choice); persist(); render(true); }
    if (action === 'undo' && save?.choices.length) { save = { ...save, choices: save.choices.slice(0, -1) }; persist(); render(true); }
    if (action === 'reset') askReset();
    if (action === 'confirm-reset') { app.querySelector('dialog').close(); document.body.classList.remove('dialog-open'); save = null; persist(); render(true); }
    if (action === 'share' && save) {
      const text = chronicle(save);
      try { await navigator.clipboard.writeText(text); toast('Historia copiada. Compártela con tu nakama.'); }
      catch { showDialog(`<div class="info-dialog"><h2>Tu historia, lista para compartir</h2><label for="destiny-share">Copia tu crónica</label><textarea id="destiny-share" class="destiny-share" readonly rows="12">${esc(text)}</textarea><button class="button button-primary" data-destiny="select-share">Seleccionar historia</button></div>`); }
    }
    if (action === 'select-share') { const field = app.querySelector('#destiny-share'); field.focus(); field.select(); }
  });
  return {
    render,
    clear() { save = null; persist(); },
    teaser() { return `<section class="destiny-teaser container" aria-labelledby="destiny-teaser-title"><div><p class="eyebrow coral">NUEVO / AVENTURA INTERACTIVA</p><h2 id="destiny-teaser-title">TU MUNDO.<br>TUS DECISIONES.<br><span class="outlined">TU DESTINO.</span></h2><p>Elige tu clan, aprende tu primera técnica y vive una historia que cambia contigo. Cuatro mundos. Muchos caminos. El protagonista eres tú.</p><a class="button button-primary" href="#/destino">${save ? 'Continuar mi historia' : 'Elegir mi destino'} ↗</a></div><div class="destiny-teaser-visual" aria-hidden="true"><span class="destiny-teaser-kanji">運命</span><div class="destiny-path"><span>ELIGE TU MUNDO</span><i></i><div><b>忍 Naruto</b><b>呪 Jujutsu</b></div><div><b>翼 Titanes</b><b>魂 Bleach</b></div><i></i><span>ESCRIBE TU HISTORIA ↗</span></div><small>ELIGE TU DESTINO / EP. 01</small></div></section>`; },
  };
}
