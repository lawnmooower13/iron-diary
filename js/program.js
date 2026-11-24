/* ==========================================================================
   IRON DIARY · program.js
   Методика: 8-недельный волновой макроцикл, 4-дневный сплит,
   частая тяга с вариациями, стронгмен-подсобка, рацион с автопересчётом,
   протоколы разминки/заминки и система достижений.
   ========================================================================== */
import { roundTo } from './engine.js';

/* ------------------------------------------------------------ Макроцикл */
export const WEEKS = [
  { n: 1, wave: 1, phase: 'Втягивание',       short: 'ВТЯГ',   note: 'Вход в первую волну. Топ-сет 5 повт. на ~77,5%, запас 2 повт. Back-off 4×5 со сбросом 12%.' },
  { n: 2, wave: 1, phase: 'Накопление',       short: 'НАКОП',  note: 'Топ-сет 4 повт. на ~82,5%. Back-off 4×4. Объём держим, плотность и вес растут.' },
  { n: 3, wave: 1, phase: 'Интенсификация',   short: 'ИНТ',    note: 'Топ-сет 3 повт. на ~87,5%, RIR 1. Back-off 3×3 со сбросом 10%.' },
  { n: 4, wave: 2, phase: 'Накопление II',    short: 'НАКОП+', note: 'Вторая волна стартует выше первой: 5 повт. на ~80% + прибавка саморасчёта.' },
  { n: 5, wave: 2, phase: 'Интенсификация II', short: 'ИНТ+',  note: 'Топ-сет 3 повт. на ~88,5%. Back-off 3×3. Пауза у колена закрепляет углы классики.' },
  { n: 6, wave: 2, phase: 'Реализация',       short: 'ПИК',    note: 'Пик волны: топ-сет 2 повт. на ~92,5%, RIR 1. Тяговые вариации на максимуме цикла.' },
  { n: 7, wave: 0, phase: 'Разгрузка',        short: 'DELOAD', note: 'Без топ-сетов и плинтов. 3×3 на 65%, подсобка −40%. Суперкомпенсация ЦНС и связок.' },
  { n: 8, wave: 0, phase: 'Проходка · Тест',  short: 'ТЕСТ',   note: 'Контрольный сингл 97,5% с RIR 1 в базе. Автоматический пересчёт максимумов на новый цикл.' },
];

