/**
 * Web7 Clock - Common clock logic
 */

/** 表示設定の保存先。デザインを変えても引き継ぐ */
const CLOCK_PREFS_KEY = 'web7clock:prefs';

function readClockPrefs() {
  try {
    return JSON.parse(localStorage.getItem(CLOCK_PREFS_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function writeClockPrefs(prefs) {
  try {
    localStorage.setItem(CLOCK_PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    /* プライベートモード等で書けなくても表示は続ける */
  }
}

/**
 * 24時間表記か12時間表記か。
 * 優先順位: URLパラメータ(?h=12 / ?h=24) > 保存された設定 > ページの既定値
 * URLで指定できるようにしているのは、キオスク端末やブックマークで
 * 表記を固定したいケースがあるため。
 */
function resolveUse24Hour(pageDefault) {
  const param = getParam('h', null);
  if (param === '12') return false;
  if (param === '24') return true;

  const saved = readClockPrefs().use24Hour;
  if (typeof saved === 'boolean') return saved;

  return pageDefault;
}

class DigitalClock {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      showSeconds: options.showSeconds !== false,
      showDate: options.showDate || false,
      use24Hour: resolveUse24Hour(options.use24Hour !== false),
      separator: options.separator || ':',
      onTick: options.onTick || null,
      // 'second': 秒が変わったときだけ描画（既定）
      // 'frame' : 毎フレーム描画。ミリ秒表示や滑らかなバーがある場合だけ使う
      precision: options.precision === 'frame' ? 'frame' : 'second',
    };
    this.running = false;
    this.animationId = null;
    this.timerId = null;
  }

  start() {
    this.running = true;
    // 初回描画より前に組み込む（onTick を包んで AM/PM を足すため）
    if (!this.controlsReady) {
      this.controlsReady = true;
      setupTimeFormatControl(this);
    }
    this.tick();
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 次の描画を予約する。
   * 'second' のときは requestAnimationFrame を回し続けず、
   * 次の秒の頭に setTimeout を張る。常時表示が主用途なので、
   * 秒に1回でよい描画のために毎フレーム起きるのは無駄
   * （毎フレーム描画だと1秒あたり60回のうち59回は同じ文字列を書き直していた）。
   */
  scheduleNext() {
    if (!this.running) return;

    if (this.options.precision === 'frame') {
      this.animationId = requestAnimationFrame(() => this.tick());
      return;
    }

    // 毎回実時刻から計算し直すのでズレが蓄積しない
    const delay = 1000 - (Date.now() % 1000) + 5;
    this.timerId = setTimeout(() => this.tick(), delay);
  }

  tick() {
    if (!this.running) return;

    const now = new Date();
    const timeData = this.getTimeData(now);

    if (this.options.onTick) {
      this.options.onTick(timeData, now);
    } else {
      this.render(timeData);
    }

    this.scheduleNext();
  }

  getTimeData(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    let period = '';

    if (!this.options.use24Hour) {
      period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
    }

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      milliseconds: String(milliseconds).padStart(3, '0'),
      period,
      date: {
        year: date.getFullYear(),
        month: String(date.getMonth() + 1).padStart(2, '0'),
        day: String(date.getDate()).padStart(2, '0'),
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      },
    };
  }

  render(timeData) {
    const sep = this.options.separator;
    let display = `${timeData.hours}${sep}${timeData.minutes}`;
    if (this.options.showSeconds) {
      display += `${sep}${timeData.seconds}`;
    }
    if (timeData.period) {
      display += ` ${timeData.period}`;
    }
    this.element.textContent = display;
  }
}

/**
 * Fullscreen toggle utility
 */
function toggleFullscreen(element) {
  if (!document.fullscreenElement) {
    (element || document.documentElement).requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

/**
 * Query parameter utilities
 */
function getParam(name, defaultValue) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || defaultValue;
}

/**
 * 24H / 12H の切り替えUIと AM/PM 表示を用意する。
 *
 * 12種類の時計ページはそれぞれ独自に描画しているため、各ページに手を入れず
 * 共通ロジック側から差し込む。設定は localStorage に保存してデザインを
 * 変えても引き継ぐ。
 *
 * ページ側の onTick は data.period を使っていないので、AM/PM は
 * .clock-container の末尾に共通の要素として出す（配色は currentColor 継承）。
 */
function setupTimeFormatControl(clock) {
  const container = document.querySelector('.clock-container');
  if (!container) return;

  // --- AM/PM 表示 ---
  let meridiem = null;
  if (!clock.options.use24Hour) {
    meridiem = document.createElement('div');
    meridiem.className = 'meridiem-display';
    container.appendChild(meridiem);

    const baseOnTick = clock.options.onTick;
    clock.options.onTick = function (data, now) {
      if (baseOnTick) baseOnTick(data, now);
      if (meridiem.textContent !== data.period) meridiem.textContent = data.period;
    };
  }

  // --- 切り替えボタン ---
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'format-toggle';
  button.textContent = clock.options.use24Hour ? '24H' : '12H';
  button.setAttribute('aria-label', clock.options.use24Hour
    ? '12時間表記に切り替える'
    : '24時間表記に切り替える');
  button.addEventListener('click', function () {
    const prefs = readClockPrefs();
    prefs.use24Hour = !clock.options.use24Hour;
    writeClockPrefs(prefs);
    // URLパラメータが指定されていると次回も上書きされるので、取り除いて再読み込みする
    const url = new URL(window.location.href);
    url.searchParams.delete('h');
    window.location.replace(url.toString());
  });
  document.body.appendChild(button);
}
