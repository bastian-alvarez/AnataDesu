import { settings } from './destiny-worlds.js';

const character = (id, name, role, separate = false) => ({ id, name, role, image: `./images/${separate ? 'speakers/' : ''}${id}.jpg` });
const cast = {
  naruto: {
    mentor: character('kakashi','Kakashi Hatake','Tu instructor'),
    guide: character('kakashi','Kakashi Hatake','Al frente de la misión'),
    care: character('sakura','Sakura Haruno','A tu lado en el puesto médico'),
    hope: character('naruto','Naruto Uzumaki','Un compañero de Konoha'),
    origin: 'Antes de mirar tu bandana quiero conocerte a ti. ¿De qué clan vienes? Lo que hagas con ese legado será tu propia decisión.',
    skill: 'Vamos a empezar por lo que podrás controlar, no por lo que se vea más impresionante. ¿Qué primer jutsu quieres aprender conmigo?',
    training: 'Ya sabes iniciar el jutsu. Ahora quiero ver si sabes detenerlo. ¿Practicamos el control, la coordinación o la potencia?',
    mission: 'El mensaje importa, pero hay gente en esa aldea. Mira el mapa conmigo: ¿investigamos, vamos a ayudar o abrimos paso hacia la amenaza?',
    clue: 'Este símbolo está invertido. Puede cambiar toda la misión. ¿Lo estudiamos antes de decidir cómo cerrar el sello?',
    crisis: 'La barrera se está cerrando. Respira y dime qué vas a hacer; necesito una decisión que tenga en cuenta a quienes siguen aquí.',
    finale: 'Ya llegamos hasta aquí. ¿Qué quieres que recordemos de ti cuando volvamos a Konoha? Yo voy a escuchar tu decisión.',
    wounded: 'Déjame ver esa herida. No tienes que fingir que puedes con todo. ¿Me dejas atenderte antes de decidir el siguiente paso?',
    loss: 'No pude salvar a {companion}. Voy a quedarme contigo mientras lo asimilas. ¿Qué necesitas hacer por quienes aún están aquí?',
    farewell: 'Estoy aquí. Puedes descansar la mano sobre la mía. No hace falta que vuelvas a levantarte para demostrarnos nada. Recordaremos tu nombre y lo que elegiste proteger.',
    sacrifice: 'Las personas que sacaste de allí están a salvo. Yo me quedaré contigo. Si ya no puedes hablar, aprieta mi mano; te estoy escuchando.',
    victory: '¡Volvieron todos! Quiero escuchar cada detalle, pero primero ven aquí. Esta vez podemos celebrar sin dejar un sitio vacío.',
    skillReplies: ['Clonación. Bien: aprenderemos a engañar a la defensa sin poner a una persona delante del golpe.','Sustitución. Reconocer cuándo salir de una trampa también forma parte de ser un shinobi.','Bola de fuego. Practicaremos dónde termina la técnica; detrás del objetivo también puede haber alguien.','Un sello de contención. A veces ganar unos segundos para otra persona decide toda una misión.'],
  },
  jujutsu: {
    mentor: character('gojo','Satoru Gojo','Tu instructor'),
    guide: character('megumi','Megumi Fushiguro','Reconocimiento de la estación'),
    care: character('nobara','Nobara Kugisaki','Apoyo en el refugio'),
    hope: character('nobara','Nobara Kugisaki','Tu compañera de escuela'),
    origin: 'Antes de entrar en esa estación, una pregunta: ¿tu formación viene de una familia de hechiceros o tuviste que descubrir todo esto por tu cuenta?',
    skill: 'Podría enseñarte algo espectacular, pero prefiero que salgas de tu primera misión. ¿Qué técnica quieres aprender a controlar?',
    training: 'Que una técnica salga una vez no significa que ya sea tuya. ¿Qué quieres dominar antes de usarla dentro de la cortina?',
    mission: 'Hay pasajeros dentro y dos accesos que siguen abiertos. ¿Buscamos primero el patrón de la estación, a los civiles o al núcleo?',
    clue: 'Los anuncios no son aleatorios. Esta grabación podría romper el ciclo. ¿La desciframos o seguimos antes de que vuelva el tren?',
    crisis: 'La maldición quiere separarnos. No le regales una decisión por miedo. ¿Qué plan puedes sostener con la energía que te queda?',
    finale: 'Las puertas van a cerrarse. Dime cómo quieres terminar esto y no me dejes adivinando al otro lado del andén.',
    wounded: 'Si estás herido, dilo. No voy a confundirte el orgullo con un plan. ¿Paramos a revisarlo antes de volver ahí fuera?',
    loss: '{companion} murió y no voy a decirte que eso deja de doler porque la misión siga. Estoy aquí. ¿Cómo cuidamos a los que aún pueden salir?',
    farewell: 'No voy a dejar que el último sonido que escuches sea ese anuncio. Escucha mi voz. Estuviste aquí con nosotros, y no pienso olvidarlo.',
    sacrifice: 'Los pasajeros están fuera. Lo lograron por el tiempo que les diste. Me quedo aquí contigo; ya no tienes que sostener la puerta.',
    victory: 'Todos fuera y sin heridas. Ahora sí puedes presumir un poco. Y luego nos cuentas cómo viste ese camino antes que la maldición.',
    skillReplies: ['Un señuelo de energía. Vamos a hacer que la maldición persiga la pista equivocada.','Refuerzo corporal. Controlar cuánto gastas será tan importante como resistir el golpe.','Impacto concentrado. Primero precisión; el andén no necesita otro agujero sin motivo.','Barrera simple. Aprenderás a dar unos segundos de calma cuando todo intente dividir al grupo.'],
  },
  titan: {
    mentor: character('levi','Levi Ackerman','Tu instructor de campo'),
    guide: character('armin','Armin Arlert','El mapa de la expedición'),
    care: character('hange','Hange Zoë','En el puesto de auxilio'),
    hope: character('armin','Armin Arlert','Un compañero de exploración'),
    origin: 'Antes de ajustar ese equipo, dime de dónde vienes. Necesito saber qué aprendiste fuera del cuartel, no qué escribieron en tu expediente.',
    skill: 'Solo vas a llevar lo que sepas usar bajo presión. ¿Qué especialidad quieres entrenar conmigo antes de salir del muro?',
    training: 'Un cable mal asegurado no perdona por mucho valor que tengas. ¿Qué movimiento vas a repetir hasta hacerlo bien?',
    mission: 'El convoy, los civiles y la ruta de regreso están conectados. ¿Dónde empezamos para tener una oportunidad de traerlos de vuelta?',
    clue: 'El conductor marcó un paso que el mapa oficial no muestra. Si lo entendemos, quizá no tengamos que cruzar delante del titán. ¿Lo revisamos?',
    crisis: 'Comprueba el gas y mira dónde está tu compañero. Después dime qué movimiento puedes terminar de verdad.',
    finale: 'El portón sigue abierto. Quiero saber qué eliges hacer antes de que esa sea nuestra última oportunidad de cruzarlo.',
    wounded: 'Puedo revisar esas heridas, pero necesito que me digas cómo te encuentras. ¿Cuidamos primero tu cuerpo o preparamos un relevo?',
    loss: '{companion} no volvió de ese encuentro. No voy a convertir su nombre en un número del informe. ¿Qué necesitas para ayudar al resto a regresar?',
    farewell: 'Estoy junto a ti. Voy a llevar tu nombre de vuelta al cuartel y voy a contar tu historia completa, también las partes que no caben en un informe.',
    sacrifice: 'El convoy cruzó el portón. Tu señal llegó. Ya puedes soltar el equipo; voy a sostenerte hasta el final.',
    victory: 'Los he contado otra vez: están todos. Esta noche el mapa será una historia que podamos contar juntos, no una lista de ausencias.',
    skillReplies: ['Señales de distracción. Que todo el grupo entienda tu señal antes de que la necesite.','Maniobras de evasión. Llegar con gas para volver será parte del entrenamiento.','Corte de precisión. Un movimiento que terminas vale más que tres que solo imaginas.','Arnés de rescate. Practicaremos con peso extra antes de confiarle a alguien su vida.'],
  },
  bleach: {
    mentor: character('rukia','Rukia Kuchiki','Tu guía en la primera patrulla',true),
    guide: character('renji','Renji Abarai','La ruta hacia la grieta',true),
    care: character('rukia','Rukia Kuchiki','Junto al refugio de las almas',true),
    hope: character('ichigo','Ichigo Kurosaki','Un aliado entre dos mundos',true),
    origin: 'Reconozco tu presión espiritual, pero eso no me dice quién eres. ¿De dónde viene tu formación antes de unirte a esta patrulla?',
    skill: 'No basta con ver el otro mundo para moverte dentro de él. ¿Qué disciplina quieres practicar conmigo primero?',
    training: 'Todavía puedes ajustar tu técnica antes de llegar al distrito. ¿Qué necesitas que practiquemos juntos?',
    mission: 'El farol atrae a las almas y la grieta sigue creciendo. Podemos seguir su rastro, ayudar a los atrapados o abrir el acceso. ¿Cuál eliges?',
    clue: 'Mira cómo vibra ese cordón. El farol depende de algo que no se ve desde la calle. ¿Quieres comprobarlo antes de cortarlo?',
    crisis: 'La grieta se está llevando el camino. No te pido que finjas seguridad: dime qué salida has preparado.',
    finale: 'Las almas esperan una señal. Estoy aquí para ayudarte a sostener la decisión, pero necesito que la tomes tú.',
    wounded: 'Tu presión espiritual está cambiando. Para un momento y dime qué parte del cuerpo no te responde como antes.',
    loss: '{companion} murió en esta patrulla. No voy a prometerte un regreso que no puedo darte. Me quedaré a tu lado mientras decides cómo seguir.',
    farewell: 'Te escucho. No hace falta que encuentres las palabras perfectas. Llevaré tu nombre conmigo cuando regrese al distrito.',
    sacrifice: 'Las almas han cruzado. No quedaron encerradas en la grieta. Ahora puedo quedarme contigo hasta que se apague la última luz.',
    victory: 'Los faroles vuelven a encenderse y todos los de la patrulla siguen aquí. Ven, vamos a llevar juntos esa noticia al distrito.',
    skillReplies: ['Un rastro ilusorio. Puede apartar al guardián de quienes todavía no saben defenderse.','Paso evasivo. Llegar al otro lado con fuerzas también es una técnica.','Zanjutsu. Practicaremos dónde termina tu corte antes de llevarlo cerca de otras almas.','Kidō de contención. A veces sostener un borde unos segundos salva todo el camino.'],
  },
  onepiece: {
    mentor: character('zoro','Roronoa Zoro','Tu entrenamiento en cubierta'),
    guide: character('nami','Nami','La ruta del faro'),
    care: character('robin','Nico Robin','En la bodega de refugio'),
    hope: character('luffy','Monkey D. Luffy','Un aliado en el puerto'),
    origin: 'Antes de embarcar quiero saber de dónde vienes. Un puerto, una escuela o una vida en el mar: todo eso se nota cuando la cubierta empieza a moverse.',
    skill: 'Tenemos un rato antes de llegar al faro. ¿Qué quieres aprender a hacer bien sobre esta cubierta?',
    training: 'Otra vez. La siguiente ola no va a esperar a que encuentres el equilibrio. ¿Qué parte quieres practicar?',
    mission: 'Conozco la marea, pero necesito saber qué vas a priorizar: la ruta al faro, las familias o el barco que bloquea el puerto.',
    clue: 'Esta corriente cambia antes que las demás. El capitán está cobrando por un paso que quizá podamos abrir nosotros. ¿Lo comprobamos?',
    crisis: 'La pasarela no va a aguantar otra ola. Mira a quién tienes detrás antes de decidir dónde pones el siguiente pie.',
    finale: '¡El faro sigue ahí! Dime qué quieres hacer y yo escucharé tu plan. Me gustaría que al volver pudiéramos comer todos juntos.',
    wounded: 'Siéntate un momento. Puedo ayudarte a revisar la herida y encontrar algo limpio con que cubrirla. ¿Qué necesitas antes de volver a cubierta?',
    loss: '{companion} murió. No hay un mapa que nos ahorre ese dolor. Estoy aquí para escucharte, también si todavía no puedes contar lo ocurrido.',
    farewell: 'No voy a dejar que el ruido del mar se lleve tu nombre. Estoy sosteniendo tu mano. Tu historia viajará con quienes encontraron la salida gracias a ti.',
    sacrifice: 'Las barcas alcanzaron el canal. La luz que mantuviste encendida les mostró el camino. Ahora deja que alguien se quede a tu lado.',
    victory: '¡Nadie falta! Esta merece una comida enorme. Pero primero quiero que venga todo el mundo: no pienso empezar sin ustedes.',
    skillReplies: ['Un señuelo de navegación. Haz que el vigía mire donde tú quieres, no donde estás.','Acrobacia entre mástiles. Si no puedes aterrizar, todavía no has terminado el salto.','Esgrima de abordaje. Practicaremos el corte con la cubierta moviéndose, como será de verdad.','Rescate con cabos. Comprueba el nudo una vez más antes de pedirle a alguien que confíe en él.'],
  },
  demonslayer: {
    mentor: character('tanjiro','Tanjiro Kamado','Tu entrenamiento antes del alba'),
    guide: character('tanjiro','Tanjiro Kamado','La senda de la posada'),
    care: character('shinobu','Shinobu Kochō','A tu lado entre las glicinas'),
    hope: character('tanjiro','Tanjiro Kamado','Un compañero en el camino'),
    origin: 'Hay muchas formas de llegar a este camino. Quiero escuchar la tuya antes de entrar en ese bosque. ¿De dónde vienes?',
    skill: 'Vamos a encontrar una forma de luchar que puedas sostener cuando tengas miedo. ¿Qué entrenamiento quieres empezar conmigo?',
    training: 'Escucha tu respiración entre un movimiento y otro. ¿Qué quieres practicar antes de que caiga la noche?',
    mission: 'Siento personas dentro de la posada. Podemos buscar el origen de las luces, llegar a sus habitaciones o enfrentarnos al guardián. ¿Por dónde empezamos?',
    clue: 'Esa mecha no consume aceite. Creo que puede estar unida al hechizo. ¿Nos detenemos a entenderla antes de avanzar?',
    crisis: 'Todavía hay un camino hacia la salida. Escucha cómo estás respirando y dime qué puedes hacer sin dejar a los demás atrás.',
    finale: 'El amanecer está cerca. Quiero escucharte antes del último movimiento. ¿Cómo elegimos que termine esta noche?',
    wounded: 'Vamos a detenernos un momento. Puedo revisar tus heridas, pero necesito que me digas la verdad sobre tu dolor. ¿A quién atendemos primero?',
    loss: '{companion} murió esta noche. No voy a pedirte que sonrías ni que escondas lo que sientes. ¿Qué necesitas antes de volver a caminar?',
    farewell: 'Estoy aquí junto a tu camilla. Puedes descansar; ya no tienes que acompasar la respiración a ningún ataque. Habrá alguien que recuerde tu nombre cuando florezcan de nuevo las glicinas.',
    sacrifice: 'Los viajeros han visto el amanecer. Los que protegiste tienen una mañana más. Yo voy a quedarme contigo mientras llega la luz.',
    victory: 'Todos pueden ver el amanecer. Quisiera que nos sentáramos juntos un momento antes de partir; hay cosas buenas que también merecen recordarse.',
    skillReplies: ['Pasos de eco. Practicaremos el ritmo hasta que puedas cambiarlo sin perder la respiración.','Respiración evasiva. Apartarte de un golpe puede darte el tiempo que otra persona necesita.','Corte de concentración. Encontraremos el momento preciso, sin gastar tu aliento en cada movimiento.','Protección de glicina. Aprender a preparar un refugio también puede cambiar el final de una noche.'],
  },
  dragonball: {
    mentor: character('goku','Son Goku','Tu entrenamiento en el valle'),
    guide: character('bulma','Bulma','El plano del regulador'),
    care: character('bulma','Bulma','En el refugio del taller'),
    hope: character('goku','Son Goku','Un compañero de entrenamiento'),
    origin: 'Antes de entrenar juntos cuéntame un poco de ti. ¿De dónde vienes y con quién aprendiste a usar tu fuerza?',
    skill: 'Vamos a probar algo que puedas controlar, incluso cuando estés cansado. ¿Cuál quieres que sea tu primera técnica?',
    training: 'No hace falta romper otra roca para saber que estás aprendiendo. ¿Practicamos el control, un movimiento conjunto o un poco más de potencia?',
    mission: 'Si revientan esa máquina, el valle puede recibir toda la descarga. Miren el plano: ¿investigamos el circuito, sacamos a la gente o abrimos el acceso?',
    clue: 'El cable de retorno no está donde Varek quiere que miremos. ¿Me ayudas a comprobarlo antes de que alguien lance otro ataque?',
    crisis: 'Todavía puedes elegir cómo usar lo que te queda. No confundas un último esfuerzo con tener que hacerlo todo a solas.',
    finale: 'Ya viste lo que puede hacer tu fuerza. Ahora dime para qué quieres usarla en este último movimiento.',
    wounded: 'Puedes sentarte aquí junto al taller. Tengo vendas y agua; no una solución mágica. ¿Me dejas ayudarte antes de volver al núcleo?',
    loss: '{companion} murió y no voy a prometerte que algo vaya a borrarlo. Podemos sentarnos un momento. Después pensaremos en quienes aún necesitan salir.',
    farewell: 'Estoy a tu lado. No necesitas guardar fuerzas para otro combate. Voy a contarles quién eras, no solo lo fuerte que llegaste a ser.',
    sacrifice: 'La ciudad sigue en pie. Los demás están fuera del alcance de la descarga. Puedes soltar mi mano cuando necesites descansar; yo no me iré.',
    victory: '¡Todos bien! Ahora sí tenemos una historia que contar después del entrenamiento. Y tiempo para comer algo juntos.',
    skillReplies: ['Imagen residual. Vamos a conseguir que tu rival siga un movimiento que ya terminaste.','Vuelo de evasión. Llegar con ki para volver será parte del ejercicio.','Onda de energía. Primero aprenderemos a detenerla donde tú decidas.','Escudo de ki. Probaremos cuánto puedes sostener sin agotar tus fuerzas.'],
  },
  alchemist: {
    mentor: character('edward','Edward Elric','Tu entrenamiento de alquimia'),
    guide: character('riza','Riza Hawkeye','El plan del distrito'),
    care: character('winry','Winry Rockbell','En el taller de auxilio'),
    hope: character('alphonse','Alphonse Elric','Un aliado en la plaza'),
    origin: 'Antes de dibujar un círculo quiero saber qué has aprendido hasta ahora. ¿Vienes de un taller, de una academia o de buscar respuestas por tu cuenta?',
    skill: 'No vamos a empezar por una transmutación enorme. Quiero saber qué puedes comprender y controlar. ¿Qué disciplina quieres practicar conmigo?',
    training: 'Si no sabes por qué funciona, aún falta una parte del entrenamiento. ¿Qué necesitas comprobar antes de salir?',
    mission: 'Las casas están dentro del circuito. Necesitamos una decisión que incluya a quienes viven en ellas. ¿Dónde empiezas la misión?',
    clue: 'Este plano deja un canal sin explicar. Si lo seguimos, quizá podamos cortar el flujo antes de que alcance las viviendas. ¿Lo investigamos?',
    crisis: 'Todavía puedes cambiar el plan. Mira el estado del grupo antes de decidir qué precio estás dispuesto a pagar.',
    finale: 'La gente del distrito espera detrás de esa puerta. Quiero escuchar tu decisión antes de que el reloj dé otro paso.',
    wounded: 'Siéntate. Puedo arreglar muchas cosas en el taller, pero no voy a tratar tu cuerpo como una pieza que puedas reemplazar sin más. ¿Qué te duele?',
    loss: '{companion} murió. Voy a guardar sus cosas hasta que puedas venir a buscarlas. No tienes que hablar ahora si no quieres.',
    farewell: 'Estoy sentada junto a ti. Voy a sujetarte la mano, como cuando te pedía que no te movieras mientras terminaba una reparación. Esta vez no tienes que esperar por mí. Puedes descansar.',
    sacrifice: 'Las familias salieron del círculo. Quiero que lo sepas antes de cerrar los ojos. No voy a dejar que te recuerden solo por lo que te costó salvarlas.',
    victory: 'El reloj vuelve a andar y nadie se ha quedado atrás. Me gustaría que escucháramos juntos la música de la fiesta, cuando todo esté listo.',
    skillReplies: ['Réplica mineral. Primero identifica el material que tienes delante; no el que te gustaría tener.','Plataforma de evasión. Comprueba qué va a sostenerla antes de confiarle tu peso.','Ruptura estructural. Entender la unión puede ahorrarte destruir todo lo demás.','Muro de contención. Vamos a levantarlo pensando en quién necesita quedar protegido detrás.'],
  },
};