export const SCHEMES = {
  main: [
    { top: [5, 0.775, 2], drop: 0.12, bo: [4, 5] },
    { top: [4, 0.825, 2], drop: 0.12, bo: [4, 4] },
    { top: [3, 0.875, 1], drop: 0.10, bo: [3, 3] },
    { top: [5, 0.80, 2],  drop: 0.12, bo: [4, 5] },
    { top: [3, 0.885, 1], drop: 0.10, bo: [3, 3] },
    { top: [2, 0.925, 1], drop: 0.10, bo: [3, 2] },
    { work: [3, 3, 0.65, 3] },
    { top: [1, 0.975, 1], drop: 0.15, bo: [2, 2], test: true },
  ],
  secondary: [
    { top: [6, 0.75, 2],  drop: 0.10, bo: [3, 6] },
    { top: [5, 0.80, 2],  drop: 0.10, bo: [3, 5] },
    { top: [4, 0.84, 2],  drop: 0.10, bo: [3, 4] },
    { top: [6, 0.775, 2], drop: 0.10, bo: [3, 6] },
    { top: [4, 0.85, 1],  drop: 0.10, bo: [3, 4] },
    { top: [3, 0.88, 1],  drop: 0.10, bo: [3, 3] },
    { work: [3, 4, 0.62, 3] },
    { work: [3, 3, 0.70, 3] },
  ],
  overload: [
    { top: [3, 0.80, 3],  drop: 0.10, bo: [2, 3] },
    { top: [3, 0.85, 2],  drop: 0.10, bo: [2, 3] },
    { top: [2, 0.90, 2],  drop: 0.10, bo: [2, 2] },
    { top: [3, 0.825, 2], drop: 0.10, bo: [2, 3] },
    { top: [2, 0.90, 2],  drop: 0.10, bo: [2, 2] },
    { top: [1, 0.95, 1],  drop: 0.12, bo: [2, 2] },
    null,
    null,
  ],
  technique: [
    { work: [4, 4, 0.72, 3] },
    { work: [4, 3, 0.77, 3] },
    { work: [3, 3, 0.82, 2] },
    { work: [4, 4, 0.74, 3] },
    { work: [4, 3, 0.79, 3] },
    { work: [3, 2, 0.84, 2] },
    { work: [2, 3, 0.60, 3] },
    null,
  ],
  volume: [
    { work: [5, 5, 0.72, 3] },
    { work: [5, 4, 0.76, 3] },
    { work: [4, 4, 0.80, 2] },
    { work: [5, 5, 0.74, 3] },
    { work: [5, 4, 0.78, 2] },
    { work: [4, 3, 0.83, 2] },
    { work: [3, 5, 0.60, 3] },
    { work: [3, 3, 0.70, 3] },
  ],
  power: [
    { work: [5, 3, 0.75, 2] },
    { work: [5, 3, 0.78, 2] },
    { work: [5, 2, 0.83, 2] },
    { work: [5, 3, 0.77, 2] },
    { work: [5, 2, 0.82, 2] },
    { work: [4, 2, 0.86, 1] },
    { work: [3, 3, 0.62, 3] },
    { work: [3, 2, 0.72, 3] },
  ],
};

export const SCHEME_LABEL = {
  main: 'ОСНОВНОЕ', secondary: 'ВАРИАНТ', overload: 'ПЕРЕГРУЗ', technique: 'ТЕХНИКА',
  volume: 'ОБЪЁМ', power: 'МОЩНОСТЬ', acc: 'ПОДСОБКА', strong: 'СТРОНГМЕН',
};

