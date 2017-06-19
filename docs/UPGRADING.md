# 💪 Upgrading


## Code upgrade

The yarn lockfile pins versions for the library dependencies. To update a specific library use `yarn upgrade [package]` ([More Info](https://yarnpkg.com/lang/en/docs/cli/upgrade/))

## Running tests

Tests can be run using `yarn test`. 

Postgres must be running and the command will:
- Create a database named `civicdr_test`
- Run the test files (files in the `test/` directory)
- Drop the `civicdr_test`

## Adding database migrations and seed data

The `knex` tool can be used to easily create migrations for the Postgres DB. The knex tool runs according to configuration in the `knexfile.js` file.

```
# Create the migration
DATABASE_URL=MY_DATABASE_URL node_modules/.bin/knex migrate:create name_of_migration --env user

# Apply the migration
DATABASE_URL=MY_DATABASE_URL node_modules/.bin/knex migrate:latest --env user

# Run seed code in the db/seeds directory
DATABASE_URL=MY_DATABASE_URL node_modules/.bin/knex seed:run --env user
```

⚠️  for a heroku database, you might need to set `PGSSLMODE=require` as an environment variable before running the abolve migration code.
