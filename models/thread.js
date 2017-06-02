const xtend = require('xtend');
const defined = require('defined');
const has = require('has');
const R = require('ramda');
const { RecordNotFound, NotNullViolation } = require('../errors');

module.exports = conn => {
  const lookup = R.flip(R.prop);
  const Read = require('./read')(conn);
  const keys = [
    'id',
    'created_at',
    'updated_at',
    'ticket_id',
    'grouping_id',
    'status',
    'type',
    'participant'
  ];

  let shrinkToSpec = R.pick(keys);

  function getThreadMessages(id) {
    return conn('messages')
      .select('id', 'created_by', 'content', 'created_at', 'updated_at')
      .where('thread_id', id) || [];
  }

  async function update(id, data) {
    let dataToInsert = xtend(data, {
      updated_at: conn.fn.now()
    });

    let [thread] = await conn('threads').where('id', id).select();
    if (!defined(thread)) {
      throw new RecordNotFound('thread not found');
    }

    return await conn('threads')
      .where('id', id)
      .update(shrinkToSpec(dataToInsert));
  }

  return {
    /* Convenience create method for ticket
     * Creates notes thread and ip thread
    * */
    createForTicket(trx, ticket_id, ip_id) {
      let active_thread = {
        ticket_id: ticket_id,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
        status: 'active'
      };
      return trx('threads')
        .insert(
          shrinkToSpec(
            xtend(active_thread, {
              participant: ip_id,
              type: 'ip'
            })
          )
        )
        .then(() => {
          return trx('threads').insert(
            shrinkToSpec(
              xtend(active_thread, {
                type: 'note'
              })
            )
          );
        });
    },

    /* Convenience create method for grouping 
     * Creates notes thread
    * */
    createForGrouping(trx, grouping_id) {
      let active_thread = {
        grouping_id: grouping_id,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
        status: 'active'
      };
      return trx('threads').insert(
        shrinkToSpec(
          xtend(active_thread, {
            type: 'note'
          })
        )
      );
    },
    /* Convenience delete method for ticket
     * Delete all associated threads
     */
    deleteMessagesForTicket(trx, ticket_id) {
      let threads = trx('threads').select('id').where('ticket_id', ticket_id);
      return trx('messages').where('thread_id', 'in', threads).delete();
    },

    create: async data => {
      let dataToInsert = xtend(data, {
        created_at: conn.fn.now(),
        updated_at: conn.fn.now()
      });

      return await conn('threads')
        .insert(shrinkToSpec(dataToInsert))
        .returning('id');
    },

    update,

    findById: async id => {
      let [data] = await conn('threads').where('id', id).select();
      if (!defined(data)) {
        return [];
      }
      const messages = await getThreadMessages(id);

      return [
        xtend(data, {
          messages
        })
      ];
    },

    findByTicketId: async ticket_id => {
      const threads = await conn('threads')
        .where('ticket_id', ticket_id)
        .select();
      return Promise.all(
        threads.map(async thread => {
          const messages = await getThreadMessages(thread.id);
          return xtend(thread, { messages });
        })
      );
    },

    findByGroupingId: async grouping_id => {
      const threads = await conn('threads')
        .where('grouping_id', grouping_id)
        .select();
      return Promise.all(
        threads.map(async thread => {
          const messages = await getThreadMessages(thread.id);
          return xtend(thread, { messages });
        })
      );
    },

    delete: async id => {
      let [thread] = await conn('thread').where('id', id).select();
      if (!defined(thread)) {
        throw new RecordNotFound('thread not found');
      }
      return await conn.transaction(async trx => {
        await trx('messages').where('thread_id', id).delete();
        await trx('thread').where('id', id).delete();
        return id;
      });
    },

    addMessage: async (data, thread_id, user_id) => {
      let [thread] = await conn('threads').where('id', thread_id).select();
      if (!defined(thread)) {
        throw new RecordNotFound('thread not found');
      }

      const dataToInsert = xtend(data, {
        thread_id,
        updated_at: conn.fn.now(),
        created_at: conn.fn.now(),
        // Null indicates an admin user
        created_by: user_id || null
      });

      // update corresponding Thread to trigger new 'updated_at'
      update(thread_id, thread);

      try {
        return await conn('messages').insert(dataToInsert, [
          'id',
          'thread_id',
          'created_by',
          'content',
          'created_at',
          'updated_at'
        ]);
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

    deleteMessage: async id => {
      await conn('messages').where('id', id).delete();
    },

    updateRead: async (id, user) => {
      let [thread] = await conn('threads').where('id', id).select('ticket_id');

      if (defined(thread.ticket_id)) {
        Read.updateRead(thread.ticket_id, user);
      }
    }
  };
};
