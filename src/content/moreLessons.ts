/**
 * More "Pensar" lessons, built from the grammar points in the material you
 * shared (articles and gender, the -é / -ó past, Voy a / Va a). The example
 * sentences are written fresh for this game, many of them for the clinic.
 */
export interface MoreLesson { id: string; title: string; rule: string; items: [string, string][] }

export const MORE_LESSONS: MoreLesson[] = [
  {
    id: 'b-genero',
    title: 'El / un and la / una',
    rule: 'Masculine words take el (the) or un (a). Feminine words take la or una. Words ending in -ión are feminine: la conversación, una opinión.',
    items: [
      ['the doctor', 'el doctor'], ['a dentist', 'un dentista'], ['the cable', 'el cable'], ['an animal', 'un animal'],
      ['the conversation', 'la conversación'], ['an opinion', 'una opinión'], ['the house', 'la casa'], ['a celebration', 'una celebración'],
      ['the class', 'la clase'], ['a lesson', 'una lección'], ['the hospital', 'el hospital'], ['the injection', 'la inyección'], ['the prescription', 'la prescripción'],
    ],
  },
  {
    id: 'b-pasado',
    title: 'The past: -é (I) and -ó (you, he, she)',
    rule: 'For -ar verbs, I did it ends in -é and you / he / she did it ends in -ó: tomé, tomó; hablé, habló; compré, compró. Add no for "didn\'t".',
    items: [
      ['I took the train', 'Tomé el tren'], ['Did you take an aspirin?', '¿Tomó usted una aspirina?'],
      ["I didn't take a taxi", 'No tomé un taxi'], ['I invited Roberto', 'Invité a Roberto'],
      ['Did you invite your mom to the movies?', '¿Invitó usted a su mamá al cine?'], ['I talked with María on the phone', 'Hablé por teléfono con María'],
      ['Did you talk with the doctor?', '¿Habló usted con el doctor?'], ['I bought bread', 'Compré pan'],
      ['What did you buy?', '¿Qué compró usted?'], ['Where did you buy the roses?', '¿Dónde compró usted las rosas?'],
      ['When did you buy the car?', '¿Cuándo compró usted el automóvil?'], ['The nurse took your blood pressure', 'La enfermera tomó su presión'],
    ],
  },
  {
    id: 'b-voya',
    title: 'Voy a / Va a + verb',
    rule: 'Voy a + verb = I\'m going to. Va a + verb = you are / he is / she is going to (usted, él, ella). As a question: ¿Va a…?',
    items: [
      ["I'm going to buy a ticket", 'Voy a comprar un boleto'], ['Are you going to study?', '¿Va a estudiar?'],
      ["Yes, I'm going to study", 'Sí, voy a estudiar'], ["I'm going to be at home", 'Voy a estar en casa'],
      ["I'm not going to take the train", 'No voy a tomar el tren'], ['Are you going to the movies?', '¿Va al cine?'],
      ["I'm going by plane", 'Voy en avión'], ['The doctor is going to arrive soon', 'El doctor va a llegar pronto'],
      ["I'm going to take your temperature", 'Voy a tomarle la temperatura'], ['Are you going to the pharmacy tomorrow?', '¿Va a la farmacia mañana?'],
    ],
  },
  {
    id: 'b-pasado-er',
    title: 'The past of -er and -ir verbs: -í and -ió',
    rule: 'For -er and -ir verbs, I did it ends in -í and you / he / she did it ends in -ió: escribí, escribió; comprendí, comprendió. Leer changes i to y: leí, leyó.',
    items: [
      ['I wrote a letter', 'Escribí una carta'], ['My friend wrote a letter', 'Mi amigo escribió una carta'],
      ['I understood', 'Comprendí'], ['Did you understand?', '¿Comprendió usted?'], ['I described the pain', 'Describí el dolor'],
      ['I read the newspaper', 'Leí el periódico'], ['Did you read the newspaper?', '¿Leyó usted el periódico?'],
      ['She received good news', 'Recibió buenas noticias'], ['I sold my car', 'Vendí mi automóvil'],
    ],
  },
  {
    id: 'b-plural',
    title: 'We and they in the past: -amos / -aron, -imos / -ieron',
    rule: '-ar verbs: we = -amos, they / you all = -aron (trabajamos, trabajaron). -er and -ir verbs: we = -imos, they = -ieron (escribimos, escribieron).',
    items: [
      ['We worked a lot', 'Trabajamos mucho'], ['My friends worked a lot', 'Mis amigos trabajaron mucho'],
      ['Did you (pl.) work a lot?', '¿Trabajaron mucho?'], ['We studied', 'Estudiamos'], ['They prepared dinner', 'Prepararon la cena'],
      ['We wrote many letters', 'Escribimos muchas cartas'], ['They wrote many letters', 'Escribieron muchas cartas'],
      ['Did you (pl.) talk?', '¿Hablaron ustedes?'], ['We accepted', 'Aceptamos'], ['They parked', 'Estacionaron'],
      ['What happened?', '¿Qué pasó?'],
    ],
  },
  {
    id: 'b-estoy',
    title: 'Estoy + how you feel (-o for men, -a for women)',
    rule: 'Use estar for how someone is right now. The word ends in -o for a man and -a for a woman: estoy cansado, estoy cansada.',
    items: [
      ["I'm happy (man)", 'Estoy contento'], ["I'm happy (woman)", 'Estoy contenta'], ["I'm tired (woman)", 'Estoy cansada'],
      ["I'm alone (man)", 'Estoy solo'], ['Are you ready? (to a man)', '¿Está listo?'], ['Is María ready?', '¿Está lista María?'],
      ['Are you busy? (to a woman)', '¿Está ocupada?'], ['Are you worried? (to a man)', '¿Está preocupado?'],
      ["He's very sick", 'Está muy enfermo'], ["She's sick", 'Está enferma'], ['How are you feeling today?', '¿Cómo se siente hoy?'],
    ],
  },
  {
    id: 'b-ando',
    title: 'Estoy + -ando / -iendo (right now)',
    rule: '-ar verbs: -ando (hablando). -er and -ir verbs: -iendo (escribiendo). Between two vowels the i becomes y: leyendo, oyendo. Estoy / está / estamos / están + that word = doing it right now.',
    items: [
      ["I'm buying", 'Estoy comprando'], ["You're working", 'Está trabajando'], ["We're preparing", 'Estamos preparando'],
      ["They're copying", 'Están copiando'], ["I'm writing", 'Estoy escribiendo'], ["She's selling", 'Está vendiendo'],
      ["I'm reading", 'Estoy leyendo'], ["They're applauding", 'Están aplaudiendo'],
      ["I'm listening", 'Estoy escuchando'], ['The patient is resting', 'El paciente está descansando'],
    ],
  },
  {
    id: 'b-espero',
    title: 'Espero + verb (I hope to…)',
    rule: '"Espero" means "I hope" and is followed by the infinitive. Espero que sí = I hope so. Espero que no = I hope not.',
    items: [
      ['I hope to see the film', 'Espero ver la película'], ['I hope to understand', 'Espero comprender'],
      ['I hope to dance a lot', 'Espero bailar mucho'], ['I hope to work a lot', 'Espero trabajar mucho'],
      ['I hope to sell the house', 'Espero vender la casa'], ['I hope to buy a car', 'Espero comprar un auto'],
      ['I hope so', 'Espero que sí'], ['I hope not', 'Espero que no'],
    ],
  },
  {
    id: 'b-presente',
    title: 'Hablo / ¿Habla? (present: -o and -a)',
    rule: 'Right now or usually: I = -o (hablo, trabajo, estudio). You / he / she = -a (habla, trabaja). As a question: ¿Habla usted…?',
    items: [
      ['I speak Spanish', 'Hablo español'], ['Do you speak Italian?', '¿Habla italiano?'], ['I work at the bank', 'Trabajo en el banco'],
      ['Do you work at the store?', '¿Trabaja en la tienda?'], ['I study after dinner', 'Estudio después de la cena'],
      ['I work at the clinic', 'Trabajo en la clínica'], ['Do you speak English?', '¿Habla inglés?'],
    ],
  },
];

