const xtend = require('xtend');
const defined = require('defined');
const has = require('has');
const R = require('ramda');
const { RecordNotFound, NotNullViolation } = require('../errors');

module.exports = conn => {
  const lookup = R.flip(R.prop);

  function numberOfAssignedTickets() {
    return conn('tickets')
      .select('ip_assigned_id as id', conn.raw('count(distinct id)'))
      .groupBy('ip_assigned_id');
  }

  function getAssignedTickets(id) {
    return conn('tickets')
      .select(
        'id',
        'status',
        'ticket_ip_contact',
        'ticket_ip_name',
        'ticket_sp_contact',
        'ticket_sp_name',
        'created_by',
        'date_of_incident',
        'incident_type',
        'description'
      )
      .where('ip_assigned_id', id);
  }

  const keys = [
    'id',
    'openid',
    'name',
    'contact',
    'location',
    'secure_channels',
    'languages',
    'notification_prefs',
    'notification_languages',
    'types_of_work',
    'pgp_key',
    'internal_level',
    'created_at',
    'updated_at',
    'email_notification'
  ];

  let shrinkToSpec = R.pick(keys);

  return {
    create: async data => {
      let dataToInsert = xtend(data, {
        created_at: conn.fn.now(),
        updated_at: conn.fn.now()
      });

      try {
        return await conn('ip_profiles')
          .insert(shrinkToSpec(dataToInsert))
          .returning('id');
      } catch (e) {
        // Postgres error code 23502 is "NOT NULL VIOLATION"
        if (e.code === '23502') {
          throw new NotNullViolation(
            `Record is missing required field ${e.column}`
          );
        } else {
          throw e;
        }
      }
    },

    findById: async id => {
      let tickets = await getAssignedTickets(id);
      let [profile] = await conn('ip_profiles').where('id', id).select();

      if (!defined(profile)) {
        return [];
      } else {
        return [xtend(profile, { tickets })];
      }
    },

    findByOpenId: async openid => {
      return await conn('ip_profiles').where('openid', openid).select();
    },

    find: async () => {
      let counts = await numberOfAssignedTickets();
      let index = R.indexBy(R.prop('id'), counts);
      let profiles = await conn('ip_profiles').select();
      return profiles.map(profile => {
        let id = profile.id;
        if (R.has(id, index)) {
          return xtend(profile, {
            ticket_count: index[id].count
          });
        } else {
          return xtend(profile, {
            ticket_count: 0
          });
        }
      });
    },

    update: async (id, data, editor) => {
      let dataToInsert = xtend(data, {
        updated_at: conn.fn.now()
      });

      let [profile] = await conn('ip_profiles').where('id', id).select();
      if (!defined(profile)) {
        throw new RecordNotFound('profile not found');
      }

      return await conn('ip_profiles')
        .where('id', id)
        .update(shrinkToSpec(dataToInsert));
    }
  };
};
