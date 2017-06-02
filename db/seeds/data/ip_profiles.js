const xtend = require('xtend');
const faker = require('faker');
const fs = require('fs');
const keys = require('./keys.json');
const {
  zeroes,
  pickone,
  pickset,
  getRandomInt
} = require('../../../utils/misc');
const {
  secure_channels,
  types_of_work,
  languages,
  notification_prefs,
  notification_languages,
  services
} = require('../../constants');

let data = zeroes(10);

let seeds = data.map(item => {
  let email = faker.internet.exampleEmail();
  return xtend(item, {
    openid: `auth0|${faker.random.number()}`,
    name: faker.name.findName(),
    contact: email,
    location: faker.address.city(),
    secure_channels: pickset(secure_channels, getRandomInt(1, 5)),
    languages: pickset(languages, getRandomInt(1, 5)),
    notification_prefs: pickset(notification_prefs, getRandomInt(0, 2)),
    notification_languages: pickset(notification_languages, 1),
    types_of_work: pickset(types_of_work, getRandomInt(1, 5)),
    pgp_key: pickone(keys),
    internal_level: 'seed data'
  });
});

seeds[0].openid = 'auth0|ip';
seeds[0].contact = 'ip@example.org';

module.exports = seeds;
