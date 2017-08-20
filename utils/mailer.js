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

  function getEmailMessage(emailGroup) {
    // Define plural and singular message texts
    // TODO: These are user facing strings ...
    // This object will need to be updated when translation is implemented
    const messageText = {
      message: {
        singular: 'You received a message.',
        plural: 'You received NUM messages.'
      },
      UpdatedTicket: {
        singular: 'One of your tickets was updated.',
        plural: 'NUM of your tickets were updated.'
      },
      newStatus: {
        singular: 'The status of one of your tickets has changed.',
        plural: 'NUM of your tickets had their status changed.'
      },
      newTicket: {
        singular: 'A new ticket was created.',
        plural: 'NUM new tickets were created.'
      },
      SPAssigned: {
        singular: 'You were assigned to a ticket.',
        plural: 'You were assigned to NUM tickets.'
      },
      IPProfileUpdate: {
        singular: 'An IP profile was updated.',
        plural: 'NUM IP profiles were updated.'
      },
      SPProfileUpdate: {
        singular: 'An SP profile was updated.',
        plural: 'NUM SP profiles were updated.'
      }
    };
    // Get a sorted list of all contexts in the group
    // Reduce so I don't grab any null contexts
    let contextList = emailGroup.reduce(function(clist, obj) {
      if (obj.context) {
        clist.push(obj.context);
      }
      return clist.sort();
    }, []);
    // Get number of duplicate context types and add correct strings
    let contextStrings = [];
    let current = null;
    let contextCount = 0;
    contextList.forEach(function(item) {
      if (item != current && current != null) {
        // We have found multiple of this type of context use the plural string
        if (contextCount > 1) {
          contextStrings.push(
            messageText[current]['plural'].replace('NUM', contextCount)
          );
          // We have found one of this type of context use the singular
        } else if (contextCount == 1) {
          contextStrings.push(messageText[current]['singular']);
        }
        contextCount = 1;
      } else {
        contextCount++;
      }
      current = item;
    });
    // Catch the last item in the loop
    // We have found multiple of this type of context use the plural string
    if (contextCount > 1) {
      contextStrings.push(
        messageText[current]['plural'].replace('NUM', contextCount)
      );
      // We have found one of this type of context use the singular
    } else if (contextCount == 1) {
      contextStrings.push(messageText[current]['singular']);
    }
    return contextStrings;
  }

  // Create email for a single email address
  function createEmailData(emailGroup) {
    let text;
    let dateTime;
    const datetimeFormat = 'MMM DD HH:mm';
    if (emailGroup.length > 1) {
      // Create base date objects
      const earliest = moment(Math.min(...emailGroup.map(eg => eg.updated_at)));
      const latest = moment(Math.max(...emailGroup.map(eg => eg.updated_at)));
      dateTime = `${earliest.format(datetimeFormat)} UTC`;
      // Create base text
      text = `The following ${emailGroup.length} events have occured on the CiviCDR Platform since ${dateTime}:`;
    } else {
      dateTime = moment(emailGroup[0].updated_at).format(datetimeFormat);
      text = `The following event occured on the CiviCDR Platform at ${dateTime} UTC:`;
    }
    // Add all the events that occured to the email
    let emailMessages = getEmailMessage(emailGroup);
    emailMessages.forEach(function(msg) {
      text += '\n - ' + msg;
    });
    // Add sign off.
    text += '\n\nYou can learn more by logging into the CiviCDR Platform.';
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
      return obj.id;
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