export const dialogueCharacters = [...new Map(Object.values(cast).flatMap(world => ['mentor','guide','care','hope'].map(role => world[role])).map(speaker => [speaker.id,speaker])).values()];

const roles = { origin:'mentor', skill:'mentor', promise:'hope', memory:'care', training:'mentor', mission:'guide', travel:'guide', branch:'guide', scout:'guide', rescue:'care', assault:'mentor', companion:'hope', camp:'care', dialogue:'care', clue:'guide', pact:'mentor', trap:'guide', triage:'care', scout2:'guide', enemy:'mentor', crossroads:'hope', crisis:'mentor', aftermath:'care', reckoning:'mentor', finale:'hope' };
export function speakerForNode(worldId, nodeId) { return cast[worldId]?.[roles[nodeId] || 'mentor'] || null; }

function sceneQuestion(state, voices) {
  const id=state.nodeId, world=state.world, story=world.story || settings[state.worldId];
  const friend=state.legacy ? 'tu equipo' : state.companion;
  const dead=state.companionHealth === 0;
  const hurt=typeof state.health === 'number' && state.health <= 3;
  if(id==='origin')return voices.origin;
  if(id==='skill')return voices.skill;
  if(id==='training')return voices.training;
  if(id==='mission')return voices.mission;
  if(id==='clue'||id==='scout2')return voices.clue;
  if(id==='finale')return dead ? `Antes de decidir, quiero reconocer a quien falta: ${friend} murió durante esta misión. ¿Cómo quieres afrontar el último movimiento con quienes aún pueden volver?` : voices.finale;
  if(id==='aftermath'&&dead)return voices.loss.replaceAll('{companion}',friend);
  if(id==='camp'||id==='triage')return dead ? `${voices.loss.replaceAll('{companion}',friend)} Todavía puedo ayudarte a cuidar tus propias heridas.` : hurt ? voices.wounded : `Estamos a salvo por un momento. ¿Prefieres recuperar fuerzas, revisar las heridas o preparar el siguiente movimiento? Yo me quedaré aquí mientras decides.`;
  if(id==='crisis')return `${voices.crisis}${dead ? ` ${friend} ya no puede cubrir ese frente; tendremos que contar con quienes siguen con vida.` : hurt ? ' Estás gravemente herido: una acción sin salida puede ser la última.' : ''}`;
  if(id==='promise')return `Antes de salir, quiero preguntarte algo más difícil que elegir una técnica. ¿Qué vas a prometernos cuando la misión te obligue a cambiar de plan?`;
  if(id==='memory')return `Hay una vida que te espera después de esta misión. ¿Quieres hablar de ella, acordar una señal de emergencia o quedarte un momento con nosotros?`;
  if(id==='travel')return `El camino hacia ${story.object} también puede herirte. ¿Seguimos el ritmo del grupo, comprobamos el desvío o avanzamos sin detenernos?`;
  if(['branch','scout','rescue','assault'].includes(id))return state.route==='assault' || id==='assault' ? `La defensa está delante de ti. ¿Usarás tu técnica para abrir paso o buscarás primero la unión más débil? No pierdas de vista a quienes avanzan contigo.` : state.route==='rescue' || id==='rescue' ? `Hay personas esperando nuestra ayuda. ¿Cómo vas a abrirles una salida sin convertir a otro miembro del equipo en la siguiente víctima?` : `Detente y mira conmigo. El enemigo ha dejado un patrón. ¿Usamos tu técnica, lo estudiamos o te expones antes de comprobarlo?`;
  if(id==='companion')return `¿Con quién quieres compartir el siguiente tramo? Escucha sus propuestas antes de elegir; pedir compañía también significa dejar que la otra persona tenga voz.`;
  if(id==='dialogue')return dead ? `No voy a hablar por ${friend}, pero sí puedo escucharte a ti. ¿Quieres recordar su voz, repasar la salida o quedarte en silencio?` : `Quiero saber cómo quieres que te escuchemos si el plan falla. ¿Lo hablamos ahora, mientras todavía podemos elegir con calma?`;
  if(id==='pact')return `El enemigo te está ofreciendo un atajo a cambio de separarte del grupo. ¿Lo rechazas, intentas comprobarlo o aceptas su promesa? Quiero que mires también lo que no está diciendo.`;
  if(id==='trap')return dead ? `No tienes a ${friend} al otro extremo del paso. ¿Cómo lo asegurarás antes de seguir?` : `Veo a ${friend} junto a la trampa. ¿Aseguras primero la salida, vas a buscarlo o sigues hacia el objetivo? La última decisión puede costarle la vida.`;
  if(id==='enemy')return `Ahora puedes ver cómo protege ${story.object}. ¿Qué quieres preguntarle antes de decidir tu siguiente movimiento?`;
  if(id==='crossroads')return `Quiero que el plan se parezca al grupo que tenemos ahora, también a sus heridas. ¿Lo adaptas, reúnes a los demás o sigues forzando tu cuerpo?`;
  if(id==='aftermath')return `Sigues aquí. Antes de volver a moverte quiero escucharte: ¿revisamos las heridas, preparas la última técnica o renovamos la promesa de regresar?`;
  if(id==='reckoning')return `Ya has visto cuánto cuesta cada decisión. ¿Qué significa ganar para ti ahora: conservar una salida, escuchar al grupo o arriesgarte otra vez?`;
  return 'Estoy aquí para escuchar tu decisión. ¿Cómo quieres seguir?';
}