/**
 * Mezcla: pick one chunk from each column to build as many sentences as you
 * can. Every combination is correct Spanish. [Spanish, English] per chunk.
 */
export interface MezclaTable { id: string; title: string; cols: [string, string][][] }

export const MEZCLA: MezclaTable[] = [
  {
    id: 'm-es',
    title: 'El ___ es ___',
    cols: [
      [['El dentista', 'The dentist'], ['El doctor', 'The doctor'], ['El presidente', 'The president'], ['El estudiante', 'The student'], ['El pianista', 'The pianist'], ['El hospital', 'The hospital'], ['El restaurante', 'The restaurant'], ['El programa', 'The program'], ['El hotel', 'The hotel']],
      [['es', 'is'], ['no es', 'is not'], ['es muy', 'is very']],
      [['famoso', 'famous'], ['generoso', 'generous'], ['inteligente', 'intelligent'], ['excelente', 'excellent'], ['importante', 'important'], ['interesante', 'interesting'], ['paciente', 'patient'], ['curioso', 'curious'], ['terrible', 'terrible']],
    ],
  },
  {
    id: 'm-tome',
    title: 'Tomé / ¿Tomó usted?',
    cols: [
      [['Tomé', 'I took'], ['No tomé', "I didn't take"], ['¿Tomó usted', 'Did you take']],
      [['el tren', 'the train'], ['un taxi', 'a taxi'], ['el avión', 'the plane'], ['una aspirina', 'an aspirin'], ['sopa', 'soup'], ['té', 'tea']],
      [['anoche', 'last night'], ['esta mañana', 'this morning'], ['esta tarde', 'this afternoon'], ['la semana pasada', 'last week']],
    ],
  },
  {
    id: 'm-invite',
    title: 'Invité / ¿Invitó usted?',
    cols: [
      [['Invité', 'I invited'], ['No invité', "I didn't invite"], ['¿Invitó usted', 'Did you invite']],
      [['a mi mamá', 'my mom'], ['a Roberto', 'Roberto'], ['a un amigo', 'a friend'], ['a su papá', 'your dad']],
      [['al cine', 'to the movies'], ['al teatro', 'to the theater'], ['a mi casa', 'to my house'], ['a la fiesta', 'to the party']],
      [['anoche', 'last night'], ['esta mañana', 'this morning'], ['la semana pasada', 'last week']],
    ],
  },
  {
    id: 'm-hable',
    title: 'Hablé / ¿Habló usted?',
    cols: [
      [['Hablé', 'I talked'], ['No hablé', "I didn't talk"], ['¿Habló usted', 'Did you talk']],
      [['por teléfono', 'on the phone'], ['mucho', 'a lot'], ['en la clase', 'in class']],
      [['con Roberto', 'with Roberto'], ['con María', 'with María'], ['con la enfermera', 'with the nurse'], ['con el doctor', 'with the doctor']],
    ],
  },
  {
    id: 'm-compre',
    title: 'Compré / ¿Compró usted?',
    cols: [
      [['Compré', 'I bought'], ['No compré', "I didn't buy"], ['¿Compró usted', 'Did you buy']],
      [['una blusa', 'a blouse'], ['un suéter', 'a sweater'], ['pan', 'bread'], ['frutas', 'fruit'], ['rosas', 'roses'], ['chocolates', 'chocolates']],
      [['en la tienda', 'at the store'], ['en la farmacia', 'at the drugstore'], ['anoche', 'last night'], ['la semana pasada', 'last week']],
    ],
  },
  {
    id: 'm-voya',
    title: 'Voy a / ¿Va a?',
    cols: [
      [['Voy a', "I'm going to"], ['No voy a', "I'm not going to"], ['¿Va a', 'Are you going to']],
      [['visitar a María', 'visit María'], ['comprar un boleto', 'buy a ticket'], ['tomar el tren', 'take the train'], ['estudiar', 'study'], ['estar en casa', 'be at home'], ['llamar al doctor', 'call the doctor']],
      [['mañana', 'tomorrow'], ['esta tarde', 'this afternoon'], ['esta noche', 'tonight']],
    ],
  },
  {
    id: 'm-estoy',
    title: 'Estoy ___ / ¿Está ___?',
    cols: [
      [['Estoy', "I'm"], ['No estoy', "I'm not"], ['¿Está usted', 'Are you']],
      [['contento', 'happy (m.)'], ['contenta', 'happy (f.)'], ['cansado', 'tired (m.)'], ['cansada', 'tired (f.)'], ['ocupado', 'busy (m.)'], ['ocupada', 'busy (f.)'], ['preocupado', 'worried (m.)'], ['preocupada', 'worried (f.)']],
      [['esta mañana', 'this morning'], ['esta tarde', 'this afternoon'], ['esta noche', 'tonight']],
    ],
  },
  {
    id: 'm-ando',
    title: 'Estoy ___ -ando / -iendo',
    cols: [
      [['Estoy', "I'm"], ['Estamos', "We're"], ['Están', "They're"], ['¿Está usted', 'Are you']],
      [['trabajando', 'working'], ['estudiando', 'studying'], ['preparando la cena', 'making dinner'], ['escribiendo una carta', 'writing a letter'], ['leyendo el periódico', 'reading the newspaper'], ['comprando pan', 'buying bread']],
      [['en casa', 'at home'], ['en el despacho', 'at the office'], ['en la cocina', 'in the kitchen'], ['ahora', 'now']],
    ],
  },
  {
    id: 'm-plural',
    title: 'Trabajamos / Trabajaron',
    cols: [
      [['Trabajamos', 'We worked'], ['No trabajamos', "We didn't work"], ['Mis amigos trabajaron', 'My friends worked'], ['¿Trabajaron ustedes', 'Did you (pl.) work']],
      [['mucho', 'a lot'], ['en el hospital', 'at the hospital'], ['en casa', 'at home'], ['en el mercado', 'at the market']],
      [['anoche', 'last night'], ['esta mañana', 'this morning'], ['la semana pasada', 'last week'], ['el sábado', 'on Saturday']],
    ],
  },
  {
    id: 'm-presente',
    title: 'Trabajo / ¿Trabaja?',
    cols: [
      [['Trabajo', 'I work'], ['No trabajo', "I don't work"], ['Estudio', 'I study'], ['¿Trabaja usted', 'Do you work'], ['¿Estudia usted', 'Do you study']],
      [['en el banco', 'at the bank'], ['en la tienda', 'at the store'], ['en el hospital', 'at the hospital'], ['en casa', 'at home']],
      [['después de la cena', 'after dinner'], ['el sábado', 'on Saturday'], ['el lunes', 'on Monday'], ['mucho', 'a lot']],
    ],
  },
  {
    id: 'm-espero',
    title: 'Espero ___',
    cols: [
      [['Espero', 'I hope to']],
      [['ver la película', 'see the film'], ['comprender', 'understand'], ['bailar mucho', 'dance a lot'], ['vender la casa', 'sell the house'], ['comprar un auto', 'buy a car'], ['trabajar mucho', 'work a lot']],
      [['mañana', 'tomorrow'], ['el sábado', 'on Saturday'], ['esta noche', 'tonight'], ['pronto', 'soon']],
    ],
  },
];

