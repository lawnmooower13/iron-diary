/* ==========================================================================
   IRON DIARY · views/analytics.js — Модуль 5: аналитика, рекорды, бэкап
   ========================================================================== */
import * as S from '../store.js';
import {
  fmt, fmtInt, fmtSigned, dots, shortDate, parseKey, slopePerWeek, roundTo, clamp,
} from '../engine.js';
import {
  COMP, COMP_LABEL, e1rmHistory, personalRecords, weeklyVolume, cycleProposal, allSessions,
} from '../session.js';
import {
  icon, on, openSheet, closeSheet, confirmSheet, toast, lineChart, barChart,
} from '../ui.js';

let activeLift = 'dl';

function currentE1rm(st, lift, prs) {
  return prs[lift]?.e1rm?.v || st.profile.maxes[lift] || 0;
}

export function render(st) {
  const P = st.profile;
  const prs = personalRecords(st);
  const sqE = currentE1rm(st, 'sq', prs);
  const bpE = currentE1rm(st, 'bp', prs);
  const dlE = currentE1rm(st, 'dl', prs);
  const totalBase = P.maxes.sq + P.maxes.bp + P.maxes.dl;
  const totalHist = P.maxes.sq + P.maxes.bp + (P.maxes.dlSumo || P.maxes.dl);
  const totalEst = Math.round((sqE + bpE + dlE) * 10) / 10;
  const dotsEst = dots(totalEst, P.bw);

  const wVol = weeklyVolume(st);
  const curWkVol = wVol[st.ui.week - 1] || { tonnage: 0, reps: 0, sets: 0 };
  const cycleTonnage = wVol.reduce((a, w) => a + w.tonnage, 0);
  const cycleReps = wVol.reduce((a, w) => a + w.reps, 0);
  const cycleSets = wVol.reduce((a, w) => a + w.sets, 0);

  const liftPts = e1rmHistory(st, activeLift).map(p => ({
    v: p.v,
    label: `Н${p.week}`,
  }));
  const chartPts = liftPts.length
    ? liftPts
    : [{ v: P.maxes[activeLift], label: 'База' }];

  const dlParity = clamp(dlE / (P.maxes.dlSumo || 230), 0, 1.15);
  const target95 = Math.round((P.maxes.dlSumo || 230) * 0.95);

  const bwPts = (st.bodyweight || []).slice(-14).map(b => ({
    t: parseKey(b.date).getTime(),
    v: b.kg,
    label: shortDate(parseKey(b.date).getTime()),
  }));
  const bwSlope = slopePerWeek(bwPts);

  const sessionsCount = allSessions(st).length;

  return `
  <!-- Сумма троеборья и DOTS -->
  <section class="glass card p-4">
    <div class="flex items-start justify-between">
      <div>
        <div class="eyebrow">Соревновательное троеборье · @ ${fmt(P.bw, 1)} кг</div>
        <div class="flex items-baseline gap-2.5 mt-1.5">
          <span class="font-mono text-[40px] leading-none tracking-tight">${fmt(totalEst, 1)}</span>
          <span class="text-[12px] text-chrome-400">кг расчётная сумма (e1RM)</span>
        </div>
      </div>
      <div class="text-right">
        <span class="tag tag-ice">DOTS ${fmt(dotsEst, 1)}</span>
        <div class="text-[11px] text-chrome-500 font-mono mt-1.5">PR сумо: ${totalHist} кг</div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2 mt-4">
      <div class="tile"><span class="eyebrow">База цикла</span><span class="font-mono text-[17px]">${totalBase} кг</span></div>
      <div class="tile"><span class="eyebrow">Тоннаж цикла</span><span class="font-mono text-[17px]">${fmtInt(cycleTonnage)}</span></div>
      <div class="tile"><span class="eyebrow">Повторы</span><span class="font-mono text-[17px]">${fmtInt(cycleReps)}</span></div>
    </div>

    <!-- Прогресс перехода Сумо -> Классика -->
    <div class="mt-4 pt-3 border-t border-white/[0.06]">
      <div class="flex items-center justify-between text-[12px]">
        <span class="eyebrow text-chrome-200">Переход в классику · цель ≥ ${target95} кг (95% сумо)</span>
        <span class="font-mono text-chrome-200">${fmt(dlE, 1)} / ${P.maxes.dlSumo} кг (${Math.round(dlParity * 100)}%)</span>
      </div>
      <div class="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mt-2 relative">
        <div class="h-full ${dlE >= target95 ? 'bg-ok' : 'bg-ice'} rounded-full transition-all" style="width:${Math.min(100, Math.round(dlParity * 100))}%"></div>
      </div>
    </div>
  </section>

  <!-- Карточки e1RM по базовым движениям -->
  <section class="grid grid-cols-2 gap-2.5">
    ${COMP.map(lift => {
      const base = P.maxes[lift];
      const best = prs[lift]?.e1rm;
      const val = best ? best.v : base;
      const diff = val - base;
      const adj = st.adj[lift] || 0;
      return `
      <button class="glass card p-3.5 text-left ${activeLift === lift ? 'border-white/25' : ''}" data-act="an:lift" data-lift="${lift}">
        <div class="flex items-center justify-between">
          <span class="eyebrow">${COMP_LABEL[lift]}</span>
          <span class="font-mono text-[11px] ${diff > 0 ? 'text-ok' : 'text-chrome-500'}">${diff ? fmtSigned(roundTo(diff, 0.5)) : 'база'}</span>
        </div>
        <div class="flex items-baseline gap-1.5 mt-2">
          <span class="font-mono text-[26px] leading-none">${fmt(val, 1)}</span>
          <span class="text-[11px] text-chrome-500">кг e1RM</span>
        </div>
        <div class="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.05] text-[11px] font-mono text-chrome-500">
          <span>1ПМ: ${base}</span>
          <span class="${adj > 0 ? 'text-ok' : adj < 0 ? 'text-warn' : ''}">АВТ: ${adj ? fmtSigned(adj) : '0'}</span>
        </div>
      </button>`;
    }).join('')}
  </section>

  <!-- График e1RM выбранного движения -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between mb-2">
      <div>
        <div class="eyebrow">Динамика расчётного 1ПМ (e1RM)</div>
        <h3 class="font-display text-[15px] mt-0.5">${COMP_LABEL[activeLift]}</h3>
      </div>
      <div class="seg seg-4 w-[190px]">
        ${COMP.map(l => `<button class="seg-btn text-[10px] ${activeLift === l ? 'is-on' : ''}" data-act="an:lift" data-lift="${l}">${COMP_LABEL[l].slice(0, 4)}</button>`).join('')}
      </div>
    </div>
    ${lineChart(chartPts, { target: activeLift === 'dl' ? P.maxes.dlSumo : P.maxes[activeLift] })}
  </section>

  <!-- Недельный тоннаж и объём -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="eyebrow">Недельный тоннаж · цикл ${st.cycle.n}</div>
        <div class="text-[12px] text-chrome-400 mt-0.5">Неделя ${st.ui.week}: <span class="font-mono text-chrome-100">${fmtInt(curWkVol.tonnage)} кг</span> · ${curWkVol.reps} повт. · ${curWkVol.sets} подх.</div>
      </div>
      <span class="tag tag-steel">${cycleSets} подх.</span>
    </div>
    <div class="mt-3">
      ${barChart(wVol.map(w => ({ label: 'Н' + w.week, v: Math.round(w.tonnage / 100) / 10 })), {
        active: st.ui.week - 1,
        fmtV: (v) => fmt(v, 1) + 'т',
      })}
    </div>
  </section>

  <!-- Матрица личных рекордов -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        <div class="eyebrow">Матрица личных рекордов</div>
        <p class="text-[11.5px] text-chrome-500 mt-0.5">Лучшие рабочие веса по диапазонам повторений</p>
      </div>
      <span class="text-ice">${icon('trophy', 18)}</span>
    </div>
    <div class="overflow-x-auto">
      <table class="pr-table">
        <thead>
          <tr>
            <th>Движение</th>
            <th>e1RM</th>
            <th>×1</th>
            <th>×2</th>
            <th>×3</th>
            <th>×5</th>
          </tr>
        </thead>
        <tbody>
          ${COMP.map(lift => {
            const r = prs[lift];
            return `
            <tr>
              <td class="font-medium text-chrome-200">${COMP_LABEL[lift]}</td>
              <td class="font-mono text-ice">${r.e1rm ? fmt(r.e1rm.v, 1) : fmt(P.maxes[lift])}</td>
              ${[1, 2, 3, 5].map(n => `<td class="font-mono ${r.reps[n] ? 'text-chrome-100' : 'text-chrome-600'}">${r.reps[n] ? fmt(r.reps[n].w) : '—'}</td>`).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Динамика массы тела -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between mb-2">
      <div>
        <div class="eyebrow">Масса тела · 95 → ${P.targetBw}+ кг</div>
        <div class="text-[12px] text-chrome-400 mt-0.5">
          Текущий: <span class="font-mono text-chrome-100">${fmt(P.bw, 1)} кг</span>
          ${bwSlope != null ? ` · темп <span class="font-mono text-ice">${fmtSigned(Math.round(bwSlope * 100) / 100)} кг/нед</span>` : ''}
        </div>
      </div>
      <span class="font-mono text-[12px] text-chrome-400">${P.height} см · размах ${P.wingspan}</span>
    </div>
    ${lineChart(bwPts, { color: 'var(--ok)' })}
  </section>

  <!-- Управление максимумами и циклом -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="eyebrow">Параметры атлета и цикл</div>
        <h3 class="font-display text-[15px] mt-0.5">Рабочие максимумы (1ПМ)</h3>
      </div>
      <button class="btn btn-ghost btn-sm" data-act="an:editMaxes">${icon('pencil', 15)}<span>Изменить</span></button>
    </div>
    <div class="grid grid-cols-5 gap-1.5 mt-3 text-center">
      ${[
        ['ПРИСЕД', P.maxes.sq],
        ['ЖИМ', P.maxes.bp],
        ['ТЯГА КЛ.', P.maxes.dl],
        ['СУМО PR', P.maxes.dlSumo],
        ['АРМЕЙСК.', P.maxes.ohp],
      ].map(([lbl, v]) => `
        <div class="tile"><span class="text-[9.5px] font-mono text-chrome-500">${lbl}</span><span class="font-mono text-[15px] mt-1">${fmt(v)}</span></div>`).join('')}
    </div>
    <button class="btn btn-ghost w-full mt-3" data-act="an:newCycleSheet">
      ${icon('layers', 17)}
      <span>Завершить цикл ${st.cycle.n} и пересчитать 1ПМ</span>
    </button>
  </section>

  <!-- Резервное копирование JSON -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="eyebrow">Локальное хранилище · 100% офлайн</div>
        <h3 class="font-display text-[15px] mt-0.5">Резервное копирование базы</h3>
      </div>
      <span class="font-mono text-[11px] text-chrome-500">${sessionsCount} сессий</span>
    </div>
    <p class="text-[12px] text-chrome-400 mt-1.5 leading-relaxed">Экспорт всей истории тренировок, авторегуляции, замеров ЦНС, питания и настроек в один файл JSON или восстановление из копии.</p>
    <div class="grid grid-cols-2 gap-2 mt-3">
      <button class="btn btn-primary" data-act="an:export">${icon('download', 17)}<span>Скачать JSON</span></button>
      <button class="btn btn-ghost" data-act="an:importTrigger">${icon('upload', 17)}<span>Импорт JSON</span></button>
    </div>
    <input id="backupFileInput" type="file" accept="application/json,.json" class="hidden" data-change="an:importFile"/>
    <div class="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
      <span class="text-[11.5px] text-chrome-500">Полный сброс приложения</span>
      <button class="text-[11.5px] font-mono text-crit hover:underline py-2 px-2" data-act="an:resetAll">Сбросить данные</button>
    </div>
  </section>`;
}

on('an:lift', (el) => { activeLift = el.dataset.lift; S.update(() => {}); });

on('an:export', () => {
  const fn = S.exportJSON();
  toast(`Копия сохранена: ${fn}`, 'ok');
});

on('an:importTrigger', () => {
  const inp = document.getElementById('backupFileInput');
  if (inp) { inp.value = ''; inp.click(); }
});

on('an:importFile', async (el) => {
  const file = el.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = S.parseBackup(text);
    const ok = await confirmSheet({
      title: 'Восстановить из копии?',
      text: `Файл содержит ${parsed.sessions} записанных тренировок. Текущие данные в браузере будут заменены.`,
      ok: 'Восстановить',
    });
    if (!ok) return;
    S.importData(parsed.data);
    toast('База данных восстановлена', 'ok');
  } catch (e) {
    toast(e.message || 'Ошибка чтения JSON', 'crit');
  }
});

on('an:resetAll', async () => {
  const ok = await confirmSheet({
    title: 'Сбросить все данные?',
    text: 'Вся история тренировок, замеры ЦНС и индивидуальные веса будут удалены. Рекомендуется сначала скачать JSON-копию.',
    ok: 'Сбросить',
    danger: true,
  });
  if (!ok) return;
  S.resetAll();
  toast('Данные сброшены к исходному профилю', 'warn');
});

/* ------------------------------------------------ Edit maxes sheet */
let draftProfile = null;

function renderMaxesSheet() {
  const d = draftProfile;
  const rows = [
    ['sq', 'Присед со штангой, кг', 2.5],
    ['bp', 'Жим лёжа с паузой, кг', 2.5],
    ['dl', 'Становая тяга классика (база), кг', 2.5],
    ['dlSumo', 'Становая сумо (ориентир PR), кг', 2.5],
    ['ohp', 'Армейский жим стоя, кг', 2.5],
  ];
  return `
  <div class="pt-1">
    <div class="flex items-start justify-between">
      <div>
        <div class="eyebrow">Профиль атлета</div>
        <h3 class="font-display text-[18px] tracking-tight mt-1">Максимумы и таймер</h3>
      </div>
      <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 20)}</button>
    </div>
    <div class="mt-3 divide-y divide-white/[0.05]">
      ${rows.map(([k, lbl, step]) => `
        <div class="metric-row">
          <span class="text-[13px] text-chrome-200">${lbl}</span>
          <div class="flex items-center gap-1.5">
            <button class="step-btn" data-act="mx:step" data-k="${k}" data-d="${-step}">${icon('minus', 16)}</button>
            <span class="font-mono text-[20px] w-[66px] text-center">${fmt(d.maxes[k])}</span>
            <button class="step-btn" data-act="mx:step" data-k="${k}" data-d="${step}">${icon('plus', 16)}</button>
          </div>
        </div>`).join('')}
      <div class="metric-row">
        <span class="text-[13px] text-chrome-200">Отдых после топ-сета, мин</span>
        <div class="flex items-center gap-1.5">
          <button class="step-btn" data-act="mx:rest" data-k="restTop" data-d="-30">${icon('minus', 16)}</button>
          <span class="font-mono text-[18px] w-[66px] text-center">${fmt(d.restTop / 60, 1)}</span>
          <button class="step-btn" data-act="mx:rest" data-k="restTop" data-d="30">${icon('plus', 16)}</button>
        </div>
      </div>
      <div class="metric-row">
        <span class="text-[13px] text-chrome-200">Отдых в базовых подходах, мин</span>
        <div class="flex items-center gap-1.5">
          <button class="step-btn" data-act="mx:rest" data-k="restMain" data-d="-30">${icon('minus', 16)}</button>
          <span class="font-mono text-[18px] w-[66px] text-center">${fmt(d.restMain / 60, 1)}</span>
          <button class="step-btn" data-act="mx:rest" data-k="restMain" data-d="30">${icon('plus', 16)}</button>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-2 mt-3">
      <button class="opt-btn ${d.sound ? 'is-on' : ''}" data-act="mx:toggle" data-k="sound"><span class="eyebrow">Звук</span><span class="font-mono text-[12px]">${d.sound ? 'ВКЛ' : 'ВЫКЛ'}</span></button>
      <button class="opt-btn ${d.vibro ? 'is-on' : ''}" data-act="mx:toggle" data-k="vibro"><span class="eyebrow">Вибро</span><span class="font-mono text-[12px]">${d.vibro ? 'ВКЛ' : 'ВЫКЛ'}</span></button>
      <button class="opt-btn ${d.autoTimer ? 'is-on' : ''}" data-act="mx:toggle" data-k="autoTimer"><span class="eyebrow">Авто-таймер</span><span class="font-mono text-[12px]">${d.autoTimer ? 'ВКЛ' : 'ВЫКЛ'}</span></button>
    </div>
    <div class="grid grid-cols-2 gap-2 mt-5">
      <button class="btn btn-ghost" data-act="sheet:close">Отмена</button>
      <button class="btn btn-primary" data-act="mx:save">${icon('check', 16)}<span>Сохранить</span></button>
    </div>
  </div>`;
}

on('an:editMaxes', () => {
  const P = S.get().profile;
  draftProfile = {
    maxes: { ...P.maxes },
    restTop: P.restTop,
    restMain: P.restMain,
    sound: P.sound,
    vibro: P.vibro,
    autoTimer: P.autoTimer,
  };
  openSheet(renderMaxesSheet);
});

on('mx:step', (el) => {
  const k = el.dataset.k;
  draftProfile.maxes[k] = Math.max(20, roundTo(draftProfile.maxes[k] + +el.dataset.d, 2.5));
  S.update(() => {});
});
on('mx:rest', (el) => {
  const k = el.dataset.k;
  draftProfile[k] = clamp(draftProfile[k] + +el.dataset.d, 60, 600);
  S.update(() => {});
});
on('mx:toggle', (el) => {
  const k = el.dataset.k;
  draftProfile[k] = !draftProfile[k];
  S.update(() => {});
});
on('mx:save', () => {
  S.update(st => {
    st.profile.maxes = { ...draftProfile.maxes };
    st.profile.restTop = draftProfile.restTop;
    st.profile.restMain = draftProfile.restMain;
    st.profile.sound = draftProfile.sound;
    st.profile.vibro = draftProfile.vibro;
    st.profile.autoTimer = draftProfile.autoTimer;
  });
  closeSheet();
  toast('Параметры обновлены', 'ok');
});

/* ------------------------------------------------ New Cycle Sheet */
on('an:newCycleSheet', () => {
  openSheet(() => {
    const st = S.get();
    const prop = cycleProposal(st);
    return `
    <div class="pt-1">
      <div class="flex items-start justify-between">
        <div>
          <div class="eyebrow">Переход к циклу ${st.cycle.n + 1}</div>
          <h3 class="font-display text-[18px] tracking-tight mt-1">Пересчёт максимумов</h3>
        </div>
        <button class="icon-btn" data-act="sheet:close">${icon('x', 20)}</button>
      </div>
      <p class="text-[12.5px] text-chrome-400 mt-2 leading-relaxed">Новые рабочие максимумы рассчитаны по лучшим e1RM текущего цикла (округление вниз до 2,5 кг). Накопленные дельты авторегуляции обнуляются.</p>
      <div class="mt-4 divide-y divide-white/[0.05]">
        ${COMP.map(l => {
          const p = prop[l];
          const d = p.next - p.cur;
          return `
          <div class="py-2.5 flex items-center justify-between">
            <span class="text-[13px] text-chrome-200">${COMP_LABEL[l]}</span>
            <span class="font-mono text-[14px]">${fmt(p.cur)} → <b class="text-chrome-100">${fmt(p.next)} кг</b> <span class="text-[11px] ${d > 0 ? 'text-ok' : 'text-chrome-500'}">(${d ? fmtSigned(d) : '0'})</span></span>
          </div>`;
        }).join('')}
      </div>
      <div class="grid grid-cols-2 gap-2 mt-5">
        <button class="btn btn-ghost" data-act="sheet:close">Отмена</button>
        <button class="btn btn-primary" data-act="an:startNextCycle">${icon('check', 16)}<span>Начать цикл ${st.cycle.n + 1}</span></button>
      </div>
    </div>`;
  });
});

on('an:startNextCycle', () => {
  S.update(st => {
    const prop = cycleProposal(st);
    st.cycle.history.push({ n: st.cycle.n, endedAt: Date.now(), maxes: { ...st.profile.maxes } });
    COMP.forEach(l => { st.profile.maxes[l] = prop[l].next; });
    st.adj = {};
    st.cycle.n += 1;
    st.cycle.week = 1;
    st.cycle.day = 1;
    st.cycle.complete = false;
    st.cycle.startedAt = Date.now();
    st.ui.week = 1;
    st.ui.day = 1;
    st.ui.tab = 'train';
  });
  closeSheet();
  toast(`Запущен цикл ${S.get().cycle.n}`, 'ok');
});
