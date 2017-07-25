const xtend = require('xtend');
const defined = require('defined');
const has = require('has');
const R = require('ramda');
const { RecordNotFound, NotNullViolation } = require('../errors');
const { defaults } = require('../utils/misc');

module.exports = conn => {
  const Grouping = require('./grouping')(conn);
  const SpProfile = require('./sp_profile')(conn);
  const Thread = require('./thread')(conn);
  const Read = require('./read')(conn);
  const lookup = R.flip(R.prop);

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

  let shrinkToSpec = R.pick(keys);

  async function _delete(id) {
    let [ticket] = await conn('tickets').where('id', id).select();
    if (!defined(ticket)) {
      throw new RecordNotFound('ticket not found');
    }
    return await conn.transaction(async trx => {
      await trx('reads').where('ticket_id', id).delete();
      await Thread.deleteMessagesForTicket(trx, id);
      await trx('threads').where('ticket_id', id).delete();
      await trx('tickets_groupings').where('ticket_id', id).delete();
      await trx('reads').where('ticket_id', id).delete();
      await trx('tickets').where('id', id).delete();
      return id;
    });
  }

  function getTicketGroupings(id) {
    let query = conn('tickets_groupings')
      .join('groupings', 'groupings.id', '=', 'tickets_groupings.grouping_id')
      .select('ticket_id', 'grouping_id', 'title', 'description');

    if (defined(id)) {
      query = query.where('ticket_id', id);
    }
    return query;
  }

  return {
    /* Create a ticket and associated threads */
    create: async (data, username) => {
      let dataToInsert = xtend(data, {
        updated_by: username,
        created_by: username,
        created_at: conn.fn.now(),
        updated_at: conn.fn.now()
      });

      try {
        return await conn.transaction(async trx => {
          const [id] = await trx('tickets')
            .insert(shrinkToSpec(dataToInsert))
            .returning('id');
          await Thread.createForTicket(trx, id, dataToInsert.ip_assigned_id);
          return [id];
        });
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
      let [data] = await conn('tickets').where('tickets.id', id).select();

      if (!defined(data)) {
        return [];
      }

      const groupings = await getTicketGroupings(id);

      return [
        xtend(data, {
          groupings
        })
      ];
    },

    delete: _delete,

    // Convenience method to delete all tickets for a profile
    deleteForProfile: async (id, type) => {
      let selector = type === 'ip' ? 'ip_assigned_id' : 'sp_assigned_id';
      let tickets = await conn('tickets').where(selector, id).select();

      return await Promise.all(
        tickets.map(ticket => {
          return _delete(ticket.id);
        })
      );
    },

    find: async opts => {
      const { withGroupings, filter } = defaults(opts || {}, {
        withGroupings: false,
        filter: {}
      });

      let query = conn('tickets').select();

      if (has(filter, 'type') && has(filter, 'val')) {
        query = query.where(filter.type, filter.val);
      }

      let ticketData = await query;

      if (withGroupings) {
        const allGroupings = await getTicketGroupings();
        const byTicket = R.groupBy(R.prop('ticket_id'), allGroupings);
        const cache = lookup(byTicket);

        return R.map(
          x => {
            let groupings = cache(x.id);
            if (defined(groupings)) {
              groupings = R.map(R.omit('ticket_id'), groupings);
            } else {
              groupings = [];
            }
            return xtend({ groupings }, x);
          },
          ticketData
        );
      } else {
        return ticketData;
      }
    },

    /* Update a ticket */
    update: async (id, data, username) => {
      let dataToInsert = xtend(data, {
        updated_by: username,
        updated_at: conn.fn.now()
      });

      /* Check if objects are defined */
      let [ticket] = await conn('tickets').where('id', id).select();
      if (!defined(ticket)) {
        throw new RecordNotFound('ticket not found');
      }

      return await conn('tickets')
        .where('id', id)
        .update(shrinkToSpec(dataToInsert));
    },

    addGrouping: async (ticket_id, grouping_id) => {
      let [grouping] = await Grouping.findById(grouping_id);
      if (!defined(grouping)) {
        throw new RecordNotFound('grouping id not found');
      }

      return await conn('tickets_groupings').insert({
        ticket_id,
        grouping_id,
        updated_at: conn.fn.now(),
        created_at: conn.fn.now()
      });
    },

    deleteGrouping: async (ticket_id, grouping_id) => {
      let [grouping] = await Grouping.findById(grouping_id);
      if (!defined(grouping)) {
        throw new RecordNotFound('grouping id not found');
      }

      return await conn('tickets_groupings')
        .where('ticket_id', ticket_id)
        .andWhere('grouping_id', grouping_id)
        .del();
    },

    assignSpProfile: async (ticket_id, profile_id) => {
      let [ticket] = await conn('tickets').where('id', ticket_id).select();
      if (!defined(ticket)) {
        throw new RecordNotFound('ticket not found');
      }
      let [profile] = await SpProfile.findById(profile_id);
      if (!defined(profile)) {
        throw new RecordNotFound('profile id not found');
      }

      let dataToInsert = xtend(ticket, {
        sp_assigned_id: profile_id,
        ticket_sp_name: profile.name,
        ticket_sp_contact: profile.contact,
        status: 'assigned',
        updated_at: conn.fn.now()
      });

      return await conn.transaction(async trx => {
        await trx('threads').insert({
          participant: profile_id,
          ticket_id,
          status: 'active',
          type: 'sp'
        });
        await trx('tickets')
          .where('id', ticket_id)
          .update(shrinkToSpec(dataToInsert));
      });
    },

    unassignSpProfile: async (ticket_id, profile_id) => {
      let [ticket] = await conn('tickets').where('id', ticket_id).select();
      if (!defined(ticket)) {
        throw new RecordNotFound('ticket not found');
      }
      let [profile] = await SpProfile.findById(profile_id);
      if (!defined(profile)) {
        throw new RecordNotFound('profile id not found');
      }

      let dataToInsert = xtend(ticket, {
        sp_assigned_id: null,
        ticket_sp_name: null,
        ticket_sp_contact: null,
        status: 'unassigned',
        updated_at: conn.fn.now()
      });

      return await conn.transaction(async trx => {
        await trx('threads')
          .where('ticket_id', ticket_id)
          .where('participant', profile_id)
          .update({ status: 'inactive' });
        await trx('tickets')
          .where('id', ticket_id)
          .update(shrinkToSpec(dataToInsert));
      });
    },

    shouldNotify: async (id, updated_at, user) => {
      let [read] = await Read.getRead(id, user);

      let threads = await conn('threads')
        .where('ticket_id', id)
        .where('participant', user.role === 'admin' ? null : user.profile.id)
        .select();

      if (defined(read)) {
        // have we read this ticket more recently than it's been updated?
        // also check all relevant threads
        return read.read_at <= updated_at ||
          threads.some(thread => {
            return read.read_at <= thread.updated_at;
          });
      } else {
        return true;
      }
    },

    updateRead: async (id, user) => {
      await Read.updateRead(id, user);
    }
  };
};
