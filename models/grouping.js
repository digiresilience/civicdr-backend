const defined = require('defined');
const xtend = require('xtend');
const { RecordNotFound, NotNullViolation } = require('../errors');
const R = require('ramda');

module.exports = conn => {
  const Thread = require('./thread')(conn);

  function getGroupingTickets(id) {
    let query = conn('tickets_groupings')
      .join('tickets', 'tickets.id', '=', 'tickets_groupings.ticket_id')
      .select(
        'ticket_id',
        'grouping_id',
        'title',
        'status',
        'created_by',
        'ticket_ip_contact',
        'ticket_ip_name',
        'ticket_sp_contact',
        'ticket_sp_name',
        'date_of_incident',
        'incident_type',
        'description'
      );

    if (defined(id)) {
      query = query.where('grouping_id', id);
    }
    return query;
  }

  function getGroupingTicketsCounts() {
    let query = conn('tickets_groupings')
      .select('grouping_id', conn.raw('count(distinct ticket_id)'))
      .groupBy('grouping_id');
    return query;
  }

  return {
    /* Create a grouping and associated note thread */
    create: async data => {
      let dataToInsert = xtend(data, {
        created_at: conn.fn.now(),
        updated_at: conn.fn.now()
      });

      return conn
        .transaction(async trx => {
          const [id] = await trx('groupings')
            .insert(dataToInsert)
            .returning('id');
          await Thread.createForGrouping(trx, id);
          return [id];
        })
        .catch(e => {
          // Postgres error code 23502 is "NOT NULL VIOLATION"
          if (e.code === '23502') {
            throw new NotNullViolation(
              `Record is missing required field ${e.column}`
            );
          } else {
            throw e;
          }
        });
    },

    find: async () => {
      let counts = await getGroupingTicketsCounts();
      let index = R.indexBy(R.prop('grouping_id'), counts);
      let groupings = await conn('groupings').select();

      return groupings.map(grouping => {
        let id = grouping.id;
        let ticket_count = 0;
        if (R.has(id, index)) {
          ticket_count = parseInt(index[id].count);
        }
        return xtend(grouping, { ticket_count });
      });
    },

    findById: async id => {
      let [data] = await conn('groupings').where('id', id).select();
      if (!defined(data)) {
        return [];
      }
      const tickets = await getGroupingTickets(id);
      return [
        xtend(data, {
          tickets: tickets
        })
      ];
    },

    /* Update a grouping */
    update: async (id, data, editor) => {
      let [grouping] = await conn('groupings').where('id', id).select();
      if (!defined(grouping)) {
        throw new RecordNotFound('grouping not found');
      }
      let dataToInsert = xtend(data, {
        updated_at: conn.fn.now()
      });
      return await conn('groupings').where('id', id).update(data);
    },

    delete: async id => {
      let [grouping] = await conn('groupings').where('id', id).select();
      if (!defined(grouping)) {
        throw new RecordNotFound('grouping not found');
      }
      /* Delete from many-to-many table and individual entry*/
      return await conn.transaction(async trx => {
        await trx('threads').where('grouping_id', id).delete();
        await trx('tickets_groupings').where('grouping_id', id).delete();
        await trx('groupings').where('id', id).delete();
        return id;
      });
    },

    /* Get associated tickets */
    getTickets: async id => {
      return await conn('tickets_groupings').where('grouping_id', id).select();
    }
  };
};
