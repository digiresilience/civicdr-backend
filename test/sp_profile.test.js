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
  t.context.Ticket = require('../models/ticket')(conn);
  t.context.IpProfile = require('../models/ip_profile')(conn);
  t.context.SpProfile = require('../models/sp_profile')(conn);
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test.afterEach.always(t => {
  t.context.conn('sp_profiles').whereNot('description', 'seed data').del();
});

test('POST /sp_profiles - create SP without sufficient fields', async t => {
  let spData = {
    email: 'sp@example.org',
    name: 'test'
  };

  const res = await request(t.context.app)
    .post('/sp_profiles')
    .send(spData)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 422);
});

test('POST /sp_profiles - create a new SP profile', async t => {
  let spData = {
    contact: 'sp@example.org',
    name: 'test',
    services: ['Alerts and Warnings'],
    secure_channels: ['PGP'],
    languages: ['Farsi'],
    fees: 'one million dollars'
  };

  const res = await request(t.context.app)
    .post('/sp_profiles')
    .send(spData)
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

test('GET /sp_profiles/:id - get an existing SP profile', async t => {
  const [{ id }] = await t.context
    .conn('sp_profiles')
    .returning('id')
    .where('description', 'seed data')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/sp_profiles/${id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('accept', 'application/json');

  t.is(res.status, 200);
});

test('GET /sp_profiles/:id - get a non-existing SP profile', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .get(`/sp_profiles/${randomid}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('accept', 'application/json');

  t.is(res.status, 404);
});

test('PUT /sp_profiles/:id - update an existing SP profile', async t => {
  const [spProfile] = await t.context
    .conn('sp_profiles')
    .returning('id')
    .where('description', 'seed data')
    .limit(1);

  const res = await request(t.context.app)
    .put(`/sp_profiles/${spProfile.id}`)
    .send({ contact: 'test@test.edu' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  const [updatedProfile] = await t.context.SpProfile.findById(spProfile.id);
  t.is(updatedProfile.contact, 'test@test.edu');
  t.truthy(
    moment(updatedProfile.updated_at).isAfter(moment(spProfile.updated_at))
  );
});

test('PUT /sp_profiles/:id - update a non-existing SP profile', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .put(`/sp_profiles/${randomid}`)
    .send({ contact: 'test@test.edu' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('DELETE /sp_profiles/:id - delete an existing SP profile', async t => {
  const [ip] = await t.context.IpProfile.create(
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

  const [sp] = await t.context.SpProfile.create(
    {
      contact: 'sp@example.org',
      name: 'test',
      services: ['Alerts and Warnings'],
      secure_channels: ['PGP'],
      languages: ['Farsi'],
      fees: 'one million dollars'
    },
    'test'
  );

  // Create some tickets with this SP
  const ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: 'Alex',
    ticket_ip_contact: 'alex@asdf.org',
    steps_taken: 'tried everything',
    ip_assigned_id: ip,
    incident_type: []
  };

  let [ticket_id] = await t.context.Ticket.create(ticketData, 'test');
  await t.context.Ticket.assignSpProfile(ticket_id, sp);

  let before = await t.context.conn('tickets').where('sp_assigned_id', sp);
  t.truthy(before.length === 1);

  const res = await request(t.context.app)
    .delete(`/sp_profiles/${sp}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  let [spProfile] = await t.context.SpProfile.findById(sp);

  t.is(res.status, 200);
  t.truthy(!defined(spProfile));

  // There are no tickets with this sp after deleting
  let after = await t.context.conn('tickets').where('sp_assigned_id', sp);
  t.truthy(after.length === 0);
});

test('DELETE /sp_profiles/:id - delete a non-existing SP profile', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .delete(`/sp_profiles/${randomid}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('GET /sp_profiles - get all SP profiles', async t => {
  const res = await request(t.context.app)
    .get('/sp_profiles')
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test('GET /sp_profiles - SPs have ticket counts', async t => {
  const res = await request(t.context.app)
    .get('/sp_profiles')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  t.truthy(res.body.every(R.has('ticket_count')));
});
