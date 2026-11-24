// JS: Тренировочный протокол и данные программы (Powerlifting + Strongman Hybrid)

const DEFAULT_PROGRAM = {
  athlete: {
    name: "Александр Громов",
    weight: 95.0,
    targetWeight: 125.0,
    height: 190,
    wingspan: 203,
    prs: {
      deadlift: 230.0,
      bench: 140.0,
      squat: 190.0
    }
  },

  // Протокол динамической мобилизации (перед тренировкой)
  warmupProtocol: [
    { id: "w1", title: "90/90 Мобилизация тазобедренных", desc: "По 10 плавных переходов на каждую сторону. Раскрытие капсулы сустава под классику.", done: false },
    { id: "w2", title: "Ягодичный мостик на одной ноге", desc: "2 подхода по 10 повторений. Нейромышечная активация большой ягодичной перед срывом.", done: false },
    { id: "w3", title: "Разгибания грудного отдела (Т-спайн)", desc: "10 повторов на валике или в планке. Жёсткость грудного отдела под съём штанги.", done: false },
    { id: "w4", title: "Face Pulls / Разводка с резиной", desc: "2 подхода по 15 повторов. Активация ротаторной манжеты и средней трапеции.", done: false },
    { id: "w5", title: "Кубковый присед с паузой внизу", desc: "10 повторений с лёгким весом или без. Проверка глубины седа и симметрии стоп.", done: false }
  ],

  // Протокол заминки и декомпрессии (после тренировки)
  cooldownProtocol: [
    { id: "c1", title: "Пассивный вис на турнике с расслаблением", desc: "2 подхода по 30–45 секунд. Снятие осевой компрессии с межпозвоночных дисков.", done: false },
    { id: "c2", title: "Растяжка подвздошно-поясничной мышцы", desc: "По 45 секунд в выпаде на каждую ногу. Снятие гипертонуса после приседа и тяги.", done: false },
    { id: "c3", title: "Поза ребёнка (растяжка широчайших)", desc: "60 секунд глубокого вытяжения рук вперёд на полу.", done: false },
    { id: "c4", title: "Диафрагмальное дыхание 4–7–8", desc: "2 минуты лёжа на спине: 4 сек вдох, 7 сек задержка, 8 сек выдох (сброс симпатики).", done: false }
  ],

  // 4 тренировочных дня
  days: [
    {
      id: "day-1",
      dayName: "Понедельник",
      shortTitle: "Пн · Д1",
      title: "Heavy Deadlift & Comp Bench",
      subtitle: "Тяжёлая соревновательная тяга + Жим с паузой + Стронгмен-хват",
      exercises: [
        {
          id: "ex-d1-1",
          name: "Становая тяга (Соревновательная)",
          category: "deadlift",
          type: "powerlifting",
          style: "Классика", // Переключатель: Классика / Сумо
          target1RM: 230.0,
          topSetTarget: 215.0,
          topSetReps: 2,
          backoffSetsCount: 3,
          backoffPercent: 0.86, // ~185 кг
          backoffReps: 3,
          notes: "Твои рычаги (размах 203 см) созданы для классики. Мощный срыв ногами, на фиксации своди лопатки без переразгибания поясницы."
        },
        {
          id: "ex-d1-2",
          name: "Жим лёжа соревновательный",
          category: "bench",
          type: "powerlifting",
          target1RM: 140.0,
          topSetTarget: 125.0,
          topSetReps: 3,
          backoffSetsCount: 3,
          backoffPercent: 0.88, // ~110 кг
          backoffReps: 4,
          notes: "Пауза на груди 1 секунда по правилам IPF. Пятки вжаты в пол, лопатки сведены в замок."
        },
        {
          id: "ex-d1-3",
          name: "Стронгмен: Тяга Крока (Kroc Rows)",
          category: "accessory",
          type: "strongman",
          targetWeight: 52.0,
          setsCount: 2,
          reps: "15-20",
          restTime: 180,
          notes: "Тяжёлая гантель в упоре. Контролируемый взрыв. Адская накачка широчайших и выносливости хвата для становой."
        },
        {
          id: "ex-d1-4",
          name: "Армейский жим стоя (OHP)",
          category: "accessory",
          type: "strongman",
          targetWeight: 75.0,
          setsCount: 3,
          reps: "6-8",
          restTime: 180,
          notes: "Фундамент для будущих лог-лифтов стронга и здоровья плечевого пояса."
        }
      ]
    },
    {
      id: "day-2",
      dayName: "Вторник",
      shortTitle: "Вт · Д2",
      title: "Competition Squat & Upper Back",
      subtitle: "Соревновательный присед + Присед с паузой + Зерхер",
      exercises: [
        {
          id: "ex-d2-1",
          name: "Присед со штангой на спине",
          category: "squat",
          type: "powerlifting",
          target1RM: 190.0,
          topSetTarget: 172.5,
          topSetReps: 3,
          backoffSetsCount: 3,
          backoffPercent: 0.85, // ~147.5 кг
          backoffReps: 4,
          notes: "Чёткий соревновательный угол (ниже параллели). Взгляд вперёд, разведение коленей по вектору стоп."
        },
        {
          id: "ex-d2-2",
          name: "Присед с паузой 2 сек в нижней точке",
          category: "squat",
          type: "powerlifting",
          targetWeight: 135.0,
          setsCount: 3,
          reps: 3,
          restTime: 180,
          notes: "Пауза в мёртвой точке без расслабления корсета. Развивает колоссальную силу выхода из седа."
        },
        {
          id: "ex-d2-3",
          name: "Жим штанги узким хватом",
          category: "bench",
          type: "powerlifting",
          targetWeight: 105.0,
          setsCount: 3,
          reps: 6,
          restTime: 180,
          notes: "Хват на ширине плеч. Мощный трицепсовый дожим для локаута на жиме лёжа."
        },
        {
          id: "ex-d2-4",
          name: "Стронгмен: Присед / Удержание Зерхера",
          category: "accessory",
          type: "strongman",
          targetWeight: 110.0,
          setsCount: 3,
          reps: "6-8",
          restTime: 180,
          notes: "Штанга на сгибе локтей перед собой. Превращает кор и верх спины в монолитную плиту."
        }
      ]
    },
    {
      id: "day-3",
      dayName: "Четверг",
      shortTitle: "Чт · Д3",
      title: "Deadlift Pause & Bench Volume",
      subtitle: "Тяга с паузой под коленом + Объёмный жим + Тяга к поясу",
      exercises: [
        {
          id: "ex-d3-1",
          name: "Тяга с паузой 2 сек у колена",
          category: "deadlift",
          type: "powerlifting",
          style: "Классика",
          target1RM: 230.0,
          targetWeight: 165.0,
          setsCount: 4,
          reps: 3,
          restTime: 180,
          notes: "Остановка на 2 секунды ровно на 2 см ниже коленной чашечки. Не перегружает ЦНС, но ставит идеальную траекторию срыва."
        },
        {
          id: "ex-d3-2",
          name: "Жим лёжа (Объёмная волна)",
          category: "bench",
          type: "powerlifting",
          target1RM: 140.0,
          topSetTarget: 120.0,
          topSetReps: 4,
          backoffSetsCount: 3,
          backoffPercent: 0.90, // ~107.5 кг
          backoffReps: 5,
          notes: "Работа над стабильностью моста и симметрией жима."
        },
        {
          id: "ex-d3-3",
          name: "Тяга штанги в наклоне (Пендли / к поясу)",
          category: "accessory",
          type: "powerlifting",
          targetWeight: 110.0,
          setsCount: 4,
          reps: 8,
          restTime: 180,
          notes: "Срыв с пола в каждом повторении. Строит широчайшие под жимовую подушку."
        },
        {
          id: "ex-d3-4",
          name: "Стронгмен: Швунг жимовой (Push Press)",
          category: "accessory",
          type: "strongman",
          targetWeight: 85.0,
          setsCount: 3,
          reps: "4-5",
          restTime: 180,
          notes: "Взрывной импульс ногами в жим над головой. Развивает общую координацию и взрывную силу тела."
        }
      ]
    },
    {
      id: "day-4",
      dayName: "Суббота",
      shortTitle: "Сб · Д4",
      title: "Heavy Block Pulls & Farmer's Walk",
      subtitle: "Тяга с плинтов + Наклонный жим + Прогулка фермера",
      exercises: [
        {
          id: "ex-d4-1",
          name: "Тяга штанги с плинтов (5–7 см)",
          category: "deadlift",
          type: "powerlifting",
          target1RM: 230.0,
          topSetTarget: 220.0,
          topSetReps: 2,
          backoffSetsCount: 2,
          backoffPercent: 0.88, // ~195 кг
          backoffReps: 3,
          notes: "Отработка локаута и привыкание ЦНС к сверхмаксимальным весам без нагрузки на срыв."
        },
        {
          id: "ex-d4-2",
          name: "Жим гантелей на наклонной скамье 30°",
          category: "bench",
          type: "accessory",
          targetWeight: 42.0,
          setsCount: 3,
          reps: "8-10",
          restTime: 150,
          notes: "Гипертрофия верха грудных мышц и передних дельт."
        },
        {
          id: "ex-d4-3",
          name: "Стронгмен: Прогулка фермера (Farmer's Walk)",
          category: "accessory",
          type: "strongman",
          targetWeight: 45.0, // на руку
          setsCount: 3,
          reps: "30 метров",
          restTime: 180,
          notes: "Тяжёлые гантели или треп-гриф. Кор в натяжении, короткие быстрые шаги. Непревзойдённый хват и трапеции."
        },
        {
          id: "ex-d4-4",
          name: "Подтягивания нейтральным / широким хватом",
          category: "accessory",
          type: "powerlifting",
          targetWeight: 0, // собственный вес 95 кг
          setsCount: 3,
          reps: "8-10",
          restTime: 120,
          notes: "Растяжение и разгрузка позвоночника под собственным весом."
        }
      ]
    }
  ],

  // 6 приёмов пищи без калорий
  meals: [
    { id: "m1", title: "Приём 1: Плотный завтрак", desc: "Яйца, овсянка/гречка, ягоды, орехи", done: false },
    { id: "m2", title: "Приём 2: Утренний перекус", desc: "Протеиновый коктейль / творог + банан", done: false },
    { id: "m3", title: "Приём 3: Сытный обед", desc: "Стейк / говядина / индейка + рис / макароны твердых сортов", done: false },
    { id: "m4", title: "Приём 4: Предтренировочный приём", desc: "Сложные углеводы + легкоусвояемый белок", done: false },
    { id: "m5", title: "Приём 5: Ужин после тренировки", desc: "Рыба / птица + картофель / крупа + свежие овощи", done: false },
    { id: "m6", title: "Приём 6: Ночной восстановительный перекус", desc: "Казеин / творог 5% + ложка арахисовой пасты", done: false }
  ],

  // Базовый протокол добавок и препаратов
  pharmaProtocol: [
    { id: "p1", name: "Креатин моногидрат", dose: "5 г с соком/водой", time: "Утро", done: false },
    { id: "p2", name: "Омега-3 (EPA/DHA)", dose: "2000 мг концентрат", time: "С завтраком", done: false },
    { id: "p3", name: "Витамин D3 + K2", dose: "5000 МЕ", time: "С жирной пищей", done: false },
    { id: "p4", name: "Цинк пиколинат + Магний бисглицинат", dose: "25мг Zn + 400мг Mg", time: "Перед сном", done: false },
    { id: "p5", name: "Протокол препаратов (индивидуально)", dose: "По расписанию курса", time: "Фикс. день", done: false }
  ]
};

// Функция генерации подводящих подходов (пирамида разминки)
function generateWarmupSets(targetWeight) {
  if (targetWeight <= 60) {
    return [
      { weight: 20, reps: 10, note: "Пустой гриф" },
      { weight: 40, reps: 5, note: "Легкий вес" }
    ];
  }

  const steps = [];
  steps.push({ weight: 20, reps: 10, note: "Пустой гриф" });

  const p50 = Math.round((targetWeight * 0.50) / 2.5) * 2.5;
  const p65 = Math.round((targetWeight * 0.65) / 2.5) * 2.5;
  const p80 = Math.round((targetWeight * 0.80) / 2.5) * 2.5;
  const p90 = Math.round((targetWeight * 0.90) / 2.5) * 2.5;

  if (p50 > 20) steps.push({ weight: p50, reps: 5, note: "50% темп" });
  if (p65 > p50) steps.push({ weight: p65, reps: 3, note: "65% взрыв" });
  if (p80 > p65) steps.push({ weight: p80, reps: 2, note: "80% траектория" });
  if (p90 > p80 && targetWeight >= 160) steps.push({ weight: p90, reps: 1, note: "90% настрой" });

  return steps;
}