/* ----------------------------------------------------- Библиотека упражнений */
export const EX = {
  dl: { name: 'Становая тяга классика', sub: 'соревновательная', base: 'dl', k: 1, scheme: 'main', lower: true, pull: true, ico: 'exDeadlift',
    cue: 'Стопы на ширине таза, хват вплотную к голеням. Размах рук 203 см даёт низкий замок — таз выше, чем в сумо, плечи чуть впереди грифа. Выбери люфт до щелчка, продави пол ногами.' },
  dl_block: { name: 'Тяга с плинтов', sub: 'гриф на 3–5 см ниже колена', base: 'dl', k: 1.05, scheme: 'overload', lower: true, pull: true, ico: 'exDeadlift',
    cue: 'Перегрузочная вариация: тренирует прохождение колена и локаут с весами выше соревновательного максимума без перегрузки связок таза.' },
  dl_def: { name: 'Тяга из ямы', sub: 'стоя на возвышении 4–5 см', base: 'dl', k: 0.88, scheme: 'technique', lower: true, pull: true, ico: 'exDeadlift',
    cue: 'Удлинённая амплитуда для мощности срыва ногами при длинных бёдрах. Скорость отрыва важнее веса.' },
  dl_knee: { name: 'Тяга с паузой у колена', sub: 'пауза 2 с ниже коленной чашечки', base: 'dl', k: 0.85, scheme: 'technique', lower: true, pull: true, ico: 'exDeadlift',
    cue: 'Жёсткая фиксация позиции на 2 секунды: широчайшие прижимают гриф к голени, плечи накрывают штангу.' },
  sq: { name: 'Присед со штангой', sub: 'соревновательный', base: 'sq', k: 1, scheme: 'main', lower: true, ico: 'exSquat',
    cue: 'Длинные бёдра: стойка чуть шире плеч, носки 25–30°, колени вперёд-наружу. Жёсткий вдох в пояс до снятия со стоек.' },
  sq_pause: { name: 'Присед с паузой', sub: 'пауза 2 с в нижней точке', base: 'sq', k: 0.87, scheme: 'secondary', lower: true, ico: 'exSquat',
    cue: 'Пауза в яме без расслабления кора. Выход вверх строго через давление в середину стопы, таз не отстреливает назад.' },
  bp: { name: 'Жим лёжа', sub: 'соревновательная пауза', base: 'bp', k: 1, scheme: 'main', ico: 'exBench',
    cue: 'Длинные руки: широкий соревновательный хват 81 см, высокий мост, лопатки сведены и опущены к тазу. Чёткая пауза на груди.' },
  bp_vol: { name: 'Жим лёжа · объём', sub: 'пауза 1 с, контроль темпа', base: 'bp', k: 1, scheme: 'volume', ico: 'exBench',
    cue: 'Наработка мышечного объёма грудных и стабильности моста. Каждый повтор по идентичной траектории.' },
  bp_close: { name: 'Жим узким хватом', sub: 'хват на ширине плеч', base: 'bp', k: 0.88, scheme: 'secondary', ico: 'exBench',
    cue: 'Дожим и масса трицепса. Локти под 45° к корпусу, касание нижней части груди.' },
  ohp: { name: 'Жим стоя', sub: 'строгий армейский жим', base: 'ohp', k: 1, scheme: 'secondary', ico: 'exOhp',
    cue: 'Ягодицы и пресс зажаты в монолит. Как только гриф проходит лоб — подай голову «в окно» под штангу.' },
  push_press: { name: 'Швунг жимовой', sub: 'взрывной толчок ногами + дожим', base: 'ohp', k: 1.15, scheme: 'power', ico: 'exOhp',
    cue: 'Стронгмен-паттерн: короткий подсед на 10 см, мощный импульс ногами и жёсткая фиксация над головой.' },

  /* Подсобка и стронгмен */
  row: { name: 'Тяга штанги в наклоне', sub: 'к поясу, корпус 35°', acc: { sets: 4, lo: 6, hi: 8, unit: 'reps', w: 100, step: 2.5, rest: 150, bar: true }, tag: 'acc', ico: 'exRow',
    cue: 'Массивная плита спины для моста и приседа: тяга к низу живота, пауза 1 с в пиковом сокращении.' },
  tbar: { name: 'Тяга Т-грифа', sub: 'узкая рукоять, пауза наверху', acc: { sets: 4, lo: 8, hi: 10, unit: 'reps', w: 75, step: 2.5, rest: 120 }, tag: 'acc', ico: 'exRow',
    cue: 'Толщина середины спины и ромбовидных. Грудь прижата или корпус жёстко зафиксирован.' },
  pendlay: { name: 'Тяга Пендлея', sub: 'взрывная с помоста каждый повтор', acc: { sets: 4, lo: 5, hi: 6, unit: 'reps', w: 95, step: 2.5, rest: 150, bar: true }, tag: 'acc', ico: 'exRow',
    cue: 'Корпус параллельно полу. Взрывной старт из мёртвой точки напрямую переносится на классическую тягу.' },
  pullup: { name: 'Подтягивания с весом', sub: 'на поясе, полная амплитуда', acc: { sets: 4, lo: 5, hi: 8, unit: 'reps', w: 10, step: 2.5, rest: 150, bwPlus: true }, tag: 'acc', ico: 'exCore',
    cue: 'Широчайшие удерживают гриф близко к голеням в тяге. Внизу полное растяжение.' },
  kroc: { name: 'Тяга Крока', sub: 'тяжёлая гантель без лямок на хват', acc: { sets: 2, lo: 15, hi: 20, unit: 'reps', w: 50, step: 2.5, rest: 120, perSide: true }, tag: 'strong', ico: 'exStrong',
    cue: 'Главное упражнение для стального хвата и верха спины. Без лямок, мощная амплитуда на 15–20 повторов.' },
  farmer: { name: 'Прогулка фермера', sub: 'тяжёлые гантели, по 30 м', acc: { sets: 4, lo: 30, hi: 30, unit: 'm', w: 45, step: 2.5, rest: 120, perSide: true }, tag: 'strong', ico: 'exStrong',
    cue: 'Функциональная мощь стронгмена: быстрые короткие шаги, трапеции и кор в статике, пальцы держат замок.' },
  suitcase: { name: 'Прогулка с чемоданом', sub: 'гантель в одной руке, 30 м', acc: { sets: 3, lo: 30, hi: 30, unit: 'm', w: 40, step: 2.5, rest: 90, perSide: true }, tag: 'strong', ico: 'exStrong',
    cue: 'Фронтальная стабильность кора: плечи строго горизонтально, корпус не наклоняется к гантели.' },
  zercher_hold: { name: 'Удержание Зерхера', sub: 'штанга в локтевых сгибах из рамы', acc: { sets: 3, lo: 20, hi: 30, unit: 's', w: 130, step: 5, rest: 120, bar: true }, tag: 'strong', ico: 'exStrong',
    cue: 'Снять со стоек на высоте пояса, зажать ягодицы и дышать под давлением. Броня для кора и грудного отдела.' },
  pinch: { name: 'Щипковый хват блинов', sub: 'два гладких диска пальцами', acc: { sets: 3, lo: 20, hi: 30, unit: 's', w: 20, step: 5, rest: 90 }, tag: 'strong', ico: 'exStrong',
    cue: 'Сила большого пальца для железного замка в тяге без лямок.' },
  ab_wheel: { name: 'Ролик для пресса', sub: 'контроль поясницы', acc: { sets: 3, lo: 8, hi: 12, unit: 'reps', w: 0, step: 0, rest: 90, bw: true }, tag: 'acc', ico: 'exCore',
    cue: 'Таз немного подкручен, поясница не прогибается.' },
  hlr: { name: 'Подъём ног в висе', sub: 'до перекладины + вис', acc: { sets: 3, lo: 10, hi: 15, unit: 'reps', w: 0, step: 0, rest: 90, bw: true }, tag: 'acc', ico: 'exCore',
    cue: 'Укрепляет пресс и сгибатели бедра, одновременно растягивая позвоночник после приседа.' },
  back_ext: { name: 'Гиперэкстензия с весом', sub: 'диск у груди, пауза 1 с', acc: { sets: 3, lo: 10, hi: 12, unit: 'reps', w: 20, step: 5, rest: 90 }, tag: 'acc', ico: 'exCore',
    cue: 'Трофика разгибателей спины и бицепса бедра между тяговыми днями.' },
};

