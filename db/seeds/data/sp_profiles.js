const xtend = require('xtend');
const faker = require('faker');
const keys = require('./keys.json');
const {
  getRandomInt,
  zeroes,
  pickset,
  pickone
} = require('../../../utils/misc');

const {
  services,
  secure_channels,
  start_time,
  languages,
  per_week_availability
} = require('../../constants');

let data = zeroes(10);

let seeds = data.map(item => {
  let email = faker.internet.exampleEmail();
  return xtend(item, {
    openid: `auth0|${faker.random.number()}`,
    name: faker.name.findName(),
    services: pickset(services, getRandomInt(1, 5)),
    description: 'seed data',
    contact: email,
    location: faker.random.locale(),
    secure_channels: pickset(secure_channels, getRandomInt(1, 5)),
    fees: faker.lorem.words(),
    languages: pickset(languages, getRandomInt(1, 5)),
    pgp_key: pickone(keys),
    rating: getRandomInt(0, 5),
    start_time: pickone(start_time),
    per_week_availability: pickone(per_week_availability)
  });
});

seeds[0].openid = 'auth0|sp';
seeds[0].contact = 'sp@example.org';

module.exports = seeds;
