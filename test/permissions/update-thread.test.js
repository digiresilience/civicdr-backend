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
  t.context.Ticket = require('../../models/ticket')(conn);
  t.context.Thread = require('../../models/thread')(conn);
  t.context.IpProfile = require('../../models/ip_profile')(conn);
  t.context.SpProfile = require('../../models/sp_profile')(conn);
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test("GET /threads/:id - IP can't read thread they don't own", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id: thread_id }] = await t.context
    .conn('threads')
    .select('id')
    .where('type', 'note')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/threads/${thread_id}`)
    .set('Authorization', `Bearer ${token}`);

  t.is(res.status, 403);
});

test("GET /threads/:id - SP can't read thread they don't own", async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.SpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id: thread_id }] = await t.context
    .conn('threads')
    .select('id')
    .where('type', 'note')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/threads/${thread_id}`)
    .set('Authorization', `Bearer ${token}`);

  t.is(res.status, 403);
});

test("POST /threads/:id/messages - IP can't update thread they don't own", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id: thread_id }] = await t.context
    .conn('threads')
    .select('id')
    .where('type', 'note')
    .limit(1);

  const res = await request(t.context.app)
    .post(`/threads/${thread_id}/messages`)
    .send({ content: 'Test' })
    .set('Authorization', `Bearer ${token}`);

  t.is(res.status, 403);
});

test("POST /threads/:id/messages - SP can't update thread they don't own", async t => {
  let user = { roles: ['SP'], sub: 'auth0|sp' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.SpProfile.findByOpenId(user.sub);
  user.profile = profile;

  const [{ id: thread_id }] = await t.context
    .conn('threads')
    .select('id')
    .where('type', 'note')
    .limit(1);

  const res = await request(t.context.app)
    .post(`/threads/${thread_id}/messages`)
    .send({ content: 'Test' })
    .set('Authorization', `Bearer ${token}`);

  t.is(res.status, 403);
});
