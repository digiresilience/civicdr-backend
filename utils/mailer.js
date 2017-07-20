const R = require('ramda');
const moment = require('moment');

// inspects email table (on a schedule) and sends to an email service
module.exports = (client, opts) => {
  // Options
  const mailgun = require('mailgun-js')({
    apiKey: opts.mailgunApiKey,
    domain: opts.mailgunDomain
  });
  const from = opts.mailgunFrom;
  const admin = opts.adminEmail;
  const logger = opts.logger;

  // Retrieve rows from emails table
  async function getEmails(startTime, endTime) {
    return await client('emails')
      .whereBetween('created_at', [startTime, endTime])
      .where('sent', false)
      .select();
  }

  // Group rows by 'email' address property
  const groupEmails = R.groupWith(R.eqProps('email'));

  // Create email for a single email address
  function createEmailData(emailGroup) {
    let text;
    if (emailGroup.length > 1) {
      const earliest = moment(Math.min(...emailGroup.map(eg => eg.updated_at)));
      const latest = moment(Math.max(...emailGroup.map(eg => eg.updated_at)));
      text = `Updates on the platform between ${earliest.format()} and ${latest.format()}. Log in to review.`;
    } else {
      text = `Update on the platform at ${moment(emailGroup[0].updated_at).format()}. Log in to review.`;
    }
    return {
      from,
      // nulls go to the admin
      to: emailGroup[0].email || admin,
      subject: 'CiviCDR Platform Activity Notification',
      text
    };
  }

  // Mark as sent in emails table
    async function markAsSent(emailGroup) {
      var idList = emailGroup.map(function(obj) {
        return obj.id
      });
    return await client('emails').whereIn('id', idList).update('sent', true);
  }

  // Send email
  async function sendEmail(data) {
    try {
      let body = await mailgun.messages().send(data);
      logger.info(`sent email: ${JSON.stringify(body)}`);
      return true;
    } catch (e) {
      logger.error(e);
      throw new Error(e);
    }
  }

  return {
    getEmails,
    groupEmails,
    createEmailData,
    markAsSent,
    sendEmail
  };
};