/* -------------------------------------------------------- Недельный сплит */
export const DAYS = [
  { n: 1, dow: 'Пн', dowFull: 'ПН', heroLift: 'dl',
    title: () => 'Тяга тяжёлая',
    focus: 'Соревновательная классика, жим с паузой, плита спины, тяга Крока и фермер',
    ex: () => ['dl', 'bp', 'row', 'kroc', 'farmer', 'ab_wheel'] },
  { n: 2, dow: 'Вт', dowFull: 'ВТ', heroLift: 'sq',
    title: () => 'Присед тяжёлый',
    focus: 'Соревновательный присед, армейский жим стоя, Т-гриф и удержание Зерхера',
    ex: () => ['sq', 'ohp', 'tbar', 'zercher_hold', 'hlr'] },
  { n: 3, dow: 'Чт', dowFull: 'ЧТ', heroLift: 'dl_block',
    title: () => 'Плинты и швунг',
    focus: 'Перегрузочная тяга с плинтов, объёмный жим, жимовой швунг и чемодан',
    ex: () => ['dl_block', 'bp_vol', 'push_press', 'pullup', 'suitcase'] },
  { n: 4, dow: 'Сб', dowFull: 'СБ', heroLift: 'sq_pause',
    title: (w) => (w >= 4 && w <= 6 ? 'Пауза и колено' : 'Пауза и яма'),
    focus: 'Присед с паузой 2 с, техническая тяга, узкий жим, Пендлей и щипковый хват',
    ex: (w) => ['sq_pause', w >= 4 && w <= 6 ? 'dl_knee' : 'dl_def', 'bp_close', 'pendlay', 'back_ext', 'pinch'] },
];

