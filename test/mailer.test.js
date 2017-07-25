const ava = require('ava');
const defined = require('defined');
const moment = require('moment');
const lib = require('../lib');

let test = ava.test;

test.beforeEach(t => {
  let { app, client: conn } = lib.init({ secret: 'secret' });
  t.context.app = app;
  t.context.conn = conn;
  t.context.Email = require('../models/email')(conn);

  t.context.mailer = require('../utils/mailer')(conn, {
    mailgunApiKey: 'fakekey',
    mailgunDomain: 'testdomain',
    mailgunFrom: 'test',
    adminEmail: 'admin@email.gov',
    logger: require('winston')
  });
});

test('getEmails returns emails', async t => {
  const emails = ['a@a.a', 'b@b.b', 'c@c.c', 'd@d.d', 'e@e.e'];
  await Promise.all(
    emails.map(async email => {
      await t.context.Email._add(email, "newTicket");
    })
  );

  // all the emails are returned
  const queriedEmails = await t.context.mailer.getEmails(
    moment().subtract(1, 'hours'),
    moment()
  );
  emails.forEach(email => {
    t.truthy(queriedEmails.map(e => e.email).includes(email));
  });

  // older date range returns none
  const noEmail = await t.context.mailer.getEmails(
    moment().subtract(49, 'hours'),
    moment().subtract(25, 'hours')
  );
  t.is(noEmail.length, 0);

  await t.context.conn('emails').whereIn('email', emails).del();
});

test('groupEmails groups emails correctly', async t => {
  const emails = ['f@f.f', 'f@f.f', 'g@g.g', 'g@g.g', 'h@h.h'];
  await Promise.all(
    emails.map(async email => {
      await t.context.Email._add(email, "newTicket");
    })
  );

  // all emails have a record from query, group into unique email lists
  const queriedEmails = await t.context.mailer.getEmails(
    moment().subtract(1, 'hours'),
    moment()
  );
  const filteredEmails = queriedEmails.filter(qe => emails.includes(qe.email));
  t.is(filteredEmails.length, 5);
  const groupedEmails = t.context.mailer.groupEmails(filteredEmails);
  t.is(groupedEmails.length, 3);

  await t.context.conn('emails').whereIn('email', emails).del();
});

test('markAsSent marks emails as sent correctly', async t => {
  const email = 'i@i.i';
  const [id] = await t.context.Email._add(email, "newTicket");

  // starts as not sent
  let [emailRecord] = await t.context.conn('emails').where('id', id);
  t.is(emailRecord.sent, false);

  // now is sent
  await t.context.mailer.markAsSent([emailRecord]);
  [emailRecord] = await t.context.conn('emails').where('id', id);
  t.is(emailRecord.sent, true);

  await t.context.conn('emails').where('id', id).del();
});

test('createEmailData handles single grouped email case', t => {
  const time = moment();
  const emailData = t.context.mailer.createEmailData([
    { email: 'test@test.com', sent: false, updated_at: time, context: "newTicket" }
  ]);
  t.is(emailData.from, 'test');
  t.is(emailData.to, 'test@test.com');
  t.is(
    emailData.text,
    `The following event occured on the CiviCDR Platform at ${time.format('MMM DD HH:mm')} UTC:\n - A new ticket was created.\n\nYou can learn more by logging into the CiviCDR Platform.`
  );
});

test('createEmailData handles multiple grouped email case', t => {
  const earliest = moment().subtract(1, 'hour');
  const latest = moment();
  const emailData = t.context.mailer.createEmailData([
    { email: 'test@test.com', sent: false, updated_at: earliest, context: "newTicket" },
    { email: 'test@test.com', sent: false, updated_at: latest, context: "UpdatedTicket" }
  ]);
  t.is(emailData.from, 'test');
  t.is(emailData.to, 'test@test.com');
  t.is(
    emailData.text,
        `The following 2 events have occured on the CiviCDR Platform since ${earliest.format('MMM DD HH:mm')} UTC:\n - One of your tickets was updated.\n - A new ticket was created.\n\nYou can learn more by logging into the CiviCDR Platform.`
  );
});

test('createEmailData sends to admins', t => {
  const time = moment();
  const emailData = t.context.mailer.createEmailData([
    { email: null, sent: false, updated_at: time, context: "newTicket" },
    { email: null, sent: false, updated_at: time, context: "newTicket" }
  ]);
  t.is(emailData.from, 'test');
  t.is(emailData.to, 'admin@email.gov');
});
