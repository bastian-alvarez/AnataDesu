import { characters, questions, dimensions } from './data.js';
import { getResult, getExplanation, validateAnswers } from './engine.js';

const app = document.querySelector('#app');
const KEY = 'anata-desu:v1';
const emptyAnswers = () => Array(questions.length).fill(null);
let answers = emptyAnswers();
let current = 0;
let filter = 'Todos';
let expanded = false;
let analysisTimer;
let toastTimer;
let observer;
let returnFocus;
let storageAvailable = true;

try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved?.version === 1 && validateAnswers(saved.answers, { partial: true })) {
    answers = saved.answers;
    current = Number.isInteger(saved.current) ? Math.min(questions.length - 1, Math.max(0, saved.current)) : 0;
  }
} catch { storageAvailable = false; }

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
  try { localStorage.setItem(KEY, JSON.stringify({ version: 1, answers, current })); }
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
  const complete = validateAnswers(answers);
  const testHref = complete ? `#/resultado/${getResult(answers).character.id}` : '#/test';
  return `<header class="header"><div class="container nav-inner">${brand}${simple ? '<a class="exit-link" href="#/">Guardar y salir <span aria-hidden="true">↗</span></a>' : `<nav class="desktop-nav" aria-label="Navegación principal"><a href="#personajes">Los personajes</a><a href="#como-funciona">Cómo funciona</a><a href="#preguntas">Preguntas frecuentes</a></nav><div class="nav-actions"><span class="nav-jp" lang="ja">君は誰？</span><a class="button button-small button-cream" href="${testHref}">${complete ? 'Mi resultado' : 'Hacer el test'} ${arrow}</a><button class="menu-toggle icon-button" data-action="menu" aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button></div><nav class="mobile-nav" aria-label="Navegación móvil" hidden><a href="#personajes">Los personajes</a><a href="#como-funciona">Cómo funciona</a><a href="#preguntas">Preguntas frecuentes</a></nav>`}</div></header>`;
}

function footer() {
  return `<footer class="footer"><div class="container footer-top">${brand}<p>Tu personalidad tiene su propio universo.</p><a href="https://github.com/bastian-alvarez/AnataDesu" target="_blank" rel="noopener noreferrer">Hecho para la comunidad ↗</a></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} AnataDesu · Un proyecto de fans para fans.</span><div><button class="text-button" data-action="privacy">Privacidad</button><button class="text-button" data-action="credits">Créditos</button><span lang="ja">またね！</span></div></div></footer>`;
}

function characterCard(character, index = 0) {
  return `<button class="character-card" data-character="${character.id}" style="--character-color:${character.color};--order:${index % 4}" aria-label="Conocer a ${character.name}, ${character.anime}"><div class="card-art"><img src="./images/${character.id}.jpg" alt="${character.name}" loading="lazy" width="225" height="350"><span class="card-index">${String(characters.indexOf(character) + 1).padStart(2, '0')}</span><span class="card-japanese" lang="ja">${character.japanese}</span><span class="card-arrow">${arrow}</span></div><div class="card-caption"><small>${character.anime}</small><h3>${character.name}</h3><span>${character.traits.slice(0, 2).join(' · ')}</span></div></button>`;
}

function renderGallery() {
  const filtered = characters.filter(character => filter === 'Todos' || character.category === filter);
  const visible = expanded || filter !== 'Todos' ? filtered : filtered.slice(0, 8);
  const grid = document.querySelector('#character-grid');
  if (!grid) return;
  grid.innerHTML = visible.map(characterCard).join('');
  document.querySelectorAll('[data-filter]').forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const more = document.querySelector('#show-more');
  more.hidden = filter !== 'Todos';
  more.innerHTML = `${expanded ? 'Ver menos personajes' : 'Explorar los 16 personajes'} <span aria-hidden="true">${expanded ? '−' : '+'}</span>`;
}

