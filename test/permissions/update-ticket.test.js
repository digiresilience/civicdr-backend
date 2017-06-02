const ava = require('ava');
const request = require('supertest');
const lib = require('../../lib');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { getUUID } = require('../../utils/misc');

let test = ava.test;

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.Ticket = require('../../models/ticket')(conn);
  t.context.IpProfile = require('../../models/ip_profile')(conn);
  t.context.SpProfile = require('../../models/sp_profile')(conn);
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test.afterEach.always(t => {
  t.context.conn('tickets').whereNot('created_by', 'Admin').del();
});

test("GET /tickets/:id - IP can read ticket they've created", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id }] = await t.context
    .conn('tickets')
    .returning('id')
    .where('ip_assigned_id', profile.id)
    .limit(1);

  const res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test("GET /tickets/:id - SP can read ticket they're assigned", async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.SpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id }] = await t.context
    .conn('tickets')
    .returning('id')
    .where('sp_assigned_id', profile.id)
    .limit(1);

  const res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test('GET /tickets/:id - IP unauthorized to read non-existing tickets', async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const id = getUUID();

  const res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 403);
});

test("GET /tickets/:id - IP can't read ticket they're not assigned", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);

  const [{ id }] = await t.context
    .conn('tickets')
    .returning('id')
    .whereNot('ip_assigned_id', profile.id)
    .limit(1);

  const res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 403);
});

test("GET /tickets/:id - SP can't read ticket they're not assigned", async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.SpProfile.findByOpenId(user.sub);

  const [{ id }] = await t.context
    .conn('tickets')
    .returning('id')
    .whereNot('sp_assigned_id', profile.id)
    .limit(1);

  const res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 403);
});
