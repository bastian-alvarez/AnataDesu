import { createDestiny } from './destiny.js';
import { characters, questions, dimensions, universes } from './data.js';
import { getResult, getExplanation, getNarrative, validateAnswers, defaultPreferences, validatePreferences, getCandidateCharacters, getArchivedResult } from './engine.js';
import { createFriendCode, parseFriendCode, compareProfiles } from './compatibility.js';
import { restoreSession, serializeSession, STORAGE_KEY, LEGACY_KEY } from './session.js';
import { createCardBlob, cardFormats, cardStyles } from './cards.js';

const app = document.querySelector('#app');
const KEY = STORAGE_KEY;
const emptyAnswers = () => Array(questions.length).fill(null);
let restored;
try { restored = restoreSession(localStorage); } catch { restored = restoreSession({ getItem: () => null }); restored.storageAvailable = false; }
let { answers, current, preferences, configured, archive, pendingFriend, storageAvailable } = restored;
let draftPreferences = structuredClone(preferences);
let filter = 'Todos';
let galleryQuery = '';
let expanded = false;
let analysisTimer;
let toastTimer;
let observer;
let returnFocus;
let studio = { format: 'story', style: 'signature' };
const personalResult = () => validateAnswers(answers) ? getResult(answers, preferences) : getArchivedResult(archive);
const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const scopeLabel = value => value.mode === 'all' ? 'Todos los universos' : value.mode === 'familiar' ? 'Mis universos conocidos' : 'Descubrir un universo nuevo';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.8"/></svg>';
const icons = {
  spark: '<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 17h5a2 2 0 1 1-2 2"/>',
  flame: '<path d="M12 2c1 5-3 6-3 10 0 2 1 3 2 3-1-4 3-5 4-8 4 4 6 7 5 10a8 8 0 0 1-16-1c0-5 5-8 8-14Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.5 10.5 7-4m-7 7 7 4"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
};
const icon = (name, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const torii = '<svg class="brand-symbol" viewBox="0 0 44 44" aria-hidden="true"><path d="M5 10Q22 16 39 10M8 19h28M14 12v25M30 12v25M11 37h6M27 37h6" fill="none" stroke="currentColor" stroke-width="3.4"/></svg>';
const brand = `<a class="brand" href="#/" aria-label="AnataDesu, inicio">${torii}<span>Anata<span class="brand-light">Desu</span><small>あなたです。</small></span></a>`;

function save() {
  try { localStorage.setItem(KEY, serializeSession({ answers, current, preferences, configured, archive, pendingFriend })); }
  catch { if (storageAvailable) toast('Tu progreso se conservará mientras esta pestaña esté abierta.'); storageAvailable = false; }
}

function toast(message) {
  clearTimeout(toastTimer);
  const target = document.querySelector('#toast');
  target.textContent = message;
  target.classList.add('visible');
  toastTimer = setTimeout(() => target.classList.remove('visible'), 4500);
}

function header(simple = false) {
  const complete = personalResult();
  const testHref = complete ? `#/resultado/${complete.character.id}` : '#/universos';
  return `<header class="header"><div class="container nav-inner">${brand}${simple ? '<a class="exit-link" href="#/">Guardar y salir <span aria-hidden="true">↗</span></a>' : `<nav class="desktop-nav" aria-label="Navegación principal"><a href="#personajes">Los personajes</a><a href="#como-funciona">Cómo funciona</a><a href="#/duo">Modo dúo</a><a href="#/destino">Elige tu destino ↗</a></nav><div class="nav-actions"><span class="nav-jp" lang="ja">君は誰？</span><a class="button button-small button-cream" href="${testHref}">${complete ? 'Mi resultado' : 'Hacer el test'} ${arrow}</a><button class="menu-toggle icon-button" data-action="menu" aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button></div><nav class="mobile-nav" aria-label="Navegación móvil" hidden><a href="#personajes">Los personajes</a><a href="#como-funciona">Cómo funciona</a><a href="#/duo">Modo dúo</a><a href="#/destino">Elige tu destino ↗</a></nav>`}</div></header>`;
}

function footer() {
  return `<footer class="footer"><div class="container footer-top">${brand}<p>Tu personalidad tiene su propio universo.</p><a href="https://github.com/bastian-alvarez/AnataDesu" target="_blank" rel="noopener noreferrer">Hecho para la comunidad ↗</a></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} AnataDesu · Un proyecto de fans para fans.</span><div><button class="text-button" data-action="privacy">Privacidad</button><button class="text-button" data-action="credits">Créditos</button><span lang="ja">またね！</span></div></div></footer>`;
}

function characterCard(character, index = 0) {
  return `<button class="character-card" data-character="${character.id}" style="--character-color:${character.color};--order:${index % 4}" aria-label="Conocer a ${character.name}, ${character.anime}"><div class="card-art"><img src="./images/${character.id}.jpg" alt="${character.name}" loading="lazy" width="225" height="350"><span class="card-index">${String(characters.indexOf(character) + 1).padStart(2, '0')}</span><span class="card-japanese" lang="ja">${character.japanese}</span><span class="card-arrow">${arrow}</span></div><div class="card-caption"><small>${character.anime}</small><h3>${character.name}</h3><span>${character.traits.slice(0, 2).join(' · ')}</span></div></button>`;
}

function renderGallery() {
  const filtered = characters.filter(character => (filter === 'Todos' || character.category === filter) && (!galleryQuery || fold(`${character.name} ${character.anime} ${character.traits.join(' ')}`).includes(fold(galleryQuery))));
  const visible = expanded || filter !== 'Todos' || galleryQuery ? filtered : filtered.slice(0, 8);
  const grid = document.querySelector('#character-grid');
  if (!grid) return;
  grid.innerHTML = visible.length ? visible.map(characterCard).join('') : '<div class="empty-catalog"><h3>Este personaje todavía no aparece por aquí.</h3><p>Prueba otro nombre, anime o rasgo.</p><button class="button button-outline" data-action="reset-gallery">Limpiar búsqueda y filtros</button></div>';
  document.querySelector('.catalog-label').textContent = `${filtered.length} PERSONAJES`;
  document.querySelectorAll('[data-filter]').forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const more = document.querySelector('#show-more');
  more.hidden = filter !== 'Todos' || !!galleryQuery;
  more.innerHTML = `${expanded ? 'Ver menos personajes' : `Explorar los ${characters.length} personajes`} <span aria-hidden="true">${expanded ? '−' : '+'}</span>`;
}

function renderHome() {
  document.title = 'AnataDesu — Descubre tu alma anime';
  const hasProgress = answers.some(answer => answer !== null) && answers.some(answer => answer === null);
  const completed = personalResult();
  app.innerHTML = `${header()}<main id="main">
    <section class="hero container" aria-labelledby="hero-title">
      <div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> EL PROTAGONISTA ERES TÚ <span class="eyebrow-line"></span></div>
        <h1 id="hero-title">DESCUBRE<br>TU <span class="outlined">ALMA</span><br><span class="coral-word">ANIME<span class="title-star">✳</span></span></h1>
        <p class="hero-description">Hay un poco de otro universo en ti.<br>Descubre qué personaje de anime comparte<br class="desktop-only"> tu forma de sentir, pensar y vivir.</p>
        <a class="button button-primary button-large" href="${hasProgress ? (configured ? '#/test' : '#/universos') : completed ? `#/resultado/${completed.character.id}` : '#/universos'}">${hasProgress ? 'Continuar mi aventura' : completed ? 'Volver a mi resultado' : 'Encontrar mi personaje'} ${arrow}</a>
        <div class="hero-facts"><span>${icon('clock')} Unos 3 minutos</span><span><span class="small-dot"></span> Sin registro. Solo tú.</span></div>
      </div>
      <div class="hero-art" aria-label="Personajes de Naruto, One Piece y Jujutsu Kaisen">
        <span class="hero-japanese" lang="ja" aria-hidden="true">自分を<br>見つけろ。</span><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="art-cross cross-one">+</span><span class="art-cross cross-two">+</span>
        <div class="hero-panel panel-gojo"><img src="./images/gojo.jpg" alt="Satoru Gojo de Jujutsu Kaisen" width="225" height="350"><div class="panel-shade"></div><span class="panel-series">JUJUTSU KAISEN</span><span class="panel-name">GOJO</span></div>
        <div class="hero-panel panel-luffy"><img src="./images/luffy.jpg" alt="Monkey D. Luffy de One Piece" width="225" height="350"><div class="panel-shade"></div><span class="panel-series">ONE PIECE</span><span class="panel-name">LUFFY</span></div>
        <div class="hero-panel panel-naruto"><img src="./images/naruto.jpg" alt="Naruto Uzumaki" width="225" height="350" fetchpriority="high"><div class="panel-shade"></div><span class="panel-series">NARUTO SHIPPUDEN</span><span class="panel-name">NARUTO</span></div>
        <div class="anime-sticker"><span>¿Y SI ERES<br>UNO DE ELLOS?</span><svg viewBox="0 0 90 36" fill="none" aria-hidden="true"><path d="M2 4C40 1 17 34 80 24m-8-10 10 10-12 8" stroke="currentColor" stroke-width="2"/></svg></div>
        <div class="hero-label"><span class="label-symbol">✦</span><div>Distintos universos.<br><strong>Una misma esencia.</strong></div></div><span class="art-caption">PERSONALITY MEETS ANIME / VOL. 02</span>
      </div>
      <a class="scroll-cue" href="#personajes"><span>EXPLORA TU UNIVERSO</span><span aria-hidden="true">↓</span></a>
    </section>
    <div class="anime-ticker" aria-label="Universos de anime incluidos"><div class="ticker-track">${Array.from({ length: 2 }, (_, index) => `<span class="ticker-group" ${index ? 'aria-hidden="true"' : ''}>${['NARUTO', 'ONE PIECE', 'JUJUTSU KAISEN', 'DEMON SLAYER', 'ATTACK ON TITAN', 'HUNTER × HUNTER', 'DEATH NOTE'].map(name => `<span>${name}</span><span class="ticker-star">✳</span>`).join('')}</span>`).join('')}</div></div>
    ${destiny.teaser()}
    <section class="character-section container section-space" id="personajes" aria-labelledby="characters-title"><div class="section-heading reveal"><div><p class="eyebrow coral">EL MULTIVERSO TE ESPERA</p><h2 id="characters-title">Diferentes historias.<br><span class="muted-heading">¿Cuál se parece a la tuya?</span></h2></div><p>El valor de Naruto. La libertad de Luffy.<br>La sensibilidad de Violet. Descubre<br>con quién compartes tu esencia.</p></div>
      <div class="catalog-search"><label for="catalog-query">ENCUENTRA TU UNIVERSO</label><input id="catalog-query" type="search" placeholder="Buscar personaje, anime o rasgo…" value="${escape(galleryQuery)}" autocomplete="off"><span>${characters.length} personajes · ${universes.length} universos</span></div><div class="gallery-toolbar"><div class="filters" role="group" aria-label="Filtrar personajes por género">${['Todos', 'Shōnen', 'Acción', 'Fantasía', 'Misterio', 'Deportes', 'Comedia'].map((name, index) => `<button class="filter ${index === 0 ? 'active' : ''}" data-filter="${name}" aria-pressed="${index === 0}">${name}</button>`).join('')}</div><span class="catalog-label">${characters.length} PERSONAJES <span>↙</span></span></div>
      <div class="character-grid" id="character-grid"></div><div class="gallery-bottom"><span>Tal vez tu favorito. Tal vez alguien que no esperabas.</span><button id="show-more" class="button button-outline" data-action="more"></button></div>
    </section>
    <section class="duo-teaser container"><div class="duo-teaser-art" aria-hidden="true"><img src="./images/naruto.jpg" alt="" width="225" height="350"><span>×</span><img src="./images/sasuke.jpg" alt="" width="225" height="350"></div><div><p class="eyebrow coral">NUEVO / MODO DÚO</p><h2>UNA BUENA HISTORIA<br>SE VIVE <span class="outlined">EN COMPAÑÍA.</span></h2><p>Compara tu resultado con el de un amigo. Descubran qué los conecta, dónde se complementan y qué dúo formarían.</p><a class="button button-outline" href="#/duo">Conectar nuestros universos ${arrow}</a></div></section><section class="how-section" id="como-funciona" aria-labelledby="how-title"><div class="container"><div class="how-top reveal"><p class="eyebrow">TU ARCO DE AUTODESCUBRIMIENTO</p><span class="how-jp" lang="ja">物語の始まり</span></div><div class="how-layout"><div class="how-intro reveal"><h2 id="how-title">UN TEST.<br>MUCHAS FORMAS<br>DE <span>SER TÚ.</span></h2><p>No hay respuestas correctas. Elige lo que de verdad se parece a ti y deja que tu historia hable.</p><a class="text-link" href="#/universos">Empieza tu primer capítulo ${arrow}</a><div class="how-emblem" aria-hidden="true">自<span>分</span><small>BE YOURSELF</small></div></div><div class="steps"><article class="step reveal"><span class="step-number">01</span><div><h3>Escucha tu instinto</h3><p>12 pequeñas escenas sobre tus decisiones, tus vínculos y lo que te mueve. Elige antes entre todos los universos, los que conoces o uno por descubrir.</p><span class="step-tag">SIN RESPUESTAS INCORRECTAS</span></div>${icon('spark')}</article><article class="step reveal"><span class="step-number">02</span><div><h3>Conecta con tu personaje</h3><p>Comparamos cinco rasgos de tus respuestas con los perfiles de ${characters.length} personajes de ${universes.length} universos.</p><span class="step-tag">VALENTÍA · EMPATÍA · Y MUCHO MÁS</span></div>${icon('bolt')}</article><article class="step reveal"><span class="step-number">03</span><div><h3>Conoce el porqué</h3><p>Recibe tu personaje, una explicación de tus afinidades y una tarjeta para compartir. Conecta dos resultados y descubre qué dúo formarían.</p><span class="step-tag">TU ESENCIA, EN OTRO UNIVERSO</span></div>${icon('heart')}</article></div></div></div></section>
    <section class="faq-section container section-space" id="preguntas" aria-labelledby="faq-title"><div class="faq-intro reveal"><p class="eyebrow coral">ANTES DEL PRIMER EPISODIO</p><h2 id="faq-title">¿ALGUNA<br><span class="outlined">DUDA?</span></h2><p>No necesitas haber visto todos los animes.<br>Solo necesitas ser tú.</p><span class="faq-doodle" aria-hidden="true">?</span></div><div class="faq-list"><details><summary>¿Cómo eligen mi personaje?<span aria-hidden="true">+</span></summary><p>Cada respuesta aporta a cinco rasgos: valentía, empatía, estrategia, libertad y determinación. Comparamos el promedio de tus respuestas con perfiles editoriales de los personajes y elegimos el más cercano. Puedes consultar <a href="#/metodo">cómo funciona la afinidad</a>.</p></details><details><summary>¿Es una evaluación psicológica?<span aria-hidden="true">+</span></summary><p>Es una experiencia de entretenimiento y autodescubrimiento creada por fans. Los perfiles son interpretaciones de los personajes y no sustituyen una evaluación psicológica.</p></details><details><summary>¿Necesito una cuenta o pagar algo?<span aria-hidden="true">+</span></summary><p>No. Puedes hacer el test completo, ver tu resultado y descargar tu tarjeta sin registrarte y sin pagar.</p></details><details><summary>¿Qué pasa con mis respuestas?<span aria-hidden="true">+</span></summary><p>Se calculan y guardan en este navegador. No enviamos tus respuestas a un servidor. Puedes borrarlas con “Borrar mi progreso” o al reiniciar el test.</p></details><details><summary>¿Puedo repetirlo o compartirlo?<span aria-hidden="true">+</span></summary><p>¡Claro! Puedes repetirlo desde tu resultado y descargar una tarjeta con tu personaje. El enlace de resultado muestra el personaje. Si usas modo dúo, eliges compartir también cinco puntuaciones resumidas con tu nakama. Las respuestas siguen en tu dispositivo.</p></details></div></section>
    <section class="final-cta container reveal"><div class="cta-grain" aria-hidden="true"></div><span class="cta-jp" lang="ja" aria-hidden="true">あなた</span><div><p class="eyebrow">CADA HISTORIA TIENE UN PROTAGONISTA</p><h2>ESTA VEZ,<br>ERES TÚ.</h2></div><div class="cta-right"><a class="button button-dark button-large" href="#/universos">Descubrir mi personaje ${arrow}</a><span>${characters.length} personajes · ${universes.length} universos · una historia propia.</span></div><span class="cta-spark" aria-hidden="true">✳</span></section>
  </main>${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
  renderGallery();
  setupReveals();
}

function renderQuiz(focusTitle = false) {
  document.title = `Pregunta ${current + 1} de 12 — AnataDesu`;
  const question = questions[current];
  const selected = answers[current];
  const answered = answers.filter(answer => answer !== null).length;
  app.innerHTML = `${header(true)}<main id="main" class="quiz-main container"><div class="quiz-topline"><a href="#/" class="quiz-back">← Volver al inicio</a><span>ENCUENTRA TU ESENCIA <span lang="ja">自分らしく</span></span></div><div class="quiz-layout"><aside class="quiz-sidebar"><span class="eyebrow coral">TU ARCO DE ORIGEN</span><h2>CADA ELECCIÓN<br>CUENTA ALGO<br><span class="outlined">DE TI.</span></h2><p>Responde con lo que sientes.<br>Tu primera intuición suele tener<br>mucho que contar.</p><div class="quiz-sidebar-art" aria-hidden="true"><span class="quiz-orbit"></span><span>✳</span><b lang="ja">心</b></div><div class="quiz-save-note">${icon('lock')}<span>${storageAvailable ? 'Tu progreso se guarda en este navegador.' : 'Tu progreso se conserva en esta pestaña.'}</span></div></aside><section class="question-panel" aria-labelledby="question-title"><div class="quiz-scope"><span>${scopeLabel(preferences)}</span><a href="#/universos">Cambiar universos ↗</a></div><div class="progress-label"><span>CAPÍTULO <b>${String(current + 1).padStart(2, '0')}</b> / 12</span><span>${answered} de 12 respondidas</span></div><div class="progress-track" role="progressbar" aria-valuenow="${answered}" aria-valuemin="0" aria-valuemax="12" aria-label="Preguntas respondidas"><span style="width:${answered / 12 * 100}%"></span></div><div class="question-content"><span class="question-kicker">${question.chapter}</span><h1 id="question-title" tabindex="-1">${question.title}</h1><p class="question-subtitle">${question.subtitle}</p><fieldset class="answers"><legend class="sr-only">Elige la respuesta que más se parece a ti</legend>${question.options.map((option, index) => `<label class="answer ${selected === index ? 'selected' : ''}"><input type="radio" name="answer" value="${index}" ${selected === index ? 'checked' : ''}><span class="answer-letter">${'ABCD'[index]}</span><span class="answer-text">${option.text}</span><span class="answer-check">${selected === index ? icon('check') : ''}</span></label>`).join('')}</fieldset><div class="quiz-navigation"><button class="text-button previous" data-action="previous" ${current === 0 ? 'disabled' : ''}>← Anterior</button><span class="keyboard-hint">Puedes usar las teclas 1–4</span><button class="button button-primary" data-action="next" ${selected === null ? 'disabled' : ''}>${current === 11 ? 'Revelar mi personaje' : 'Siguiente'} ${arrow}</button></div></div><div class="quiz-bottom-note"><span>Sin respuestas correctas. Sin etiquetas definitivas.</span><span aria-hidden="true">✦</span></div></section></div></main><footer class="quiz-footer container"><span>Una experiencia de fans, para fans.</span><button class="text-button" data-action="clear">Borrar mi progreso</button></footer><dialog id="detail-dialog" class="detail-dialog"></dialog>`;
  if (focusTitle) document.querySelector('#question-title').focus({ preventScroll: true });
}

function renderAnalysis() {
  if (!validateAnswers(answers)) { location.hash = '/test'; return; }
  document.title = 'Encontrando tu personaje — AnataDesu';
  app.innerHTML = `${header(true)}<main class="analysis-screen container" id="main"><div class="analysis-symbol" aria-hidden="true"><span>✳</span><b lang="ja">心</b></div><p class="eyebrow coral">EL MOMENTO DE CONOCERTE</p><h1>TU UNIVERSO<br>ESTÁ POR <span class="outlined">REVELARSE.</span></h1><p role="status">Comparando tus cinco rasgos con ${getCandidateCharacters(preferences).length} personajes de tu selección…</p><div class="analysis-loader" aria-hidden="true"><span></span></div><small>Una interpretación de tus respuestas. Una historia por descubrir.</small></main>`;
  analysisTimer = setTimeout(() => { location.hash = `/resultado/${getResult(answers, preferences).character.id}`; }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 200 : 1900);
}

function renderResult(id) {
  const character = characters.find(item => item.id === id);
  if (!character) { renderNotFound(); return; }
  const computed = personalResult();
  const result = computed?.character.id === id ? computed : null;
  const narrative = result ? getNarrative(result, result.edition === 'v2' ? answers : null) : null;
  const related = result ? result.ranking.slice(1).map(item => item.character) : characters.filter(item => item.id !== id && item.category === character.category).slice(0, 2);
  document.title = `${character.name} — ${result ? 'Tu alma anime' : 'Conoce al personaje'} · AnataDesu`;
  app.innerHTML = `${header(true)}<main id="main"><section class="result-section container" style="--character-color:${character.color}"><div class="result-topline"><a class="quiz-back" href="#/">← Volver al inicio</a><span>${result ? 'TU ARCO DE ORIGEN · COMPLETADO' : 'UN PERSONAJE, MUCHAS HISTORIAS'} <span aria-hidden="true">✦</span></span></div>${result?.edition === 'v1' ? `<div class="edition-notice"><span>✦ TU PRIMERA AVENTURA SIGUE AQUÍ</span><p>Conservamos tu resultado original. La nueva edición tiene ${characters.length} personajes y nuevas escenas para descubrir más de ti.</p><a href="#/universos" class="text-link">Explorar la nueva edición ${arrow}</a></div>` : ''}<div class="result-hero"><div class="result-art"><div class="result-art-orbit"></div><span class="result-japanese" lang="ja">${character.japanese}</span><img src="./images/${id}.jpg" alt="${character.name}, de ${character.anime}" width="225" height="350"><div class="result-art-label"><span>ANATA DESU — VOL. 02</span><b>${character.anime}</b></div><span class="result-art-star" aria-hidden="true">✳</span></div><div class="result-copy"><p class="eyebrow coral">${result ? 'EN OTRO UNIVERSO, TU ALMA SE PARECE A' : 'CONOCE EL UNIVERSO DE'}</p><h1>${character.name}</h1><span class="result-anime">${character.anime}<span>•</span>${character.category}</span><p class="result-tag">“${character.tag}”</p><div class="trait-tags">${character.traits.map(trait => `<span>${trait}</span>`).join('')}</div><p class="result-description">${character.description}</p>${result ? `<div class="affinity"><span class="affinity-value">${result.affinity}<small>%</small></span><div><b>Afinidad del test</b><span>Similitud con nuestro perfil del personaje.<br>Una pista para explorar, no una medida científica.</span></div>${icon('spark')}</div>` : `<div class="shared-note">Este enlace muestra el perfil del personaje. Haz el test para descubrir tu propia afinidad.</div>`}<div class="result-actions">${result ? `<button class="button button-primary" data-action="download" data-id="${id}">${icon('download')} Diseñar mi tarjeta</button>` : `<a class="button button-primary" href="#/universos">Encontrar mi personaje ${arrow}</a>`}<button class="button button-outline" data-action="share" data-id="${id}">${icon('share')} Compartir</button></div>${result ? `<div class="result-followup"><a class="text-link" href="#/duo${pendingFriend ? `?amigo=${encodeURIComponent(pendingFriend)}` : ''}">${pendingFriend ? 'Tu nakama te espera: descubrir el dúo' : 'Descubrir mi dúo con un amigo'} ${arrow}</a><button class="text-button retake" data-action="restart">↻ Volver a hacer el test</button></div><p class="result-scope-note">${scopeLabel(result.preferences)} · ${result.edition === 'v1' ? 'Edición original' : `${getCandidateCharacters(result.preferences).length} personajes comparados`}</p>` : ''}</div></div>
      ${result ? `<div class="result-detail-grid"><section class="personality-panel"><p class="eyebrow coral">EL MAPA DE TU PERSONALIDAD</p><h2>Tus cinco rasgos</h2><p>Intensidad relativa de cada rasgo en tus respuestas.</p><div class="trait-bars">${dimensions.map(dimension => { const trait = result.traits.find(item => item.id === dimension.id); return `<div class="trait-bar-row"><div>${icon(dimension.icon)}<span>${dimension.label}</span><b>${trait.value}<small>/100</small></b></div><div class="trait-bar"><span style="--bar-width:${trait.value}%"></span></div></div>`; }).join('')}</div></section><section class="why-panel"><p class="eyebrow coral">LAS CONEXIONES DE TU HISTORIA</p><h2>¿Por qué este personaje?</h2>${getExplanation(result).map(reason => `<article class="reason">${icon(reason.icon)}<div><h3>${reason.label}</h3><p>${reason.text}</p></div></article>`).join('')}<p class="why-summary">${character.name} refleja esta combinación desde su propia historia. La afinidad se calcula con los cinco rasgos, no con una sola respuesta.</p></section></div>` : ''}
      ${result ? renderNarrative(narrative) : ''}<div class="growth-grid"><article><span class="eyebrow">TU LADO LUMINOSO ${icon('spark')}</span><h2>Lo que te hace brillar</h2><p>${character.strengths}</p></article><article><span class="eyebrow">EL SIGUIENTE CAPÍTULO ${icon('wind')}</span><h2>Un espacio para crecer</h2><p>${character.growth}</p></article></div>
      ${related.length ? `<section class="related-section"><div class="section-heading"><div><p class="eyebrow coral">${result ? 'OTRAS CONEXIONES DE TU UNIVERSO' : 'SIGUE EXPLORANDO'}</p><h2>${result ? 'También hay un poco de ellos en ti.' : 'Otras historias por descubrir.'}</h2></div></div><div class="related-grid">${related.map(characterCard).join('')}</div></section>` : ''}
      <div class="result-disclaimer">${icon('spark')}<p>Somos más que un personaje. Este test es una experiencia de entretenimiento basada en perfiles editoriales. Tu personalidad siempre será más rica que cualquier resultado. <a href="#/metodo">Conoce el método</a>.</p></div></section></main>${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
  requestAnimationFrame(() => document.querySelectorAll('.trait-bar span').forEach(bar => bar.classList.add('filled')));
}

function renderSetup() {
  document.title = 'Elige tus universos — AnataDesu';
  app.innerHTML = `${header(true)}<main id="main" class="setup-page container"><a href="#/" class="quiz-back">← Volver al inicio</a><div class="setup-heading"><div><p class="eyebrow coral">ANTES DEL PRIMER CAPÍTULO · EDICIÓN 02</p><h1>ELIGE DÓNDE<br><span class="outlined">ENCONTRARTE.</span></h1></div><p>${characters.length} personajes. ${universes.length} universos.<br>La misma aventura puede contarse<br>de muchas formas.</p></div><fieldset class="universe-modes"><legend class="sr-only">¿Qué universos quieres incluir en tu resultado?</legend>${[
    ['all','✳','Todo el multiverso','Deja que tu personalidad elija entre todos los personajes.'],
    ['familiar','◎','Mis universos conocidos','El resultado pertenecerá a una de las series que marques.'],
    ['discovery','↗','Sorpréndeme con un anime nuevo','Marca lo que ya viste. Buscaremos tu personaje fuera de esos universos.'],
  ].map(([mode, symbol, title, description]) => `<label class="universe-mode ${draftPreferences.mode === mode ? 'selected' : ''}"><input type="radio" name="universe-mode" value="${mode}" ${draftPreferences.mode === mode ? 'checked' : ''}><span class="mode-symbol">${symbol}</span><h2>${title}</h2><p>${description}</p><span class="mode-check">${icon('check')}</span></label>`).join('')}</fieldset><section id="universe-picker" ${draftPreferences.mode === 'all' ? 'hidden' : ''}><div class="picker-heading"><div><p class="eyebrow coral">TU MAPA DE UNIVERSOS</p><h2>¿Cuáles de estos animes conoces?</h2></div><div><button class="text-button" data-action="select-all-universes">Marcar todos</button><button class="text-button" data-action="clear-universes">Quitar selección</button></div></div><div class="universe-grid">${universes.map(universe => `<label class="universe-option"><input type="checkbox" name="universe" value="${universe.id}" ${draftPreferences.seriesIds.includes(universe.id) ? 'checked' : ''}><img src="./images/${universe.cover}.jpg" alt="" width="45" height="60" loading="lazy"><span><b>${universe.name}</b><small>${universe.count} ${universe.count === 1 ? 'personaje' : 'personajes'}</small></span><span class="universe-tick">${icon('check')}</span></label>`).join('')}</div></section><div class="setup-bottom"><div><p id="scope-count" role="status" aria-live="polite"></p><span>${answers.some(answer => answer !== null) ? 'Tus respuestas de esta edición se mantienen al cambiar los universos.' : '12 escenas · unos 3 minutos · sin registro'}</span></div><button class="button button-primary button-large" data-action="start-test">${validateAnswers(answers) ? 'Aplicar y ver resultado' : answers.some(answer => answer !== null) ? 'Aplicar y continuar' : 'Comenzar mi aventura'} ${arrow}</button></div>${archive && !validateAnswers(answers) ? '<p class="archive-note">Tu resultado de la primera edición sigue guardado hasta que termines una nueva aventura.</p>' : ''}</main>${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
  updateSetup();
}

function updateSetup() {
  const valid = validatePreferences(draftPreferences);
  document.querySelectorAll('.universe-mode').forEach(label => label.classList.toggle('selected', label.querySelector('input').value === draftPreferences.mode));
  document.querySelector('#universe-picker').hidden = draftPreferences.mode === 'all';
  document.querySelector('[data-action="start-test"]').disabled = !valid;
  const count = document.querySelector('#scope-count');
  count.textContent = valid ? `${getCandidateCharacters(draftPreferences).length} personajes pueden encontrarte en esta aventura.` : draftPreferences.mode === 'discovery' && draftPreferences.seriesIds.length === universes.length ? 'Deja al menos un universo sin marcar para poder descubrirlo.' : 'Marca al menos un universo para continuar.';
  document.querySelectorAll('input[name="universe"]').forEach(input => { input.checked = draftPreferences.seriesIds.includes(input.value); });
}

function renderNarrative(narrative) {
  return `<section class="narrative-section"><div class="section-heading"><div><p class="eyebrow coral">MÁS ALLÁ DEL NOMBRE</p><h2>Tu forma de vivir la historia.</h2></div></div><div class="narrative-grid">${narrative.aspects.map(aspect => `<article><span class="eyebrow">${aspect.label} ${icon(aspect.icon)}</span><h3>${aspect.title}</h3><p>${aspect.text}</p></article>`).join('')}</div>${narrative.evidence.length ? `<div class="evidence-panel"><span class="evidence-star" aria-hidden="true">✳</span><div><p class="eyebrow coral">DECISIONES QUE TE TRAJERON AQUÍ</p>${narrative.evidence.map(evidence => `<article><span>${evidence.chapter} · ${evidence.trait}</span><p>${evidence.text}</p></article>`).join('')}</div></div>` : ''}</section>`;
}

function duoPerson(person, label, className) {
  return `<article class="duo-person ${className}" style="--character-color:${person.character.color}"><div><img src="./images/${person.character.id}.jpg" alt="${person.character.name}" width="225" height="350"><span>${label}</span></div><small>${person.character.anime}</small><h2>${person.character.name}</h2></article>`;
}

function renderDuo(hash = '/duo') {
  document.title = 'Modo dúo — AnataDesu';
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const raw = params.has('amigo') ? params.get('amigo') : pendingFriend || '';
  const friend = parseFriendCode(raw);
  if (friend && pendingFriend !== friend.code) { pendingFriend = friend.code; save(); }
  const result = personalResult();
  const own = result ? parseFriendCode(createFriendCode(result)) : null;
  const comparison = own && friend ? compareProfiles(own, friend) : null;
  app.innerHTML = `${header(true)}<main class="duo-page container" id="main"><a href="#/" class="quiz-back">← Volver al inicio</a><div class="duo-heading"><p class="eyebrow coral">DOS HISTORIAS. UN NUEVO CAPÍTULO.</p><h1>${comparison ? 'SU DÚO TIENE<br><span class="outlined">SU PROPIO RITMO.</span>' : '¿QUÉ DÚO<br><span class="outlined">FORMARÍAN?</span>'}</h1><p>Aliados, rivales o compañeros de aventuras.<br>Comparen sus resultados y descubran lo que aporta cada uno.</p></div>${comparison ? `<section class="duo-reveal" aria-labelledby="duo-title"><div class="duo-lineup">${duoPerson(comparison.a, 'TU PERSONAJE', 'duo-you')}<div class="duo-connection"><span>✦</span><b>${comparison.affinity}<small>%</small></b><p>Afinidad de estilo</p></div>${duoPerson(comparison.b, 'TU NAKAMA', 'duo-friend')}</div><div class="duo-story"><p class="eyebrow coral">${{ companions:'COMPAÑEROS', allies:'ALIADOS', rivals:'RIVALES', adventurers:'AVENTUREROS' }[comparison.type]}</p><h2 id="duo-title">${comparison.title}</h2><p>${comparison.description}</p></div><div class="duo-insights"><article><span class="eyebrow">SU PUNTO DE ENCUENTRO</span><h3>${comparison.common.label}</h3><p>Es el rasgo con mayor presencia media en sus dos perfiles. Puede convertirse en un lenguaje compartido para iniciar algo juntos.</p></article><article><span class="eyebrow">SU DIFERENCIA MÁS GRANDE</span><h3>${comparison.difference.gap === 0 ? 'Un ritmo muy parecido' : comparison.difference.label}</h3><p>${comparison.difference.gap === 0 ? 'Sus puntuaciones son iguales en los cinco rasgos. También pueden buscar variedad en sus gustos, experiencias e ideas.' : `En ${comparison.difference.label.toLowerCase()}, ${comparison.difference.a > comparison.difference.b ? 'tu puntuación es mayor' : 'la puntuación de tu nakama es mayor'}. Hablar de cómo se expresa en cada uno puede convertir una diferencia en un recurso.`}</p></article></div><section class="duo-traits"><div class="duo-legend"><span><i></i>Tú</span><span><i></i>Tu nakama</span></div>${comparison.traits.map(trait => `<div class="duo-trait"><span>${icon(trait.icon)} ${trait.label}</span><div><div><b style="width:${trait.a}%"></b><small>${trait.a}</small></div><div><b style="width:${trait.b}%"></b><small>${trait.b}</small></div></div></div>`).join('')}</section><p class="duo-disclaimer">La afinidad compara cinco puntuaciones del juego. No predice la calidad de una amistad ni mide compatibilidad romántica. Las diferencias también pueden enriquecer un vínculo.</p></section>` : friend ? `<div class="friend-arrived"><img src="./images/${friend.character.id}.jpg" alt="${friend.character.name}" width="70" height="90"><div><p class="eyebrow coral">TU NAKAMA YA ESTÁ AQUÍ</p><h2>${friend.character.name}</h2><p>Su perfil está listo. Completa tu test para descubrir el dúo.</p><a class="button button-primary" href="#/universos">Descubrir mi personaje ${arrow}</a></div></div>` : ''}<div class="duo-tools"><section class="duo-invite"><p class="eyebrow coral">01 / INVITA A TU NAKAMA</p><h2>Tu parte de la historia.</h2>${own ? `<p>Este código comparte <strong>tu personaje y tus cinco puntuaciones resumidas</strong>. Tus respuestas se quedan en tu navegador.</p><label class="sr-only" for="own-code">Tu código de modo dúo</label><input id="own-code" readonly value="${own.code}"><div class="duo-buttons"><button class="button button-primary" data-action="copy-friend-code">Copiar mi código ${icon('share')}</button><button class="button button-outline" data-action="copy-invite">Copiar invitación ${arrow}</button></div><small>La invitación conserva tu perfil mientras la otra persona hace su test.</small>` : `<p>Primero encuentra tu personaje. Después tendrás un código para compartir con tus amigos.</p><a class="button button-primary" href="#/universos">Hacer mi test ${arrow}</a>`}</section><section class="duo-import"><p class="eyebrow coral">02 / CONECTEN SUS UNIVERSOS</p><h2>Pega su código o invitación.</h2><p>Pide a tu amigo el código de su resultado. Comparamos los perfiles aquí mismo, sin cuentas.</p><form id="duo-form"><label class="sr-only" for="friend-code">Código o enlace de tu nakama</label><textarea id="friend-code" name="friend-code" rows="3" maxlength="1200" placeholder="AD2.personaje.… o un enlace de invitación" aria-describedby="friend-error">${escape(raw)}</textarea><p id="friend-error" class="field-error" role="alert" ${raw && !friend ? '' : 'hidden'}>${raw && !friend ? 'El código no es válido. Revisa que esté completo y pide a tu amigo que lo copie de nuevo.' : ''}</p><button class="button button-primary" type="submit">${own ? 'Descubrir nuestro dúo' : 'Guardar el código y hacer mi test'} ${arrow}</button>${friend ? '<button class="text-button" type="button" data-action="forget-friend">Quitar este código</button>' : ''}</form></section></div><div class="duo-privacy">${icon('lock')}<p>Los códigos se interpretan en el navegador y pueden guardarse localmente para continuar. El código tiene una comprobación de errores de copia, pero no verifica la identidad de nadie. <a href="#/metodo">Conoce el método</a>.</p></div></main>${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
}

async function copyDuo(invitation = false) {
  const result = personalResult();
  if (!result) return;
  const code = createFriendCode(result);
  const value = invitation ? `${location.href.split('#')[0]}#/duo?amigo=${encodeURIComponent(code)}` : code;
  try { await navigator.clipboard.writeText(value); toast(invitation ? '¡Invitación copiada! Incluye tu personaje y cinco puntuaciones.' : '¡Código copiado! Ya pueden conectar sus universos.'); }
  catch { showDialog(`<div class="info-dialog"><p class="eyebrow coral">TU INVITACIÓN ESTÁ LISTA</p><h2>Copia y comparte con tu nakama.</h2><p>Incluye tu personaje y cinco puntuaciones resumidas. Tus respuestas se quedan aquí.</p><input class="share-url" id="share-url" readonly aria-label="Código o invitación para compartir" value="${escape(value)}"><button class="button button-primary" data-action="select-share">Seleccionar para copiar</button></div>`); }
}

function cardPreview(result) {
  const character = result.character;
  return `<div id="studio-preview" class="studio-preview ${studio.format} ${studio.style}" style="--character-color:${character.color}"><span class="preview-brand">ANATA DESU / TU HISTORIA</span><div class="preview-photo"><img src="./images/${character.id}.jpg" alt="Vista previa de tarjeta de ${character.name}" width="225" height="350">${studio.style === 'universe' ? `<span class="preview-stamp">UNIVERSO / ${character.anime}</span>` : ''}</div><div class="preview-copy"><span>EN OTRO UNIVERSO, MI ALMA SE PARECE A</span><h3>${character.name}</h3><b>${character.anime}</b><p>${character.tag}</p>${studio.format === 'story' ? `<small>MIS RASGOS MÁS PRESENTES</small><strong>${result.traits.slice(0, 2).map(trait => trait.label).join(' / ')}</strong>` : ''}</div><div class="preview-footer">AnataDesu <span>✳</span></div></div>`;
}

function showCardStudio(id) {
  const result = personalResult();
  if (result?.character.id !== id) return;
  showDialog(`<div class="card-studio"><div class="studio-canvas">${cardPreview(result)}</div><div class="studio-settings"><p class="eyebrow coral">TU TARJETA, TU ESTILO</p><h2>Lista para otro universo.</h2><p>Comparte tu personaje. En formato historia también se incluyen tus dos rasgos más presentes.</p><fieldset><legend>FORMATO</legend>${Object.entries(cardFormats).map(([key, value]) => `<label><input type="radio" name="card-format" value="${key}" ${studio.format === key ? 'checked' : ''}>${value.label}</label>`).join('')}</fieldset><fieldset><legend>ESTILO</legend>${Object.entries(cardStyles).map(([key, name]) => `<label><input type="radio" name="card-style" value="${key}" ${studio.style === key ? 'checked' : ''}>${name}${key === 'universe' ? ` · ${result.character.anime}` : ''}</label>`).join('')}</fieldset><button class="button button-primary" data-action="export-card" data-id="${id}">${icon('download')} Descargar PNG</button><small>La composición final se adapta al formato que elijas.</small></div></div>`, 'studio-dialog');
}

function renderMethod() {
  document.title = 'Cómo funciona la afinidad — AnataDesu';
  app.innerHTML = `${header(true)}<main class="method-page container" id="main"><a href="#/" class="quiz-back">← Volver al inicio</a><p class="eyebrow coral">TRANSPARENCIA ANTES QUE MAGIA</p><h1>Así conectamos<br>tu historia.</h1><p class="method-lead">Un método sencillo y visible para una experiencia de entretenimiento.</p><div class="method-content"><h2>1. Cinco rasgos, doce preguntas</h2><p>Cada opción asigna entre 1 y 5 puntos a valentía, empatía, estrategia, libertad y determinación. Todas las preguntas tienen el mismo peso. Calculamos el promedio de cada rasgo con tus 12 respuestas.</p><h2>2. Una interpretación de los personajes</h2><p>Los ${characters.length} personajes tienen un perfil editorial en los mismos cinco rasgos, calibrado sobre puntuaciones alcanzables con las escenas. Son interpretaciones creativas de fans, no valoraciones oficiales ni perfiles psicológicos validados.</p><h2>3. El personaje más cercano</h2><p>Medimos la raíz de la distancia cuadrática media entre tu perfil y cada personaje dentro de los universos elegidos. Gana la menor distancia. Si hay un empate exacto, usamos el identificador del personaje en orden alfabético para que el resultado sea reproducible.</p><h2>4. ¿Qué significa el porcentaje?</h2><p>La afinidad es 100 × (1 − distancia / 4), redondeada al entero más cercano. El 4 es la mayor distancia posible en una escala de 1 a 5. Es un índice de similitud de este juego, no una probabilidad, una precisión ni una medida clínica.</p><h2>5. Universos y modo descubrimiento</h2><p>Todos los modos usan las mismas preguntas. “Mis universos conocidos” compara únicamente personajes de las series que marques. “Sorpréndeme” excluye esas series para que conozcas otra historia. La elección del universo cambia los candidatos, no tus puntuaciones.</p><h2>6. Afinidad de un dúo</h2><p>Cada código contiene la edición, el personaje, cinco puntuaciones entre 20 y 100 y una comprobación de errores de copia. La afinidad de estilo es 100 × (1 − raíz del promedio de diferencias al cuadrado / 80), redondeada. La descripción considera semejanzas y diferencias; no predice la calidad de una relación. Los códigos no verifican identidades.</p><h2>7. Tu privacidad</h2><p>El cálculo se hace en tu navegador. Las respuestas se guardan en el almacenamiento local del dispositivo para que puedas continuar. El enlace de resultado solo incluye el identificador del personaje. El modo dúo comparte, por decisión tuya, un código con tu personaje y cinco puntuaciones resumidas, sin respuestas. No hay cuentas, analítica ni envío de respuestas. Las fuentes tipográficas pueden cargarse desde Google Fonts; las imágenes de personajes están incluidas en el sitio.</p><p>Puedes borrar tus respuestas en cualquier momento.</p><button class="button button-outline" data-action="clear">Borrar mi progreso</button><a class="button button-primary" href="#/universos">Hacer el test ${arrow}</a></div></main>${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
}

function renderNotFound() {
  document.title = 'Un universo por descubrir — AnataDesu';
  app.innerHTML = `${header(true)}<main id="main" class="not-found container"><p class="eyebrow coral">ESTE EPISODIO NO EXISTE</p><h1>¿NOS PERDIMOS<br>DE <span class="outlined">UNIVERSO?</span></h1><p>No encontramos ese personaje o esa página.</p><a class="button button-primary" href="#/">Volver al inicio ${arrow}</a></main>${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
}

function setupReveals() {
  observer?.disconnect();
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => { element.classList.add('will-reveal'); observer.observe(element); });
}

function route() {
  clearTimeout(analysisTimer);
  document.querySelector('dialog[open]')?.close();
  document.body.classList.remove('dialog-open');
  const hash = location.hash.slice(1) || '/';
  if (!hash.startsWith('/')) {
    if (!document.querySelector('.hero')) renderHome();
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
    document.querySelector('.mobile-nav')?.setAttribute('hidden', '');
    document.querySelector('[data-action="menu"]')?.setAttribute('aria-expanded', 'false');
    document.querySelector('[data-action="menu"]')?.setAttribute('aria-label', 'Abrir menú');
    return;
  }
  observer?.disconnect();
  if (hash === '/') renderHome();
  else if (hash === '/destino') destiny.render();
  else if (hash === '/universos') { draftPreferences = structuredClone(preferences); renderSetup(); }
  else if (hash === '/test') { if (!configured) { location.replace('#/universos'); return; } renderQuiz(); }
  else if (hash === '/duo' || hash.startsWith('/duo?')) renderDuo(hash);
  else if (hash === '/revelando') renderAnalysis();
  else if (hash.startsWith('/resultado/')) renderResult(hash.split('/')[2]);
  else if (hash === '/metodo') renderMethod();
  else renderNotFound();
  window.scrollTo({ top: 0, behavior: 'instant' });
  requestAnimationFrame(() => { const heading = document.querySelector('main h1'); if (heading && hash !== '/') { heading.tabIndex = -1; heading.focus({ preventScroll: true }); } });
}

function showDialog(content, className = '') {
  const dialog = document.querySelector('#detail-dialog');
  const alreadyOpen = dialog.open;
  if (!alreadyOpen) returnFocus = document.activeElement;
  dialog.className = `detail-dialog ${className}`;
  dialog.innerHTML = `<button class="dialog-close icon-button" data-action="close-dialog" aria-label="Cerrar ventana">${icon('close')}</button>${content}`;
  dialog.setAttribute('aria-label', dialog.querySelector('h2')?.textContent || 'Detalles');
  if (alreadyOpen) { dialog.querySelector('button')?.focus(); return; }
  dialog.showModal();
  document.body.classList.add('dialog-open');
  dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (returnFocus?.isConnected) returnFocus.focus(); }, { once: true });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
}

function showCharacter(id) {
  const character = characters.find(item => item.id === id);
  if (!character) return;
  showDialog(`<div class="character-dialog" style="--character-color:${character.color}"><div class="dialog-art"><img src="./images/${id}.jpg" alt="${character.name}" width="225" height="350"><span lang="ja">${character.japanese}</span></div><div class="dialog-copy"><p class="eyebrow coral">${character.anime}</p><h2>${character.name}</h2><p class="dialog-tag">${character.tag}</p><div class="trait-tags">${character.traits.map(trait => `<span>${trait}</span>`).join('')}</div><p>${character.description}</p><a class="button button-primary" href="#/universos" data-action="close-dialog">¿Compartimos esencia? ${arrow}</a><a class="text-link" href="#/resultado/${id}" data-action="close-dialog">Ver su perfil ${arrow}</a></div></div>`);
}

async function share(id) {
  const character = characters.find(item => item.id === id);
  const url = `${location.href.split('#')[0]}#/resultado/${id}`;
  const text = `Mi alma anime se parece a ${character.name}. ¿Cuál es la tuya? Descúbrelo en AnataDesu.`;
  try {
    if (navigator.share) { await navigator.share({ title: 'Mi alma anime — AnataDesu', text, url }); return; }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    toast('¡Enlace copiado! Compártelo con tu nakama.');
  } catch (error) {
    if (error.name === 'AbortError') return;
    showDialog(`<div class="info-dialog"><p class="eyebrow coral">COMPARTE TU UNIVERSO</p><h2>Tu personaje, en un enlace.</h2><p>Copia este enlace. Tus respuestas personales se quedan en tu navegador.</p><label class="sr-only" for="share-url">Enlace del personaje</label><input id="share-url" class="share-url" readonly value="${escape(url)}"><button class="button button-primary" data-action="select-share">Seleccionar enlace</button></div>`);
  }
}

async function downloadCard(id, button) {
  const character = characters.find(item => item.id === id);
  if (!character || button.disabled) return;
  button.disabled = true;
  const old = button.innerHTML;
  button.textContent = 'Preparando tarjeta…';
  try {
    const result = personalResult();
    if (result?.character.id !== id) throw new Error('Falta el resultado personal');
    const blob = await createCardBlob(result, studio);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `AnataDesu-${id}-${studio.format}-${studio.style}.png`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast('¡Tarjeta lista! Ya puedes compartir tu universo.');
  } catch { toast('No pudimos descargar la tarjeta. Puedes compartir el enlace del personaje.'); }
  finally { button.disabled = false; button.innerHTML = old; }
}

app.addEventListener('change', event => {
  if (event.target.name === 'universe-mode') { draftPreferences.mode = event.target.value; updateSetup(); return; }
  if (event.target.name === 'universe') { draftPreferences.seriesIds = [...document.querySelectorAll('input[name="universe"]:checked')].map(input => input.value); updateSetup(); return; }
  if (event.target.name === 'card-format' || event.target.name === 'card-style') { studio[event.target.name === 'card-format' ? 'format' : 'style'] = event.target.value; const result = personalResult(); if (result) document.querySelector('#studio-preview').outerHTML = cardPreview(result); return; }
  if (!event.target.matches('input[name="answer"]')) return;
  answers[current] = Number(event.target.value);
  save();
  document.querySelectorAll('.answer').forEach((label, index) => {
    const selected = index === answers[current]; label.classList.toggle('selected', selected); label.querySelector('.answer-check').innerHTML = selected ? icon('check') : '';
  });
  document.querySelector('[data-action="next"]').disabled = false;
  const count = answers.filter(answer => answer !== null).length;
  const progress = document.querySelector('.progress-track'); progress.setAttribute('aria-valuenow', String(count)); progress.firstElementChild.style.width = `${count / 12 * 100}%`;
  document.querySelector('.progress-label > span:last-child').textContent = `${count} de 12 respondidas`;
});

app.addEventListener('click', event => {
  const character = event.target.closest('[data-character]');
  if (character) { showCharacter(character.dataset.character); return; }
  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) { filter = filterButton.dataset.filter; renderGallery(); return; }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'start-test' && validatePreferences(draftPreferences)) { preferences = structuredClone(draftPreferences); configured = true; save(); location.hash = validateAnswers(answers) ? '/resultado/' + getResult(answers, preferences).character.id : '/test'; }
  if (action === 'select-all-universes') { draftPreferences.seriesIds = universes.map(universe => universe.id); updateSetup(); }
  if (action === 'clear-universes') { draftPreferences.seriesIds = []; updateSetup(); }
  if (action === 'reset-gallery') { filter = 'Todos'; galleryQuery = ''; document.querySelector('#catalog-query').value = ''; renderGallery(); }
  if (action === 'copy-friend-code') copyDuo(false);
  if (action === 'copy-invite') copyDuo(true);
  if (action === 'forget-friend') { pendingFriend = null; save(); if (location.hash === '#/duo') renderDuo(); else location.hash = '/duo'; }
  if (action === 'more') { expanded = !expanded; renderGallery(); }
  if (action === 'menu') { const nav = document.querySelector('.mobile-nav'); nav.hidden = !nav.hidden; button.setAttribute('aria-expanded', String(!nav.hidden)); button.setAttribute('aria-label', nav.hidden ? 'Abrir menú' : 'Cerrar menú'); }
  if (action === 'next' && answers[current] !== null) {
    if (current === questions.length - 1) {
      const missing = answers.findIndex(answer => answer === null);
      if (missing !== -1) { current = missing; save(); renderQuiz(true); toast('Falta responder esta pregunta para conocer tu resultado.'); }
      else { archive = null; save(); location.hash = '/revelando'; }
    } else { current++; save(); renderQuiz(true); window.scrollTo({ top: 0, behavior: 'instant' }); }
  }
  if (action === 'previous' && current > 0) { current--; save(); renderQuiz(true); }
  if (action === 'restart' || action === 'clear') {
    showDialog(`<div class="info-dialog"><p class="eyebrow coral">UN NUEVO PRIMER CAPÍTULO</p><h2>${action === 'restart' ? '¿Comenzamos otra vez?' : '¿Borrar tu progreso?'}</h2><p>${action === 'restart' ? 'Se borrarán las respuestas y el resultado del test. Tu aventura de Elige tu destino se conserva.' : 'Se borrarán el test, su resultado y tu aventura de Elige tu destino en este navegador.'}</p><div class="dialog-buttons"><button class="button button-outline" data-action="close-dialog">Conservar mis respuestas</button><button class="button button-primary" data-action="confirm-clear" data-restart="${action === 'restart'}">${action === 'restart' ? 'Empezar de nuevo' : 'Borrar mis respuestas'}</button></div></div>`);
  }
  if (action === 'confirm-clear') {
    if (button.dataset.restart !== 'true') destiny.clear();
    answers = emptyAnswers(); current = 0; archive = null; pendingFriend = null; configured = false; preferences = defaultPreferences();
    try { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY); } catch { /* La memoria de la pestaña ya está limpia. */ }
    document.querySelector('#detail-dialog').close();
    if (button.dataset.restart === 'true') { location.hash = '/universos'; }
    else { if (location.hash === '#/test') location.hash = '/universos'; else route(); toast('Tus respuestas y los códigos guardados se han borrado.'); }
  }
  if (action === 'close-dialog') document.querySelector('#detail-dialog').close();
  if (action === 'share') share(button.dataset.id);
  if (action === 'download') showCardStudio(button.dataset.id);
  if (action === 'export-card') downloadCard(button.dataset.id, button);
  if (action === 'select-share') { document.querySelector('#share-url').focus(); document.querySelector('#share-url').select(); }
  if (action === 'privacy') showDialog(`<div class="info-dialog"><p class="eyebrow coral">TU HISTORIA ES TUYA</p><h2>Privacidad, sin enredos.</h2><p>Tus respuestas y tu progreso se guardan en el almacenamiento local de este navegador. El minijuego Elige tu destino guarda por separado el mundo y las decisiones de tu aventura, también solo en tu dispositivo. Si copias tu historia, compartirás el desenlace y el listado de elecciones. El resultado se calcula en tu dispositivo y no se envía a ningún servidor.</p><p>No usamos cuentas ni herramientas de analítica. Las fuentes pueden conectarse con Google Fonts; el proveedor de alojamiento puede registrar solicitudes técnicas. Las imágenes se sirven desde este mismo sitio.</p><p>El enlace de resultado comparte solo el personaje. Los códigos e invitaciones de modo dúo incluyen además cinco puntuaciones resumidas. Las tarjetas verticales muestran tu personaje y tus dos rasgos más presentes. Tus respuestas no se incluyen.</p><button class="button button-outline" data-action="clear">Borrar mi progreso</button></div>`);
  if (action === 'credits') showDialog(`<div class="info-dialog"><p class="eyebrow coral">DE FANS PARA FANS</p><h2>El talento detrás de estos universos.</h2><p>AnataDesu es un proyecto de fans sin afiliación oficial con las series. Los personajes, imágenes y marcas pertenecen a sus respectivos autores y titulares. Las imágenes se obtuvieron de MyAnimeList.</p><p>Las descripciones y los perfiles de afinidad son interpretaciones editoriales creadas para esta experiencia.</p><a class="text-link" href="./asset-credits.json" target="_blank" rel="noopener">Ver fuentes de cada imagen ↗</a><a class="text-link" href="https://github.com/bastian-alvarez/AnataDesu" target="_blank" rel="noopener">Código y comunidad en GitHub ↗</a></div>`);
});

