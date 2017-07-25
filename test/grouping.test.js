const ava = require('ava');
const request = require('supertest');
const lib = require('../lib');
const has = require('has');
const jwt = require('jsonwebtoken');
const defined = require('defined');
const { getUUID } = require('../utils/misc');
const R = require('ramda');

let test = ava.test;

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.Grouping = require('../models/grouping')(conn);

  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test.afterEach.always(t => {
  t.context.conn('groupings').whereNot('description', 'seed').del();
});

test('POST /groupings - create with insufficient fields', async t => {
  let groupingData = {
    description: 'new'
  };

  const res = await request(t.context.app)
    .post('/groupings')
    .send(groupingData)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 422);
});

test('POST /groupings - create a new grouping', async t => {
  let groupingData = {
    title: 'new',
    description: 'cool description'
  };

  const res = await request(t.context.app)
    .post('/groupings')
    .send(groupingData)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);

  // Returns a uuid
  let [id] = res.body;

  t.regex(
    id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
});

test('GET /groupings/:id - get an existing grouping', async t => {
  const [{ id }] = await t.context
    .conn('groupings')
    .returning('id')
    .where('description', 'seed')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/groupings/${id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('accept', 'application/json');

  t.is(res.status, 200);

  t.truthy(has(res.body, 'title'));
  t.truthy(has(res.body, 'description'));
});

test('GET /groupings/:id - get a non-existing grouping', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .get(`/groupings/${randomid}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('accept', 'application/json');

  t.is(res.status, 404);
});

test('PUT /groupings/:id - update an existing grouping', async t => {
  const [{ id }] = await t.context
    .conn('groupings')
    .returning('id')
    .where('description', 'seed')
    .limit(1);

  const res = await request(t.context.app)
    .put(`/groupings/${id}`)
    .send({ description: 'done' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  const [{ description }] = await t.context.conn('groupings').where('id', id);
  t.is(description, 'done');
});

test('UPDATE /groupings/:id - update a non-existing grouping', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .put(`/groupings/${randomid}`)
    .send({ description: 'done' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('DELETE /groupings/:id - delete an existing grouping', async t => {
  const [id] = await t.context.Grouping.create({
    title: 'test',
    description: 'test'
  });

  const res = await request(t.context.app)
    .delete(`/groupings/${id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);
  let [grouping] = await t.context.Grouping.findById(id);

  const dbres = await t.context.conn
    .from('tickets_groupings')
    .where('grouping_id', id)
    .limit(1);
  t.is(dbres.length, 0);
  t.truthy(!defined(grouping));
});

test('PUT /groupings/:id - delete a non-existing grouping', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .delete(`/groupings/${randomid}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('GET /groupings - get all groupings', async t => {
  let [{ count }] = await t.context.conn('groupings').count('id');
  const res = await request(t.context.app)
    .get('/groupings')
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test('GET /groupings/:id - get a grouping with associated tickets', async t => {
  const [{ grouping_id, ticket_id }] = await t.context
    .conn('tickets_groupings')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/groupings/${grouping_id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
  t.truthy(res.body.tickets.length > 0);
});

test('GET /groupings - get a grouping has related ticket counts', async t => {
  const [{ grouping_id, ticket_id }] = await t.context
    .conn('tickets_groupings')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/groupings/`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);

  let index = R.indexBy(R.prop('id'), res.body);

  t.truthy(index[grouping_id].ticket_count > 0);
});