export const sessionKey = (c, w, d) => `c${c}-w${w}-d${d}`;

export function buildDay(week, dayN, st) {
  const day = DAYS[dayN - 1];
  return day.ex(week).map(id => buildExercise(id, week, st)).filter(Boolean);
}

export function buildExercise(id, week, st) {
  const def = EX[id];
  if (!def) return null;
  const P = st.profile;
  if (def.acc) {
    const a = def.acc;
    const w = st.accW[id] ?? a.w;
    let n = a.sets;
    if (week === 7) n = Math.max(2, Math.round(n * 0.6));
    if (week === 8) n = Math.max(1, Math.round(n * 0.5));
    const sets = Array.from({ length: n }, () => ({ type: 'acc', w, r: a.hi, rir: 2, rest: a.rest }));
    return {
      id, kind: 'acc', tag: def.tag, name: def.name, sub: def.sub, cue: def.cue, unit: a.unit,
      perSide: !!a.perSide, bw: !!a.bw, bwPlus: !!a.bwPlus, step: a.step, lo: a.lo, hi: a.hi,
      bar: !!a.bar, ico: def.ico || 'exStrong', sets,
    };
  }
  const scheme = SCHEMES[def.scheme][week - 1];
  if (!scheme) return null;
  const baseMax = Math.round((P.maxes[def.base] || 0) * def.k);
  const limit = baseMax * 0.15;
  const adj = Math.max(-limit, Math.min(limit, st.adj[id] || 0));
  const W = (p) => Math.max(P.bar, roundTo(baseMax * p + adj));
  const sets = [];
  if (scheme.top) {
    const [r, p, rir] = scheme.top;
    const topW = W(p);
    sets.push({ type: 'top', w: topW, r, rir, rest: P.restTop, p });
    const [n, br] = scheme.bo;
    const bw = Math.max(P.bar, roundTo(topW * (1 - scheme.drop)));
    for (let i = 0; i < n; i++) sets.push({ type: 'bo', w: bw, r: br, rir: Math.min(3, rir + 2), rest: P.restMain, p: Math.round(p * (1 - scheme.drop) * 100) / 100 });
  } else {
    const [n, r, p, rir] = scheme.work;
    for (let i = 0; i < n; i++) sets.push({ type: 'work', w: W(p), r, rir, rest: P.restMain, p });
  }
  return {
    id, kind: def.scheme, name: def.name, sub: def.sub, cue: def.cue, lower: !!def.lower, pull: !!def.pull,
    bar: true, unit: 'reps', drop: scheme.drop || 0, test: !!scheme.test, base: def.base, baseMax,
    pct: Math.round((sets[0]?.p || 0.75) * 100), ico: def.ico || 'exDeadlift', sets,
  };
}