app.addEventListener('input', event => { if (event.target.id === 'catalog-query') { galleryQuery = event.target.value.trim(); renderGallery(); } });
app.addEventListener('submit', event => {
  if (event.target.id !== 'duo-form') return;
  event.preventDefault();
  const input = document.querySelector('#friend-code');
  const parsed = parseFriendCode(input.value);
  if (!parsed) { const error = document.querySelector('#friend-error'); error.hidden = false; error.textContent = 'El código no es válido. Copia el código completo o pega la invitación de tu nakama.'; input.setAttribute('aria-invalid','true'); input.focus(); return; }
  pendingFriend = parsed.code; save();
  if (!personalResult()) { location.hash = '/universos'; return; }
  const next = '/duo?amigo=' + encodeURIComponent(parsed.code);
  if (location.hash === '#' + next) { renderDuo(next); window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector('main h1').setAttribute('tabindex','-1'); document.querySelector('main h1').focus({preventScroll:true}); }
  else location.hash = next;
});

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || location.hash !== '#/test') return;
  if (/^[1-4]$/.test(event.key) && !event.target.matches('input:not([type="radio"]), textarea, [contenteditable="true"]')) {
    const radio = document.querySelector(`input[name="answer"][value="${Number(event.key) - 1}"]`);
    radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); radio.focus();
  }
});
window.addEventListener('hashchange', route);
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector('main');
  if (main) { main.tabIndex = -1; main.focus(); main.scrollIntoView(); }
});
const destiny = createDestiny({ app, header, footer, showDialog, toast });
route();
