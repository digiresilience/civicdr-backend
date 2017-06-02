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

test("GET /tickets/:ticket_id/threads - IP can't read threads they don't own", async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  /* Get a ticket that has note threads */
  const [{ ticket_id }] = await t.context
    .conn('threads')
    .select('ticket_id')
    .where(
      'ticket_id',
      'in',
      t.context.conn('tickets').select('id').where('ip_assigned_id', profile.id)
    )
    .limit(1);

  const res = await request(t.context.app)
    .get(`/tickets/${ticket_id}/threads`)
    .set('Authorization', `Bearer ${token}`);

  t.is(res.status, 200);

  // All threads should have the requester as participant
  t.true(Array.isArray(res.body) && res.body.length > 0);
  t.truthy(R.all(R.propEq('participant', profile.id), res.body));
});
