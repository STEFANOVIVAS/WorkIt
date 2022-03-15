export class Cron {
  cron;
  seconds = 0;
  minutes = 0;
  hours = 0;
  constructor(secondSpan, minuteSpan, hourSpan) {
    this.secondSpan = secondSpan;
    this.minuteSpan = minuteSpan;
    this.hourSpan = hourSpan;
  }
  _start() {
    this._pause();
    this.cron = setInterval(() => this._timer(), 1000);
  }
  _pause() {
    clearInterval(this.cron);
  }
  _timer() {
    this.seconds++;
    if (this.seconds === 60) {
      this.seconds = 0;
      this.minutes++;
    }
    if (this.minutes === 60) {
      this.minutes === 0;
      this.hours++;
    }

    this.secondSpan.innerText = String(this.seconds).padStart(2, 0);
    this.minuteSpan.innerText = String(this.minutes).padStart(2, 0);
    this.hourSpan.innerText = String(this.hours).padStart(2, 0);
  }
  _reset() {
    this.seconds = 0;
    this.minutes = 0;
    this.hours = 0;
    this.secondSpan.innerText = '00';
    this.minuteSpan.innerText = '00';
    this.hourSpan.innerText = '00';
  }
}

// const cronom = new Cron();
