'use strict';

import { Running } from './running.js';
import { Cycling } from './cycling.js';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// console.log(deleteWorkoutBtn);
// console.log(inputElevation);

let map, mapEvent;
// deleteWorkoutBtn.addEventListener('click', function () {
//   console.log('delete');
// });

class App {
  #map;
  #markers = [];
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();

    //Handling with events
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Can't get yout current position");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    console.log(`https://www.google.com.br/maps/@${latitude},${longitude}`);
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    console.log(this.#mapEvent);
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    const validData = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const positiveInteger = (...inputs) => inputs.every(inp => inp > 0);

    //get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng
      ? this.#mapEvent.latlng
      : this.#mapEvent;
    let workout;

    //check if data is valid//
    //if workout type running, create running object
    if (type === 'Running') {
      const cadence = +inputCadence.value;
      if (
        !validData(distance, duration, cadence) ||
        !positiveInteger(distance, duration, cadence)
      ) {
        return alert('Please insert positive numbers');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if workout type Cycling, create cycling object
    if (type === 'Cycling') {
      const elevationGain = +inputElevation.value;
      if (
        !validData(distance, duration, elevationGain) ||
        !positiveInteger(distance, duration)
      ) {
        return alert('Please insert positive numbers');
      }

      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }
    //add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    //render workout object on map as a marker
    this._renderWorkoutMarker(workout);

    //render workout on list
    this._renderWorkout(workout);

    //Storage data in local storage api
    this._setLocalStorage();

    //hidden form and clear data
    this._hideForm();
  }

  _renderWorkoutMarker(workout) {
    let mark = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'Running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
    console.log(mark);
    this.#markers.push((this.#markers[workout.id] = mark));
  }
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type.toLowerCase()}" 
      data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'Running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value--distance">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value--duration">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;
    if (workout.type === 'Running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value--cadence">${workout.cadence}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value--pace">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">spm</span>
        </div>
        <div class="delete--workout">
            <button class="delete__button">Delete &#128465</button>
        </div>
        <div class="edit--workout">
          <button class="edit__button">Edit
        </div>
      </li>`;
    }
    if (workout.type === 'Cycling') {
      html += ` 
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value--speed">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value--elevation">${
            workout.elevationGain
          }</span>
          <span class="workout__unit">m</span>
        </div>
        <div class="delete--workout">
            <button class="delete__button">Delete &#128465</button>
        </div>
        <div class="edit--workout">
          <button class="edit__button">Edit
        </div>
      </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
    //delete button
    const deleteWorkoutBtn = document.querySelector('.delete--workout');
    deleteWorkoutBtn.addEventListener('click', this._deleteWorkout.bind(this));
    //edit button
    const editWorkoutBtn = document.querySelector('.edit--workout');
    editWorkoutBtn.addEventListener('click', this._editWorkout.bind(this));
    console.log(editWorkoutBtn);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    if (!workout) return;
    console.log(workout);
    this.#map.setView(workout.coords, 14);
  }
  _setLocalStorage() {
    localStorage.setItem(`workouts`, JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const works = JSON.parse(localStorage.getItem('workouts'));
    console.log(works);
    if (!works) return;
    works.forEach(work => console.log(work));
    this.#workouts = works;
    console.log(this.#workouts);
    this.#workouts.forEach(work => {
      console.log(work);
      this._renderWorkout(work);
    });
  }

  _deleteWorkout(e) {
    //find element
    const workoutElement = e.target.closest('.workout');
    if (!workoutElement) return;
    //delete item from #workouts Array
    const workoutIndex = this.#workouts.findIndex(
      work => work.id === workoutElement.dataset.id
    );
    this.#workouts.splice(workoutIndex, 1);
    //Update local storage with the remaining workouts
    this._setLocalStorage();
    //Remove workout marker from map
    const markerId = workoutElement.dataset.id;
    this.#map.removeLayer(this.#markers[markerId]);
    //Remove workout div from index.html
    workoutElement.remove();
  }
  _editWorkout(e) {
    //find element
    const workoutElement = e.target.closest('.workout');
    const workoutIndex = workoutElement.dataset.id;
    const workout = this.#workouts.find(
      work => work.id === workoutElement.dataset.id
    );

    //get original data from form

    const workoutDistance = workoutElement.querySelector(
      '.workout__value--distance'
    );
    const workoutDuration = workoutElement.querySelector(
      '.workout__value--duration'
    );

    const workoutCadence = workoutElement.querySelector(
      '.workout__value--cadence'
    );
    const workoutPace = workoutElement.querySelector('.workout__value--pace');
    const workoutSpeed = workoutElement.querySelector('.workout__value--speed');
    const workoutElevation = workoutElement.querySelector(
      '.workout__value--elevation'
    );

    //hide workout div
    this._deleteWorkout(e);
    //show form of this element with original data and type
    this._showForm(this.#markers[workoutIndex]._latlng);
    form.classList.remove('hidden');
    if (workout.type === 'Running') {
      inputDistance.value = workoutDistance.textContent;
      inputDuration.value = workoutDuration.textContent;
      inputCadence.value = workoutCadence.textContent;
    }

    if (workout.type === 'Cycling') {
      inputType.value = 'Cycling';
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');

      inputDistance.value = workoutDistance.textContent;
      inputDuration.value = workoutDuration.textContent;
      inputElevation.value = workoutElevation.textContent;
    }
    //submit new data

    //exclude or edit workout data from this.#workouts

    //insert new data in the local storage
  }
}

const app = new App();
