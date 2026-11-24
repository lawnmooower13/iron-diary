// JS: Автоматический таймер отдыха между подходами с виброоткликом и звуком

class RestTimer {
  constructor() {
    this.remainingSeconds = 0;
    this.totalSeconds = 180;
    this.intervalId = null;
    this.audioCtx = null;

    this.barEl = document.getElementById('rest-timer-bar');
    this.displayEl = document.getElementById('timer-display');
    this.titleEl = document.getElementById('timer-status-title');
    this.add30Btn = document.getElementById('timer-add-30');
    this.closeBtn = document.getElementById('timer-close-btn');

    this.initEvents();
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  // Синтез звукового сигнала таймера (без внешних mp3)
  beep(freq = 880, duration = 0.15) {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.log('Audio beep notice:', e);
    }
  }

  // Вибрация телефона (Haptic feedback)
  vibrate(pattern = [100, 60, 150]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  start(seconds = 180, label = "Восстановление сил") {
    this.stop();
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;

    if (this.titleEl) {
      this.titleEl.innerHTML = `<span>${label}</span>`;
    }

    this.updateDisplay();
    this.showBar();

    // Короткий тактильный отклик при запуске
    this.vibrate([40]);
    this.initAudio();

    this.intervalId = setInterval(() => {
      this.remainingSeconds--;
      this.updateDisplay();

      // Оповещения за 3, 2, 1 секунду
      if (this.remainingSeconds === 3 || this.remainingSeconds === 2 || this.remainingSeconds === 1) {
        this.beep(587, 0.1);
        this.vibrate([50]);
      }

      if (this.remainingSeconds <= 0) {
        this.onFinished();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onFinished() {
    this.stop();
    // Финальный победный тройной сигнал
    this.beep(880, 0.3);
    setTimeout(() => this.beep(1174, 0.4), 200);
    this.vibrate([150, 100, 200, 100, 400]);

    if (this.displayEl) {
      this.displayEl.textContent = "ГОТОВ!";
    }
    if (this.titleEl) {
      this.titleEl.innerHTML = `<span class="text-emerald-400 font-bold">Время вышло! Иди на подход</span>`;
    }

    setTimeout(() => {
      this.hideBar();
    }, 4500);
  }

  updateDisplay() {
    if (!this.displayEl) return;
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    this.displayEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  showBar() {
    if (!this.barEl) return;
    this.barEl.classList.remove('translate-y-36', 'opacity-0');
    this.barEl.classList.add('translate-y-0', 'opacity-100');
  }

  hideBar() {
    if (!this.barEl) return;
    this.barEl.classList.add('translate-y-36', 'opacity-0');
    this.barEl.classList.remove('translate-y-0', 'opacity-100');
  }

  initEvents() {
    if (this.add30Btn) {
      this.add30Btn.addEventListener('click', () => {
        this.remainingSeconds += 30;
        this.updateDisplay();
        this.vibrate([30]);
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.stop();
        this.hideBar();
        this.vibrate([20]);
      });
    }
  }
}

// Глобальный экземпляр таймера
let timerInstance = null;
window.addEventListener('DOMContentLoaded', () => {
  timerInstance = new RestTimer();
});
