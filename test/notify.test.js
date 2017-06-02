const ava = require('ava');
const request = require('supertest');
const lib = require('../lib');
const defined = require('defined');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const xtend = require('xtend');
const { getUUID } = require('../utils/misc');

let test = ava.test;

const prepareTicketData = async context => {
  const [{ id: profile_id }] = await context
    .conn('ip_profiles')
    .returning('id')
    .limit(1);
  const ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: 'Alex',
    ticket_ip_contact: 'alex@asdf.org',
    steps_taken: 'tried everything',
    ip_assigned_id: profile_id,
    incident_type: []
  };
  return ticketData;
};

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.Ticket = require('../models/ticket')(conn);
  t.context.IpProfile = require('../models/ip_profile')(conn);
  t.context.Thread = require('../models/thread')(conn);
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test('GET /tickets/:id - ticket notification status - admin', async t => {
  const ticketData = await prepareTicketData(t.context);
  const [id] = await t.context.Ticket.create(ticketData, 'notify');

  let res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  // first GET notifies
  t.is(res.status, 200);
  t.is(res.body.notify, true);

  res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  // second does not
  t.is(res.status, 200);
  t.is(res.body.notify, false);

  // teardown
  t.context.Ticket.delete(id);
});

test('GET /tickets/:id - ticket notification status - ip', async t => {
  const ticketData = await prepareTicketData(t.context);
  const [id] = await t.context.Ticket.create(ticketData, 'notify');

  const [profile] = await t.context.IpProfile.findById(
    ticketData.ip_assigned_id
  );
  const user = { roles: ['IP'], sub: profile.openid };
  const token = jwt.sign(user, 'secret');

  let res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

  // first GET notifies (non-route created)
  t.is(res.status, 200);
  t.is(res.body.notify, true);

  res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

  // second GET doesn't
  t.is(res.status, 200);
  t.is(res.body.notify, false);

  // edit record
  const updatedTicket = xtend(ticketData, {
    description: 'a new thing'
  });
  await t.context.Ticket.update(id, updatedTicket, 'test');

  res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

  // notify again
  t.is(res.status, 200);
  t.is(res.body.notify, true);

  // teardown
  t.context.Ticket.delete(id);
});

test('GET /tickets/:id - ticket notification status - add message', async t => {
  const ticketData = await prepareTicketData(t.context);
  const [id] = await t.context.Ticket.create(ticketData, 'notify');

  const [profile] = await t.context.IpProfile.findById(
    ticketData.ip_assigned_id
  );
  const user = { roles: ['IP'], sub: profile.openid };
  const token = jwt.sign(user, 'secret');

  let res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

  // first GET notifies (non-route created)
  t.is(res.status, 200);
  t.is(res.body.notify, true);

  res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

  // second GET doesn't
  t.is(res.status, 200);
  t.is(res.body.notify, false);

  // find corresponding threads
  let threads = await t.context.Thread.findByTicketId(id);

  // add an admin message to the ip thread
  await t.context.Thread.addMessage(
    { content: 'test' },
    threads.filter(th => th.type === 'ip')[0].id,
    null
  );

  res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

  // notify again
  t.is(res.status, 200);
  t.is(res.body.notify, true);

  // teardown
  t.context.Ticket.delete(id);
});

test('GET /tickets - ticket notification - has property', async t => {
  let res = await request(t.context.app)
    .get(`/tickets`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  // notify flag is there
  t.is(res.status, 200);
  res.body.forEach(ticket => {
    t.truthy(ticket.hasOwnProperty('notify'));
  });
});
