const ava = require('ava');
const request = require('supertest');
const lib = require('../lib');
const defined = require('defined');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { getUUID } = require('../utils/misc');
const R = require('ramda');

let test = ava.test;

const prepareTicketData = async (context, ip_contact, sp_contact) => {
  const [ip_profile] = await context
    .conn('ip_profiles')
    .returning('id')
    .limit(1);
  const [sp_profile] = await context
    .conn('sp_profiles')
    .returning('id')
    .limit(1);
  const ticketData = {
    status: 'ready',
    description: 'bad things',
    date_of_incident: moment(),
    ticket_ip_name: 'Alex',
    ticket_ip_contact: ip_contact,
    steps_taken: 'tried everything',
    ip_assigned_id: ip_profile.id,
    incident_type: [],
    ticket_sp_name: 'Becky',
    ticket_sp_contact: sp_contact,
    sp_assigned_id: sp_profile.id
  };
  return ticketData;
};

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.Ticket = require('../models/ticket')(conn);
  t.context.Thread = require('../models/thread')(conn);
  t.context.IpProfile = require('../models/ip_profile')(conn);
  t.context.SpProfile = require('../models/ip_profile')(conn);
  t.context.Email = require('../models/email')(conn);
  t.context.admin_token = jwt.sign({ roles: ['admin'] }, 'secret');
});

test('PUT /tickets/:id - status updates get emails', async t => {
  const ticketData = await prepareTicketData(
    t.context,
    'ipemailtester1@email.org',
    'spemailtester1@email.org'
  );
  const [id] = await t.context.Ticket.create(ticketData, 'test');

  const res = await request(t.context.app)
    .put(`/tickets/${id}`)
    .send({ status: 'done' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);

  let emails = await t.context
    .conn('emails')
    .where('email', ticketData.ticket_ip_contact);

  t.is(emails.length, 1);
  t.context.Email.delete(emails[0].id);

  emails = await t.context
    .conn('emails')
    .where('email', ticketData.ticket_sp_contact);

  t.is(emails.length, 1);
  await t.context.Email.delete(emails[0].id);
});

test('POST /tickets/:id/sp_profiles/:profile_id - notify sp', async t => {
  const ticketData = await prepareTicketData(
    t.context,
    'ipemailtester2@email.org',
    'spemailtester2@email.org'
  );
  const [id] = await t.context.Ticket.create(ticketData, 'test');

  const [profile] = await t.context
    .conn('sp_profiles')
    .whereNot('id', ticketData.sp_assigned_id)
    .limit(1);

  const res = await request(t.context.app)
    .post(`/tickets/${id}/sp_profiles/${profile.id}`)
    .set('Authorization', `Bearer ${t.context.admin_token}`)
    .send({ sp_assigned_id: profile.id });

  t.is(res.status, 200);

  let emails = await t.context.conn('emails').where('email', profile.contact);

  t.is(emails.length, 1);
  await t.context.Ticket.delete(id);
  await t.context.Email.delete(emails[0].id);
});

test('POST /threads/:id/messages - notify ip', async t => {
  const ticketData = await prepareTicketData(
    t.context,
    'ipemailtester3@email.org',
    'spemailtester3@email.org'
  );
  const [id] = await t.context.Ticket.create(ticketData, 'test');

  const [thread] = await t.context
    .conn('threads')
    .where('participant', ticketData.ip_assigned_id)
    .where('ticket_id', id)
    .select();

  const res = await request(t.context.app)
    .post(`/threads/${thread.id}/messages`)
    .send({ content: 'test' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);
  let emails = await t.context
    .conn('emails')
    .where('email', ticketData.ticket_ip_contact);

  t.is(emails.length, 1);

  await t.context.Ticket.delete(id);
  await t.context.Email.delete(emails[0].id);
});

test('POST /threads/:id/messages - notify sp', async t => {
  const ticketData = await prepareTicketData(
    t.context,
    'ipemailtester4@email.org',
    'spemailtester4@email.org'
  );
  const [id] = await t.context.Ticket.create(ticketData, 'test');
  await t.context.Thread.create({
    ticket_id: id,
    type: 'sp',
    participant: ticketData.sp_assigned_id,
    status: 'active'
  });

  const [thread] = await t.context
    .conn('threads')
    .where('participant', ticketData.sp_assigned_id)
    .where('ticket_id', id)
    .select();

  const res = await request(t.context.app)
    .post(`/threads/${thread.id}/messages`)
    .send({ content: 'test' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);
  let emails = await t.context
    .conn('emails')
    .where('email', ticketData.ticket_sp_contact);

  t.is(emails.length, 1);
  await t.context.Ticket.delete(id);
  await t.context.Email.delete(emails[0].id);
});

test('PUT /ip_profiles/:id - update an existing IP profile', async t => {
  const [ipProfile] = await t.context
    .conn('ip_profiles')
    .returning('id')
    .where('internal_level', 'seed data')
    .limit(1);

  const res = await request(t.context.app)
    .put(`/ip_profiles/${ipProfile.id}`)
    .send({ contact: 'test@test.edu' })
    .set('Authorization', `Bearer ${t.context.admin_token}`);

  t.is(res.status, 200);
  // null email is admin
  let emails = await t.context.conn('emails').whereNull('email');

  t.truthy(emails.length > 0);
  await t.context.Email.delete(emails[0].id);
});
