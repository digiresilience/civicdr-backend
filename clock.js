// Include .env config
require('dotenv').config();

/* Initialize db */
const client = require('../db');

/* Configure logger */
const logger = require('./utils/logger')('mailer');

/* Imports */
const moment = require('moment');
const mailer = require('./utils/mailer')(client, {
  mailgunApiKey: process.env.MAILGUN_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  mailgunFrom: process.env.MAILGUN_EMAIL,
  adminEmail: process.env.ADMIN_EMAIL,
  logger
});

// default is last 24 hours, otherwise use the supplied parameters
let startTime = moment().subtract(24, 'hours');
let endTime = moment();
if (process.argv.length > 2) {
  startTime = moment(process.argv[2]);
}
if (process.argv.length > 3) {
  endTime = moment(process.argv[3]);
}

mailer
  .getEmails(startTime, endTime)
  .then(emails => {
    const groupedEmails = mailer.groupEmails(emails);
    logger.info(
      `Found ${groupedEmails.length} unique email addresses. Queuing...`
    );
    return Promise.all(
      groupedEmails.map(async emailGroup => {
        try {
          const emailData = mailer.createEmailData(emailGroup);
          await mailer.sendEmail(emailData);
          return await mailer.markAsSent(email.id);
        } catch (e) {
          console.error(e);
          return null;
        }
      })
    );
  })
  .then(complete => {
    logger.info(
      `Sent ${complete.filter(Boolean).length} of ${complete.length} emails`
    );
    process.exit(0);
  })
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });
