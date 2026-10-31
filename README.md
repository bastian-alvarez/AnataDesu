# AnataDesu · あなたです。

Una web para descubrir qué personaje de anime comparte tu forma de sentir, pensar y vivir. Hecha con **Node.js y JavaScript**, sin dependencias de producción.

**Sitio público:** [bastian-alvarez.github.io/AnataDesu](https://bastian-alvarez.github.io/AnataDesu/). Puedes compartir este enlace para usar la encuesta sin instalar nada ni iniciar sesión.

## Iniciar

Requiere Node.js 22 o superior. No es necesario ejecutar `npm install`.

```bash
npm run dev
```

Abre http://localhost:3000. `npm start` inicia el servidor sin reinicio automático. Puedes cambiar el puerto con la variable de entorno `PORT`.

```bash
npm test          # Valida contenido, resultados, afinidad e imágenes
npm run build    # Copia la aplicación lista para publicar a dist/
npm run preview  # Sirve dist/ con Node
```

## La experiencia · versión 1.2

- Portada editorial con composición de personajes, animaciones y galería filtrable.
- 12 escenas con decisiones personales, navegación hacia atrás, atajos 1–4 y progreso guardado localmente.
- 48 personajes de 21 universos, con protagonistas, antagonistas y personajes de películas.
- Tres modos: todo el multiverso, solo series conocidas y descubrimiento fuera de las series que ya viste.
- Resultados con imagen, cinco rasgos, papel en el equipo, respuesta ante conflictos, vínculos y decisiones concretas que explican tus afinidades.
- Estudio de tarjetas PNG: 1080×1400 o historias de 1080×1920; estilos Anata original, Tinta y papel y Mi universo.
- Modo dúo: códigos e invitaciones para comparar dos resultados, similitudes, diferencias y dinámica del dúo.
- Conservación del resultado completo de la primera edición. Las respuestas antiguas no se reutilizan para preguntas nuevas.
- Diseño adaptable, navegación con teclado y respeto a `prefers-reduced-motion`.

## Elige tu destino

Minijuego en [#/destino](https://bastian-alvarez.github.io/AnataDesu/#/destino), con cuatro aventuras originales de fans: Naruto Shippuden, Jujutsu Kaisen, Attack on Titan y Bleach. Cada mundo incluye cuatro orígenes, cuatro técnicas, tres rutas de misión y cuatro desenlaces alcanzables. Son historias alternativas, independientes del argumento oficial.

Cada episodio tiene siete decisiones: origen, técnica y cinco capítulos. Valor, ingenio, vínculos y reserva cambian con las elecciones. Las técnicas permiten acciones exclusivas, investigar desbloquea el uso de información y elegir un aliado permite coordinarse con él. Los finales dependen de requisitos visibles; siempre existe una salida de regreso con refuerzos.

La partida se guarda en `anata-desu:destiny:v1` mediante un historial de decisiones validado y reconstruido al cargar. Volver una decisión restaura también sus recursos. El guardado es local a cada navegador y alojamiento. Reiniciar el test conserva la aventura; «Borrar mi progreso» en privacidad elimina ambos. Se puede copiar una crónica con el final y las elecciones realizadas. No hay generación remota ni llamadas a servicios de IA.

Archivos: `destiny-data.js` (historias), `destiny-engine.js` (reglas y persistencia validada), `destiny.js` (interfaz) y `destiny.css`. Las pruebas recorren todos los caminos disponibles para verificar que no hay bloqueos y que los 16 finales se pueden alcanzar.

## Cómo funciona

Cada opción asigna de 1 a 5 puntos en valentía, empatía, estrategia, libertad y determinación. Se promedian las 12 respuestas y se compara ese perfil con los perfiles editoriales de los personajes de los universos seleccionados mediante distancia euclídea normalizada por cinco dimensiones (raíz del error cuadrático medio). Gana la menor distancia; los empates se resuelven por el identificador en orden alfabético.

`afinidad = redondear(100 × (1 − distancia / 4))`

El porcentaje es un índice de similitud del juego, no una probabilidad ni una evaluación psicológica. El relato usa el perfil personal y cita decisiones reales del cuestionario. Los perfiles editoriales se calibran sobre combinaciones alcanzables con `node scripts/calibrate-profiles.mjs`. Cada personaje tiene un ejemplo de respuestas en `test/result-witnesses.json`, verificado por las pruebas. El método también está explicado en `#/metodo`.

## Modo dúo

Cada visitante puede copiar un código o una invitación desde `#/duo`. El otro visitante pega ese código o abre la invitación. Si todavía no ha completado el test, el perfil del amigo se conserva localmente mientras responde.

Formato del código: `AD2.personaje.cinco-puntuaciones.comprobación`. Contiene solo el personaje y cinco puntuaciones redondeadas entre 20 y 100. La comprobación detecta errores de copia; no cifra ni autentica la identidad. El enlace de resultado habitual continúa compartiendo únicamente el personaje.

La afinidad de estilo es `redondear(100 × (1 − RMSE / 80))`, donde RMSE compara las cinco puntuaciones de ambos perfiles. El texto considera patrones de semejanza y diferencia. Es un juego, sin predicciones sobre la calidad de una amistad o relación.

## Privacidad

El cálculo ocurre en el navegador. Las respuestas, el índice de progreso, los universos elegidos, el resultado archivado y un código de amigo pendiente se guardan en `localStorage` bajo `anata-desu:v2`. El formato anterior `anata-desu:v1` se lee para conservar resultados completos. “Borrar mi progreso” limpia las dos ediciones, el código guardado y la aventura de Elige tu destino. No hay cuentas, base de datos, analítica ni envío de respuestas. Las imágenes están incluidas; Google Fonts es el único recurso visual externo y tiene fuentes de respaldo del sistema.

## Estructura

```text
public/
  index.html           Documento y metadatos
  styles.css           Diseño original, animación y adaptación móvil
  edition-two.css      Universos, modo dúo y estudio de tarjetas
  app.js               Vistas, navegación y encuesta
  session.js           Persistencia y migración entre ediciones
  compatibility.js     Códigos, validación y afinidad de dúos
  cards.js             Exportación PNG por formato y estilo
  data.js              Catálogo unificado y universos
  catalog.js           Los 32 personajes nuevos
  scenes.js            Las 12 escenas y sus decisiones
  profile-anchors.js   Perfiles editoriales calibrados
  legacy-v1.js         Pesos originales para conservar resultados
  engine.js            Cálculo puro de afinidad y explicación
  images/              48 retratos locales
  asset-credits.json   Fuentes individuales de imágenes
server.mjs             Servidor HTTP Node
scripts/build.mjs      Generación estática de dist/
test/                  Pruebas de catálogo, afinidad, universos, dúos y migración
```

El repositorio principal es [bastian-alvarez/AnataDesu](https://github.com/bastian-alvarez/AnataDesu). GitHub Actions ejecuta pruebas y compilación en cada push a `main` y pull request. Cuando las comprobaciones pasan en `main`, publica `dist/` automáticamente en GitHub Pages. También puedes iniciar el flujo manualmente desde la pestaña Actions. Los pull requests se validan sin publicar.

GitHub Pages sirve la aplicación estática; el test y el modo dúo se ejecutan en el navegador. Node se usa para las pruebas y la compilación. Las rutas de recursos relativas y la navegación con hash permiten servir el sitio bajo `/AnataDesu/`. El servidor Node continúa disponible para desarrollo local o un alojamiento compatible con Node.

Los resultados se guardan por dirección del sitio y navegador. Al entrar en GitHub Pages por primera vez, se comienza una aventura nueva; los resultados del alojamiento anterior siguen en ese alojamiento. Los códigos de modo dúo se pueden pegar en cualquiera de las dos versiones.

## Imágenes y créditos

Proyecto de fans sin afiliación oficial. Los personajes y las imágenes pertenecen a sus autores y titulares. Consulta `public/asset-credits.json` para ver la página y URL de cada imagen de MyAnimeList. El código original del sitio no concede derechos sobre esas imágenes.

`node scripts/fetch-assets.mjs` descarga los retratos que falten; `--refresh` permite renovarlos manualmente. Requiere acceso a Internet y curl. La aplicación desplegada no depende de Jikan ni MyAnimeList en tiempo de ejecución.
