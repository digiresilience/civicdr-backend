const R = require('ramda');
const faker = require('faker');

function pickset(arr, size) {
  var shuffled = arr.slice(0), i = arr.length, temp, index;
  while (i--) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(0, size);
}

const pickone = arr => pickset(arr, 1)[0];
const zeroes = R.times(R.always(0));

const makeRandomZeroArray = max => zeroes(Math.ceil(Math.random() * max));

function getUUID() {
  return faker.random.uuid();
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const defaults = R.flip(R.merge);

const uuids = R.pipe(zeroes, R.map(getUUID));

module.exports = {
  pickset,
  pickone,
  makeRandomZeroArray,
  zeroes,
  uuids,
  getUUID,
  getRandomInt,
  defaults
};
