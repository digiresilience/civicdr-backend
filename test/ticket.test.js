const ava = require('ava');
const request = require('supertest');
const lib = require('../lib');
const defined = require('defined');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { getUUID } = require('../utils/misc');
const R = require('ramda');

let test = ava.test;

const prepareTicketData = async context => {
  const [{ id: profile_id }] = await context
    .conn('ip_profiles')
    .returning('id')
    .limit(1);
  const ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: 'Alex',
    ticket_ip_contact: 'alex@asdf.org',
    steps_taken: 'tried everything',
    ip_assigned_id: profile_id,
    incident_type: []
  };
  return ticketData;
};

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.Ticket = require('../models/ticket')(conn);
  t.context.Thread = require('../models/thread')(conn);
  t.context.Grouping = require('../models/grouping')(conn);
  t.context.IpProfile = require('../models/ip_profile')(conn);
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test.afterEach.always(t => {
  t.context.conn('tickets').whereNot('created_by', 'Admin').del();
});

test('POST /tickets - create with insufficient fields', async t => {
  let ticketData = {
    status: 'ready'
  };

  const res = await request(t.context.app)
    .post('/tickets')
    .send(ticketData)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 422);
});

test('POST /tickets - create a new ticket', async t => {
  const [{ id: profile_id }] = await t.context
    .conn('ip_profiles')
    .returning('id')
    .limit(1);

  let ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: 'Alex',
    ticket_ip_contact: 'alex@asdf.org',
    steps_taken: 'tried everything',
    ip_assigned_id: profile_id,
    incident_type: []
  };

  const res = await request(t.context.app)
    .post('/tickets')
    .send(ticketData)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  // Returns a uuid
  let [id] = res.body;
  t.regex(
    id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
});

test('POST /tickets - create a new ticket with no contact info', async t => {
  const [{ id: profile_id, name, contact }] = await t.context
        .conn('ip_profiles')
        .returning('id', 'name', 'contact')
        .limit(1);

  let ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    steps_taken: 'tried everything',
    ip_assigned_id: profile_id,
    incident_type: []
  };

  const res = await request(t.context.app)
        .post('/tickets')
        .send(ticketData)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  // Returns a uuid
  let [id] = res.body;

  // Ticket contact info pulled from ip profile
  let [ticket] = await t.context.Ticket.findById(id);
  t.is(ticket.ticket_ip_name, name);
  t.is(ticket.ticket_ip_contact, contact);
});


test('POST /tickets - IP create a new ticket', async t => {
  let user = { roles: ['IP'], sub: 'auth0|ip' };
  let token = jwt.sign(user, 'secret');
  let [profile] = await t.context.IpProfile.findByOpenId(user.sub);
  user.profile = profile;

  let ticketData = {
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: 'Alex',
    ticket_ip_contact: 'alex@asdf.org',
    steps_taken: 'tried everything',
    incident_type: []
  };

  const res = await request(t.context.app)
    .post('/tickets')
    .send(ticketData)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

  t.is(res.status, 200);

  let [id] = res.body;
  const [{ status, ip_assigned_id }] = await t.context
    .conn('tickets')
    .where('id', id);
  t.is(status, 'unassigned');
  t.is(ip_assigned_id, user.profile.id);
});

