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
  t.context.Thread = require('../models/thread')(conn);
  t.context.Ip = require('../models/ip_profile')(conn);
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test('POST /tickets - create a new ticket creates ip thread and notes', async t => {
  const [{ id }] = await t.context.Ip.findByOpenId('auth0|ip');
  let ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: 'Alex',
    ticket_ip_contact: 'alex@asdf.org',
    steps_taken: 'tried everything',
    ip_assigned_id: id,
    incident_type: []
  };

  const res = await request(t.context.app)
    .post('/tickets')
    .send(ticketData)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  const threads = await t.context.Thread.findByTicketId(res.body[0]);
  t.truthy(threads.length > 0);
  t.truthy(threads.filter(thread => thread.type === 'note').length > 0);
  t.truthy(
    threads.filter(
      thread => thread.type === 'ip' && thread.participant === id
    ).length > 0
  );
});

test('DELETE /tickets/:id - delete ticket deletes its threads and messages', async t => {
  const [{ id }] = await t.context.Ip.findByOpenId('auth0|ip');
  let ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: 'Alex',
    ticket_ip_contact: 'alex@asdf.org',
    steps_taken: 'tried everything',
    ip_assigned_id: id,
    incident_type: []
  };
  const [ticketID] = await t.context.Ticket.create(ticketData, 'test');

  const res = await request(t.context.app)
    .delete(`/tickets/${ticketID}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  const threads = await t.context.Thread.findByTicketId(ticketID);
  t.truthy(threads.length === 0);

  /* TODO check for message delete */
});

test('GET /tickets/:ticket_id/threads - get threads for a ticket', async t => {
  const [{ ticket_id }] = await t.context
    .conn('threads')
    .select('ticket_id')
    .whereNotNull('ticket_id')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/tickets/${ticket_id}/threads`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);
  t.true(Array.isArray(res.body) && res.body.length > 0);
  t.true(
    res.body.every(
      t => t.messages && Array.isArray(t.messages) && t.messages.length > 0
    )
  );
});


test("GET /tickets/:ticket_id/threads - don't return inactive", async t => {
  const [thread] = await t.context
        .conn('threads')
        .select()
        .whereNotNull('ticket_id')
        .where('type', 'sp')
        .limit(1);
  const { ticket_id, participant } = thread;

  // Confirm that the admin reads three threads with an assigned SP
  const resBeforeUnassign = await request(t.context.app)
        .get(`/tickets/${ticket_id}/threads`)
        .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(resBeforeUnassign.status, 200);
  t.true(
    Array.isArray(resBeforeUnassign.body) &&
      resBeforeUnassign.body.length === 3 &&
      resBeforeUnassign.body.every(t => t.status === 'active')
  );

  // Unassign SP and confirm that the admin reads two threads,
  // since they shouldn't receive the `inactive` thread
  await t.context.Ticket.unassignSpProfile(ticket_id, participant);

  const resAfterUnassign = await request(t.context.app)
        .get(`/tickets/${ticket_id}/threads`)
        .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(resAfterUnassign.status, 200);
  t.true(
    Array.isArray(resAfterUnassign.body) &&
      resAfterUnassign.body.length === 2 &&
      resAfterUnassign.body.every(t => t.status === 'active')
  );
});


test('GET /groupings/:grouping_id/threads - get threads for a grouping', async t => {
  const [{ grouping_id }] = await t.context
    .conn('threads')
    .select('grouping_id')
    .whereNotNull('grouping_id')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/groupings/${grouping_id}/threads`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);
  t.true(Array.isArray(res.body) && res.body.length > 0);
  t.true(
    res.body.every(
      t => t.messages && Array.isArray(t.messages) && t.messages.length > 0
    )
  );
});

test('GET /threads/:id - get thread', async t => {
  const [{ id: thread_id }] = await t.context
    .conn('threads')
    .select('id')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/threads/${thread_id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);
});

test('GET /threads/:id - get non-existing thread', async t => {
  const thread_id = getUUID();

  const res = await request(t.context.app)
    .get(`/threads/${thread_id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 404);
});

test('POST /threads/:id/messages - add a message', async t => {
  const [{ user_id }] = await t.context.Ip.findByOpenId('auth0|ip');
  let [thread_id] = await t.context.Thread.create({
    participant: user_id,
    status: 'active',
    type: 'ip'
  });

  const res = await request(t.context.app)
    .post(`/threads/${thread_id}/messages`)
    .send({ content: 'test' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  let messages = await t.context.conn('messages').where('thread_id', thread_id);

  t.is(res.status, 200);
  t.truthy(
    R.difference(R.keys(res.body[0]), [
      'id',
      'thread_id',
      'created_by',
      'content',
      'created_at',
      'updated_at'
    ]).length === 0
  );
  t.truthy(messages.length === 1);
});

test('POST /threads/:id/messages - add a message as a participating IP', async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let ipToken = jwt.sign(user, 'secret');
  const [profile] = await t.context.Ip.findByOpenId(user.sub);
  user.profile = profile;

  const ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: profile.name,
    ticket_ip_contact: profile.contact,
    steps_taken: 'tried everything',
    ip_assigned_id: profile.id,
    incident_type: []
  };

  const [ticket_id] = await t.context.Ticket.create(ticketData, 'test');

  let [{ id: thread_id }] = await t.context
    .conn('threads')
    .select('id')
    .where('type', 'ip')
    .where('ticket_id', ticket_id)
    .where('participant', profile.id)
    .limit(1);

  const res = await request(t.context.app)
    .post(`/threads/${thread_id}/messages`)
    .send({ content: 'test' })
    .set('Authorization', `Bearer ${ipToken}`);

  let messages = await t.context.conn('messages').where('thread_id', thread_id);

  t.is(res.status, 200);
  t.true(messages[messages.length - 1].created_by === profile.id);
});

test('POST /threads/:id/messages - add a message to non-existing thread', async t => {
  const [{ user_id }] = await t.context.Ip.findByOpenId('auth0|ip');
  let thread_id = getUUID();

  const res = await request(t.context.app)
    .post(`/threads/${thread_id}/messages`)
    .send({ content: 'test' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('POST /threads/:id/messages - add a message with no content', async t => {
  const [{ user_id }] = await t.context.Ip.findByOpenId('auth0|ip');
  let [thread_id] = await t.context.Thread.create({
    participant: user_id,
    status: 'active',
    type: 'ip'
  });

  const res = await request(t.context.app)
    .post(`/threads/${thread_id}/messages`)
    .send({})
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 422);
});

test('DELETE /messages/:id', async t => {
  const [{ id }] = await t.context.conn('messages').select('id').limit(1);

  const res = await request(t.context.app)
    .delete(`/messages/${id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  let messages = await t.context.conn('messages').where('id', id);

  t.is(res.status, 200);
  t.truthy(messages.length === 0);
});
