'use strict';
import axios from 'axios';
import { Running } from './running.js';
import { Cycling } from './cycling.js';
import { Workout } from './workout.js';
import { Cron } from './cron.js';
import 'regenerator-runtime/runtime';
import leaflet from 'leaflet';

import Topography from 'leaflet-topography';

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
    startWorkout.addEventListener('click', this._startWorkout.bind(this));
    stopWorkout.addEventListener('click', this._stopWorkout.bind(this));
    // form.addEventListener('submit', this._newWorkout.bind(this));
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
    console.log(this.#coordinates);

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
    console.log(this.#workouts);
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
    // const groupMarkers = this.#markers.map(array => array[0]);
    // const workoutGroup = L.featureGroup(groupMarkers).getBounds();
    // const { _northEast, _southWest } = workoutGroup;
    // console.log(_northEast, _southWest);

    // if (this.#workoutGroup) {
    //   this.#map.fitBounds([
    //     [this.#workoutGroup._northEast.lat, this.#workoutGroup._northEast.lng],
    //     [this.#workoutGroup._southWest.lat, this.#workoutGroup._southWest.lng],
    //   ]);
    // }
    // console.log(this.#workoutGroup);
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

  _startWorkout(e) {
    e.preventDefault();
    //start timer
    let cron = new Cron(secondSpan, minuteSpan, hourSpan);
    this.#cron = cron;
    this.#cron._start();
    startWorkout.classList.add('hidden');
    pauseWorkout.classList.remove('hidden');
    stopWorkout.classList.remove('hidden');

    //watching position to draw lines
    if (navigator.geolocation) {
      this.#interval = navigator.geolocation.watchPosition(data => {
        console.log(data.coords);
        this.#coordinates.push(
          L.latLng([data.coords.latitude, data.coords.longitude])
        );
        console.log(this.#coordinates),
          function () {
            alert("Can't get yout current position");
          };
      });
    }
    //insert start position mark
  }
  _createWorkout() {
    let workout;

    //get data from form
    const type = inputType.value;
    const distance = (this._totalDistance() / 1000).toFixed(2);

    // this._elevationGain();
    console.log(this.#coordinates);
    const duration = Number(
      (this.#cron.hours * 60 + this.#cron.minutes * 60 + this.#cron.seconds) /
        60
    ).toFixed(2);
    console.log(typeof duration);

    const pace = this.#cron.pace;

    this._getWorkoutData()
      .then(workoutData => {
        const elevationGain = Number(
          workoutData[1].elevation - workoutData[0].elevation
        ).toFixed(1);
        workout = new Workout(
          this.#coordinates,
          distance,
          duration,
          elevationGain,
          type,
          workoutData[2].data.features[0].properties.city
        );

        this.#coordinates = [];
        console.log(workout.coords[0].lat);

        //async function to render location and then add new object to workout array
        this._addNewWorkout(workout);
      })
      .catch(error => console.log(error));
  }
  async _getWorkoutData() {
    try {
      const options = {
        token:
          'pk.eyJ1Ijoic3RlZmFub3ZpdmFzIiwiYSI6ImNsMG8yZzd0bzFtMzkzaWw0bDQ5aHZ0cjMifQ.SE3bsA0q__9_gm7G5Vh6rA',
      };
      const workoutData = await Promise.all([
        Topography.getTopography(this.#coordinates[0], options),
        Topography.getTopography(this.#coordinates.slice(-1)[0], options),
        axios.get(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${
            this.#coordinates[0].lat
          }&lon=${
            this.#coordinates[0].lng
          }&apiKey=b1b509d1849544b3a7afca6aa08b85cb`
        ),
      ]);

      return workoutData;
    } catch (err) {
      console.log(`${err}`);
    }
  }
  _renderWorkoutMarker(workout) {
    const mark = L.marker(workout.coords[0])
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
      .setPopupContent(`${workout.type} in ${workout.location}`)
      .openPopup();
    console.log(mark);
    const geoLines = L.polyline(workout.coords).addTo(this.#map);

    this.#markers.push((this.#markers[workout.id] = [mark, geoLines]));

    // const groupMarkers = this.#markers.map(array => array[0]);
    // this.#workoutGroup = L.featureGroup(groupMarkers).getBounds();
    console.log(this.#markers);

    // console.log(this.#workoutGroup._northEast.lat);
  }
  _totalDistance() {
    let len = this.#coordinates.length;
    let ll1, ll2, dist;
    let totalDist = 0;
    for (let i = 1; i < len; i++) {
      ll1 = this.#coordinates[i - 1];
      ll2 = this.#coordinates[i % len];
      dist = ll1.distanceTo(ll2);
      totalDist += dist;
    }
    return totalDist;
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
        
      </li>`;

    form.insertAdjacentHTML('afterend', html);
    //delete button
    const deleteWorkoutBtn = document.querySelector('.delete--workout');
    deleteWorkoutBtn.addEventListener('click', this._deleteWorkout.bind(this));
    //edit button
    // const editWorkoutBtn = document.querySelector('.edit--workout');
    // editWorkoutBtn.addEventListener('click', this._editWorkout.bind(this));
    // console.log(editWorkoutBtn);
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
    this.#map.setView(workout.coords[0], 14);
  }
  _setLocalStorage() {
    console.log(this.#workouts);
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
    this.#map.removeLayer(this.#markers[markerId][0]);
    this.#map.removeLayer(this.#markers[markerId][1]);
    //Remove workout div from index.html
    workoutElement.remove();
  }

  _addNewWorkout(workout) {
    // axios
    //   .get(
    //     `https://api.geoapify.com/v1/geocode/reverse?lat=${workout.coords[0].lat}&lon=${workout.coords[0].lng}&apiKey=b1b509d1849544b3a7afca6aa08b85cb`
    //   )
    //   .then(response => {
    //     if (!response.ok)
    //       throw new Error(`Location doesn't existis. Please try again!`);
    //     workout.locationInfo = `${result.features[0].properties.city} - ${result.features[0].properties.country}`;
    //     return workout;
    //   })
    //   .then(result => {
    //     workout.locationInfo = `${result.features[0].properties.city} - ${result.features[0].properties.country}`;
    //     return workout;
    //   })
    //   .then(workout => {
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
  }
  // .catch(error => console.log(error));
}

const app = new App();