test('GET /tickets/:id - get an existing ticket', async t => {
  const [{ id }] = await t.context
    .conn('tickets')
    .returning('id')
    .where('created_by', 'Admin')
    .limit(1);

  const res = await request(t.context.app)
    .get(`/tickets/${id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('accept', 'application/json');

  t.is(res.status, 200);

  // List of keys from `/models/ticket.js`
  const keys = [
    'id',
    'status',
    'ticket_ip_contact',
    'ticket_ip_name',
    'ticket_sp_contact',
    'ticket_sp_name',
    'date_of_incident',
    'incident_type',
    'description',
    'steps_taken',
    'created_by',
    'updated_by',
    'created_at',
    'updated_at',
    'ip_assigned_id',
    'sp_assigned_id',
    'notify'
  ];
  t.true(keys.every(k => Object.keys(res.body).includes(k)));
});

test('GET /tickets/:id - get a non-existing ticket', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .get(`/tickets/${randomid}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('accept', 'application/json');

  t.is(res.status, 404);
});

test('PUT /tickets/:id - update an existing ticket', async t => {
  const ticketData = await prepareTicketData(t.context);
  const [id] = await t.context.Ticket.create(ticketData, 'test');
  const [ticket] = await t.context.Ticket.findById(id);

  const res = await request(t.context.app)
    .put(`/tickets/${ticket.id}`)
    .send({ status: 'done' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  const [updatedTicket] = await t.context.Ticket.findById(ticket.id);
  t.is(updatedTicket.status, 'done');
  t.truthy(moment(updatedTicket.updated_at).isAfter(moment(ticket.updated_at)));
});

test('POST /tickets/:id/groupings/:grouping_id - adding a grouping', async t => {
  const ticketData = await prepareTicketData(t.context);
  const [id] = await t.context.Ticket.create(ticketData, 'test');
  const [{ id: grouping_id }] = await t.context
    .conn('groupings')
    .returning('id')
    .where('description', 'seed')
    .limit(1);

  const res = await request(t.context.app)
    .post(`/tickets/${id}/groupings/${grouping_id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .send({ grouping: grouping_id });

  t.is(res.status, 200);
  const dbres = await t.context.conn
    .from('tickets_groupings')
    .where('ticket_id', id)
    .limit(1);
  t.is(dbres.length, 1);
});

test('POST /tickets/:id/groupings/:grouping_id - adding a non-existing grouping', async t => {
  const ticketData = await prepareTicketData(t.context);
  const [id] = await t.context.Ticket.create(ticketData, 'test');
  const randomid = getUUID();

  const res = await request(t.context.app)
    .post(`/tickets/${id}/groupings/${randomid}`)
    .send({ grouping: randomid })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('PUT /tickets/:id - update a non-existing ticket', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .put(`/tickets/${randomid}`)
    .send({ status: 'done' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('DELETE /tickets/:id - delete an existing ticket', async t => {
  const ticketData = await prepareTicketData(t.context);
  const [id] = await t.context.Ticket.create(ticketData, 'test');

  const res = await request(t.context.app)
    .delete(`/tickets/${id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);
  let [ticket] = await t.context.Ticket.findById(id);

  t.is(res.status, 200);
  t.truthy(!defined(ticket));
});

test('DELETE /tickets/:id deleting a ticket with grouping deletes inner table', async t => {
  const [{ ticket_id }] = await t.context.conn
    .select('ticket_id')
    .from('tickets_groupings')
    .limit(1);

  const res = await request(t.context.app)
    .delete(`/tickets/${ticket_id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  const dbres = await t.context.conn
    .from('tickets_groupings')
    .where('ticket_id', ticket_id)
    .limit(1);
  t.is(res.status, 200);
  t.is(dbres.length, 0);
});

test('DELETE /tickets/:id - delete a non-existing ticket', async t => {
  let randomid = getUUID();
  const res = await request(t.context.app)
    .delete(`/tickets/${randomid}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('GET /tickets - get all tickets', async t => {
  const res = await request(t.context.app)
    .get('/tickets')
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);
});

test('POST /tickets/:ticket_id/duplicate/:profile_id - duplicate ticket', async t => {
  // Create the ticket with an IP
  const ticketData = await prepareTicketData(t.context);
  const [ticket_id] = await t.context.Ticket.create(ticketData, 'test');

  // Add a grouping to the ticket
  const [{ id: grouping_id }] = await t.context.conn('groupings').limit(1);
  await t.context.Ticket.addGrouping(ticket_id, grouping_id);

  // Assign an SP to the ticket
  const [{ id: sp_profile_id }] = await t.context.conn('sp_profiles').limit(1);
  await t.context.Ticket.assignSpProfile(ticket_id, sp_profile_id);

  const [original] = await t.context.Ticket.findById(ticket_id);

  // Get thread ids
  const threads = await t.context.Thread.findByTicketId(ticket_id);
  const original_thread_ids = R.pluck('id', threads);

  // Get another IP to duplicate the ticket to
  const [{ id: profile_id }] = await t.context
    .conn('ip_profiles')
    .whereNot('id', ticketData.ip_assigned_id)
    .returning('id')
    .limit(1);

  const res = await request(t.context.app)
    .post(`/tickets/${ticket_id}/duplicate/${profile_id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  let [duplicated_id] = res.body;
  const [duplicated] = await t.context.Ticket.findById(duplicated_id);

  t.is(res.status, 200);
  t.is(duplicated.ip_assigned_id, profile_id);

  // Get duplicated thread ids
  const other_threads = await t.context.Thread.findByTicketId(duplicated_id);
  const duplicated_thread_ids = R.pluck('id', other_threads);

  // All fields that should be duplicated are duplicated
  const omitDiffering = R.omit([
    'id',
    'ticket_ip_contact',
    'ticket_ip_name',
    'ip_assigned_id',
    'ticket_sp_contact',
    'ticket_sp_name',
    'sp_assigned_id',
    'status',
    'created_by',
    'updated_by',
    'created_at',
    'updated_at',
    'groupings' // We can't do an equal check on the array
  ]);
  t.truthy(R.equals(omitDiffering(original), omitDiffering(duplicated)));

  // Grouping is duplicated
  t.is(duplicated.groupings[0].grouping_id, grouping_id);

  // SP is deleted
  t.truthy(
    R.all(
      R.isNil,
      R.props(
        ['sp_assigned_id', 'ticket_sp_contact', 'ticket_sp_name'],
        duplicated
      )
    )
  );

  // Status is unassigned
  t.is(duplicated.status, 'unassigned');

  // All thread ids are different
  t.is(R.length(R.intersection(original_thread_ids, duplicated_thread_ids)), 0);
});

test('POST /tickets/:ticket_id/duplicate/:profile_id - duplicate non-existing ticket', async t => {
  const randomid = getUUID();

  const [{ id: profile_id }] = await t.context
    .conn('ip_profiles')
    .select('id')
    .limit(1);

  const res = await request(t.context.app)
    .post(`/tickets/${randomid}/duplicate/${profile_id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('POST /tickets/:ticket_id/duplicate/:profile_id - duplicate ticket with non-existing profile', async t => {
  const ticketData = await prepareTicketData(t.context);
  const [ticket_id] = await t.context.Ticket.create(ticketData, 'test');

  const randomid = getUUID();

  const res = await request(t.context.app)
    .post(`/tickets/${ticket_id}/duplicate/${randomid}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 400);
});

test('POST /tickets/:id/sp_profiles/:profile_id - assign SP', async t => {
  const ticketData = await prepareTicketData(t.context);
  const [id] = await t.context.Ticket.create(ticketData, 'test');

  const [profile] = await t.context.conn('sp_profiles').limit(1);

  const res = await request(t.context.app)
    .post(`/tickets/${id}/sp_profiles/${profile.id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .send({ sp_assigned_id: profile.id });

  t.is(res.status, 200);
  const [updatedTicket] = await t.context.Ticket.findById(id);
  t.is(updatedTicket.sp_assigned_id, profile.id);
  t.is(updatedTicket.ticket_sp_name, profile.name);
  t.is(updatedTicket.ticket_sp_contact, profile.contact);

  const threads = await t.context.Thread.findByTicketId(id);
  const activeSP = R.both(
    R.propEq('participant', profile.id),
    R.propEq('status', 'active')
  );
  t.falsy(R.isEmpty(R.filter(activeSP, threads)));
});

test('DELETE /tickets/:id/sp_profiles/:profile_id - del SP', async t => {
  const [profile] = await t.context
    .conn('sp_profiles')
    .returning('id')
    .limit(1);

  const ticketData = await prepareTicketData(t.context);
  const ticketWithSP = Object.assign({}, ticketData, {
    sp_assigned_id: profile.id,
    ticket_sp_name: profile.name,
    ticket_sp_contact: profile.contact
  });
  const [id] = await t.context.Ticket.create(ticketWithSP, 'test');

  // Confirm that the ticket isn't `unassigned` to start with
  const [unmodifiedTicket] = await t.context.Ticket.findById(id);
  t.true(
    unmodifiedTicket.status.length > 0 &&
      unmodifiedTicket.status !== 'unassigned'
  );

  const res = await request(t.context.app)
    .delete(`/tickets/${id}/sp_profiles/${profile.id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);
  const [updatedTicket] = await t.context.Ticket.findById(id);
  t.is(updatedTicket.sp_assigned_id, null);
  t.is(updatedTicket.ticket_sp_name, null);
  t.is(updatedTicket.ticket_sp_contact, null);
  t.is(updatedTicket.status, 'unassigned');

  const threads = await t.context.Thread.findByTicketId(id);
  const activeSP = R.both(
    R.propEq('participant', profile.id),
    R.propEq('status', 'active')
  );
  t.truthy(R.isEmpty(R.filter(activeSP, threads)));
});
