// JS: Калькулятор олимпийских соревновательных дисков и визуализация грифа

const PLATE_DENOMINATIONS = [
  { weight: 25.0, name: "25", colorClass: "plate-25", hex: "#DC2626", label: "25 кг (Красный)" },
  { weight: 20.0, name: "20", colorClass: "plate-20", hex: "#2563EB", label: "20 кг (Синий)" },
  { weight: 15.0, name: "15", colorClass: "plate-15", hex: "#EAB308", label: "15 кг (Жёлтый)" },
  { weight: 10.0, name: "10", colorClass: "plate-10", hex: "#16A34A", label: "10 кг (Зелёный)" },
  { weight: 5.0,  name: "5",  colorClass: "plate-5",  hex: "#F8FAFC", label: "5 кг (Белый)" },
  { weight: 2.5,  name: "2.5",colorClass: "plate-2_5",hex: "#1E293B", label: "2.5 кг (Чёрный)" },
  { weight: 1.25, name: "1.2",colorClass: "plate-1_25",hex: "#64748B", label: "1.25 кг (Хром)" }
];

const BAR_WEIGHT = 20.0; // Стандартный гриф 20 кг

function calculatePlates(targetTotalWeight) {
  if (targetTotalWeight < BAR_WEIGHT) {
    return {
      barWeight: BAR_WEIGHT,
      perSideWeight: 0,
      plates: [],
      remainder: 0
    };
  }

  const weightNeeded = targetTotalWeight - BAR_WEIGHT;
  let perSideNeeded = weightNeeded / 2;
  const resultPlates = [];

  for (const p of PLATE_DENOMINATIONS) {
    while (perSideNeeded >= p.weight - 0.001) {
      resultPlates.push(p);
      perSideNeeded -= p.weight;
    }
  }

  return {
    barWeight: BAR_WEIGHT,
    perSideWeight: (targetTotalWeight - BAR_WEIGHT) / 2,
    plates: resultPlates,
    remainder: Math.round(perSideNeeded * 100) / 100
  };
}

// Рендеринг визуального грифа в HTML
function renderBarbellVisual(calcResult) {
  if (!calcResult.plates || calcResult.plates.length === 0) {
    return `
      <div class="flex items-center gap-1.5 opacity-60">
        <div class="barbell-sleeve"></div>
        <div class="barbell-collar"></div>
        <span class="text-xs font-mono text-slate-400 pl-2">Только пустой гриф (20 кг)</span>
      </div>
    `;
  }

  let html = `
    <div class="flex items-center gap-1 overflow-x-auto py-1">
      <div class="barbell-sleeve" title="Втулка грифа"></div>
      <div class="barbell-collar" title="Замок/упор"></div>
  `;

  // Сортировка: самые тяжелые ближе к замку (классика соревнований)
  calcResult.plates.forEach(p => {
    html += `
      <div class="plate-item ${p.colorClass}" title="${p.weight} кг">
        ${p.name}
      </div>
    `;
  });

  html += `
      <div class="barbell-collar opacity-75" title="Замок"></div>
    </div>
  `;

  return html;
}

// Формирование компактного текстового описания
function renderPlatesText(calcResult) {
  if (!calcResult.plates || calcResult.plates.length === 0) {
    return "<div>Навешивать ничего не нужно: пустой гриф 20 кг.</div>";
  }

  // Группировка одинаковых блинов: например, "3 × 25 кг, 1 × 2.5 кг"
  const counts = {};
  calcResult.plates.forEach(p => {
    counts[p.weight] = (counts[p.weight] || 0) + 1;
  });

  let textList = [];
  Object.keys(counts).sort((a,b) => Number(b) - Number(a)).forEach(w => {
    const p = PLATE_DENOMINATIONS.find(x => x.weight === Number(w));
    textList.push(`<span class="font-bold text-white">${counts[w]} шт × ${w} кг</span> (${p ? p.label : ''})`);
  });

  return `
    <div class="text-slate-300">На каждую сторону:</div>
    <div class="pl-2 border-l-2 border-crimson space-y-0.5">
      ${textList.map(t => `<div>• ${t}</div>`).join('')}
    </div>
  `;
}