/* ----------------------------------------------------------- Питание ("Ешь по кнопкам") */
export const MEALS = [
  {
    id: 'm1', time: '07:30', title: 'Завтрак', type: 'ОСНОВНОЙ', art: 'mealBreakfast',
    baseKcal: 770, baseProt: 38,
    items: [
      { name: 'Яйца', amount: 4, unit: 'шт', step: 1 },
      { name: 'Овсянка', amount: 80, unit: 'г', step: 5 },
      { name: 'Молоко', amount: 250, unit: 'мл', step: 10 },
      { name: 'Банан', amount: 1, unit: 'шт', step: 1 },
    ],
    guide: '2 ладони белка · 2 кулака углеводов · фрукт',
  },
  {
    id: 'm2', time: '12:00', title: 'Обед', type: 'ОСНОВНОЙ', art: 'mealLunch',
    baseKcal: 825, baseProt: 47,
    items: [
      { name: 'Рис сухой', amount: 115, unit: 'г', step: 5 },
      { name: 'Курица или говядина', amount: 200, unit: 'г', step: 10 },
      { name: 'Овощи', amount: 150, unit: 'г', step: 10 },
      { name: 'Масло', amount: 12, unit: 'г', step: 2 },
    ],
    guide: '2 ладони мяса · 2 кулака гарнира · овощи',
  },
  {
    id: 'm3', time: '15:30', title: 'Коктейль', type: 'ДО ЗАЛА', art: 'mealShake',
    baseKcal: 935, baseProt: 54,
    items: [
      { name: 'Молоко', amount: 400, unit: 'мл', step: 10 },
      { name: 'Овсянка', amount: 80, unit: 'г', step: 5 },
      { name: 'Банан', amount: 1, unit: 'шт', step: 1 },
      { name: 'Арахисовая паста', amount: 30, unit: 'г', step: 5 },
      { name: 'Протеин', amount: 30, unit: 'г', step: 5 },
    ],
    guide: 'Быстрые и средние углеводы + сыворотка за 90 мин до штанги',
  },
  {
    id: 'm4', time: '19:30', title: 'Ужин', type: 'ПОСЛЕ ЗАЛА', art: 'mealDinner',
    baseKcal: 895, baseProt: 55,
    items: [
      { name: 'Паста сухая', amount: 115, unit: 'г', step: 5 },
      { name: 'Фарш 15% или индейка', amount: 200, unit: 'г', step: 10 },
      { name: 'Томатный соус и овощи', amount: 150, unit: 'г', step: 10 },
    ],
    guide: 'Восполнение гликогена после тяжёлой базы: 2 ладони белка + 2–3 кулака пасты/риса',
  },
  {
    id: 'm5', time: '22:30', title: 'На ночь', type: 'ПЕРЕКУС', art: 'mealNight',
    baseKcal: 430, baseProt: 40,
    items: [
      { name: 'Творог 5%', amount: 220, unit: 'г', step: 10 },
      { name: 'Орехи / миндаль', amount: 25, unit: 'г', step: 5 },
      { name: 'Ягоды или мёд', amount: 25, unit: 'г', step: 5 },
    ],
    guide: 'Медленный казеиновый белок для ночного восстановления мышц',
  },
];

export function scaleMeal(meal, scale = 1) {
  const kcal = Math.round(meal.baseKcal * scale);
  const prot = Math.round(meal.baseProt * scale);
  const items = meal.items.map(it => {
    const raw = it.amount * scale;
    const val = it.step >= 5 ? Math.max(it.step, Math.round(raw / it.step) * it.step) : Math.max(1, Math.round(raw));
    return { ...it, val };
  });
  return { ...meal, kcal, prot, items };
}

export const MEAL_FEEL = [
  { key: 'hard',  label: 'Тяжело',   bars: 1 },
  { key: 'meh',   label: 'Так себе', bars: 2 },
  { key: 'norm',  label: 'Норм',     bars: 3 },
  { key: 'good',  label: 'Хорошо',   bars: 4 },
  { key: 'great', label: 'Отлично',  bars: 5 },
];

export const MORNING_FEEL = [
  { key: 1, label: 'Разбит', bars: 1 },
  { key: 2, label: 'Тяжко',  bars: 2 },
  { key: 3, label: 'Норм',   bars: 3 },
  { key: 4, label: 'Бодро',  bars: 4 },
  { key: 5, label: 'Огонь',  bars: 5 },
];