/**
 * Words to remember, exactly as you shared them, as garden seeds ("Vocabulario").
 * Only letters lost in copying were restored (o cina → oficina, in erno → infierno).
 */
export const VOCAB: [string, string][] = [
  ['el programa', 'the program'], ['el rosbif', 'the roast beef'], ['el biftec', 'the beefsteak'], ['en', 'in'], ['mi', 'my'],
  ['paciente', 'patient'], ['interesante', 'interesting'], ['muy', 'very'], ['en mi opinión', 'in my opinion'],
  ['la lección', 'the lesson'], ['la clase', 'the class'], ['la cena', 'supper, dinner'], ['la casa', 'the house'], ['para', 'for; in order to'],
  ['su', 'your'], ['esta mañana', 'this morning'], ['esta tarde', 'this afternoon'], ['esta noche', 'tonight'], ['anoche', 'last night'],
  ['el diablo', 'the devil'], ['el infierno', 'hell'], ['la oficina', 'the office'], ['un hombre', 'a man'], ['una mujer', 'a woman'],
  ['la crema', 'the cream'], ['pero', 'but'], ['gracias', 'thank you'], ['bien', 'well'], ['en la casa', 'in the house'],
  ['en casa', 'at home'], ['en el refrigerador', 'in the refrigerator'], ['el club de tenis', 'the tennis club'],
  ['¿Cómo está usted?', 'How are you?'], ['en el sofá', 'on the sofa'], ['una blusa', 'a blouse'], ['un suéter', 'a sweater'],
  ['una tienda', 'a store'], ['el pan', 'the bread'], ['la carne', 'the meat'], ['la farmacia', 'the drugstore'],
  ['el automóvil', 'the automobile'], ['la agenda de automóviles', 'the automobile agency'], ['cuándo', 'when'], ['qué', 'what'],
  ['bonito', 'pretty'], ['chocolate', 'chocolate (drink)'], ['chocolates', 'chocolates (candy)'], ['Marta', 'Martha'],
  ['frutas', 'fruits'], ['rosas', 'roses'], ['la semana pasada', 'last week'], ['un boleto', 'a ticket'], ['en avión', 'by plane'],
  ['en tren', 'by train'], ['quien', 'who'], ['naturalmente', 'naturally'], ['probablemente', 'probably'], ['mañana', 'tomorrow'],
  ['el sábado', 'Saturday, on Saturday'], ['el domingo', 'Sunday, on Sunday'], ['el lunes', 'Monday, on Monday'],
  ['el martes', 'Tuesday, on Tuesday'], ['el miércoles', 'Wednesday, on Wednesday'], ['el jueves', 'Thursday, on Thursday'],
  ['el viernes', 'Friday, on Friday'], ['RECIBIR', 'to receive'], ['ESCRIBIR', 'to write'], ['SERVIR', 'to serve'],
  ['DESCRIBIR', 'to describe'], ['COMPRENDER', 'to understand'], ['VENDER', 'to sell'], ['el diccionario', 'the dictionary'],
  ['el calendario', 'the calendar'], ['un diario', 'a diary'], ['por favor', 'please'], ['el dormitorio', 'the bedroom'],
  ['discreto', 'discreet'], ['la secretaria', 'the secretary (fem.)'], ['el notario público', 'the notary public'],
  ['el obituario', 'the obituary'], ['absolutamente', 'absolutely'], ['una carta', 'a letter'], ['muchas (fem.)', 'many'],
  ['muchos teléfonos', 'many telephones'], ['muchas cartas', 'many letters'], ['es terrible', "it's terrible, is it terrible?"],
  ['eso es terrible', 'that is terrible'], ['es necesario', "it's necessary, is it necessary?"],
  ['es necesario escribir', 'it is necessary to write, is it necessary to write?'], ['el directorio de teléfono', 'the telephone directory'],
  ['hay', 'there is, there are, is there? are there?'], ['el despacho', 'the office'],
  ['el comedor', 'the dining room'], ['la sala', 'the living room'], ['la cocina', 'the kitchen'], ['la cocinera', 'the cook'],
  ['la criada', 'the maid'], ['la escalera', 'the staircase, ladder'], ['la almohada', 'the pillow'], ['las cortinas', 'the curtains, drapes'],
  ['las sábanas', 'the sheets'], ['la silla', 'the chair'], ['la cama', 'the bed'], ['la lámpara', 'the lamp'], ['la alfombra', 'the rug'],
  ['la mesa', 'the table'], ['el mes', 'the month'], ['el mercado', 'the market'], ['el mes de mayo', 'the month of May'],
  ['la playa', 'the beach'], ['las tarjetas postales', 'the post cards'], ['español', 'Spanish'], ['entusiasmo', 'enthusiasm'],
  ['las playas famosas', 'the famous beaches'], ['el efecto', 'the effect'], ['para comprender', 'in order to understand'],
  ['guapo, (sing.)', 'handsome'], ['guapos (pl.)', 'handsome'], ['hombres guapos', 'handsome men'], ['Roberto y yo', 'Robert and I'],
  ['una película', 'a film'], ['buenas noticias', 'good news'], ['pobre Carlos', 'poor Charles'], ['en cinco minutos', 'in five minutes'],
  ['nunca', 'never'], ['pronto', 'soon'], ['también', 'also'], ['en una hora', 'in an hour'], ['mejor', 'better'],
  ['Está muy enfermo.', "He's very sick."], ['dictar', 'to dictate'], ['la frase', 'the sentence'], ['perezoso (masc.)', 'lazy'],
  ['perezosa (fem.)', 'lazy'], ['una pipa', 'a pipe'], ['un cigarrillo', 'a cigarette'], ['¡Qué idea!', 'What an idea!'],
  ['un puro', 'a cigar'], ['mi abuelo', 'my grandfather'],
  ['una vez', 'one time, once'], ['dos veces', 'two times, twice'], ['tres veces', 'three times'], ['otra vez', 'again (another time)'],
  ['tal vez', 'maybe'], ['muchas veces', 'many times, often'], ['unas veces', 'sometimes'], ['una servilleta', 'a napkin'],
  ['un mantel', 'a tablecloth'], ['el plato', 'the plate, the dish'], ['los platos', 'the dishes'], ['el vaso', 'the glass'],
  ['un vaso de leche', 'a glass of milk'], ['un vaso de agua', 'a glass of water'], ['una taza', 'a cup'],
  ['una taza de café', 'a cup of coffee'], ['azúcar', 'sugar'], ['una propina', 'a tip'],
  ['Espero que sí.', 'I hope so.'], ['Espero que no.', 'I hope not.'],
];
