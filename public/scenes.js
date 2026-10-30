const option = (text, values, insight) => ({ text, values, insight });
export const questions = [
  { chapter:'EL ÚLTIMO TREN', title:'Tu tren está por salir. Alguien en el andén pide ayuda. ¿Qué haces?', subtitle:'Tu aventura empieza antes de lo previsto.', options:[
    option('Me acerco a ayudar, aunque tenga que reorganizar mi viaje.',[4,5,2,2,4],'Elegiste hacer espacio para otra persona, incluso cuando complicaba tu plan.'),
    option('Busco al personal de la estación y le explico qué ocurre.',[2,3,5,1,4],'Preferiste activar los recursos adecuados para resolver la situación.'),
    option('Pregunto qué necesita y decido según lo que puedo hacer.',[2,4,4,3,3],'Buscaste comprender antes de asumir qué ayuda necesitaba.'),
    option('Le indico dónde pedir ayuda y sigo el viaje que había elegido.',[3,2,2,5,4],'Tu elección dio peso a tu propio camino y a los compromisos que ya tenías.'),
  ]},
  { chapter:'LA MISIÓN', title:'El plan del equipo falla a mitad de la misión. Tú propones…', subtitle:'El guion acaba de cambiar. Tu siguiente movimiento cuenta.', options:[
    option('Probar una salida sobre la marcha; actuar nos dará información.',[5,2,2,5,3],'Te inclinaste por aprender actuando ante lo inesperado.'),
    option('Parar un momento, reunir los hechos y ajustar el plan.',[2,2,5,1,5],'Elegiste crear claridad antes de seguir avanzando.'),
    option('Escuchar cómo está cada persona y repartir de nuevo las tareas.',[2,5,3,2,4],'Pusiste la coordinación y el estado del equipo en el centro.'),
    option('Cambiar de objetivo: quizá este camino ya no tiene sentido.',[2,1,4,5,1],'Te diste permiso para replantear una meta en lugar de sostenerla por costumbre.'),
  ]},
  { chapter:'EL FESTIVAL', title:'Organizas un festival. Faltan dos horas y quedan demasiadas cosas por hacer.', subtitle:'Los episodios cotidianos también revelan tu esencia.', options:[
    option('Elijo lo esencial y hago una lista para coordinar al grupo.',[2,2,5,2,4],'Convertiste un problema grande en prioridades concretas.'),
    option('Me encargo de la tarea más difícil y no la suelto hasta terminar.',[4,2,3,1,5],'Preferiste demostrar compromiso con una tarea exigente.'),
    option('Pregunto quién está agobiado y reorganizo la carga.',[2,5,3,1,4],'Tu decisión buscó que el esfuerzo fuera sostenible para todos.'),
    option('Improviso una versión más sencilla, con un toque inesperado.',[3,3,2,5,2],'Usaste flexibilidad y creatividad para salvar la experiencia.'),
  ]},
  { chapter:'LA AZOTEA', title:'Una amistad se distancia sin explicar por qué. Coinciden a solas. ¿Qué dices?', subtitle:'No todas las conversaciones tienen una respuesta inmediata.', options:[
    option('“Te noto lejos. Si quieres hablar, puedo escucharte”.',[2,5,2,2,3],'Abriste una conversación sin exigir una explicación inmediata.'),
    option('“Necesito saber si pasó algo entre nosotros”.',[4,3,3,2,4],'Elegiste expresar con claridad lo que necesitabas saber.'),
    option('Le doy espacio y observo si cambia algo antes de preguntar.',[1,2,5,3,3],'Preferiste observar y respetar el espacio antes de intervenir.'),
    option('Propongo hacer algo juntos, sin convertirlo todo en una charla.',[3,4,1,5,2],'Buscaste reconstruir cercanía a través de una experiencia compartida.'),
  ]},
  { chapter:'LA OFERTA', title:'Te ofrecen una oportunidad increíble, pero exige dejar un proyecto a medias.', subtitle:'Elegir también es reconocer qué estás dispuesto a dejar.', options:[
    option('La acepto: quiero descubrir lo que todavía no conozco.',[4,2,2,5,2],'Diste prioridad a explorar una posibilidad nueva.'),
    option('Termino mi compromiso; para mí cumplir tiene mucho peso.',[3,3,2,1,5],'Tu elección puso en primer lugar el compromiso que ya habías asumido.'),
    option('Comparo los costes y busco una transición viable.',[2,2,5,3,4],'Intentaste conectar la oportunidad con un plan sostenible.'),
    option('Hablo con quienes dependen de mí antes de decidir.',[2,5,3,2,3],'Incluiste a las personas afectadas en una decisión importante.'),
  ]},
  { chapter:'EL RIVAL', title:'Alguien te supera en algo que te importa mucho. ¿Qué ocurre después?', subtitle:'Los rivales pueden convertirse en espejos inesperados.', options:[
    option('Me dan ganas de entrenar hasta mejorar mi propia marca.',[5,1,2,2,5],'Canalizaste la comparación en práctica y esfuerzo personal.'),
    option('Le pregunto cómo lo hace; quizá pueda aprender algo.',[2,3,5,2,4],'Elegiste convertir el desafío en una oportunidad para aprender.'),
    option('Lo felicito y recuerdo qué disfruto de hacerlo, aunque no gane.',[2,5,2,3,2],'Volviste a conectar con el disfrute y con el valor del vínculo.'),
    option('Pruebo un estilo distinto: quiero destacar a mi manera.',[4,2,3,5,3],'Buscaste diferenciarte con una forma propia de actuar.'),
  ]},
  { chapter:'LA BIBLIOTECA', title:'Encuentras una pista que contradice lo que todo el grupo da por cierto.', subtitle:'A veces una buena pregunta cambia el episodio.', options:[
    option('La compruebo y preparo una explicación con pruebas.',[2,1,5,2,5],'Tu curiosidad se apoyó en comprobar y argumentar.'),
    option('La comparto enseguida: quizá alguien vea algo que yo no veo.',[4,4,3,3,3],'Abriste la investigación a otras perspectivas.'),
    option('Sigo investigando por mi cuenta; el misterio me intriga.',[1,1,5,5,3],'Elegiste explorar con autonomía una pregunta que te interesaba.'),
    option('Primero pienso cómo contarlo sin herir a nadie.',[1,5,3,1,3],'Consideraste el efecto emocional de una información nueva.'),
  ]},
  { chapter:'LA FRONTERA', title:'Una norma impide que alguien de tu equipo participe. Te parece injusta.', subtitle:'Tu brújula entra en escena.', options:[
    option('La cuestiono frente al grupo y defiendo que se cambie.',[5,3,2,4,4],'Elegiste tomar postura de forma visible.'),
    option('Busco la excepción o el argumento que permita incluirle.',[2,3,5,2,4],'Tu respuesta combinó estrategia con una solución concreta.'),
    option('Me quedo con esa persona y buscamos juntos otra opción.',[2,5,2,1,4],'Diste prioridad a acompañar a quien estaba quedando fuera.'),
    option('Organizo algo aparte donde podamos decidir nuestras reglas.',[3,3,3,5,2],'Tu iniciativa buscó crear una alternativa con más autonomía.'),
  ]},
  { chapter:'EL REFUGIO', title:'Después de una semana intensa, aparece una tarde sin planes. ¿Qué eliges?', subtitle:'Tu forma de recargar también forma parte de tu historia.', options:[
    option('Perderme por un lugar nuevo, sin itinerario.',[3,1,1,5,1],'Elegiste renovar energía explorando sin una meta cerrada.'),
    option('Dedicar tiempo a una habilidad que quiero dominar.',[2,1,4,2,5],'Encontraste descanso en profundizar en algo propio.'),
    option('Compartir algo tranquilo con mis personas favoritas.',[1,5,1,2,2],'Buscaste energía en la cercanía y en los pequeños momentos.'),
    option('Estar a solas con mis ideas, un libro o una curiosidad.',[1,2,5,4,2],'Reservaste un espacio para procesar y explorar a tu ritmo.'),
  ]},
  { chapter:'EL ERROR', title:'Un error tuyo complica el trabajo de todos. ¿Cómo lo afrontas?', subtitle:'Lo que haces después del fallo también te define.', options:[
    option('Lo reconozco de inmediato y me pongo a repararlo.',[5,3,2,2,5],'Elegiste hacerte cargo con franqueza y acción.'),
    option('Entiendo primero qué ocurrió y propongo un ajuste que no se repita.',[2,2,5,1,4],'Transformaste el error en una oportunidad para mejorar el sistema.'),
    option('Pregunto a quién afectó y qué necesita de mí ahora.',[2,5,2,1,4],'Tu respuesta priorizó reparar el efecto sobre las personas.'),
    option('Acepto que pasó y busco una solución diferente a la prevista.',[3,2,3,5,2],'Preferiste adaptarte y abrir una salida nueva.'),
  ]},
  { chapter:'LA PROMESA', title:'Tu meta parece cada vez más lejana. Un amigo pregunta si aún quieres seguir.', subtitle:'No tienes que decidir para demostrar nada a nadie.', options:[
    option('Sí. Ajustaré el ritmo, pero todavía tiene sentido para mí.',[4,2,3,2,5],'Distinguías entre bajar el ritmo y abandonar algo valioso.'),
    option('Necesito revisar si esta meta sigue siendo realmente mía.',[1,2,4,5,2],'Te importó reconocer si tu objetivo seguía representándote.'),
    option('Me gustaría seguir, pero compartiendo mejor el esfuerzo.',[2,5,3,1,4],'Elegiste buscar apoyo para que el camino sea sostenible.'),
    option('Voy a probar un enfoque nuevo antes de decidir.',[4,1,5,4,3],'Respondías a la duda con curiosidad y experimentación.'),
  ]},
  { chapter:'LOS CRÉDITOS', title:'Antes de irse, tu equipo te deja una nota. ¿Cuál te gustaría encontrar?', subtitle:'El último capítulo de este test. Tu historia sigue después.', options:[
    option('“Nos ayudaste a dar el paso cuando nadie se atrevía”.',[5,3,1,4,4],'Te identificaste con el valor de poner algo en movimiento.'),
    option('“A tu lado, cada persona encontró un lugar”.',[1,5,2,1,3],'Elegiste dejar una huella de pertenencia y cuidado.'),
    option('“Encontraste una salida que nadie había imaginado”.',[2,2,5,3,4],'Te atrajo aportar una perspectiva que abriera posibilidades.'),
    option('“Nos recordaste que podíamos elegir nuestra propia historia”.',[3,3,2,5,2],'Te identificaste con la libertad de construir un camino propio.'),
  ]},
];
