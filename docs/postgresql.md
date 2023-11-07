# PostgreSQL

## PostgreSQL Installation
### Debian
1. Update the APT package index: `sudo apt update`
2. Install the PostgreSQL server and contrib package which provides additional features for the PostgreSQL database: `sudo apt install postgresql postgresql-contrib`

### MacOS
1. Update Homebrea: `brew update`
2. Install the PostgreSQL server: `brew install postgresql`

## Create a Sidekick database
To create a database called "sidekick" and a user with username "sidekick_user" and password "sidekick_password", follow the instructions below.
1. Switch to postgres user: `sudo su postgres`
2. Enter the the interactive terminal for working with Postgres: `psql`
3. Create the database: `CREATE DATABASE sidekick;`
4. Create user: `CREATE USER sidekick_user WITH PASSWORD 'sidekick_password';`
5. Grant privileges on database to user: `GRANT ALL PRIVILEGES ON DATABASE "sidekick" to sidekick_user;`

## Configuring Sidekick to use PostgreSQL
If you have followed the instructions above to create a Sidekick database on your localhost, you can configure the Sidekick server to use this database by first setting the environment variable "SQLALCHEMY_DATABASE_URI" to the postgresql connection URI for example: `SQLALCHEMY_DATABASE_URI=postgresql://sidekick_user:sidekick_password@127.0.0.1/sidekick`


## Quick reference
1. Log into the PostgreSQL database: `psql -U username -d database`
2. List all databases: `\l`
3. Connect to a database: `\c database_name`
4. List all tables in the current database: `\dt`
5. Describe a table: `\d table_name`
6. Exit PostgreSQL: `\q`