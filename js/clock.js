/**
 * Web7 Clock - Common clock logic
 */

class DigitalClock {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      showSeconds: options.showSeconds !== false,
      showDate: options.showDate || false,
      use24Hour: options.use24Hour !== false,
      separator: options.separator || ':',
      onTick: options.onTick || null,
    };
    this.running = false;
    this.animationId = null;
  }

  start() {
    this.running = true;
    this.tick();
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
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

    this.animationId = requestAnimationFrame(() => this.tick());
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
