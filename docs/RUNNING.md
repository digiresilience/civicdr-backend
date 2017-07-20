# 🏃 Running

## Running the API

You should have a `.env` file that contains the following environment variables:

-  `DATABASE_URL` : URL to the postgres database, of the form `postgres://USER:PASSWORD@DOMAIN:PORT/DATABASE`
-  `MAILGUN_KEY` : Mailgun API key
-  `MAILGUN_DOMAIN` : Mailgun Domain
-  `MAILGUN_EMAIL` : Mailgun "from" address for notifications
-  `ADMIN_EMAIL` : Email address for admin notifications
-  `JWT_SECRET` : The secret token used to validate requests from clients. [More information](ARCHITECTURE.md#-authentication)
- `HEROKU_APP_LOG_LEVEL` : The log level for heroku streaming logs.
- `LOG_DIRECTORY` : Log files are written to the directory defined here.

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

### Running on Heroku

- After creating an application on Heroku and associating the Github repository, the default `npm start` will run the server (make sure to create the environment variables for the app)
- The [Heroku Scheduler](https://devcenter.heroku.com/articles/scheduler) can be used to run the mailer for notifications using the same commands as above.

### CircleCI Integration

If you want to leverage [Circleci](https://circleci.com) to do automatic builds when the codebase is updated you can follow these steps.

#### Create a new account
- Create a [CircleCI account](https://circleci.com/signup/)
- Click on the arrow next to the button labeled "Start with Github" and choose "Public Repos Only"

![login buton](https://raw.githubusercontent.com/ASL-19/civicdr-backend/master/docs/images/circleci_login.png)

- Accept the permissions request from Github and enter your password if requested
- You will be taken back to the [CircleCI Dashboard](https://circleci.com/dashboard)

#### Add CiviCDR-Backend as a project

- In the side-bar menu click the [projects tab](https://circleci.com/projects)
- This will take you to the [projects section](https://circleci.com/projects) of your profile
- Select the organization and/or account that contains CiviCDR.
- Click the "Add Project" button. This will take you to the [Add Projects page](https://circleci.com/add-projects)

![add projects text "ASL-19 has no projects building on CircleCI, Let's fix that by adding a new project. Add Project](https://raw.githubusercontent.com/ASL-19/civicdr-backend/master/docs/images/circleci_no_projects.png)

- Click on the name of the organization and/or account that contains CiviCDR in the box on the left.
- This will open up a list of projects in that account in the right hand box.
- Next to civicdr and/or civicdr-backend there will be a button titled "Follow Project"

![Picture of button saying "Follow Project"](https://raw.githubusercontent.com/ASL-19/civicdr-backend/master/docs/images/circleci_follow.png)


- Click the "Follow Project" button.
- After a few seconds the text of the button should change to "Build Project"

![Picture of button saying "Build Project"](https://raw.githubusercontent.com/ASL-19/civicdr-backend/master/docs/images/circleci_build.png)

- Click on the "Build Project" Button.
- This will take you to the "build page" for the build you just created
- You can follow the status of that build in this page
- Once the build has completed it will place a button titles "Success" at the top left of the main page


#### What to do if you have previously a CiviCDR project stops building

- Go to the [Add Projects page](https://circleci.com/add-projects) on CircleCI
- Click on the name of the organization and/or account that contains CiviCDR in the box on the left.
- This will open up a list of projects in that account in the right hand box.
- Next to civicdr and/or civicdr-backend there will be a button titled "Unfollow Project"

![Picture of button saying "Unfollow Project"](https://raw.githubusercontent.com/ASL-19/civicdr-backend/master/docs/images/circleci_unfollow.png)

- Click the "Unfollow Project" button.
- After a few seconds the text of the button should change to "Follow Project"

![Picture of button saying "Follow Project"](https://raw.githubusercontent.com/ASL-19/civicdr-backend/master/docs/images/circleci_follow.png)

- Click the "Follow Project" button.
- After a few seconds the text of the button should change to "Build Project"

![Picture of button saying "Build Project"](https://raw.githubusercontent.com/ASL-19/civicdr-backend/master/docs/images/circleci_build.png)

- Click on the "Build Project" Button.
- This will take you to the "build page" for the build you just created
- You can follow the status of that build in this page
- Once the build has completed it will place a button titles "Success" at the top left of the main page

![Picture of the interface saying "Success"](https://raw.githubusercontent.com/ASL-19/civicdr-backend/master/docs/images/circleci_success.png)
