const ava = require('ava');
const request = require('supertest');
const lib = require('../../lib');
const jwt = require('jsonwebtoken');
const R = require('ramda');

let test = ava.test;

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.IpProfile = require('../../models/ip_profile')(conn);
});

test("GET /threads/:id - user can't delete msg they don't own", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id }] = await t.context
    .conn('messages')
    .select('id')
    .whereNull('created_by')
    .limit(1);

  const res = await request(t.context.app)
    .delete(`/messages/${id}`)
    .set('Authorization', `Bearer ${token}`);

  t.is(res.status, 403);
});
