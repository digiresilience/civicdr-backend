const xtend = require('xtend');
const faker = require('faker');
const { zeroes, pickone, pickset } = require('../../../utils/misc');
const { incident_types, statuses } = require('../../constants');

const ids = zeroes(50);

let seeds = ids.map(item => {
  return xtend(item, {
    ticket_ip_contact: faker.internet.email(),
    ticket_ip_name: faker.name.findName(),
    ticket_sp_contact: faker.internet.email(),
    ticket_sp_name: faker.name.findName(),
    date_of_incident: faker.date.recent().toISOString().substring(0, 10),
    incident_type: pickset(incident_types, 2),
    description: faker.lorem.sentence(),
    steps_taken: faker.lorem.sentence(),
    status: pickone(statuses)
  });
});

module.exports = seeds;
