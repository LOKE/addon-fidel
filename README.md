# LOKE Addon - Fidel

## Description

A LOKE addon to award points to users transacting outside LOKE organization.

## Contributing

### Local Configuration

Create a .env file in the root of the project.

Add all required configuration.

Run `npm start`

NOTE: you can run an in memory database by specifying `USE_MOCK_REPO=true`

### Database Migrations

Use knex, eg `npx knex migrate:make my_migration_name`