function reactionToLastChoice(state, voices) {
  const last=state.history.at(-1);
  if(!last || state.ending)return null;
  const speaker=speakerForNode(state.worldId,last.node);
  if(last.events?.length)return null; // The present scene acknowledges losses, rather than inventing a living reply.
  if(last.node==='skill') {
    const index=state.world.skills.findIndex(skill=>skill.label===last.choice);
    return index>=0 ? {speaker,text:voices.skillReplies[index]} : null;
  }
  if(last.node==='origin')return {speaker,text:`${last.choice}. Gracias por contármelo. Ahora quiero saber qué vas a aprender antes de salir.`};
  if(last.node==='promise')return {speaker,text:state.flags.includes('promise') ? 'Escuché tu promesa. Voy a recordarla cuando tengamos que elegir entre llegar antes y llegar juntos.' : 'Te he escuchado. Cuando el plan cambie, todavía podrás decidir cómo actuar.'};
  if(last.node==='camp'||last.node==='triage')return {speaker,text:'Bien. Gracias por detenerte a decidir qué necesitabas antes de seguir.'};
  return null;
}

export function getSceneDialogue(state) {
  if(!state?.node || !cast[state.worldId])return null;
  const voices=cast[state.worldId];
  const speaker=speakerForNode(state.worldId,state.nodeId);
  const direction=state.nodeId==='skill' ? `${speaker.name} se coloca frente a ti para comenzar el entrenamiento.` : state.nodeId==='mission' ? `${speaker.name} despliega el mapa y espera tu decisión.` : state.nodeId==='triage' ? `${speaker.name} prepara las curas y te escucha antes de acercarse.` : null;
  return { speaker, text:sceneQuestion(state,voices), direction, label:state.nodeId==='skill' ? 'ENTRENAMIENTO / TE PREGUNTA' : 'ENCUENTRO / TE HABLA', reaction:reactionToLastChoice(state,voices) };
}