export const WEEK_FEEL = [
  { key: 1, label: 'Провал', bars: 1 },
  { key: 2, label: 'Тяжело', bars: 2 },
  { key: 3, label: 'Норм',   bars: 3 },
  { key: 4, label: 'Хорошо', bars: 4 },
  { key: 5, label: 'Огонь',  bars: 5 },
];

export const WATER_TARGET = 4000;
export const SUPP_TIMES = ['Утро', 'День', 'До тренировки', 'После тренировки', 'Вечер', 'Перед сном'];
export const SUPP_KINDS = ['ДОБАВКА', 'ВИТАМИН', 'ПРЕПАРАТ', 'ИНЪЕКЦИЯ'];

export const DEFAULT_SUPPS = [
  { id: 'sp1', name: 'Креатин моногидрат', dose: '5 г', time: 'Утро',            kind: 'ДОБАВКА', sched: { type: 'daily' } },
  { id: 'sp2', name: 'Витамин D3',         dose: '5000 МЕ', time: 'Утро',         kind: 'ВИТАМИН', sched: { type: 'daily' } },
  { id: 'sp3', name: 'Омега-3',            dose: '3 г EPA+DHA', time: 'День',     kind: 'ДОБАВКА', sched: { type: 'daily' } },
  { id: 'sp4', name: 'Сывороточный изолят', dose: '30 г', time: 'После тренировки', kind: 'ДОБАВКА', sched: { type: 'training' } },
  { id: 'sp5', name: 'Магний бисглицинат', dose: '400 мг', time: 'Перед сном',    kind: 'ВИТАМИН', sched: { type: 'daily' } },
];

export const TRAINING_DOW = [1, 2, 4, 6];

/* ------------------------------------------------ Геймификация: Достижения */
export const ACHIEVEMENTS = [
  { id: 'first_set',   title: 'Первый подход',     desc: 'Отметь любой подход',           art: 'achFirst' },
  { id: 'full_day',    title: 'Полная тренировка', desc: 'Все подходы дня',               art: 'achDay' },
  { id: 'full_week',   title: 'Неделя закрыта',    desc: 'Закрой неделю',                 art: 'achWeek' },
  { id: 'new_pr',      title: 'Рекорд',            desc: 'Подход выше максимума',         art: 'achStar' },
  { id: 'full_food',   title: 'Сытый день',        desc: '100% калорий за день',          art: 'achFork' },
  { id: 'streak_7',    title: '7 дней по плану',   desc: 'Серия питания',                 art: 'achFlame' },
  { id: 'bw_100',      title: 'Сотка',             desc: 'Вес тела 100 кг',               art: 'ach100' },
  { id: 'bench_140',   title: 'Жим 140',           desc: 'Вернуть лучший жим',            art: 'achBench' },
  { id: 'total_600',   title: 'Сумма 600',         desc: 'Присед + жим + тяга',           art: 'achTotal' },
  { id: 'dl_parity',   title: 'Король классики',   desc: 'Тяга классикой 220+ кг',        art: 'achDeadlift' },
  { id: 'iron_grip',   title: 'Железный хват',     desc: 'Тяга Крока 20 повт. + фермер',  art: 'achGrip' },
  { id: 'bw_125',      title: 'Супертяж 125+',     desc: 'Целевая категория 125 кг',      art: 'achTitan' },
];

