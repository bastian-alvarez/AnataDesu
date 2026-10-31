const c = (id, label, detail, effect = {}, extra = {}) => ({ id, label, detail, effect, ...extra });

// Every scene is authored. Duration changes scenes and decisions, never a reading timer.
function buildNode(id, world, state) {
  const s = world.story;
  const friend = state.companion || s.companion;
  const alive = state.companionHealth > 0;
  const enemyDescription = alive ? s.enemyText : s.enemyText.split(/(?<=[.!?])\s+/).slice(0,2).join(' ');
  const company = alive ? `${friend} permanece a tu lado. Mira tus manos antes de preguntar si todavía puedes continuar.` : `El espacio donde caminaba ${friend} está vacío. Conservas ${s.token}; ninguna decisión posterior podrá devolverle la vida.`;
  const node = (title, text, choices, mood = 'quiet') => ({ id, title, text, choices, mood });
  const result = (outcome, extra = {}) => ({ outcome, ...extra });
  const tech = (index, label, detail, effect, extra = {}) => c('technique', label, detail, effect, { requires: { skill: world.skills[index].id }, ...extra });
  switch (id) {
    case 'origin': return node(world.originLabel, 'Todo protagonista viene de algún lugar. Tu origen modifica tus primeras fortalezas, pero no decide quién merece volver a casa. Cada mundo tiene su propia misión y sus propios peligros.', world.origins.map(choice => ({ ...choice, next: undefined })));
    case 'skill': return node(world.skillLabel, 'Elige una técnica que realmente quieras usar. Durante la misión aparecerán oportunidades exclusivas para aplicarla: investigar, esquivar, abrir camino o proteger a alguien. Ninguna técnica garantiza sobrevivir si ignoras sus límites.', world.skills.map(choice => ({ ...choice, next: undefined })));
    case 'promise': return node('Lo que prometiste al salir', `${s.opening}\n\nAntes de partir, decides qué idea va a acompañarte cuando el plan falle. No es un juramento mágico: alguien recordará lo que dijiste y esperará que actúes en consecuencia.`, [
      c('people', 'Prometer que nadie se quedará atrás', 'Asume la responsabilidad de cuidar al equipo.', { bonds: 1 }, result('Prometiste volver con tu compañero. Esa promesa sigue contigo.', { flag: 'promise' })),
      c('understand', 'Prometer que entenderás la amenaza', 'Prefiere descubrir una salida antes de recurrir a la fuerza.', { cunning: 1 }, result('Decidiste buscar una explicación antes de elegir un enemigo.')),
      c('prove', 'Prometer que esta vez no retrocederás', 'Tu voluntad crece; también debes reconocer sus límites.', { courage: 1 }, result('Prometiste avanzar. Todavía puedes decidir qué merece ese riesgo.')),
    ]);
    case 'memory': return node('Una razón para regresar', `Antes de partir, tu compañero te entrega ${s.token}. «Devuélvemelo cuando todo termine», dice. Hay un silencio cómodo, uno de esos que solo existen antes de una misión. Podrías preguntarle por su familia, repasar las señales o bromear para que deje de apretar los puños.`, [
      c('listen', 'Preguntarle qué hará cuando regrese', 'Conoces la vida que existe al otro lado de la misión.', { bonds: 1 }, result(`${friend} te habló del pequeño hogar que quiere construir. Ahora sabes por qué desea volver.`, { flag: 'memory' })),
      c('signals', 'Acordar una señal si algo sale mal', 'Dos golpes significarán detenerse y cambiar de plan.', { cunning: 1 }, result('Acordaron una señal de retirada que ambos reconocerán.', { flag: 'signal' })),
      c('laugh', 'Inventar un nombre absurdo para el equipo', 'Una risa compartida también puede dar fuerzas.', { bonds: 1, energy: 1 }, result('La risa aflojó la tensión. Por un momento, el camino pareció menos largo.')),
    ]);
    case 'training': return node('La última práctica', `Antes de dejar el refugio pruebas ${world.skills.find(item => item.id === state.skill)?.label}. La primera repetición sale bien; la segunda deja claro que no puedes mantenerla para siempre. ${friend} propone entrenar una salida de emergencia. Tienes tiempo para perfeccionar un movimiento o conservar fuerzas, pero no para hacerlo todo.`, [
      c('control', 'Practicar el control, no la potencia', 'Reserva precisión para el encuentro decisivo.', { cunning: 1 }, result('Aprendiste a detener la técnica antes de perder el control.', { flag: 'prepared' })),
      c('pair', 'Ensayar una maniobra conjunta', 'El equipo aprende a cubrir el error del otro.', { bonds: 1 }, result('Practicaron hasta reconocer el momento de cubrirse.', { flag: 'ally' })),
      c('power', 'Llevar la técnica al límite', 'Ganas confianza, aunque gastas una reserva.', { courage: 2, energy: -1 }, result('Descubriste una potencia nueva y también su coste.')),
    ]);
    case 'mission': return node(world.text.mission[0], `${world.text.mission[1]}${state.duration === 'long' ? `\n\nLa orden es ${s.goal}. El informe no dice qué hacer si recuperar ${s.object} exige dejar a alguien atrás. Tu compañero espera tu decisión en el cruce; a partir de aquí habrá partes de la misión que ya no podrán resolverse desde el refugio.` : ''}`, [
      c('scout', 'Investigar antes de exponernos', 'Busca información y un punto débil.', { cunning: 1 }, result('Elegiste la ruta de observación. El equipo avanza con cautela.', { route: 'scout' })),
      c('rescue', 'Llegar primero a las personas atrapadas', 'Prioriza vidas antes que el objetivo.', { bonds: 1 }, result('Te desviaste para buscar a quienes aún no han podido salir.', { route: 'rescue' })),
      c('assault', 'Ir directo hacia la amenaza', 'Gana terreno, aunque el enemigo sabrá que llegas.', { courage: 1 }, result('Tu avance rápido alertó al enemigo.', { route: 'assault' })),
    ], 'tension');
    case 'travel': return node('El camino también elige', `${s.travel}\n\nQuedan provisiones para una sola parada. Una luz al otro lado del camino podría ser ayuda o una distracción. Puedes aceptar la ruta propuesta, explorar un desvío o avanzar sin comprobarlo. Tu compañero no discute tu autoridad: intenta saber si estás escuchando lo que el terreno les dice.`, [
      c('pace', 'Seguir el ritmo de mi compañero', 'Conserva fuerzas y refuerza la confianza.', { energy: 1, bonds: 1 }, result('Llegaron juntos y con fuerzas para responder a una sorpresa.')),
      c('detour', 'Explorar el desvío con cuidado', 'Obtén información a costa de una reserva.', { cunning: 1, energy: -1 }, result('Encontraste una ruta que no figuraba en el informe.', { flag: 'intel' })),
      c('rush', 'Atravesar sin revisar el terreno', 'Riesgo: una caída puede herirte antes del combate.', { courage: 1, health: -2 }, result('La prisa te hizo pisar una zona inestable. Continuaste con una herida.', { risk: 'Herida probable' })),
    ], 'tension');
    case 'branch': {
      const route = state.route || 'scout';
      const text = world.text[route];
      const extra = state.duration === 'long' ? `\n\n${friend} señala una salida lateral. No tiene certeza de que siga abierta cuando regresen. Si eliges una acción peligrosa, no habrá un instructor para detenerla antes de que cause daño. Puedes usar lo que entrenaste o cambiar el objetivo de este encuentro.` : '';
      if (route === 'scout') return node(text[0], text[1] + extra, [
        tech(0, `Usar ${world.skills[0].label}`, 'La técnica revela la ruta sin exponerte.', { cunning: 1 }, result('Tu señuelo reveló el punto débil. Nadie resultó herido.', { flag: 'intel' })),
        c('observe', 'Observar hasta entender el patrón', 'Gasta una reserva para reunir información.', { cunning: 1, energy: -1 }, result('Identificaste el patrón de la defensa.', { flag: 'intel' })),
        c('reckless', 'Cruzar antes de que nos descubran', 'Riesgo alto: la defensa sigue activa.', { courage: 2, health: -4, companionHealth: -2 }, result('La defensa se activó. Lograste cruzar, pero ambos resultaron heridos.', { risk: 'Daño a ambos' })),
      ], 'tension');
      if (route === 'rescue') return node(text[0], text[1] + extra, [
        tech(1, `Usar ${world.skills[1].label}`, 'Evita el impacto y abre una salida.', { bonds: 1 }, result('Tu técnica de evasión abrió un paso seguro.', { flag: 'rescued' })),
        c('plan', 'Organizar la salida antes de mover a nadie', 'Separa las tareas y descubre una ruta alternativa.', { cunning: 1, bonds: 1, energy: -1 }, result('La evacuación reveló un acceso desprotegido.', { flags: ['intel', 'rescued'] })),
        c('shield', 'Recibir el impacto para protegerlos', 'Riesgo: perderás vida para cubrir la salida.', { bonds: 2, health: -3 }, result('Las personas cruzaron detrás de ti. Absorbiste el golpe y quedaste herido.', { flag: 'rescued', risk: 'Herida propia' })),
      ], 'rescue');
      return node(text[0], text[1] + extra, [
        tech(2, `Abrir paso con ${world.skills[2].label}`, 'Tu preparación reduce el desgaste del ataque.', { courage: 1, energy: -1 }, result('La técnica abrió una brecha precisa en la defensa.', { flag: 'prepared' })),
        c('weakness', 'Buscar la unión más débil', 'La observación evita un choque frontal.', { cunning: 1, energy: -1 }, result('Encontraste un punto débil que cambia el combate.', { flag: 'intel' })),
        c('reckless', 'Romper la defensa con todo lo que tengo', 'Riesgo alto: la onda alcanza también al equipo.', { courage: 2, health: -4, companionHealth: -2 }, result('Abriste el paso, pero la onda de choque hirió a ambos.', { risk: 'Daño a ambos' })),
      ], 'tension');
    }
    case 'companion': return node('Con quién caminarás', `En ${s.place} se unen dos miembros del grupo de apoyo. ${s.companion}, ${s.role}, quiere cubrir tu espalda. ${s.alternate} prefiere trazar una salida desde el mapa. Elegir quién te acompañará también implica escucharle cuando proponga detenerse.`, [
      c('bond', `Pedir a ${s.companion} que venga conmigo`, 'La confianza abre maniobras conjuntas.', { bonds: 1 }, result(`${s.companion} se convierte en tu compañero de misión.`, { companion: s.companion, flag: 'ally' })),
      c('planner', `Preparar la siguiente ruta con ${s.alternate}`, 'Un segundo punto de vista aporta estrategia.', { cunning: 1 }, result(`${s.alternate} toma el relevo para acompañarte en el resto de la misión.`, { companion: s.alternate, flag: 'ally' })),
    ]);
    case 'camp': return node('Lo que cabe en una pausa', `Llegas a ${s.place}. ${company}\n\nPuedes dedicar unos minutos a recuperar fuerzas, atender las heridas o revisar lo aprendido. El peligro no desaparece mientras descansas, pero llegar agotado tampoco hará la misión más corta.`, [
      c('rest', 'Recuperar reservas antes de seguir', 'Descansa y guarda energía para el último tramo.', { energy: 2 }, result('El descanso te devolvió una parte de tus fuerzas.')),
      c('care', alive ? `Atender las heridas de ${friend}` : 'Atender mis propias heridas', 'Las heridas pueden sanar; las pérdidas no se revierten.', alive ? { companionHealth: 2, health: 1, bonds: 1 } : { health: 2 }, result(alive ? `Cuidaste de ${friend} y revisaste tus propias heridas.` : 'Te vendaste en silencio y guardaste el recuerdo de tu compañero.')),
      c('map', 'Preparar un plan con lo que sabemos', 'La siguiente decisión se beneficia de la preparación.', { cunning: 1 }, result('Dejaste preparada una salida y un plan de contingencia.', { flag: 'prepared' })),
    ], 'quiet');
    case 'dialogue': return node('Lo que no decía el informe', `${company}\n\n${alive ? `«Si no puedo seguir, no decidas por mí sin preguntarme», dice ${friend}. No suena a desafío. Está intentando conservar un poco de su propia historia dentro de la tuya. La conversación deja de tratarse de ganar y empieza a tratarse de cómo quieren volver.` : `Recuerdas la última conversación con ${friend}. Hay palabras que ahora pesan de otra manera. El silencio no exige una respuesta perfecta; exige que no conviertas esa pérdida en una excusa para arriesgar a todos los demás.`}`, [
      c('respect', alive ? 'Acordar que nos escucharemos hasta el final' : 'Recordar su voz antes de decidir', 'Reconoce los límites y la voluntad de tu compañero.', { bonds: 1 }, result(alive ? 'Acordaron tomar juntos las decisiones que les afecten a ambos.' : 'Elegiste honrar a tu compañero cuidando a quienes todavía están aquí.', { flag: 'consent' })),
      c('route', 'Repasar nuestra señal de emergencia', 'Si algo falla, aún habrá una instrucción clara.', { cunning: 1 }, result('La señal de emergencia quedó clara antes del siguiente encuentro.', { flag: 'signal' })),
      c('silence', 'Quedarme unos minutos en silencio', 'Recupera concentración sin prometer lo imposible.', { energy: 1 }, result('Te diste permiso para sentir el peso de la misión antes de continuar.')),
    ]);
    case 'clue': return node('La pieza que faltaba', `${s.clue}\n\nLa información contradice la orden inicial. Podrías guardarla para el momento decisivo, comprobarla con una segunda observación o dejarla atrás para llegar antes. Esta vez, entender el mecanismo puede cambiar quién necesita ponerse en peligro.`, [
      c('decode', 'Descifrar y conservar la información', 'Obtén la clave que permite un desenlace estratégico.', { cunning: 1 }, result('Descifraste la clave del objetivo y la conservaste.', { flag: 'intel' })),
      c('verify', 'Comprobarlo antes de confiar en ello', 'Gasta una reserva para preparar un plan sólido.', { cunning: 1, energy: -1 }, result('Confirmaste la clave y preparaste cómo utilizarla.', { flags: ['intel', 'prepared'] })),
      c('leave', 'Llegar antes de que cambie la situación', 'Conserva fuerzas; renuncias a esta pista.', { energy: 1, courage: 1 }, result('Dejaste la pista atrás para conservar tiempo y energía.')),
    ], 'discovery');
    case 'pact': return node('Una oferta demasiado conveniente', `${enemyDescription}\n\nUn mensaje propone un atajo: abrirán un acceso a cambio de que avances sin tu compañero. No hay forma de comprobar la promesa desde aquí. La ruta segura tarda más, pero permanece bajo tu control.`, [
      c('reject', 'Rechazar el trato y sostener el plan', 'Conserva el control y la confianza del equipo.', { bonds: 1 }, result('Rechazaste separar al equipo a cambio de una promesa del enemigo.', { flag: 'ally' })),
      c('fake', 'Fingir que acepto y marcar el acceso', 'Gasta una reserva para obtener una ventaja.', { cunning: 1, energy: -1 }, result('Marcaste la entrada sin entregar a tu compañero.', { flag: 'intel' })),
      c('accept', 'Aceptar el acceso sin comprobarlo', 'Riesgo alto: el trato puede ser una emboscada.', { energy: 1, health: -3, companionHealth: -2 }, result('El acceso era una trampa. Escaparon heridos antes de que se cerrara.', { risk: 'Emboscada' })),
    ], 'tension');
    case 'trap': return node('Dos vidas en una decisión', `${alive ? s.hazard : `El acceso a ${s.object} sigue inestable. Una defensa activa bloquea el paso y tendrás que buscar una salida sin el apoyo de tu compañero.`}\n\n${alive ? `${friend} usa la señal de emergencia. Todavía puedes sujetarlo, asegurar primero la salida o seguir hacia el objetivo dejándolo atrás. La última opción puede costarle la vida; no hay refuerzos en esta zona.` : `Sin ${friend} para sostener el otro extremo, debes asegurar tu propio paso. El camino rápido sigue siendo peligroso y nadie podrá alcanzarte si caes.`}`, [
      c('secure', 'Asegurar el paso antes de movernos', 'Gasta una reserva y evita más heridas.', { cunning: 1, energy: -1 }, result('Aseguraste el paso y desactivaste la trampa sin otra pérdida.', { flag: 'prepared' })),
      c('pull', alive ? `Arriesgarme para sacar a ${friend}` : 'Proteger a los civiles que vienen detrás', 'Recibirás parte del impacto al cubrir la salida.', { health: -2, bonds: 1 }, result(alive ? `Alcanzaste a ${friend} antes de que cediera el paso. El impacto te hirió.` : 'Cubriendo la salida recibiste el impacto de la defensa.', { risk: 'Herida propia' })),
      c('abandon', 'Seguir hacia el objetivo sin asegurar el paso', alive ? 'Riesgo mortal para tu compañero. No podrás curarlo si muere.' : 'Riesgo mortal para ti: el paso no está asegurado.', alive ? { companionHealth: -6, courage: 1 } : { health: -5, courage: 1 }, result('Continuaste sin asegurar la salida.', { risk: 'Riesgo mortal' })),
    ], 'danger');
    case 'triage': return node('Lo que todavía puedes salvar', `${company}\n\nEn el refugio queda un único paquete de primeros auxilios. El tiempo de la misión no se detiene, pero las heridas tampoco desaparecen por ignorarlas. Puedes dedicar los materiales a una persona y preparar el siguiente movimiento con lo que quede.`, [
      c('self', 'Tratar primero mi herida más grave', 'Recupera vida para afrontar el último tramo.', { health: 3 }, result('La cura estabilizó tus heridas. Conservas las cicatrices de lo ocurrido.')),
      c('friend', alive ? `Usar el paquete para ${friend}` : 'Llevar el paquete a los supervivientes', alive ? 'Recupera la salud de tu compañero.' : 'Tu ayuda llega a quienes aún pueden recibirla.', alive ? { companionHealth: 3, bonds: 1 } : { bonds: 2 }, result(alive ? `${friend} pudo volver a mantenerse en pie.` : 'Entregaste las curas a los supervivientes. La pérdida de tu compañero permanece.')),
      c('breath', 'Parar y reorganizar nuestras reservas', 'Recupera energía, sin curar las heridas.', { energy: 2 }, result('Reorganizaste las reservas antes de afrontar la amenaza.')),
    ]);
    case 'scout2': return node('La salida que no vio nadie', `Recuerdas la pista sobre ${s.object} y la contrastas con el mapa.\n\nAhora observas el mecanismo desde su lado menos protegido. Los errores del primer encuentro te permiten reconocer qué parte se activa al sentir movimiento. Hay una salida estrecha, suficiente para un grupo pequeño si preparas el recorrido antes de llamar a los demás.`, [
      c('mark', 'Marcar el recorrido para todos', 'Obtén información y una salida compartida.', { cunning: 1 }, result('Marcaste una ruta de salida que el enemigo no estaba vigilando.', { flags: ['intel', 'signal'] })),
      c('test', 'Probar la salida con una técnica controlada', 'Gasta una reserva y comprueba el plan.', { energy: -1, cunning: 1 }, result('Comprobaste la salida con un ensayo preciso.', { flags: ['intel', 'prepared'] })),
      c('save', 'Conservar fuerzas y mantener la posición', 'Confía en lo ya aprendido.', { energy: 1 }, result('Guardaste fuerzas en lugar de exponerte en otro reconocimiento.')),
    ], 'discovery');
    case 'enemy': return node('Frente a quien lo empezó', `${enemyDescription}\n\nYa no se trata de una silueta al otro lado del mapa. El enemigo puede oírte y tú puedes ver cómo protege ${s.object}. Quizá una pregunta revele su intención, una distracción permita avanzar o un desafío lo saque de su posición.`, [
      c('question', 'Preguntar qué espera conseguir', 'Escuchar no implica aceptar. Descubre cómo piensa.', { cunning: 1 }, result('El enemigo reveló qué parte del objetivo necesita conservar.', { flag: 'intel' })),
      c('distract', 'Hablar mientras aseguro una segunda salida', 'Gasta energía para preparar el terreno.', { energy: -1 }, result('Aseguraste otra salida mientras mantenías su atención.', { flag: 'prepared' })),
      c('challenge', 'Provocarlo para que abandone su defensa', 'Riesgo: aceptas un primer intercambio de golpes.', { courage: 2, health: -2 }, result('El enemigo dejó su posición, pero su primer ataque te alcanzó.', { risk: 'Herida propia' })),
    ], 'tension');
    case 'crossroads': return node('La parte del plan que eres tú', `La ruta conduce a ${s.object}. ${company}\n\nTu cuerpo ya conoce el precio de cada decisión. Puedes reajustar el plan para proteger a quienes siguen contigo o apurar el último tramo como si las heridas fueran solo un número. No queda nadie a quien demostrar que eres invulnerable. Queda una misión que terminar.`, [
      c('adapt', 'Adaptar el plan a nuestras condiciones reales', 'Prepara una defensa y refuerza la confianza.', { bonds: 1 }, result('Cambiaste el plan para tener en cuenta las heridas y los recursos.', { flag: 'prepared' })),
      c('regroup', 'Reunir al grupo antes de avanzar', alive ? 'Tu compañero podrá cubrir tu espalda.' : 'Los supervivientes se reagrupan para salir.', { bonds: 1, energy: 1 }, result(alive ? `${friend} confirmó que aún puede cubrir tu espalda.` : 'Los supervivientes encontraron una ruta de regreso.', { flag: 'ally' })),
      c('push', 'Forzar mi cuerpo para ganar tiempo', 'Riesgo alto: avanzar herido puede matarte.', { courage: 2, health: -3 }, result('Forzaste tu cuerpo para llegar antes al núcleo.', { risk: 'Riesgo mortal si estás herido' })),
    ], 'danger');
    case 'crisis': return node('Cuando el plan se rompe', `${state.duration === 'short' && alive ? s.hazard : `El enemigo cambia su defensa después del primer encuentro. El acceso a ${s.object} empieza a cerrarse y una nueva oleada amenaza la salida de los supervivientes. Tendrás que actuar antes de que el grupo quede dividido.`}\n\n${company}${state.duration === 'long' ? '\n\nLa preparación ya no es una idea sobre el papel. Si acordaste señales, investigaste o cuidaste a tu compañero, este es el momento de usarlo. Si llegaste herido, una acción impulsiva puede ser la última. Todavía existe una ruta que evita el choque frontal.' : ''}`, [
      tech(3, `Proteger con ${world.skills[3].label}`, 'Gasta una reserva y da tiempo al equipo.', { bonds: 1, energy: -1 }, result('Tu técnica sostuvo la defensa y abrió una salida segura.', { flag: 'ally' })),
      c('coordinate', alive ? `Coordinarme con ${friend}` : 'Coordinar la salida de los supervivientes', 'Acordar una señal conserva vidas y refuerza el vínculo.', { bonds: 2 }, result(alive ? `Escuchaste a ${friend}. La señal compartida permitió actuar al mismo tiempo.` : 'Coordinaste a los supervivientes desde una posición segura.', { flag: 'ally' })),
      c('intel', 'Usar el punto débil que investigué', 'La información abre un camino sin heridos.', { cunning: 1 }, result('La pista funcionó. El enemigo perdió el control de la defensa.', { requires: { flag: 'intel' }, flag: 'prepared' })),
      c('alone', alive ? `Mandar a ${friend} a contenerlo a solas` : 'Contenerlo a solas, sin preparar la salida', alive ? 'Riesgo mortal para tu compañero: recibirá todo el impacto.' : 'Riesgo mortal: recibirás todo el impacto.', alive ? { companionHealth: -4, courage: 1 } : { health: -6, courage: 1 }, result(alive ? `Ordenaste a ${friend} contener la amenaza sin apoyo.` : 'Te enfrentaste al impacto sin una salida preparada.', { risk: 'Riesgo mortal' })),
      c('gamble', 'Lanzarme sin reservar una salida', 'Riesgo mortal: perderás cinco puntos de vida.', { health: -5, courage: 2 }, result('Atravesaste la defensa a costa de tu propio cuerpo.', { risk: 'Riesgo mortal' })),
    ], 'danger');
    case 'aftermath': return node(alive ? 'Después del estruendo' : 'El nombre que falta', `${company}\n\n${alive ? `Tu compañero comprueba que aún llevas ${s.token}. Queda cerca el objetivo y, por primera vez, pueden ver la salida que habían imaginado desde el refugio. La última pausa permite atender una herida o reunir fuerzas para el desenlace.` : `${friend} murió durante esta misión. El enemigo sigue junto a ${s.object}, pero la historia ya ha cambiado para siempre. Puedes detenerte a recordar, ayudar a otra persona o preparar el último movimiento. La pérdida no se deshace con una cura.`}`, [
      c('care', alive ? 'Comprobar que ambos podemos seguir' : 'Atender a quienes siguen con vida', 'Recupera vida y cuida de tu grupo.', alive ? { health: 1, companionHealth: 1, bonds: 1 } : { health: 1, bonds: 1 }, result(alive ? 'Revisaron juntos las heridas y el camino que quedaba.' : 'Ayudaste a los supervivientes sin olvidar a quien falta.')),
      c('focus', 'Preparar el movimiento decisivo', 'Recupera una reserva y afina el plan.', { energy: 1, cunning: 1 }, result('Reuniste fuerzas para el último movimiento.', { flag: 'prepared' })),
      c('remember', alive ? 'Renovar nuestra promesa de volver' : `Guardar un recuerdo de ${friend}`, 'La misión también importa por quienes la viven.', { bonds: 2 }, result(alive ? 'Renovaron la promesa de regresar juntos.' : `Guardaste ${s.token} para contar la historia de ${friend}.`)),
    ], alive ? 'quiet' : 'loss');
    case 'reckoning': return node('Qué significa ganar', `El último tramo ya está a la vista. El enemigo ha dejado de negociar y el grupo espera saber si aún seguirás el plan.\n\n${alive ? `${friend} ya no espera una promesa de victoria. Espera una decisión que tenga en cuenta a todos los que están aquí. El enemigo cuenta con que olvides tus límites al verlo tan cerca.` : `La ausencia de ${friend} hace tentadora una última acción sin regreso. Pero todavía hay personas que dependen de la salida que preparaste. Puedes sentir rabia sin entregarles también tu vida.`} Lo que ganes al final dependerá tanto de tus heridas como de tu fuerza.`, [
      c('limits', 'Aceptar mis límites y preparar el regreso', 'Conserva una reserva y una salida real.', { energy: 1 }, result('Aceptaste tus límites y dejaste preparado el regreso.', { flag: 'prepared' })),
      c('together', alive ? 'Escuchar la última propuesta de mi compañero' : 'Escuchar a los supervivientes', 'Pon las vidas presentes por delante del orgullo.', { bonds: 1 }, result('Escuchaste a quienes todavía podían responderte.', { flag: 'ally' })),
      c('anger', 'Convertir toda mi rabia en un último avance', 'Riesgo alto: perderás tres puntos de vida.', { courage: 2, health: -3 }, result('Tu rabia ganó terreno, pero también te hirió.', { risk: 'Riesgo mortal si estás herido' })),
    ], 'tension');
    case 'finale': return node('La decisión que te recordará', `${s.finale}\n\n${company} Tus heridas y las vidas perdidas seguirán contando después del último golpe. Puedes buscar una victoria conjunta, aprovechar la información, apostar por un duelo o asegurar que alguien más consiga volver.`, [
      c('unite', 'Ejecutar el plan junto a mi compañero', 'Con información, confianza y ambos ilesos, puede ser una victoria perfecta.', {}, result('Elegiste completar el plan junto a tu compañero.', { requires: { flags: ['ally', 'intel'], companionAlive: true }, intent: 'unite' })),
      c('outsmart', 'Usar la clave para desarmar al enemigo', 'Resuelve el conflicto con la información que reuniste.', {}, result('Usaste la información como movimiento decisivo.', { requires: { flag: 'intel' }, intent: 'outsmart' })),
      c('duel', 'Desafiarlo con mi última técnica', 'Riesgo mortal con vida menor de 4 o Valor menor de 6. Requiere 2 de reserva.', { energy: -2 }, result('Apostaste por una última técnica frente al enemigo.', { requires: { energy: 2 }, intent: 'duel', risk: 'Duelo de alto riesgo' })),
      c('protect', 'Cubrir la salida y terminar la defensa', 'Una preparación cuidadosa permite vencer protegiendo al grupo.', {}, result('Elegiste cerrar el conflicto manteniendo una salida para el grupo.', { requires: { flag: 'prepared' }, intent: 'protect' })),
      c('sacrifice', 'Quedarme para que los demás escapen', 'Tu protagonista morirá. Los supervivientes podrán regresar.', {}, result('Elegiste entregar tu vida para mantener abierta la salida.', { intent: 'sacrifice', risk: 'Sacrificio irreversible' })),
      c('retreat', 'Replegarnos y pedir refuerzos', 'La amenaza permanece; quienes puedan seguir volverán contigo.', {}, result('Elegiste volver con la información y pedir refuerzos.', { intent: 'retreat' })),
    ], 'tension');
    default: throw new Error('Escena desconocida');
  }
}

export function storyNode(id, world, state) {
  const node = buildNode(id, world, state);
  if (state.duration === 'short') {
    if (id === 'origin') node.text = 'Tu origen define tus primeras fortalezas. Tú decides qué hacer con ellas.';
    if (id === 'skill') node.text = 'Esta técnica abrirá opciones exclusivas. Elige cómo afrontarás el peligro.';
    if (id === 'crisis') node.text = state.companionHealth > 0 ? world.story.hazard : 'La defensa sigue activa. Tendrás que cruzarla sin tu compañero.';
    if (id === 'finale') node.text = world.story.finale;
  }
  return node;
}