function renderHome() {
  document.title = 'AnataDesu — Descubre tu alma anime';
  const hasProgress = answers.some(answer => answer !== null) && answers.some(answer => answer === null);
  const completed = validateAnswers(answers);
  app.innerHTML = `${header()}<main id="main">
    <section class="hero container" aria-labelledby="hero-title">
      <div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> EL PROTAGONISTA ERES TÚ <span class="eyebrow-line"></span></div>
        <h1 id="hero-title">DESCUBRE<br>TU <span class="outlined">ALMA</span><br><span class="coral-word">ANIME<span class="title-star">✳</span></span></h1>
        <p class="hero-description">Hay un poco de otro universo en ti.<br>Descubre qué personaje de anime comparte<br class="desktop-only"> tu forma de sentir, pensar y vivir.</p>
        <a class="button button-primary button-large" href="${completed ? `#/resultado/${getResult(answers).character.id}` : '#/test'}">${completed ? 'Volver a mi resultado' : hasProgress ? 'Continuar mi aventura' : 'Encontrar mi personaje'} ${arrow}</a>
        <div class="hero-facts"><span>${icon('clock')} Unos 3 minutos</span><span><span class="small-dot"></span> Sin registro. Solo tú.</span></div>
      </div>
      <div class="hero-art" aria-label="Personajes de Naruto, One Piece y Jujutsu Kaisen">
        <span class="hero-japanese" lang="ja" aria-hidden="true">自分を<br>見つけろ。</span><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="art-cross cross-one">+</span><span class="art-cross cross-two">+</span>
        <div class="hero-panel panel-gojo"><img src="./images/gojo.jpg" alt="Satoru Gojo de Jujutsu Kaisen" width="225" height="350"><div class="panel-shade"></div><span class="panel-series">JUJUTSU KAISEN</span><span class="panel-name">GOJO</span></div>
        <div class="hero-panel panel-luffy"><img src="./images/luffy.jpg" alt="Monkey D. Luffy de One Piece" width="225" height="350"><div class="panel-shade"></div><span class="panel-series">ONE PIECE</span><span class="panel-name">LUFFY</span></div>
        <div class="hero-panel panel-naruto"><img src="./images/naruto.jpg" alt="Naruto Uzumaki" width="225" height="350" fetchpriority="high"><div class="panel-shade"></div><span class="panel-series">NARUTO SHIPPUDEN</span><span class="panel-name">NARUTO</span></div>
        <div class="anime-sticker"><span>¿Y SI ERES<br>UNO DE ELLOS?</span><svg viewBox="0 0 90 36" fill="none" aria-hidden="true"><path d="M2 4C40 1 17 34 80 24m-8-10 10 10-12 8" stroke="currentColor" stroke-width="2"/></svg></div>
        <div class="hero-label"><span class="label-symbol">✦</span><div>Distintos universos.<br><strong>Una misma esencia.</strong></div></div><span class="art-caption">PERSONALITY MEETS ANIME / VOL. 01</span>
      </div>
      <a class="scroll-cue" href="#personajes"><span>EXPLORA TU UNIVERSO</span><span aria-hidden="true">↓</span></a>
    </section>
    <div class="anime-ticker" aria-label="Universos de anime incluidos"><div class="ticker-track">${Array.from({ length: 2 }, (_, index) => `<span class="ticker-group" ${index ? 'aria-hidden="true"' : ''}>${['NARUTO', 'ONE PIECE', 'JUJUTSU KAISEN', 'DEMON SLAYER', 'ATTACK ON TITAN', 'HUNTER × HUNTER', 'DEATH NOTE'].map(name => `<span>${name}</span><span class="ticker-star">✳</span>`).join('')}</span>`).join('')}</div></div>
    <section class="character-section container section-space" id="personajes" aria-labelledby="characters-title"><div class="section-heading reveal"><div><p class="eyebrow coral">EL MULTIVERSO TE ESPERA</p><h2 id="characters-title">Diferentes historias.<br><span class="muted-heading">¿Cuál se parece a la tuya?</span></h2></div><p>El valor de Naruto. La libertad de Luffy.<br>La sensibilidad de Violet. Descubre<br>con quién compartes tu esencia.</p></div>
      <div class="gallery-toolbar"><div class="filters" role="group" aria-label="Filtrar personajes por género">${['Todos', 'Shōnen', 'Acción', 'Fantasía', 'Misterio', 'Deportes', 'Comedia'].map((name, index) => `<button class="filter ${index === 0 ? 'active' : ''}" data-filter="${name}" aria-pressed="${index === 0}">${name}</button>`).join('')}</div><span class="catalog-label">16 PERSONAJES <span>↙</span></span></div>
      <div class="character-grid" id="character-grid"></div><div class="gallery-bottom"><span>Tal vez tu favorito. Tal vez alguien que no esperabas.</span><button id="show-more" class="button button-outline" data-action="more"></button></div>
    </section>
    <section class="how-section" id="como-funciona" aria-labelledby="how-title"><div class="container"><div class="how-top reveal"><p class="eyebrow">TU ARCO DE AUTODESCUBRIMIENTO</p><span class="how-jp" lang="ja">物語の始まり</span></div><div class="how-layout"><div class="how-intro reveal"><h2 id="how-title">UN TEST.<br>MUCHAS FORMAS<br>DE <span>SER TÚ.</span></h2><p>No hay respuestas correctas. Elige lo que de verdad se parece a ti y deja que tu historia hable.</p><a class="text-link" href="#/test">Empieza tu primer capítulo ${arrow}</a><div class="how-emblem" aria-hidden="true">自<span>分</span><small>BE YOURSELF</small></div></div><div class="steps"><article class="step reveal"><span class="step-number">01</span><div><h3>Escucha tu instinto</h3><p>12 preguntas sobre tus decisiones, tus vínculos y lo que te mueve. Responde a tu ritmo.</p><span class="step-tag">SIN RESPUESTAS INCORRECTAS</span></div>${icon('spark')}</article><article class="step reveal"><span class="step-number">02</span><div><h3>Conecta con tu personaje</h3><p>Comparamos cinco rasgos de tus respuestas con los perfiles de 16 personajes de distintos universos.</p><span class="step-tag">VALENTÍA · EMPATÍA · Y MUCHO MÁS</span></div>${icon('bolt')}</article><article class="step reveal"><span class="step-number">03</span><div><h3>Conoce el porqué</h3><p>Recibe tu personaje, una explicación de tus afinidades y una tarjeta para compartir con tu nakama.</p><span class="step-tag">TU ESENCIA, EN OTRO UNIVERSO</span></div>${icon('heart')}</article></div></div></div></section>
    <section class="faq-section container section-space" id="preguntas" aria-labelledby="faq-title"><div class="faq-intro reveal"><p class="eyebrow coral">ANTES DEL PRIMER EPISODIO</p><h2 id="faq-title">¿ALGUNA<br><span class="outlined">DUDA?</span></h2><p>No necesitas haber visto todos los animes.<br>Solo necesitas ser tú.</p><span class="faq-doodle" aria-hidden="true">?</span></div><div class="faq-list"><details><summary>¿Cómo eligen mi personaje?<span aria-hidden="true">+</span></summary><p>Cada respuesta aporta a cinco rasgos: valentía, empatía, estrategia, libertad y determinación. Comparamos el promedio de tus respuestas con perfiles editoriales de los personajes y elegimos el más cercano. Puedes consultar <a href="#/metodo">cómo funciona la afinidad</a>.</p></details><details><summary>¿Es una evaluación psicológica?<span aria-hidden="true">+</span></summary><p>Es una experiencia de entretenimiento y autodescubrimiento creada por fans. Los perfiles son interpretaciones de los personajes y no sustituyen una evaluación psicológica.</p></details><details><summary>¿Necesito una cuenta o pagar algo?<span aria-hidden="true">+</span></summary><p>No. Puedes hacer el test completo, ver tu resultado y descargar tu tarjeta sin registrarte y sin pagar.</p></details><details><summary>¿Qué pasa con mis respuestas?<span aria-hidden="true">+</span></summary><p>Se calculan y guardan en este navegador. No enviamos tus respuestas a un servidor. Puedes borrarlas con “Borrar mi progreso” o al reiniciar el test.</p></details><details><summary>¿Puedo repetirlo o compartirlo?<span aria-hidden="true">+</span></summary><p>¡Claro! Puedes repetirlo desde tu resultado y descargar una tarjeta con tu personaje. El enlace compartido muestra el personaje; tus respuestas y tu perfil personal se quedan en tu dispositivo.</p></details></div></section>
    <section class="final-cta container reveal"><div class="cta-grain" aria-hidden="true"></div><span class="cta-jp" lang="ja" aria-hidden="true">あなた</span><div><p class="eyebrow">CADA HISTORIA TIENE UN PROTAGONISTA</p><h2>ESTA VEZ,<br>ERES TÚ.</h2></div><div class="cta-right"><a class="button button-dark button-large" href="#/test">Descubrir mi personaje ${arrow}</a><span>12 preguntas para conocerte en otro universo.</span></div><span class="cta-spark" aria-hidden="true">✳</span></section>
  </main>${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
  renderGallery();
  setupReveals();
}

function renderQuiz(focusTitle = false) {
  document.title = `Pregunta ${current + 1} de 12 — AnataDesu`;
  const question = questions[current];
  const selected = answers[current];
  const answered = answers.filter(answer => answer !== null).length;
  app.innerHTML = `${header(true)}<main id="main" class="quiz-main container"><div class="quiz-topline"><a href="#/" class="quiz-back">← Volver al inicio</a><span>ENCUENTRA TU ESENCIA <span lang="ja">自分らしく</span></span></div><div class="quiz-layout"><aside class="quiz-sidebar"><span class="eyebrow coral">TU ARCO DE ORIGEN</span><h2>CADA ELECCIÓN<br>CUENTA ALGO<br><span class="outlined">DE TI.</span></h2><p>Responde con lo que sientes.<br>Tu primera intuición suele tener<br>mucho que contar.</p><div class="quiz-sidebar-art" aria-hidden="true"><span class="quiz-orbit"></span><span>✳</span><b lang="ja">心</b></div><div class="quiz-save-note">${icon('lock')}<span>${storageAvailable ? 'Tu progreso se guarda en este navegador.' : 'Tu progreso se conserva en esta pestaña.'}</span></div></aside><section class="question-panel" aria-labelledby="question-title"><div class="progress-label"><span>CAPÍTULO <b>${String(current + 1).padStart(2, '0')}</b> / 12</span><span>${answered} de 12 respondidas</span></div><div class="progress-track" role="progressbar" aria-valuenow="${answered}" aria-valuemin="0" aria-valuemax="12" aria-label="Preguntas respondidas"><span style="width:${answered / 12 * 100}%"></span></div><div class="question-content"><span class="question-kicker">${['EL PRIMER PASO', 'LOS VÍNCULOS', 'LOS DESAFÍOS', 'TU PODER', 'TU EQUIPO', 'LO QUE TE MUEVE', 'TU BRÚJULA', 'TU PAUSA', 'LA DECISIÓN', 'TU MUNDO INTERIOR', 'TU HISTORIA', 'EL ÚLTIMO CAPÍTULO'][current]}</span><h1 id="question-title" tabindex="-1">${question.title}</h1><p class="question-subtitle">${question.subtitle}</p><fieldset class="answers"><legend class="sr-only">Elige la respuesta que más se parece a ti</legend>${question.options.map((option, index) => `<label class="answer ${selected === index ? 'selected' : ''}"><input type="radio" name="answer" value="${index}" ${selected === index ? 'checked' : ''}><span class="answer-letter">${'ABCD'[index]}</span><span class="answer-text">${option.text}</span><span class="answer-check">${selected === index ? icon('check') : ''}</span></label>`).join('')}</fieldset><div class="quiz-navigation"><button class="text-button previous" data-action="previous" ${current === 0 ? 'disabled' : ''}>← Anterior</button><span class="keyboard-hint">Puedes usar las teclas 1–4</span><button class="button button-primary" data-action="next" ${selected === null ? 'disabled' : ''}>${current === 11 ? 'Revelar mi personaje' : 'Siguiente'} ${arrow}</button></div></div><div class="quiz-bottom-note"><span>Sin respuestas correctas. Sin etiquetas definitivas.</span><span aria-hidden="true">✦</span></div></section></div></main><footer class="quiz-footer container"><span>Una experiencia de fans, para fans.</span><button class="text-button" data-action="clear">Borrar mi progreso</button></footer><dialog id="detail-dialog" class="detail-dialog"></dialog>`;
  if (focusTitle) document.querySelector('#question-title').focus({ preventScroll: true });
}

function renderAnalysis() {
  if (!validateAnswers(answers)) { location.hash = '/test'; return; }
  document.title = 'Encontrando tu personaje — AnataDesu';
  app.innerHTML = `${header(true)}<main class="analysis-screen container" id="main"><div class="analysis-symbol" aria-hidden="true"><span>✳</span><b lang="ja">心</b></div><p class="eyebrow coral">EL MOMENTO DE CONOCERTE</p><h1>TU UNIVERSO<br>ESTÁ POR <span class="outlined">REVELARSE.</span></h1><p role="status">Comparando tus cinco rasgos con los 16 personajes…</p><div class="analysis-loader" aria-hidden="true"><span></span></div><small>Una interpretación de tus respuestas. Una historia por descubrir.</small></main>`;
  analysisTimer = setTimeout(() => { location.hash = `/resultado/${getResult(answers).character.id}`; }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 200 : 1900);
}

function renderResult(id) {
  const character = characters.find(item => item.id === id);
  if (!character) { renderNotFound(); return; }
  const computed = validateAnswers(answers) ? getResult(answers) : null;
  const result = computed?.character.id === id ? computed : null;
  const related = result ? result.ranking.slice(1).map(item => item.character) : characters.filter(item => item.id !== id && item.category === character.category).slice(0, 2);
  document.title = `${character.name} — ${result ? 'Tu alma anime' : 'Conoce al personaje'} · AnataDesu`;
  app.innerHTML = `${header(true)}<main id="main"><section class="result-section container" style="--character-color:${character.color}"><div class="result-topline"><a class="quiz-back" href="#/">← Volver al inicio</a><span>${result ? 'TU ARCO DE ORIGEN · COMPLETADO' : 'UN PERSONAJE, MUCHAS HISTORIAS'} <span aria-hidden="true">✦</span></span></div><div class="result-hero"><div class="result-art"><div class="result-art-orbit"></div><span class="result-japanese" lang="ja">${character.japanese}</span><img src="./images/${id}.jpg" alt="${character.name}, de ${character.anime}" width="225" height="350"><div class="result-art-label"><span>ANATA DESU — VOL. 01</span><b>${character.anime}</b></div><span class="result-art-star" aria-hidden="true">✳</span></div><div class="result-copy"><p class="eyebrow coral">${result ? 'EN OTRO UNIVERSO, TU ALMA SE PARECE A' : 'CONOCE EL UNIVERSO DE'}</p><h1>${character.name}</h1><span class="result-anime">${character.anime}<span>•</span>${character.category}</span><p class="result-tag">“${character.tag}”</p><div class="trait-tags">${character.traits.map(trait => `<span>${trait}</span>`).join('')}</div><p class="result-description">${character.description}</p>${result ? `<div class="affinity"><span class="affinity-value">${result.affinity}<small>%</small></span><div><b>Afinidad del test</b><span>Similitud con nuestro perfil del personaje.<br>Una pista para explorar, no una medida científica.</span></div>${icon('spark')}</div>` : `<div class="shared-note">Este enlace muestra el perfil del personaje. Haz el test para descubrir tu propia afinidad.</div>`}<div class="result-actions">${result ? `<button class="button button-primary" data-action="download" data-id="${id}">${icon('download')} Descargar tarjeta</button>` : `<a class="button button-primary" href="#/test">Encontrar mi personaje ${arrow}</a>`}<button class="button button-outline" data-action="share" data-id="${id}">${icon('share')} Compartir</button></div>${result ? '<button class="text-button retake" data-action="restart">↻ Volver a hacer el test</button>' : ''}</div></div>
      ${result ? `<div class="result-detail-grid"><section class="personality-panel"><p class="eyebrow coral">EL MAPA DE TU PERSONALIDAD</p><h2>Tus cinco rasgos</h2><p>Intensidad relativa de cada rasgo en tus respuestas.</p><div class="trait-bars">${dimensions.map(dimension => { const trait = result.traits.find(item => item.id === dimension.id); return `<div class="trait-bar-row"><div>${icon(dimension.icon)}<span>${dimension.label}</span><b>${trait.value}<small>/100</small></b></div><div class="trait-bar"><span style="--bar-width:${trait.value}%"></span></div></div>`; }).join('')}</div></section><section class="why-panel"><p class="eyebrow coral">LAS CONEXIONES DE TU HISTORIA</p><h2>¿Por qué este personaje?</h2>${getExplanation(result).map(reason => `<article class="reason">${icon(reason.icon)}<div><h3>${reason.label}</h3><p>${reason.text}</p></div></article>`).join('')}<p class="why-summary">${character.name} refleja esta combinación desde su propia historia. La afinidad se calcula con los cinco rasgos, no con una sola respuesta.</p></section></div>` : ''}
      <div class="growth-grid"><article><span class="eyebrow">TU LADO LUMINOSO ${icon('spark')}</span><h2>Lo que te hace brillar</h2><p>${character.strengths}</p></article><article><span class="eyebrow">EL SIGUIENTE CAPÍTULO ${icon('wind')}</span><h2>Un espacio para crecer</h2><p>${character.growth}</p></article></div>
      ${related.length ? `<section class="related-section"><div class="section-heading"><div><p class="eyebrow coral">${result ? 'OTRAS CONEXIONES DE TU UNIVERSO' : 'SIGUE EXPLORANDO'}</p><h2>${result ? 'También hay un poco de ellos en ti.' : 'Otras historias por descubrir.'}</h2></div></div><div class="related-grid">${related.map(characterCard).join('')}</div></section>` : ''}
      <div class="result-disclaimer">${icon('spark')}<p>Somos más que un personaje. Este test es una experiencia de entretenimiento basada en perfiles editoriales. Tu personalidad siempre será más rica que cualquier resultado. <a href="#/metodo">Conoce el método</a>.</p></div></section></main>${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
  requestAnimationFrame(() => document.querySelectorAll('.trait-bar span').forEach(bar => bar.classList.add('filled')));
}

function renderMethod() {
  document.title = 'Cómo funciona la afinidad — AnataDesu';
  app.innerHTML = `${header(true)}<main class="method-page container" id="main"><a href="#/" class="quiz-back">← Volver al inicio</a><p class="eyebrow coral">TRANSPARENCIA ANTES QUE MAGIA</p><h1>Así conectamos<br>tu historia.</h1><p class="method-lead">Un método sencillo y visible para una experiencia de entretenimiento.</p><div class="method-content"><h2>1. Cinco rasgos, doce preguntas</h2><p>Cada opción asigna entre 1 y 5 puntos a valentía, empatía, estrategia, libertad y determinación. Todas las preguntas tienen el mismo peso. Calculamos el promedio de cada rasgo con tus 12 respuestas.</p><h2>2. Una interpretación de los personajes</h2><p>Los 16 personajes tienen un perfil editorial en los mismos cinco rasgos. Son interpretaciones creativas de fans, no valoraciones oficiales ni perfiles psicológicos validados.</p><h2>3. El personaje más cercano</h2><p>Medimos la distancia cuadrática media entre tu perfil y cada personaje. Gana la menor distancia. Si hay un empate exacto, usamos el identificador del personaje en orden alfabético para que el resultado sea reproducible.</p><h2>4. ¿Qué significa el porcentaje?</h2><p>La afinidad es 100 × (1 − distancia / 4), redondeada al entero más cercano. El 4 es la mayor distancia posible en una escala de 1 a 5. Es un índice de similitud de este juego, no una probabilidad, una precisión ni una medida clínica.</p><h2>5. Tu privacidad</h2><p>El cálculo se hace en tu navegador. Las respuestas se guardan en el almacenamiento local del dispositivo para que puedas continuar. El enlace compartido solo incluye el identificador del personaje. No hay cuentas, analítica ni envío de respuestas. Las fuentes tipográficas pueden cargarse desde Google Fonts; las imágenes de personajes están incluidas en el sitio.</p><p>Puedes borrar tus respuestas en cualquier momento.</p><button class="button button-outline" data-action="clear">Borrar mi progreso</button><a class="button button-primary" href="#/test">Hacer el test ${arrow}</a></div></main>${footer()}<dialog id="detail-dialog" class="detail-dialog"></dialog>`;
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
  observer?.disconnect();
  const hash = location.hash.slice(1) || '/';
  if (!hash.startsWith('/')) {
    if (!document.querySelector('.hero')) renderHome();
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
    document.querySelector('.mobile-nav')?.setAttribute('hidden', '');
    document.querySelector('[data-action="menu"]')?.setAttribute('aria-expanded', 'false');
    document.querySelector('[data-action="menu"]')?.setAttribute('aria-label', 'Abrir menú');
    return;
  }
  if (hash === '/') renderHome();
  else if (hash === '/test') renderQuiz();
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
  showDialog(`<div class="character-dialog" style="--character-color:${character.color}"><div class="dialog-art"><img src="./images/${id}.jpg" alt="${character.name}" width="225" height="350"><span lang="ja">${character.japanese}</span></div><div class="dialog-copy"><p class="eyebrow coral">${character.anime}</p><h2>${character.name}</h2><p class="dialog-tag">${character.tag}</p><div class="trait-tags">${character.traits.map(trait => `<span>${trait}</span>`).join('')}</div><p>${character.description}</p><a class="button button-primary" href="#/test" data-action="close-dialog">¿Compartimos esencia? ${arrow}</a><a class="text-link" href="#/resultado/${id}" data-action="close-dialog">Ver su perfil ${arrow}</a></div></div>`);
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
    const image = new Image();
    image.src = `./images/${id}.jpg`;
    await image.decode();
    await document.fonts.ready;
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#151617'; ctx.fillRect(0, 0, 1080, 1400);
    ctx.fillStyle = character.color; ctx.fillRect(54, 54, 972, 790);
    const scale = Math.max(972 / image.width, 790 / image.height);
    const w = image.width * scale, h = image.height * scale;
    ctx.save();
    ctx.beginPath(); ctx.rect(54, 54, 972, 790); ctx.clip();
    ctx.drawImage(image, 54 + (972 - w) / 2, 54 + (790 - h) * .2, w, h);
    const gradient = ctx.createLinearGradient(0, 570, 0, 850); gradient.addColorStop(0, 'transparent'); gradient.addColorStop(1, '#151617'); ctx.fillStyle = gradient; ctx.fillRect(54, 540, 972, 310);
    ctx.restore();
    ctx.fillStyle = '#ff6846'; ctx.font = '700 25px "DM Sans", sans-serif'; ctx.fillText('EN OTRO UNIVERSO, MI ALMA SE PARECE A', 72, 902);
    ctx.fillStyle = '#f4f1e9';
    let fontSize = 102; ctx.font = `800 ${fontSize}px "Barlow Condensed", Impact, sans-serif`;
    while (ctx.measureText(character.name.toUpperCase()).width > 930 && fontSize > 48) { fontSize -= 2; ctx.font = `800 ${fontSize}px "Barlow Condensed", Impact, sans-serif`; }
    ctx.fillText(character.name.toUpperCase(), 67, 1010);
    ctx.fillStyle = character.color; ctx.font = '600 29px "DM Sans", sans-serif'; ctx.fillText(character.anime, 72, 1060);
    ctx.fillStyle = '#c3c1b9'; ctx.font = '400 26px "DM Sans", sans-serif'; ctx.fillText(character.traits.join('  /  '), 72, 1130);
    ctx.strokeStyle = '#414241'; ctx.beginPath(); ctx.moveTo(72, 1200); ctx.lineTo(1008, 1200); ctx.stroke();
    ctx.fillStyle = '#f4f1e9'; ctx.font = '700 35px "DM Sans", sans-serif'; ctx.fillText('AnataDesu', 72, 1270);
    ctx.fillStyle = '#a4a49e'; ctx.font = '400 23px "DM Sans", sans-serif'; ctx.fillText('Tu personalidad tiene su propio universo.', 72, 1315);
    ctx.fillStyle = '#ff6846'; ctx.font = '700 66px sans-serif'; ctx.fillText('✳', 925, 1295);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('No se pudo crear la tarjeta');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `AnataDesu-${id}.png`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast('¡Tarjeta lista! Ya puedes compartir tu universo.');
  } catch { toast('No pudimos descargar la tarjeta. Puedes compartir el enlace del personaje.'); }
  finally { button.disabled = false; button.innerHTML = old; }
}

app.addEventListener('change', event => {
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
  if (action === 'more') { expanded = !expanded; renderGallery(); }
  if (action === 'menu') { const nav = document.querySelector('.mobile-nav'); nav.hidden = !nav.hidden; button.setAttribute('aria-expanded', String(!nav.hidden)); button.setAttribute('aria-label', nav.hidden ? 'Abrir menú' : 'Cerrar menú'); }
  if (action === 'next' && answers[current] !== null) {
    if (current === questions.length - 1) {
      const missing = answers.findIndex(answer => answer === null);
      if (missing !== -1) { current = missing; save(); renderQuiz(true); toast('Falta responder esta pregunta para conocer tu resultado.'); }
      else { save(); location.hash = '/revelando'; }
    } else { current++; save(); renderQuiz(true); window.scrollTo({ top: 0, behavior: 'instant' }); }
  }
  if (action === 'previous' && current > 0) { current--; save(); renderQuiz(true); }
  if (action === 'restart' || action === 'clear') {
    showDialog(`<div class="info-dialog"><p class="eyebrow coral">UN NUEVO PRIMER CAPÍTULO</p><h2>${action === 'restart' ? '¿Comenzamos otra vez?' : '¿Borrar tu progreso?'}</h2><p>Se borrarán las respuestas y el resultado guardados en este navegador.</p><div class="dialog-buttons"><button class="button button-outline" data-action="close-dialog">Conservar mis respuestas</button><button class="button button-primary" data-action="confirm-clear" data-restart="${action === 'restart'}">${action === 'restart' ? 'Empezar de nuevo' : 'Borrar mis respuestas'}</button></div></div>`);
  }
  if (action === 'confirm-clear') {
    answers = emptyAnswers(); current = 0;
    try { localStorage.removeItem(KEY); } catch { /* La memoria de la pestaña ya está limpia. */ }
    document.querySelector('#detail-dialog').close();
    if (button.dataset.restart === 'true') { if (location.hash === '#/test') renderQuiz(true); else location.hash = '/test'; }
    else { if (location.hash === '#/test') renderQuiz(true); else if (location.hash.startsWith('#/resultado/')) route(); toast('Tus respuestas se han borrado.'); }
  }
  if (action === 'close-dialog') document.querySelector('#detail-dialog').close();
  if (action === 'share') share(button.dataset.id);
  if (action === 'download') downloadCard(button.dataset.id, button);
  if (action === 'select-share') { document.querySelector('#share-url').focus(); document.querySelector('#share-url').select(); }
  if (action === 'privacy') showDialog(`<div class="info-dialog"><p class="eyebrow coral">TU HISTORIA ES TUYA</p><h2>Privacidad, sin enredos.</h2><p>Tus respuestas y tu progreso se guardan en el almacenamiento local de este navegador. El resultado se calcula en tu dispositivo y no se envía a ningún servidor.</p><p>No usamos cuentas ni herramientas de analítica. Las fuentes pueden conectarse con Google Fonts; el proveedor de alojamiento puede registrar solicitudes técnicas. Las imágenes se sirven desde este mismo sitio.</p><p>Al compartir un enlace, solo compartes el personaje. La tarjeta descargada contiene el nombre y los rasgos editoriales del personaje.</p><button class="button button-outline" data-action="clear">Borrar mi progreso</button></div>`);
  if (action === 'credits') showDialog(`<div class="info-dialog"><p class="eyebrow coral">DE FANS PARA FANS</p><h2>El talento detrás de estos universos.</h2><p>AnataDesu es un proyecto de fans sin afiliación oficial con las series. Los personajes, imágenes y marcas pertenecen a sus respectivos autores y titulares. Las imágenes se obtuvieron de MyAnimeList.</p><p>Las descripciones y los perfiles de afinidad son interpretaciones editoriales creadas para esta experiencia.</p><a class="text-link" href="./asset-credits.json" target="_blank" rel="noopener">Ver fuentes de cada imagen ↗</a><a class="text-link" href="https://github.com/bastian-alvarez/AnataDesu" target="_blank" rel="noopener">Código y comunidad en GitHub ↗</a></div>`);
});

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || location.hash !== '#/test') return;
  if (/^[1-4]$/.test(event.key) && !event.target.matches('input:not([type="radio"]), textarea, [contenteditable="true"]')) {
    const radio = document.querySelector(`input[name="answer"][value="${Number(event.key) - 1}"]`);
    radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); radio.focus();
  }
});
window.addEventListener('hashchange', route);
route();
