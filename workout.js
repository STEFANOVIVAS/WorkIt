export class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration, elevation, type, lines) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.elevation = elevation;
    this.type = type;
    this.lines = lines;
    this._calcPace();
    this._setDescription();
  }
  _setDescription() {
    this.description = `${this.type} on ${this.date.toLocaleString('en-IN', {
      month: 'long',
    })} ${this.date.getDate()}`;
  }
  _calcPace() {
    this.pace = (this.duration / this.distance).toFixed(5);
    return this.pace;
  }
}