export function getReplyLabel(nodeId, choice) {
  if(nodeId==='skill')return `Quiero aprender ${choice.label}.`;
  if(nodeId==='origin')return `Mi origen: ${choice.label}.`;
  const replies={
    promise:{people:'Prometo que nadie se quedará atrás.',understand:'Quiero entender la amenaza antes de decidir.',prove:'Esta vez quiero demostrar que puedo avanzar.'},
    training:{control:'Quiero practicar el control.',pair:'Ensayemos una maniobra conjunta.',power:'Quiero descubrir hasta dónde llega mi técnica.'},
    mission:{scout:'Quiero investigar antes de exponernos.',rescue:'Primero quiero llegar a las personas atrapadas.',assault:'Voy a abrir camino hacia la amenaza.'},
    camp:{rest:'Necesito recuperar fuerzas antes de seguir.',care:'Quiero que atendamos las heridas.',map:'Revisemos el plan con lo que sabemos.'},
    dialogue:{respect:'Quiero que nos escuchemos hasta el final.',route:'Repasemos nuestra señal de emergencia.',silence:'Necesito quedarme unos minutos en silencio.'},
    finale:{unite:'Lo haremos juntos, siguiendo el plan.',outsmart:'Usaré la clave que descubrimos.',duel:'Voy a desafiarlo con mi última técnica.',protect:'Cubriré la salida para proteger al grupo.',sacrifice:'Me quedaré para que los demás escapen.',retreat:'Quiero que nos repleguemos y pidamos refuerzos.'},
  };
  if(replies[nodeId]?.[choice.id])return replies[nodeId][choice.id];
  return choice.label;
}

