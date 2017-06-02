const seeds = require('./data/groupings');
const { pickset } = require('../../utils/misc');
const R = require('ramda');

exports.seed = async (knex, Promise) => {
  const Grouping = require('../../models/grouping')(knex);
  const Ticket = require('../../models/ticket')(knex);
  let groupings = await Promise.all(
    seeds.map(grouping => Grouping.create(grouping))
  );

  /* Add some ticket groupings */
  let tickets = await Ticket.find();
  groupings = R.flatten(groupings);
  try {
    tickets.forEach(async ticket => {
      let subgroupings = pickset(groupings, 3);
      await Promise.all(
        subgroupings.map(grouping => {
          Ticket.addGrouping(ticket.id, grouping);
        })
      );
    });
  } catch (e) {
    throw new Error('Could not create seed data', e);
  }
  return;
};
