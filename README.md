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

## Features

### GET list /event-definition-type

Returns a list of allowed types for the frontend to work with, if the user doesn't have permission to view event definitions with an "ads" type the server returns every other option, if they do it returns all type options. If the server lacks configuration to verify the users IP it defaults to returning the restricted subset of types

### GET one /event-definition/:id

Returns the requested entity by id, if the user does not have permission to view it (ads permission) the request is rejected & the server returns a 401 Unauthorized exception, if the database fails to find any entity with that id a 404 Not found exception is returned

### GET many /event-definition

Returns a list of event definitions based on the provided inputs, if the user doesn't have permission to view "ads" type definitions, the DB query is modified appropriately so that the returned result set will still match limits & other filters.

This endpoint supports pagination through optional offset & limit parameters, if not provided 0 & 10 are used as defaults. The provided values must be integers.

A response content range header is provided to better enable client pagination & provide user input on the number of results their query has. The total count is based on the provided filters as well as permissions.

Sorting is supported through the sort parameter, and can be done on any known key of the EventDefinition object by providing sort={key}. For descending sorting prefix the key with a - sign as such "sort=-{key}". Providing multiple sort parameters is supported & will be applied in order. Unknown keys as well as duplicate keys will be ignored.

Full text search is supported by using the search parameter, which expects a string. Because of "ease of use" a simple to_tsvector was chosen to parse te input as a websearch option seemed too advanced for the usecase. On request this can be modified easily through a migration. If multiple search parameters are provided, the first will be used & the rest discarded. Search parameters are trimmed and empty/blank values are ignored

Column filtering is available on any key of the EventDefinition object. Unknown keys & matcher pairs are ignored. Available matchers are based on the fields data type:

- .eq [Equal] can be used on ANY type
- .neq [Not equal] can be used on ANY type
- .ilike [Insensitive like] can be used on STRING types
- .nilike [Not insensitive like] can be used on STRING types
- .gt [Greater than] can be used on NUMBER or DATE types
- .gte [Greater than inclusive] can be used on NUMBER or DATE types
- .lt [Less than] can be used on NUMBER or DATE types
- .lte [Less than inclusive] can be used on NUMBER or DATE types
- .eqd [Equal day] can be used on DATE types
- .neqd [Not equal day] can be used on DATE types

Column filters are constructured with a {key}.{matcher}=value ex name.eq=event7.

Multiple filters of the same key.matcher pair function as or combinators, different key.matcher pairs function as ands.

Values provided to a NUMBER data type key that can not be parsed into a number are ignored.

Values provided to a DATE datatype that can not be parsed into a valid date are ignored.

### POST /event-definition

Accepts a CreateEventDefinitionDTO & saves it to the database. If the user does not have permission to work with the "ads" type a 401 Unauthorized exception is returned, if prettified version of the zod validator errors are returned as a 400 Bad request exception.

Triggers a EventDefinitionChangeEvent with a type of "create"

### PATCH /event-definition/:id

Accepts a UpdateEventDefinitionDTO & saves it to the database. Returns the same errors as POST if the user doesn't have permissions or the DTO fails validation. Can also return a 404 Not found if the provided id doesn't match an entity within the database.

### DELETE /event-definition/:id

This method was omited due to the nature of the event definition entity. As they are objects inherently used to provide metadata for another they can only be archived through the patch method. This guarantees referential integrity throughout the system. Archived events can not be modified & should not be used by consumers other than for display & metadata purposes for existing events.

### SSE /event-definition/changes/:clientId

Method provides a subscription to changes made by other consumers that do not match the provided clientId. Client ids are not sent to other consumers. Changes made to entities with an "ads" type are not sent to clients which do not have permission to view those.

For the server to be able to filter events based on client ids a request header of 'x-client-id' should be sent by the client with their unique id. This parameter is optional, but the subscribing client will need to filter their own generated events.

### Server caching & deduplication

External calls to the IP api & the ads permission api are cached to ensure better performance of queries. This way the user only "pays" for the permission check rarely instead of on every request. call Promises are cached instead of pure values so that if a cachable call is still in flight the next request will simply hook into it instead of creating a new request. Caches are set to a simply lru strategy

### Table

A simple table view was chosen as this provides the greatest flexibility for business consumers to find the data they are looking for. The client supports all the server filtration, sorting & pagination capabilities of the server but limits itself to one filter per column as well as one directional sort for "ease of use".

Sorting can be done by clicking the icon button in the column header, to use the fulltext search simply use the search field above the table. Each header cell is also a filter input, clicking on the name will focus into it. The sort button is hidden unless the user hovers over the header or sort on that column is active

Applying specific sort directions, changing filter matchers and other functions can be found in each cells own menu "vertical dots"

Pagination, column ordering/visibility & pinning are also supported & can be acessed through each header cells menu.

Column order/visibility can also be toggled in the table toolbar by clicking on the column icon button & opening the dedicated menu

If any filters are active a remove filters button appears on the right hand side of the table toolbar, clicking it removes all filters

The table is responsive & adjusts to new ui dimensions. Vertical scrolling is done on the table body only.

### Create/Edit dialog

A dialog was chosen to provide better mobile support & due to the simple structure of the input data. Dialogs accept reactive data, if the underlying data is mutated while the dialog is open, new changes will be applied to it. Dirty fields are kept, but clean fields are repopulated with the fresh data.

If confirm is clicked a post/patch request is triggered & the ui is optimistically updated. The table data is refreshed after a succesful post/patch is completed. If an error occurs a snackbar will appear with options to retry the request or reopen the dialog to potentially modify the state a different way. In flight state is persisted so the dialog opens with the state the user just closed & not the original values.

The dialogs are responsive

### Archive confirmation dialog

The archive button asks for confirmation, data flow functions the same as the Create/Edit dialogs

### Mobile list

If the screen size gets too small (tablet portrait or mobile portrait/landscape) the table view is switched to a simplified list view. Pagination, filtering & sorting are disabled in this view. Up to 50 entries are loaded and displayed in a card list, the user can use the global filter to find what they need & then modify/archive the entity as needed.

### SSE subscription

The client subscribes to the SSE endpoint provided by the server, if the change event happens and the entity is currently in the clients view the data will be modified in place. Reactive chains such as the one linked to the dialog guarantee that data flows consistently.

### Client caching, prefetching & deduplication

Client side caching is handled with the same lru strategy as the server, but stale time & key generation are modified. By default (and currently used in every request) staleTime is set to 0, this enables behaviour where stale data is shown to the user if available, but immediately a new call is triggered to get up-to-date data.

Prefetching is also handled by caching the values. This is currently used on table queries, where next/previous pages are pre-fetched & cached to ensure "smooth" behavior. The browsers Network information API is used to disable prefetching on slow connections.

GET-like requests are deduped if a request with the same parameters is currently in flight

### Other

Dark/light theming, localization & other core features are supported by the application. Locale changes require a full refresh by design & will cause state to reset, this is a performance tradeoff with the assumption that users wont change their language frequently.

Theme, table & other settings are stored into local storage so that the user can "pick up" where they left off. Ideally an authentication service would be added enabling server side storage of preferences so that the user can share their state wherever they go, but this is out of scope for this project.

### Testing

Due to the short time frame for delivery tests were omited so that resources could be spent on creating better experiences for users. In the future certain core parts of the solution should be unit, integration & e2e tested, as such this repository has already been configured to run Jest & Cypress tests, though Cypress would also ideally have a remote deployment to test against.

### CI/CD

Due to no target deployment for this project CI/CD was omited the repository has a github actions template prepared for future proofing.
