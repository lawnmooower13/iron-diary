// JS: Главный контроллер приложения «Железный Дневник 2.0»

const STORAGE_KEY = 'IRON_DIARY_STATE_V2';

class IronDiaryApp {
  constructor() {
    this.state = this.loadState();
    this.currentDayIndex = 0;
    this.wakeLock = null;

    this.initDOM();
    this.initEventListeners();
    this.renderAll();
  }

  loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Ошибка чтения localStorage, загружаем дефолт:', e);
      }
    }

    // Дефолтное начальное состояние
    return {
      activeTab: 'tab-workout',
      program: JSON.parse(JSON.stringify(DEFAULT_PROGRAM)),
      history: {}, // { 'exId_setIdx': { completed: true, weight: 215, reps: 2, feel: 'norm', rir: 2, date: '...' } }
      readiness: {
        sleepHours: 8.0,
        sleepQuality: 4,
        restingHR: 62,
        doms: 'low',
        score: 92
      },
      dailyFuel: {
        waterCount: 0,
        maxWater: 8,
        date: new Date().toISOString().slice(0, 10),
        meals: DEFAULT_PROGRAM.meals,
        pharma: DEFAULT_PROGRAM.pharmaProtocol
      }
    };
  }

  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.updateStats();
  }

  initDOM() {
    // Вкладки навигации
    this.navBtns = document.querySelectorAll('.nav-btn');
    this.tabPanes = document.querySelectorAll('.tab-pane');

    // Дни тренировок
    this.dayBtns = document.querySelectorAll('.day-tab-btn');
    this.dayBadge = document.getElementById('workout-day-badge');
    this.dayTitle = document.getElementById('workout-day-title');
    this.dayProgressVal = document.getElementById('workout-day-progress');
    this.dayProgressBar = document.getElementById('workout-progress-bar');
    this.exercisesList = document.getElementById('exercises-list');

    // Быстрые плашки
    this.quickWarmupToggle = document.getElementById('quick-warmup-toggle');
    this.quickCooldownToggle = document.getElementById('quick-cooldown-toggle');
    this.quickWarmupStatus = document.getElementById('quick-warmup-status');
    this.quickCooldownStatus = document.getElementById('quick-cooldown-status');

    // Чеклисты разминки/заминки
    this.warmupContainer = document.getElementById('warmup-checklist');
    this.cooldownContainer = document.getElementById('cooldown-checklist');

    // Готовность
    this.readinessScoreVal = document.getElementById('readiness-big-score');
    this.readinessHeaderVal = document.getElementById('header-readiness-val');
    this.readinessStatusText = document.getElementById('readiness-status-text');
    this.readinessRecText = document.getElementById('readiness-recommendation');
    this.sleepHoursInput = document.getElementById('input-sleep-hours');
    this.sleepHoursVal = document.getElementById('val-sleep-hours');
    this.restingHRInput = document.getElementById('input-resting-hr');
    this.restingHRVal = document.getElementById('val-resting-hr');

    // Вода и Питание
    this.waterGlassesContainer = document.getElementById('water-glasses');
    this.waterCounterVal = document.getElementById('water-counter-val');
    this.mealsContainer = document.getElementById('meals-checklist');
    this.mealsStatus = document.getElementById('meals-status');
    this.pharmaContainer = document.getElementById('pharma-checklist');
    this.addPharmaBtn = document.getElementById('add-pharma-btn');

    // Бэкап
    this.exportBtn = document.getElementById('btn-export-json');
    this.importInput = document.getElementById('input-import-json');

    // WakeLock
    this.wakeLockBtn = document.getElementById('wakelock-btn');

    // Модалка блинов
    this.platesModal = document.getElementById('plates-modal');
    this.platesModalBox = document.getElementById('plates-modal-box');
    this.platesCloseBtn = document.getElementById('plates-modal-close');
    this.platesDoneBtn = document.getElementById('plates-done-btn');
    this.platesTargetWeight = document.getElementById('plates-target-weight');
    this.platesPerSideWeight = document.getElementById('plates-per-side-weight');
    this.platesVisualBar = document.getElementById('plates-visual-bar');
    this.platesTextList = document.getElementById('plates-text-list');
  }

  initEventListeners() {
    // Переключение главных вкладок
    this.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        this.switchTab(targetId);
      });
    });

    // Переключение дней недели
    this.dayBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentDayIndex = parseInt(btn.dataset.day, 10);
        this.renderWorkoutDay();
      });
    });

    // Быстрый переход в разминку/заминку
    if (this.quickWarmupToggle) {
      this.quickWarmupToggle.addEventListener('click', () => this.switchTab('tab-mobility'));
    }
    if (this.quickCooldownToggle) {
      this.quickCooldownToggle.addEventListener('click', () => this.switchTab('tab-mobility'));
    }

    // Слайдеры сна и пульса
    if (this.sleepHoursInput) {
      this.sleepHoursInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.state.readiness.sleepHours = val;
        this.sleepHoursVal.textContent = `${val.toFixed(1)} ч`;
        this.recalcReadiness();
      });
    }

    if (this.restingHRInput) {
      this.restingHRInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.state.readiness.restingHR = val;
        this.restingHRVal.textContent = `${val} уд/мин`;
        this.recalcReadiness();
      });
    }

    // Кнопки качества сна
    const sleepBtns = document.querySelectorAll('#sleep-quality-buttons button');
    sleepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sleepBtns.forEach(b => {
          b.classList.remove('bg-crimson', 'text-white', 'font-bold');
          b.classList.add('bg-white/5', 'text-slate-300');
        });
        btn.classList.remove('bg-white/5', 'text-slate-300');
        btn.classList.add('bg-crimson', 'text-white', 'font-bold');

        this.state.readiness.sleepQuality = parseInt(btn.dataset.val, 10);
        document.getElementById('val-sleep-quality').textContent = `${this.state.readiness.sleepQuality} / 5`;
        this.recalcReadiness();
      });
    });

    // Кнопки забитости мышц (DOMS)
    const domsBtns = document.querySelectorAll('.doms-btn');
    domsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        domsBtns.forEach(b => b.classList.remove('active', 'border-crimson', 'bg-crimson/15', 'text-white'));
        btn.classList.add('active', 'border-crimson', 'bg-crimson/15', 'text-white');
        this.state.readiness.doms = btn.dataset.doms;
        this.recalcReadiness();
      });
    });

    // Добавление кастомного препарата
    if (this.addPharmaBtn) {
      this.addPharmaBtn.addEventListener('click', () => {
        const name = prompt('Название препарата или добавки:');
        if (!name) return;
        const dose = prompt('Дозировка или время (например: 10мг утро):') || '';
        this.state.dailyFuel.pharma.push({
          id: 'p_' + Date.now(),
          name,
          dose,
          time: 'Кастомно',
          done: false
        });
        this.saveState();
        this.renderPharma();
      });
    }

    // Сброс разминки / заминки
    document.getElementById('reset-warmup-btn')?.addEventListener('click', () => {
      this.state.program.warmupProtocol.forEach(p => p.done = false);
      this.saveState();
      this.renderMobility();
    });
    document.getElementById('reset-cooldown-btn')?.addEventListener('click', () => {
      this.state.program.cooldownProtocol.forEach(p => p.done = false);
      this.saveState();
      this.renderMobility();
    });

    // Модалка калькулятора блинов
    this.platesCloseBtn?.addEventListener('click', () => this.hidePlatesModal());
    this.platesDoneBtn?.addEventListener('click', () => this.hidePlatesModal());
    this.platesModal?.addEventListener('click', (e) => {
      if (e.target === this.platesModal) this.hidePlatesModal();
    });

    // Wake Lock (Не гасить экран)
    if (this.wakeLockBtn) {
      this.wakeLockBtn.addEventListener('click', () => this.toggleWakeLock());
    }

    // Экспорт / Импорт JSON
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportBackupJSON());
    }
    if (this.importInput) {
      this.importInput.addEventListener('change', (e) => this.importBackupJSON(e));
    }
  }

  // Переключение экранов
  switchTab(targetTabId) {
    this.state.activeTab = targetTabId;
    this.navBtns.forEach(btn => {
      if (btn.dataset.target === targetTabId) {
        btn.classList.add('active');
        btn.querySelector('svg')?.classList.add('text-crimson');
      } else {
        btn.classList.remove('active');
        btn.querySelector('svg')?.classList.remove('text-crimson');
      }
    });

    this.tabPanes.forEach(pane => {
      if (pane.id === targetTabId) {
        pane.classList.remove('hidden');
        pane.classList.add('active');
      } else {
        pane.classList.add('hidden');
        pane.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Рендеринг всех модулей
  renderAll() {
    this.renderWorkoutDay();
    this.renderMobility();
    this.renderReadiness();
    this.renderFuel();
    this.updateStats();
  }

  // РЕНДЕРИНГ ДНЯ ТРЕНИРОВКИ
  renderWorkoutDay() {
    const day = this.state.program.days[this.currentDayIndex];
    if (!day) return;

    // Обновление кнопок дней
    this.dayBtns.forEach((btn, idx) => {
      if (idx === this.currentDayIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Шапка дня
    this.dayBadge.textContent = `Неделя 1 · ${day.dayName}`;
    this.dayTitle.textContent = day.title;

    // Рендер упражнений
    this.exercisesList.innerHTML = '';
    let totalSetsInDay = 0;
    let completedSetsInDay = 0;

    day.exercises.forEach(ex => {
      const card = document.createElement('div');
      card.className = 'glass-card p-4 rounded-2xl space-y-3';

      // Генерация подводящих подходов
      const primaryWeight = ex.topSetTarget || ex.targetWeight || 100;
      const warmupSteps = generateWarmupSets(primaryWeight);

      // Стилизация шапки карточки упражнения
      const typeBadge = ex.type === 'strongman' 
        ? `<span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">СТРОНГМЕН</span>`
        : `<span class="px-2 py-0.5 rounded-md bg-crimson/20 text-crimson font-mono text-[10px] font-bold">ПАУЭРЛИФТИНГ</span>`;

      const styleBadge = ex.style 
        ? `<span class="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono text-[10px]">${ex.style}</span>`
        : '';

      card.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-1.5 mb-1">
              ${typeBadge}
              ${styleBadge}
            </div>
            <h3 class="font-display font-bold text-sm text-white">${ex.name}</h3>
          </div>
          <button class="plates-calc-btn text-[11px] font-mono px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition" data-weight="${primaryWeight}">
            Блины ⚙️
          </button>
        </div>

        ${ex.notes ? `<p class="text-[11px] text-slate-400 bg-black/20 p-2 rounded-xl border border-white/5 leading-relaxed">${ex.notes}</p>` : ''}

        <!-- Сворачиваемая разминочная пирамида -->
        <details class="group bg-white/3 rounded-xl p-2.5 border border-white/5">
          <summary class="flex items-center justify-between cursor-pointer text-xs font-mono text-slate-400 hover:text-white list-none">
            <span class="flex items-center gap-1.5">
              <span>⚡ Подводящие подходы (${warmupSteps.length})</span>
            </span>
            <span class="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="pt-2.5 space-y-1.5 text-xs font-mono">
            ${warmupSteps.map(s => `
              <div class="flex items-center justify-between px-2 py-1 bg-black/30 rounded-lg text-slate-300">
                <span class="font-bold text-white">${s.weight} кг × ${s.reps}</span>
                <span class="text-[11px] text-slate-400">${s.note}</span>
              </div>
            `).join('')}
          </div>
        </details>

        <!-- Рабочие подходы -->
        <div class="space-y-2 pt-1" id="sets-${ex.id}"></div>
      `;

      const setsContainer = card.querySelector(`#sets-${ex.id}`);

      // Формируем список рабочих сетов (1 топ-сет + бэкофф сеты, либо фиксированные сеты)
      const setsList = [];
      if (ex.topSetTarget) {
        setsList.push({
          type: 'top',
          label: 'ТОП-СЕТ',
          weight: ex.topSetTarget,
          reps: ex.topSetReps,
          restSec: 300
        });
        const backoffWeight = Math.round((ex.topSetTarget * (ex.backoffPercent || 0.85)) / 2.5) * 2.5;
        for (let i = 0; i < (ex.backoffSetsCount || 3); i++) {
          setsList.push({
            type: 'backoff',
            label: `Сет ${i + 2}`,
            weight: backoffWeight,
            reps: ex.backoffReps,
            restSec: 180
          });
        }
      } else {
        for (let i = 0; i < (ex.setsCount || 3); i++) {
          setsList.push({
            type: 'work',
            label: `Сет ${i + 1}`,
            weight: ex.targetWeight || 0,
            reps: ex.reps || '8',
            restSec: ex.restTime || 180
          });
        }
      }

      setsList.forEach((setInfo, setIdx) => {
        totalSetsInDay++;
        const setKey = `${ex.id}_${setIdx}`;
        const setSaved = this.state.history[setKey] || { completed: false, feel: 'norm', rir: 2 };
        if (setSaved.completed) completedSetsInDay++;

        const setRow = document.createElement('div');
        setRow.className = `set-row p-2.5 rounded-xl border border-white/5 bg-white/2 ${setSaved.completed ? 'completed' : ''}`;

        setRow.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <button class="check-btn ${setSaved.completed ? 'checked' : ''}" data-key="${setKey}" data-rest="${setInfo.restSec}">
                ${setSaved.completed ? '✓' : ''}
              </button>
              <div>
                <div class="flex items-center gap-1.5 font-mono text-xs">
                  <span class="font-bold text-white">${setInfo.label}:</span>
                  <span class="font-extrabold text-sm ${setInfo.type === 'top' ? 'text-crimson' : 'text-white'}">
                    ${setInfo.weight > 0 ? `${setInfo.weight} кг` : 'Свой вес'}
                  </span>
                  <span class="text-slate-400">× ${setInfo.reps}</span>
                </div>
                <div class="text-[10px] text-slate-500 font-mono">Отдых: ${Math.floor(setInfo.restSec / 60)} мин</div>
              </div>
            </div>

            <button class="plates-calc-btn text-[10px] font-mono px-2 py-1 rounded bg-black/40 text-slate-400 hover:text-white" data-weight="${setInfo.weight}">
              ${setInfo.weight > 0 ? 'Диски ❯' : ''}
            </button>
          </div>

          <!-- Блок авторегуляции: RIR и субъективные ощущения (виден всегда) -->
          <div class="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1 text-[11px]">
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-mono text-slate-500 mr-1">RIR:</span>
              ${[0, 1, 2, 3].map(r => `
                <button class="rir-chip px-1.5 py-0.5 rounded font-mono text-[10px] ${setSaved.rir === r ? 'bg-white text-black font-bold' : 'bg-white/5 text-slate-400'}" data-key="${setKey}" data-rir="${r}">
                  ${r === 3 ? '3+' : r}
                </button>
              `).join('')}
            </div>

            <div class="flex items-center gap-1">
              <button class="feel-chip ${setSaved.feel === 'fly' ? 'active-fly' : ''}" data-key="${setKey}" data-feel="fly">
                🚀 Летит
              </button>
              <button class="feel-chip ${setSaved.feel === 'norm' ? 'active-norm' : ''}" data-key="${setKey}" data-feel="norm">
                👌 Норма
              </button>
              <button class="feel-chip ${setSaved.feel === 'heavy' ? 'active-heavy' : ''}" data-key="${setKey}" data-feel="heavy">
                ⚠️ Давит
              </button>
            </div>
          </div>
        `;

        setsContainer.appendChild(setRow);
      });

      this.exercisesList.appendChild(card);
    });

    // Обработчики клика по чекбоксам
    this.exercisesList.querySelectorAll('.check-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const rest = parseInt(btn.dataset.rest, 10) || 180;
        const current = this.state.history[key] || { completed: false, feel: 'norm', rir: 2 };
        current.completed = !current.completed;
        current.date = new Date().toISOString();
        this.state.history[key] = current;
        this.saveState();
        this.renderWorkoutDay();

        // Запуск таймера отдыха при выполнении
        if (current.completed && timerInstance) {
          timerInstance.start(rest, "Отдых после подхода");
        }
      });
    });

    // Обработчики RIR
    this.exercisesList.querySelectorAll('.rir-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const rir = parseInt(btn.dataset.rir, 10);
        const current = this.state.history[key] || { completed: true, feel: 'norm', rir: 2 };
        current.rir = rir;
        this.state.history[key] = current;
        this.saveState();
        this.renderWorkoutDay();
      });
    });

    // Обработчики ощущений (Летит/Норма/Давит)
    this.exercisesList.querySelectorAll('.feel-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const feel = btn.dataset.feel;
        const current = this.state.history[key] || { completed: true, feel: 'norm', rir: 2 };
        current.feel = feel;
        this.state.history[key] = current;
        this.saveState();
        this.renderWorkoutDay();
      });
    });

    // Открытие калькулятора блинов
    this.exercisesList.querySelectorAll('.plates-calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const weight = parseFloat(btn.dataset.weight);
        if (weight > 0) {
          this.showPlatesModal(weight);
        }
      });
    });

    // Прогресс дня
    const percent = totalSetsInDay > 0 ? Math.round((completedSetsInDay / totalSetsInDay) * 100) : 0;
    this.dayProgressVal.textContent = `${percent}%`;
    this.dayProgressBar.style.width = `${percent}%`;

    // Статусы быстрой разминки
    const warmupDone = this.state.program.warmupProtocol.filter(p => p.done).length;
    this.quickWarmupStatus.textContent = `${warmupDone} из ${this.state.program.warmupProtocol.length} пройдено`;

    const cooldownDone = this.state.program.cooldownProtocol.filter(p => p.done).length;
    this.quickCooldownStatus.textContent = `${cooldownDone} из ${this.state.program.cooldownProtocol.length} выполнено`;
  }

  // РЕНДЕРИНГ РАЗМИНКИ И ЗАМИНКИ
  renderMobility() {
    if (!this.warmupContainer || !this.cooldownContainer) return;

    // Разминка
    this.warmupContainer.innerHTML = '';
    this.state.program.warmupProtocol.forEach(item => {
      const el = document.createElement('div');
      el.className = `p-3 rounded-xl border border-white/5 flex items-start gap-3 transition cursor-pointer ${item.done ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/2 hover:bg-white/5'}`;
      el.innerHTML = `
        <div class="check-btn mt-0.5 ${item.done ? 'checked' : ''}">${item.done ? '✓' : ''}</div>
        <div class="flex-1">
          <div class="font-bold text-xs text-white">${item.title}</div>
          <div class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">${item.desc}</div>
        </div>
      `;
      el.addEventListener('click', () => {
        item.done = !item.done;
        this.saveState();
        this.renderMobility();
        this.renderWorkoutDay();
      });
      this.warmupContainer.appendChild(el);
    });

    // Заминка
    this.cooldownContainer.innerHTML = '';
    this.state.program.cooldownProtocol.forEach(item => {
      const el = document.createElement('div');
      el.className = `p-3 rounded-xl border border-white/5 flex items-start gap-3 transition cursor-pointer ${item.done ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/2 hover:bg-white/5'}`;
      el.innerHTML = `
        <div class="check-btn mt-0.5 ${item.done ? 'checked' : ''}">${item.done ? '✓' : ''}</div>
        <div class="flex-1">
          <div class="font-bold text-xs text-white">${item.title}</div>
          <div class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">${item.desc}</div>
        </div>
      `;
      el.addEventListener('click', () => {
        item.done = !item.done;
        this.saveState();
        this.renderMobility();
        this.renderWorkoutDay();
      });
      this.cooldownContainer.appendChild(el);
    });
  }

  // РАСЧЁТ И РЕНДЕРИНГ ГОТОВНОСТИ (READINESS)
  recalcReadiness() {
    const { sleepHours, sleepQuality, restingHR, doms } = this.state.readiness;

    let score = 50;

    // Сон (оптимум 8.5ч)
    if (sleepHours >= 8) score += 20;
    else if (sleepHours >= 7) score += 12;
    else if (sleepHours >= 6) score += 5;
    else score -= 15;

    // Качество сна (1-5)
    score += (sleepQuality - 3) * 6;

    // Пульс покоя (чем ниже относительно 65, тем лучше)
    if (restingHR <= 58) score += 15;
    else if (restingHR <= 65) score += 10;
    else if (restingHR <= 72) score += 2;
    else score -= 12;

    // DOMS
    if (doms === 'low') score += 10;
    else if (doms === 'high') score -= 15;

    score = Math.max(30, Math.min(99, score));
    this.state.readiness.score = score;
    this.saveState();
    this.renderReadiness();
  }

  renderReadiness() {
    const score = this.state.readiness.score || 92;
    this.readinessScoreVal.textContent = `${score}%`;
    this.readinessHeaderVal.textContent = `${score}%`;

    const circle = document.getElementById('readiness-circle');

    if (score >= 85) {
      this.readinessStatusText.textContent = "Пиковая готовность (Green Zone)";
      this.readinessRecText.textContent = "ЦНС восстановлена! Запланированный топ-сет выполняй уверенно в соревновательном стиле.";
      circle.className = "relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/20";
      this.readinessScoreVal.className = "font-display font-black text-3xl text-emerald-400";
    } else if (score >= 65) {
      this.readinessStatusText.textContent = "Умеренный тонус (Yellow Zone)";
      this.readinessRecText.textContent = "Рабочие веса держим. Топ-сет делай с запасом RIR 2, без предельных синглов.";
      circle.className = "relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-amber-500/40 bg-amber-500/10 shadow-lg shadow-amber-500/20";
      this.readinessScoreVal.className = "font-display font-black text-3xl text-amber-400";
    } else {
      this.readinessStatusText.textContent = "Высокая утомляемость (Red Zone)";
      this.readinessRecText.textContent = "Недосып или повышен пульс. Сбрось 10% с рабочих весов или перенеси тяжёлую становую на завтра.";
      circle.className = "relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/20";
      this.readinessScoreVal.className = "font-display font-black text-3xl text-red-400";
    }
  }

  // РЕНДЕРИНГ РЕЖИМА И ПИТАНИЯ (FUEL)
  renderFuel() {
    // Водный баланс
    this.waterGlassesContainer.innerHTML = '';
    const count = this.state.dailyFuel.waterCount || 0;
    const liters = (count * 0.5).toFixed(1);
    this.waterCounterVal.textContent = `${liters} / 4.0 л`;

    for (let i = 0; i < 8; i++) {
      const btn = document.createElement('button');
      const isFilled = i < count;
      btn.className = `water-glass-btn ${isFilled ? 'filled' : ''}`;
      btn.innerHTML = `
        <span class="text-sm">${isFilled ? '💧' : '○'}</span>
        <span class="text-[9px] mt-0.5">0.5л</span>
      `;
      btn.addEventListener('click', () => {
        if (i < count) {
          this.state.dailyFuel.waterCount = i;
        } else {
          this.state.dailyFuel.waterCount = i + 1;
        }
        this.saveState();
        this.renderFuel();
      });
      this.waterGlassesContainer.appendChild(btn);
    }

    // Приёмы пищи
    this.mealsContainer.innerHTML = '';
    let closedMeals = 0;
    this.state.dailyFuel.meals.forEach(m => {
      if (m.done) closedMeals++;
      const el = document.createElement('div');
      el.className = `p-3 rounded-xl border border-white/5 flex items-start gap-3 transition cursor-pointer ${m.done ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/2 hover:bg-white/5'}`;
      el.innerHTML = `
        <div class="check-btn mt-0.5 ${m.done ? 'checked' : ''}">${m.done ? '✓' : ''}</div>
        <div class="flex-1">
          <div class="font-bold text-xs text-white">${m.title}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">${m.desc}</div>
        </div>
      `;
      el.addEventListener('click', () => {
        m.done = !m.done;
        this.saveState();
        this.renderFuel();
      });
      this.mealsContainer.appendChild(el);
    });
    this.mealsStatus.textContent = `${closedMeals} / 6 закрыто`;

    // Препараты
    this.renderPharma();
  }

  renderPharma() {
    this.pharmaContainer.innerHTML = '';
    this.state.dailyFuel.pharma.forEach(p => {
      const el = document.createElement('div');
      el.className = `p-2.5 rounded-xl border border-white/5 flex items-center justify-between transition cursor-pointer ${p.done ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/2 hover:bg-white/5'}`;
      el.innerHTML = `
        <div class="flex items-center gap-2.5">
          <div class="check-btn ${p.done ? 'checked' : ''}">${p.done ? '✓' : ''}</div>
          <div>
            <div class="font-bold text-xs text-white">${p.name}</div>
            <div class="text-[10px] text-slate-400 font-mono">${p.dose} · ${p.time}</div>
          </div>
        </div>
      `;
      el.addEventListener('click', () => {
        p.done = !p.done;
        this.saveState();
        this.renderPharma();
      });
      this.pharmaContainer.appendChild(el);
    });
  }

  // ОБНОВЛЕНИЕ СТАТИСТИКИ И РЕКОРДОВ
  updateStats() {
    let totalTonnage = 0;
    let totalReps = 0;

    Object.keys(this.state.history).forEach(key => {
      const set = this.state.history[key];
      if (set && set.completed) {
        // Подсчёт примерного тоннажа
        totalTonnage += (set.weight || 0) * (set.reps || 1);
        totalReps += (set.reps || 1);
      }
    });

    const tonValEl = document.getElementById('weekly-tonnage-val');
    const repsValEl = document.getElementById('weekly-reps-val');
    if (tonValEl) tonValEl.textContent = `${totalTonnage.toLocaleString('ru-RU')} кг`;
    if (repsValEl) repsValEl.textContent = totalReps;
  }

  // КАЛЬКУЛЯТОР БЛИНОВ (МОДАЛКА)
  showPlatesModal(weight) {
    if (!this.platesModal) return;
    const calc = calculatePlates(weight);

    this.platesTargetWeight.textContent = `${weight.toFixed(1)} кг`;
    this.platesPerSideWeight.textContent = `${calc.perSideWeight.toFixed(1)} кг`;
    this.platesVisualBar.innerHTML = renderBarbellVisual(calc);
    this.platesTextList.innerHTML = renderPlatesText(calc);

    this.platesModal.classList.remove('opacity-0', 'pointer-events-none');
    this.platesModalBox.classList.remove('translate-y-8');
    this.platesModalBox.classList.add('translate-y-0');
  }

  hidePlatesModal() {
    if (!this.platesModal) return;
    this.platesModal.classList.add('opacity-0', 'pointer-events-none');
    this.platesModalBox.classList.add('translate-y-8');
    this.platesModalBox.classList.remove('translate-y-0');
  }

  // WAKE LOCK (Не тушить экран на тренировке)
  async toggleWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        if (!this.wakeLock) {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.wakeLockBtn.classList.add('bg-crimson', 'text-white');
          alert('Режим тренировки: экран не будет гаснуть во время подходов!');
        } else {
          await this.wakeLock.release();
          this.wakeLock = null;
          this.wakeLockBtn.classList.remove('bg-crimson', 'text-white');
        }
      } else {
        alert('WakeLock API не поддерживается этим браузером, но приложение работает нормально.');
      }
    } catch (err) {
      console.log('WakeLock error:', err);
    }
  }

  // ЭКСПОРТ ДАННЫХ В JSON ФАЙЛ
  exportBackupJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `iron-diary-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // ИМПОРТ ДАННЫХ ИЗ JSON ФАЙЛА
  importBackupJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && imported.program) {
          this.state = imported;
          this.saveState();
          this.renderAll();
          alert('Бэкап успешно восстановлен! Все данные загружены.');
        } else {
          alert('Некорректный формат файла бэкапа.');
        }
      } catch (err) {
        alert('Ошибка при чтении файла JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
}

// Запуск приложения
let ironApp = null;
window.addEventListener('DOMContentLoaded', () => {
  ironApp = new IronDiaryApp();
});
