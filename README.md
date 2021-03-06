# community-expenses-submission

Community projects often handle reimbursement of expenses. This process can
be labour intensive. The goal of this software is to make this process
easier, and allow more people to share the work. We're inspired by the
[opencollective](https://opencollective.com/) system.

## Stack

- Auth0
  - User registration and login is handled via Auth0
  - Auth0 provides a JWT to the user on successful login
- Hasura backend
  - The backend is a hasura server
  - It exposes a postgres database via GraphQL
  - The configuration is in the `hasura/` folder
  - Hasura takes user data from the JWT generated by Auth0
- Media server
  - Images are uploaded to and served from a dedicated media server
  - It (currently) puts files on disk
  - The media server enforces permissions
- React frontend
  - Using redux (minimally)
  - Apollo is the GraphQL client connecting to Hasura
  - The Auth0-lock package is used to handle authentication
    - The JWT is written into `localStorage` on successful login

### Services

The stack can be deployed with the following services:

- [Auth0](https://auth0.com/) for user management
  - See the Hasura docs on how to link Auth0 and Hasura
- [Heroku](https://www.heroku.com/) for the hasura server
  - Should fit comfortably within their free dyno limit
- [Netlify](https://www.netlify.com/) for the static frontend
  - Netlify offers free static site hosting and will build from GitHub automatically

## Development

To run this locally in development you need the following installed:

- [nodejs](https://nodejs.org/)
- [yarn](https://www.yarnpkg.com/)
- [docker](https://www.docker.com)
  - Including `docker-compose`

You'll need multiple terminals to run all the pieces. More info below.

### Config

To run the app in development, you'll need some config values. They're
included in this repo in `.env` at the root. However, to standardise on this,
we're planning to copy the config setup from
[here](https://github.com/chmac/community-shift-signup). See
https://github.com/chmac/community-expenses-submission/issues/4.

### Data backend

Hasura requires 2 terminals. Firstly, to run the Hasura engine:

- `cd hasura`
- `docker-compose up`

  - This starts the Hasura engine via docker

Now in a second terminal:

- `cd hasura`
- `yarn`
- `yarn run migrate:status`
  - This will tell you the hasura console migration status
- `yarn run migrate:apply`
  - This will ensure you are running the latest migrations
- `yarn start`
  - This starts the Hasura console

Then you need to add some data to be able to use the app. As a minimum:

- Insert 2 budget categories
  - http://localhost:9695/data/schema/public/tables/budget_categories/insert
  - Pick any name you like
  - Enter a budget amount in cents (so `20000` = €200)

### Media server

- `cd media-server`
- `yarn`
- `yarn start`

### Frontend

- `cd frontend`
- `yarn`
- `yarn start`

## Demo

You can login with email `admin@mailinator.com` and password `pass123!`.

Or if you create our own Auth0 setup, for admin users, set their app_metadata to:

```json
{
  "roles": ["user", "admin"]
}
```

## Deployment

To deploy this application requires the following.

### Netlify

- Fork this GitHub repository
- Deploy this fork to netlify
  - First create an account on netlify.com, login with your GitHub account
  - Then create a new site, choose this repository
  - OPTIONAL: Add a custom domain
    - Up to you, follow the netlify instructions to do this
  - Save the site url as `FRONTEND_URL` (trailing slash, no path)
    - Example `https://app-name.netlify.app/`
  - NOTE: The deploy will not work at this point, we need to add environment
    variables which comes later

### Auth0

- Setup an Auth0 account and fill the config values into .env
  - Create a new tenant domain
  - Follow the hasura instructions
    - https://hasura.io/docs/1.0/graphql/core/guides/integrations/auth0-jwt.html
    - https://hasura.io/learn/graphql/hasura/authentication/1-create-auth0-app/
    - Create an application
    - Create the `hasura-jwt-claims` rule
    - Get the JWT secret, save it as `HASURA_GRAPHQL_JWT_SECRET`
  - Applications > Create Application
    - Set your `FRONTEND_URL` in "Allowed Callback URLs", "Allowed Logout URLs", and "Allowed Web Origins"
  - Save `AUTH0_DOMAIN` and `AUTH0_CLIENT_ID`

Use the following rule instead of what the Hasura docs contain:

```js
function (user, context, callback) {
  const namespace = "https://hasura.io/jwt/claims";
  context.idToken[namespace] =
    {
      'x-hasura-default-role': 'user',
      // If the user has any app_metadata.roles, add them to the hasura roles
      'x-hasura-allowed-roles': ['user'].concat(user && user.app_metadata && user.app_metadata.roles || []) ,
      'x-hasura-user-id': user.user_id
    };
  callback(null, user, context);
}
```

After you have created your own account (by using the signup in the
application), edit your own user on Auth0, and add to `app_metadata` the
following:

```json
{
  "roles": ["admin"]
}
```

This sets you as an admin within the hasura backend and the application
itself. Repeat this process for any other users who you want to have admin
access.

### Heroku

- One click deploy hasura to heroku

  - See the docs here:
    https://hasura.io/docs/1.0/graphql/core/deployment/deployment-guides/heroku.html#option-1-one-click-deployment
  - Save the new URL (without the `/console`, so the url without any path)
  - This is your `HASURA_URL`
  - Create a random string and save it as `HASURA_GRAPHQL_ADMIN_SECRET`
  - Set the environment variables in heroku
    - In Heroku, Manage App > Settings
    - Set `HASURA_GRAPHQL_ADMIN_SECRET` and `HASURA_GRAPHQL_JWT_SECRET`
    - Then Restart All Dynos (found under the More menu top right in Heroku)
  - Set the `HASURA_URL` and `HASURA_GRAPHQL_ADMIN_SECRET` in `./.env`
    - At the repository root, not in the `hasura/` directory
  - Run the hasura migrations
    - `cd hasura`
    - `yarn`
    - `yarn run migrate:status`
      - This will tell you the hasura console migration status
    - `yarn run migrate:apply`
      - This will ensure you are running the latest migrations
  - Load your hasura console to check the migrations were successful
    - Load your hasura url in the browser, use the admin secret to login

After you've deployed Hasura to Heroku, log in to the console and create
budget categories.

- Go to the Data tab
- Find the `budget_categoreis` table on the left
- Open the Insert Row tab
- Enter the `name` and `budget_cents`, and optionall `notes`
  - DO NOT edit `id`, `created_at` or `updated_at`
  - For a value of €200, enter 20000 in the `budget_cents` category, etc

### Media server

- Run a copy of the media-server somewhere
- This is currently not easily automated, PRs welcome
- Easiest option is to run it on docker, see
  `media-server/scripts/deployment` for example scripts of how to do this
- Then add SSL termination in front of the docker container on a public domain
  - Save this as `FRONTEND_URL`

### Frontend env vars

- Update the environment variables on Netlify
  - Settings > Build & Deploy > Environment
    - Copy the variable names from `frontend/.env` and set the values based
      on the previous steps
    - Note that the GraphQL URI is a combination of 2 parts

### Custom deployment

Here's some notes that might be useful if you want to deploy to your own
docker containers. The strategy above is easier, free of charge, and the
recommended approach.

- Deploy hasura
  - Easiest is likely via docker, which requires 2 containers, a postgres
    container and the hasura container itself
  - Copy the hasura secret key to the root `.env`
  - Run the hasura migrations against this server
    - The migration files are in the `hasura/` folder
    - There are migration commands above that might help understanding this
      part
    - TODO Provide better docs on how to do this
    - https://hasura.io/docs/1.0/graphql/core/deployment/deployment-guides/docker.html#deployment-docker
- Deploy an HTTPS termination service in front of hasura
  - The easiest is probably another docker container
  - https://hasura.io/docs/1.0/graphql/core/deployment/enable-https.html#enable-https
  - Copy the public hasura URL into the root `.env`
- Deploy the media server
  - This is a simple node script, it could be packaged to run inside a docker
    container
- Deploy an HTTPS termination service in front of the media server
  - Likely using the same strategy as for Hasura
- Build and deploy the frontend
  - Set the frontend URL into `.env`
  - This is most easily done via netlify
  - If you want to do this manually, the steps are loosely:
    - Install all dependencies in `frontend/` like `cd frontend && yarn`
    - Build the frontend `cd frontend && yarn build`
    - Serve the `build/` folder at a URL with HTTPS enabled
      - It's purely static files, so any web server or CDN will do
  - PRs adding a multi stage docker build for this part most welcome

## User Testing

- Erin Jeavons-Fellows - Chief User Tester (President)
