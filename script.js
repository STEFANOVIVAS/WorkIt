'use strict';

import { Running } from './running.js';
import { Cycling } from './cycling.js';
import { Workout } from './workout.js';
import { Cron } from './cron.js';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const startWorkout = document.querySelector('.button__start');
const stopWorkout = document.querySelector('.button__stop');
const pauseWorkout = document.querySelector('.button__pause');
const resumeWorkout = document.querySelector('.button__resume');
const minuteSpan = document.getElementById('minutes');
const secondSpan = document.getElementById('seconds');
const hourSpan = document.getElementById('hour');
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
  #cron;
  #coordinates = [];
  #interval;
  #workoutGroup;
  #map;
  #markers = [];
  #mapEvent;
  #workouts = [];
  constructor() {
    // this._loadMap();
    this._getPosition();
    this._getLocalStorage();

    //Handling with events
    resumeWorkout.addEventListener('click', this._resumeWorkout.bind(this));
    pauseWorkout.addEventListener('click', this._pauseWorkout.bind(this));
    startWorkout.addEventListener('click', this._newWorkout.bind(this));
    stopWorkout.addEventListener('click', this._stopWorkout.bind(this));
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _stopPosition(myInterval) {}

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        position => this._loadMap(position),
        function () {
          alert("Can't get yout current position");
        }
      );
  }

  _stopWorkout() {
    const myInterval = this.#interval;
    navigator.geolocation.clearWatch(myInterval);
    console.log('stop');
    const coordinates = this.#coordinates;
    const myLines = {
      type: 'LineString',
      coordinates: coordinates,
    };
    L.geoJSON(myLines).addTo(this.#map);
    console.log(coordinates);
    this.#cron._pause();
    console.log(this.#cron.seconds);
    //create a workout object
    //save in database
    this._createWorkout();
    this.#cron._reset();
    pauseWorkout.classList.add('hidden');
    startWorkout.classList.remove('hidden');

    resumeWorkout.classList.add('hidden');
    //render workout
  }
  _pauseWorkout() {
    pauseWorkout.classList.add('hidden');
    resumeWorkout.classList.remove('hidden');
    this.#cron._pause();
  }
  _resumeWorkout() {
    resumeWorkout.classList.add('hidden');
    pauseWorkout.classList.remove('hidden');

    this.#cron._start();
  }
  //

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    // this._geolocation(...coords);
    console.log(`https://www.google.com.br/maps/@${latitude},${longitude}`);
    console.log(this.#markers);

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
    const workoutGroup = L.featureGroup([...this.#markers]).getBounds();
    const { _northEast, _southWest } = workoutGroup;
    console.log(_northEast, _southWest);

    if (this.#workoutGroup) {
      this.#map.fitBounds([
        [this.#workoutGroup._northEast.lat, this.#workoutGroup._northEast.lng],
        [this.#workoutGroup._southWest.lat, this.#workoutGroup._southWest.lng],
      ]);
    }
    console.log(this.#workoutGroup);
    // L.marker(coords)
    //   .addTo(this.#map)
    //   .bindPopup(
    //     L.popup({
    //       maxWidth: 250,
    //       minWidth: 100,
    //       autoClose: false,
    //       closeOnClick: false,
    //       // className: `${workout.type}-popup`,
    //     })
    //   )
    //   .setPopupContent(`You are here!`)
    //   .openPopup();
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

    //watching position to draw lines
    if (navigator.geolocation) {
      this.#interval = navigator.geolocation.watchPosition(data => {
        console.log(data.coords);
        this.#coordinates.push([data.coords.latitude, data.coords.longitude]);
        console.log(this.#coordinates),
          function () {
            alert("Can't get yout current position");
          };
      });
    }
    let cron = new Cron(secondSpan, minuteSpan, hourSpan);
    this.#cron = cron;
    this.#cron._start();
    startWorkout.classList.add('hidden');
    pauseWorkout.classList.remove('hidden');
    stopWorkout.classList.remove('hidden');

    //start timer
  }
  _createWorkout() {
    let workout;
    //get data from form
    const type = inputType.value;
    const distance = 2;
    const elevation = 3;

    const duration = (
      (this.#cron.hours * 60 + this.#cron.minutes * 60 + this.#cron.seconds) /
      60
    ).toFixed(2);
    console.log(duration);

    const pace = this.#cron.pace;
    // const { lat, lng } = this.#mapEvent.latlng
    //   ? this.#mapEvent.latlng
    //   : this.#mapEvent;

    //check if data is valid//
    //if workout type running, create running object
    // if (type === 'Running') {
    //   const cadence = +inputCadence.value;
    //   if (
    //     !validData(distance, duration, cadence) ||
    //     !positiveInteger(distance, duration, cadence)
    //   ) {
    //     return alert('Please insert positive numbers');
    //   }

    //   workout = new Running([lat, lng], distance, duration, cadence);
    // }
    //if workout type Cycling, create cycling object
    // if (type === 'Cycling') {
    //   const elevationGain = +inputElevation.value;
    //   if (
    //     !validData(distance, duration, elevationGain) ||
    //     !positiveInteger(distance, duration)
    //   ) {
    //     return alert('Please insert positive numbers');
    //   }

    //   workout = new Cycling([lat, lng], distance, duration, elevationGain);
    // }
    workout = new Workout(
      this.#coordinates,
      distance,
      duration,
      elevation,
      type
    );
    this.#coordinates = [];
    console.log(workout);
    //async function to render location and then add new object to workout array
    this._addNewWorkout(workout);
  }

  _renderWorkoutMarker(workout) {
    let mark = L.marker(workout.coords[0])
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
      .setPopupContent(`${workout.type} in ${workout.locationInfo}`)
      .openPopup();
    console.log(mark);
    console.log(workout);
    console.log(this.#markers);

    this.#markers.push((this.#markers[workout.id] = mark));
    this.#workoutGroup = L.featureGroup([...this.#markers]).getBounds();
    console.log(this.#workoutGroup);
    console.log(this.#workoutGroup._northEast.lat);
  }
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--" 
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
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value--pace">${workout.pace}</span>
          <span class="workout__unit">spm</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value--elevation">${workout.elevation}</span>
        <span class="workout__unit">m</span>
      </div>

        <div class="delete--workout">
            <button class="delete__button">Delete &#128465</button>
        </div>
        <div class="edit--workout">
          <button class="edit__button">Edit
        </div>
      </li>`;

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
  }
  _addNewWorkout(workout) {
    fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${workout.coords[0][0]}&lon=${workout.coords[0][1]}&apiKey=b1b509d1849544b3a7afca6aa08b85cb`
    )
      .then(response => {
        if (!response.ok)
          throw new Error(`Location doesn't existis. Please try again!`);
        return response.json();
      })
      .then(result => {
        workout.locationInfo = `${result.features[0].properties.city} - ${result.features[0].properties.country}`;
        return workout;
      })
      .then(workout => {
        this.#workouts.push(workout);
        console.log(this.#workouts);

        //render workout object on map as a marker
        // this._renderWorkoutMarker(workout);
        this._renderWorkoutMarker(workout);

        //render workout on list
        this._renderWorkout(workout);

        //Storage data in local storage api
        this._setLocalStorage();

        //hidden form and clear data
        this._hideForm();
      })
      .catch(error => console.log(error));
  }
}

const app = new App();
