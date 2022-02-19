export class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    this.description = `${this.type} on ${this.date.toLocaleString('en-IN', {
      month: 'long',
    })} ${this.date.getDate()}`;
  }
}
