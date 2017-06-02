const ava = require('ava');
const request = require('supertest');
const lib = require('../../../lib');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { getUUID } = require('../../../utils/misc');

let test = ava.test;

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.IpProfile = require('../../../models/ip_profile')(conn);
  t.context.SpProfile = require('../../../models/sp_profile')(conn);
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test.afterEach.always(t => {
  t.context.conn('tickets').whereNot('created_by', 'Admin').del();
});

test('GET /ip_profiles/:id - IP can read their profile', async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const res = await request(t.context.app)
    .get(`/ip_profiles/${profile.id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test('GET /sp_profiles/:id - SP can read their profile', async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.SpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const res = await request(t.context.app)
    .get(`/sp_profiles/${profile.id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test("GET /ip_profiles/:id - IP can't read other profiles", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id }] = await t.context
    .conn('ip_profiles')
    .returning('id')
    .whereNot('id', profile.id)
    .limit(1);

  const res = await request(t.context.app)
    .get(`/ip_profiles/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 403);
});

test("GET /sp_profiles/:id - SP can't read other profiles", async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.SpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id }] = await t.context
    .conn('sp_profiles')
    .returning('id')
    .whereNot('id', profile.id)
    .limit(1);

  const res = await request(t.context.app)
    .get(`/sp_profiles/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 403);
});

test('PUT /ip_profiles/:id - IP can update their profile', async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const res = await request(t.context.app)
    .put(`/ip_profiles/${profile.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test' })
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test('PUT /sp_profiles/:id - SP can update their profile', async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.SpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const res = await request(t.context.app)
    .put(`/sp_profiles/${profile.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test' })
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test("PUT /ip_profiles/:id - IP can't update other profiles", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id }] = await t.context
    .conn('ip_profiles')
    .returning('id')
    .whereNot('id', profile.id)
    .limit(1);

  const res = await request(t.context.app)
    .put(`/ip_profiles/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test' })
    .set('Accept', 'application/json');

  t.is(res.status, 403);
});

test("PUT /sp_profiles/:id - SP can't update other profiles", async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.SpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id }] = await t.context
    .conn('sp_profiles')
    .returning('id')
    .whereNot('id', profile.id)
    .limit(1);

  const res = await request(t.context.app)
    .put(`/sp_profiles/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test' })
    .set('Accept', 'application/json');

  t.is(res.status, 403);
});
