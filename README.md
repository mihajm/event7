# Event7

## Getting started

### Installation

Please ensure you have a modern version of node & npm installed before. At least node 18.20.6 is expected, as vanilla node fetch is used, developed & tested on 23.7.0. Run `npm install` in the root directory to install dependencies.

Docker + docker-compose are setup to generate a postgres image for development, however any postgres instance will work, simply configure the .env variables accordingly. To use the provided image run `docker-compose up` in the root directory

### Environment configuration

To configure the local environment variables for the server application please create a .env file in the root of the project, a .env.template file has been provided showcasing the expected configuration.

_NX_DEAMON is set to false within the template due to a bug with the latest nx version & the nestjs runner causing command prompts to be opened on every save, due to this reload on save does not work for the nestjs application & it needs to be restarted before changes are applied. Changing the NX_DEAMON variable to true or removing it restores auto reloading functionality_

The frontend project uses the env.js file within the source files of the event7-client application. This gets bundled as an asset at build time & is expected to be replaced in a genuine deployment using a kubernetes config map or similar. The provided configuration matches what would be the chosen defaults for a local server instance.

_Further steps require the environment to be configured_

### Migration & Seeding

Database migration scripts are already pre-generated within libraries that require it, when setting up a new database instance ex. if you just ran `docker-compose up` on the included image for the first time you need to run the migration scripts to set up the various database tables, functions etc.. To run the migration use `npx nx run event7-server:migrate`.

A seed script is also available to pre-populate existing tables. After migration you can run `npx nx run event7-server:seed` to run seed the database. By default 100 entries are created, but you can configure it using the environment variable "SEED_COUNT" in the .env file or the terminal environment.

_Please note that due to the permission logic, running the server locally will result in you not being allowed to view event definitions with the type of "ads", because of this returned total count returned from an unlimited list query might yield less than the provided seed count_

To create new migration scripts when changing the database schema use the command `npx nx run-many --target=generate` this will run scripts in any libraries that need to generate new migration scripts

### Serving

Both the server & client applications have prepared "serve" nx executors you can run them similarly to the migration/seed scripts mentioned above:

- Server: `npx nx run event7-server:serve`
- Client: `npx nx run event7-client:serve`
