const faker = require('faker');
exports.seed = async (knex, Promise) => {
  const Thread = require('../../models/thread')(knex);
  const threads = await knex('threads').select();

  return await Promise.all(
    threads.map(thread => {
      // Add 5 messages
      return Promise.all([
        Thread.addMessage(
          {
            content: faker.hacker.phrase(),
            created_by: thread.participant
          },
          thread.id
        ),
        Thread.addMessage(
          {
            content: faker.hacker.phrase(),
            created_by: thread.participant
          },
          thread.id
        ),
        Thread.addMessage(
          {
            content: faker.hacker.phrase(),
            created_by: thread.participant
          },
          thread.id
        ),
        Thread.addMessage(
          {
            content: faker.hacker.phrase(),
            created_by: thread.participant
          },
          thread.id
        ),
        Thread.addMessage(
          {
            content: faker.hacker.phrase(),
            created_by: thread.participant
          },
          thread.id
        )
      ]);
    })
  );
};
