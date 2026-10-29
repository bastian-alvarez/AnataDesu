# AnataDesu · あなたです。

Una web para descubrir qué personaje de anime comparte tu forma de sentir, pensar y vivir. Hecha con **Node.js y JavaScript**, sin dependencias de producción.

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

## La experiencia

- Portada editorial con composición de personajes, animaciones y galería filtrable.
- 12 preguntas, navegación hacia atrás, atajos 1–4 y progreso guardado localmente.
- 16 personajes de Naruto, One Piece, Jujutsu Kaisen, Demon Slayer, Attack on Titan, Hunter × Hunter, Death Note, Haikyū!!, Violet Evergarden, Sailor Moon, El viaje de Chihiro, Fullmetal Alchemist, Dragon Ball y Spy × Family.
- Resultados con imagen, explicación, cinco rasgos, afinidades alternativas y sugerencias para reflexionar.
- Tarjeta PNG descargable y enlace compartible que no contiene respuestas personales.
- Diseño adaptable, navegación con teclado y respeto a `prefers-reduced-motion`.

## Cómo funciona

Cada opción asigna de 1 a 5 puntos en valentía, empatía, estrategia, libertad y determinación. Se promedian las 12 respuestas y se compara ese perfil con los perfiles editoriales de los personajes mediante distancia euclídea normalizada por cinco dimensiones (raíz del error cuadrático medio). Gana la menor distancia; los empates se resuelven por el identificador en orden alfabético.

`afinidad = redondear(100 × (1 − distancia / 4))`

El porcentaje es un índice de similitud del juego, no una probabilidad ni una evaluación psicológica. La explicación personalizada usa los dos rasgos con mayor puntuación. El método también está explicado en `#/metodo`.

## Privacidad

El cálculo ocurre en el navegador. Solo se almacenan respuestas e índice de progreso en `localStorage` bajo `anata-desu:v1`. El visitante puede borrarlos desde la web. No hay cuentas, base de datos, analítica ni envío de respuestas. Las imágenes están incluidas; Google Fonts es el único recurso visual externo y tiene fuentes de respaldo del sistema.

## Estructura

```text
public/
  index.html           Documento y metadatos
  styles.css           Diseño, animación y adaptación móvil
  app.js               Vistas, encuesta, almacenamiento y tarjeta PNG
  data.js              Preguntas y perfiles de personajes
  engine.js            Cálculo puro de afinidad y explicación
  images/              16 retratos locales
  asset-credits.json   Fuentes individuales de imágenes
server.mjs             Servidor HTTP Node
scripts/build.mjs      Generación estática de dist/
test/engine.test.mjs   Pruebas de contenido y algoritmo
```

El repositorio principal es [bastian-alvarez/AnataDesu](https://github.com/bastian-alvarez/AnataDesu). GitHub Actions ejecuta pruebas y compilación en cada push a `main` y pull request. `dist/` se puede alojar en cualquier servicio estático; las rutas con hash permiten publicarlo también bajo un subdirectorio como GitHub Pages. El servidor Node sirve la misma aplicación localmente o en un alojamiento compatible con Node.

## Imágenes y créditos

Proyecto de fans sin afiliación oficial. Los personajes y las imágenes pertenecen a sus autores y titulares. Consulta `public/asset-credits.json` para ver la página y URL de cada imagen de MyAnimeList. El código original del sitio no concede derechos sobre esas imágenes.

`node scripts/fetch-assets.mjs` permite actualizar los retratos manualmente y requiere acceso a Internet y curl. La aplicación desplegada no depende de Jikan ni MyAnimeList en tiempo de ejecución.
