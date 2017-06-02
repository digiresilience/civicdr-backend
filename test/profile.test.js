const ava = require('ava');
const request = require('supertest');
const lib = require('../lib');
const defined = require('defined');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const R = require('ramda');
const { getUUID, pickset, getRandomInt } = require('../utils/misc');
const faker = require('faker');
const {
  secure_channels,
  languages,
  notification_prefs,
  notification_languages
} = require('../db/constants');

let test = ava.test;

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.IpProfile = require('../models/ip_profile')(conn);
});

test('GET /profile - get profile for IP', async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');

  const res = await request(t.context.app)
    .get('/profile')
    .set('Authorization', `Bearer ${token}`)
    .set('accept', 'application/json');

  t.is(res.status, 200);
});

test('GET /profile - get profile for SP', async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');

  const res = await request(t.context.app)
    .get('/profile')
    .set('Authorization', `Bearer ${token}`)
    .set('accept', 'application/json');

  t.is(res.status, 200);
});

test('GET /profile - get unexisting profile', async t => {
  let user = { roles: ['IP'], sub: 'unexisting' };
  let token = jwt.sign(user, 'secret');

  const res = await request(t.context.app)
    .get('/profile')
    .set('Authorization', `Bearer ${token}`)
    .set('accept', 'application/json');

  t.is(res.status, 404);
});

test('POST /profile - create new IP profile', async t => {
  const userID = `auth0|${faker.random.number()}`;
  let user = { roles: ['IP'], sub: userID };
  let token = jwt.sign(user, 'secret');

  let profileData = {
    openid: userID,
    contact: faker.internet.exampleEmail(),
    name: faker.name.findName(),
    notification_prefs: pickset(notification_prefs, getRandomInt(0, 2)),
    notification_languages: pickset(notification_languages, getRandomInt(1, 2)),
    languages: pickset(languages, getRandomInt(1, 5)),
    secure_channels: pickset(secure_channels, getRandomInt(1, 5))
  };

  const res = await request(t.context.app)
    .post('/profile')
    .send(profileData)
    .set('Authorization', `Bearer ${token}`)
    .set('accept', 'application/json');

  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);

  t.is(res.status, 200);
  t.truthy(defined(profile));
  t.truthy(R.has('id', profile));
});

test('POST /profile - create IP without sufficient fields', async t => {
  const userID = `auth0|${faker.random.number()}`;
  let user = { roles: ['IP'], sub: userID };
  let token = jwt.sign(user, 'secret');

  let profileData = {
    name: faker.name.findName(),
    contact: faker.internet.exampleEmail(),
    location: faker.address.city()
  };

  const res = await request(t.context.app)
    .post('/profile')
    .send(profileData)
    .set('Authorization', `Bearer ${token}`)
    .set('accept', 'application/json');

  t.is(res.status, 422);
});
