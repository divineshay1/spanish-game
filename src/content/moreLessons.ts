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
];

/**
 * Words to remember, exactly as you shared them, as garden seeds ("Vocabulario").
 * Only letters lost in copying were restored (o cina → oficina, in erno → infierno).
 */
export const VOCAB: [string, string][] = [
  ['el programa', 'the program'], ['el rosbif', 'the roast beef'], ['el biftec', 'the beefsteak'], ['en', 'in'], ['mi', 'my'],
  ['paciente', 'patient'], ['interesante', 'interesting'], ['muy', 'very'], ['en mi opinión', 'in my opinion'],
  ['la lección', 'the lesson'], ['la clase', 'the class'], ['la cena', 'supper, dinner'], ['la casa', 'the house'], ['para', 'for'],
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
];
