# 🏃 Running

## Running the API

You should have a `.env` file that contains the following environment variables:

-  `DATABASE_URL` : URL to the postgres database, of the form `postgres://USER:PASSWORD@DOMAIN:PORT/DATABASE` 
-  `MAILGUN_KEY` : Mailgun API key
-  `MAILGUN_DOMAIN` : Mailgun Domain
-  `MAILGUN_EMAIL` : Mailgun "from" address for notifications
-  `ADMIN_EMAIL` : Email address for admin notifications
-  `JWT_SECRET` : The secret token used to validate requests from clients. [More information](ARCHITECTURE.md#-authentication)

```
# Copy over the .env file and set the environment variables
cp .env.tmpl .env
	
# Run server
yarn run web
```

- The API runs by default at port 4040. You can control the port with the `PORT` environment variable.
- If your database requires SSL connections, you might to set `PGSSLMODE=require` in the `.env` file.

## Running the Mailer

The `clock.js` script sends emails to notify participants about changes to tickets, it uses Mailgun to send email through an HTTP API. [More information about how email notifications work](ARCHITECTURE.md#️-email).

```
# Run the task once to send unsent notifications from the past day
yarn run clock
# Can optionally be run with start and end parameters to get unsent emails from other periods, e.g. send any unsent emails from April 2017
yarn run clock 2017-04-01 2017-04-30
```
To send mail regularly, set up a cron job to run the script on a schedule. For example (every 10 minutes):
	
```
# cd into the app directory and run the clock process
*/10 * * * * civicdr cd /home/civicdr && yarn run clock<Paste>
```
