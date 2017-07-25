const xtend = require('xtend');
const defined = require('defined');
const has = require('has');
const R = require('ramda');
const { RecordNotFound } = require('../errors');

module.exports = conn => {
  const IpProfile = require('./ip_profile')(conn);
  const SpProfile = require('./sp_profile')(conn);

  async function add(email, context) {
    return await conn('emails')
      .insert({
        email,
        created_at: conn.fn.now(),
        updated_at: conn.fn.now(),
        sent: false,
        context: context
      })
      .returning('id');
  }

  return {
    // helper function for adding rows to 'emails' table
    _add: add,

    notify: async (email, profile_id, type, context) => {
      if (type === 'ip') {
        let [ip_profile] = await IpProfile.findById(profile_id);
        if (ip_profile && ip_profile.email_notification) {
          await add(email, context);
        }
      } else if (type === 'sp') {
        let [sp_profile] = await SpProfile.findById(profile_id);
        if (sp_profile && sp_profile.email_notification) {
          await add(email, context);
        }
      }
    },

    notifyAdmin: async context => {
      // null email addresses are sent to admin
      await add(null, context);
    },

    delete: async id => {
      let [email] = await conn('emails').where('id', id).select();
      if (!defined(email)) {
        throw new RecordNotFound('email not found');
      }

      return await conn('emails').where('id', id).delete();
    }
  };
};