/* ------------------------------------------------ Протоколы подготовки */
export const PROTOCOLS = {
  pre: {
    title: 'Динамическая мобилизация',
    sub: 'Перед штангой · ~12 мин · ТБС, грудной отдел, ротаторы',
    groups: [
      { title: 'Разогрев и грудной отдел', items: [
        { id: 'p1', title: 'Гребля / велотренажёр', dose: '5 мин', cue: 'Пульс 115–120, лёгкая испарина', sec: 300 },
        { id: 'p2', title: 'Разгибание грудного на ролле', dose: '10 повт.', cue: '3 уровня лопаток, ягодицы на полу' },
        { id: 'p3', title: 'Ротация «книжка» лёжа на боку', dose: '8 / стор.', cue: 'Колени прижаты, взгляд за рукой' },
      ]},
      { title: 'Тазобедренные и ягодичные', items: [
        { id: 'p5', title: 'Переходы 90/90 сидя', dose: '8 / стор.', cue: 'Внутренняя и наружная ротация бедра без помощи рук' },
        { id: 'p7', title: 'Глубокий гоблет-присед с паузой', dose: '60 с', cue: 'Локти разводят колени, раскрытие паха и голеностопа', sec: 60 },
        { id: 'p8', title: 'Ягодичный мост + шаги с лентой', dose: '2 × 15', cue: 'Активация средних ягодичных и кора' },
      ]},
      { title: 'Плечи и ЦНС', items: [
        { id: 'p11', title: 'Тяга ленты к лицу + ротация', dose: '2 × 15', cue: 'Ротаторная манжета и задняя дельта перед жимом' },
        { id: 'p14', title: 'Взрывные выпрыгивания с места', dose: '3 × 3', cue: 'Потенциация ЦНС перед тяжёлым топ-сетом' },
      ]},
    ],
  },
  post: {
    title: 'Декомпрессия после базы',
    sub: 'После тренировки · ~8 мин · снятие осевой компрессии',
    groups: [
      { title: 'Позвоночник и таз', items: [
        { id: 'q1', title: 'Пассивный вис на турнике', dose: '3 × 45 с', cue: 'Плечи расслаблены, глубокий выдох в живот', sec: 45 },
        { id: 'q3', title: 'Растяжка подвздошно-поясничной', dose: '60 с / стор.', cue: 'Выпад на колене, таз подкручен вперёд', sec: 60 },
        { id: 'q4', title: 'Поза голубя (грушевидная)', dose: '60 с / стор.', cue: 'Снятие тонуса с наружных ротаторов таза', sec: 60 },
      ]},
      { title: 'Даунрегуляция ЦНС', items: [
        { id: 'q5', title: 'Растяжка широчайших и грудных', dose: '45 с / стор.', cue: 'У силовой стойки с уводом таза назад', sec: 45 },
        { id: 'q7', title: 'Парасимпатическое дыхание 90/90', dose: '2 мин', cue: 'Ноги на скамье: вдох 4 с носом, выдох 8 с ртом', sec: 120 },
      ]},
    ],
  },
};

export function methodSections(profile) {
  const ape = profile.wingspan - profile.height;
  const apeIdx = (profile.wingspan / profile.height).toFixed(3).replace('.', ',');
  return [
    { title: 'Рычаги 190/203', body: `
      <p>Рост <b>${profile.height} см</b>, размах рук <b>${profile.wingspan} см</b>: индекс рычагов <b>${apeIdx}</b> (+${ape} см). Длинные руки опускают замок на 6–7 см ниже среднего, делая классическую тягу биомеханически идеальной и избавляя связки таза от перегрузки широкого сумо.</p>` },
    { title: 'Тяга 3 раза/нед', body: `
      <p><b>Пн:</b> тяжёлая соревновательная классика (топ-сет + back-off). <b>Чт:</b> перегрузочная тяга с плинтов ниже колена (+5% к классике, короткий рычаг). <b>Сб:</b> скоростная тяга из ямы (волна 1) или с паузой у колена (волна 2).</p>` },
    { title: 'Стронгмен и спина', body: `
      <p>Каждая тренировка содержит тяжёлую горизонтальную/вертикальную тягу для мышечной плиты спины (в наклоне, Т-гриф, Пендлей, подтягивания) и стронгмен-подсобку: тяга Крока 15–20 без лямок, прогулка фермера, чемодан, удержание Зерхера и жимовой швунг.</p>` },
  ];
}
