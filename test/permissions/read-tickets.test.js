const ava = require('ava');
const request = require('supertest');
const lib = require('../../lib');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { getUUID } = require('../../utils/misc');
const R = require('ramda');

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

test("GET /tickets - IP can only read tickets they're assigned", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [{ id: profile_id }] = await t.context.IpProfile.findByOpenId(user.sub);

  const res = await request(t.context.app)
    .get(`/tickets`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
  t.truthy(res.body.every(R.propEq('ip_assigned_id', profile_id)));
  t.truthy(R.none(R.has('groupings'), res.body));
});

test("GET /tickets - SP can only read ticket they're assigned", async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');
  let [{ id: profile_id }] = await t.context.SpProfile.findByOpenId(user.sub);

  const res = await request(t.context.app)
    .get(`/tickets`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
  t.truthy(res.body.every(R.propEq('sp_assigned_id', profile_id)));
  t.truthy(R.none(R.has('groupings'), res.body));
});

test('GET /tickets - Admin tickets should have groupings', async t => {
  const res = await request(t.context.app)
    .get(`/tickets`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
  res.body.forEach(ticket => {
    t.truthy(R.has('groupings', ticket));
  });
});

test('GET /tickets - A user that does not have a profile is unauthorized to read tickets', async t => {
  let user = { roles: ['IP'], sub: 'auth0|noprofile' };
  let token = jwt.sign(user, 'secret');
  const res = await request(t.context.app)
    .get(`/tickets`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 403);
});
