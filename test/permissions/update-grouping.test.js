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
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test.afterEach.always(t => {
  t.context.conn('groupings').whereNot('created_by', 'Admin').del();
});

test("PUT /groupings/:id - SP can't update a grouping", async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');

  const [{ id }] = await t.context.conn('groupings').returning('id').limit(1);

  const res = await request(t.context.app)
    .put(`/groupings/${id}`)
    .send({ title: 'other-grouping' })
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

  t.is(res.status, 403);
});

test("PUT /groupings/:id - IP can't update a grouping", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');

  const [{ id }] = await t.context.conn('groupings').returning('id').limit(1);

  const res = await request(t.context.app)
    .put(`/groupings/${id}`)
    .send({ title: 'other-grouping' })
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

  t.is(res.status, 403);
});
