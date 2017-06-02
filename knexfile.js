var path = require('path');
module.exports = {
  test: {
    client: 'pg',
    connection: 'postgres://localhost/civicdr_test',
    debug: process.env.KNEX_DEBUG || false,
    migrations: {
      directory: path.join(__dirname, 'db/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'db/seeds')
    }
  },
  user: {
    client: 'pg',
    debug: process.env.KNEX_DEBUG || false,
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.join(__dirname, 'db/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'db/seeds')
    }
  },
  circle: {
    client: 'pg',
    connection: 'postgres://ubuntu@localhost/circle_test',
    migrations: {
      directory: path.join(__dirname, 'db/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'db/seeds')
    }
  }
};
