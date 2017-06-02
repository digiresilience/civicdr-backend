const ava = require('ava');
const request = require('supertest');
const lib = require('../lib');
const defined = require('defined');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const R = require('ramda');
const { getUUID } = require('../utils/misc');

let test = ava.test;

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.IpProfile = require('../models/ip_profile')(conn);
  t.context.Ticket = require('../models/ticket')(conn);
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test.afterEach.always(t => {
  t.context.conn('ip_profiles').whereNot('internal_level', 'seed data').del();
});

test('POST /ip_profiles - create IP without sufficient fields', async t => {
  let ipData = {
    email: 'ip@example.org',
    name: 'test'
  };

  const res = await request(t.context.app)
    .post('/ip_profiles')
    .send(ipData)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 422);
});

test('POST /ip_profiles - create a new IP profile', async t => {
  let ipData = {
    contact: 'ip@example.org',
    name: 'test',
    notification_prefs: ['Inform me about status changes to an incident.'],
    notification_languages: ['Farsi'],
    languages: ['Farsi'],
    secure_channels: ['PGP']
  };

  const res = await request(t.context.app)
    .post('/ip_profiles')
    .send(ipData)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  // Returns a uuid
  let [id] = res.body;
  t.regex(
    id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
});

test('GET /ip_profiles/:id - get an existing IP profile', async t => {
  const [{ id }] = await t.context
    .conn('ip_profiles')
    .returning('id')
    .where('internal_level', 'seed data')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/ip_profiles/${id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('accept', 'application/json');

  t.is(res.status, 200);
});

test('GET /ip_profiles/:id - get a non-existing IP profile', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .get(`/ip_profiles/${randomid}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('accept', 'application/json');

  t.is(res.status, 404);
});

test('PUT /ip_profiles/:id - update an existing IP profile', async t => {
  const [ipProfile] = await t.context
    .conn('ip_profiles')
    .returning('id')
    .where('internal_level', 'seed data')
    .limit(1);

  const res = await request(t.context.app)
    .put(`/ip_profiles/${ipProfile.id}`)
    .send({ contact: 'test@test.edu' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  const [updatedProfile] = await t.context.IpProfile.findById(ipProfile.id);
  t.is(updatedProfile.contact, 'test@test.edu');
  t.truthy(
    moment(updatedProfile.updated_at).isAfter(moment(ipProfile.updated_at))
  );
});

test('PUT /ip_profiles/:id - update a non-existing IP profile', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .put(`/ip_profiles/${randomid}`)
    .send({ contact: 'test@test.edu' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('DELETE /ip_profiles/:id - delete an existing IP profile', async t => {
  const [id] = await t.context.IpProfile.create(
    {
      contact: 'ip@example.org',
      name: 'test',
      notification_prefs: ['Inform me about status changes to an incident.'],
      notification_languages: ['Farsi'],
      languages: ['Farsi'],
      secure_channels: ['PGP']
    },
    'test'
  );

  // Create some tickets with this IP
  const ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: 'Alex',
    ticket_ip_contact: 'alex@asdf.org',
    steps_taken: 'tried everything',
    ip_assigned_id: id,
    incident_type: []
  };
  await t.context.Ticket.create(ticketData, 'test');
  await t.context.Ticket.create(ticketData, 'test');
  await t.context.Ticket.create(ticketData, 'test');

  // There are tickets with this IP
  let before = await t.context
    .conn('tickets')
    .select()
    .where('ip_assigned_id', id);
  t.truthy(before.length > 0);

  const res = await request(t.context.app)
    .delete(`/ip_profiles/${id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  let [ipProfile] = await t.context.IpProfile.findById(id);

  t.truthy(!defined(ipProfile));

  // There are no tickets with this IP
  let after = await t.context
    .conn('tickets')
    .select()
    .where('ip_assigned_id', id);
  t.is(after.length, 0);
});

test('DELETE /ip_profiles/:id - delete a non-existing IP profile', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .delete(`/ip_profiles/${randomid}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('GET /ip_profiles - get all IP profiles', async t => {
  const res = await request(t.context.app)
    .get('/ip_profiles')
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test('GET /ip_profiles - IPs have ticket counts', async t => {
  const res = await request(t.context.app)
    .get('/ip_profiles')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  t.truthy(res.body.every(R.has('ticket_count')));
});
