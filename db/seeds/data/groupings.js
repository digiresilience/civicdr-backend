const xtend = require('xtend');
const faker = require('faker');
const { zeroes } = require('../../../utils/misc');

let data = zeroes(10);

let seeds = data.map(item => {
  return xtend(item, {
    title: faker.random.words(),
    description: 'seed'
  });
});

module.exports = seeds;