export function getEndingDialogue(state, ending) {
  if(!ending || !cast[state.worldId])return null;
  const voices=cast[state.worldId];
  const friend=state.legacy ? 'tu equipo' : state.companion;
  const fate=ending.fate;
  const dying=fate==='fallen'||fate==='sacrifice';
  const speaker=fate==='triumph' ? voices.hope : fate==='strategist'||fate==='retreat' ? voices.guide : voices.care;
  let text;
  if(fate==='triumph')text=voices.victory;
  else if(fate==='fallen')text=voices.farewell;
  else if(fate==='sacrifice')text=voices.sacrifice;
  else if(fate==='loss')text=voices.loss.replaceAll('{companion}',friend);
  else if(fate==='strategist')text='Leí tus notas y vi el momento en que el enemigo perdió el control del plan. Quiero que nos cuentes cómo encontraste esa salida; puede ayudar a quien venga después.';
  else if(fate==='retreat')text='Has vuelto con información y con la decisión de pedir ayuda. Vamos a preparar el siguiente paso con lo que aprendiste. No tienes que regresar ahí a solas.';
  else text=state.flags.includes('wounded')||state.flags.includes('companion-wounded') ? 'Ya terminó el enfrentamiento. Ahora quiero que dejemos espacio para las heridas y para quienes necesitan cuidados. Me quedaré contigo mientras descansas.' : 'Ya puedes bajar la guardia. Me gustaría escuchar cómo decidiste proteger al grupo y dejar una salida abierta para todos.';
  return {
    speaker,text,label:dying ? 'DESPEDIDA / TUS ÚLTIMOS INSTANTES' : fate==='loss' ? 'A TU LADO / DESPUÉS DE LA PÉRDIDA' : 'UN ÚLTIMO ENCUENTRO',
    direction:dying ? state.worldId==='naruto' ? 'En el puesto de auxilio, Sakura se sienta junto a tu camilla y toma tu mano. La escena recuerda tus últimos instantes.' : `${speaker.name} se queda a tu lado. La escena recuerda los últimos momentos de tu protagonista.` : fate==='loss' ? `${speaker.name} guarda un momento de silencio por ${friend}.` : `${speaker.name} se acerca cuando termina la misión.`,
  };
}
