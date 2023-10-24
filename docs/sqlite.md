# SQLite

A brief introduction with some example commands to get you going if you are using sidekick with a SQLite database.

## Using the SQLite CLI

You can use the SQLite CLI to interact with your database. To do so, you need to know the path to your database file.
For example, if your database file is in server/instance/sidekick.db, you can run the following command to open the SQLite CLI:

```bash
sqlite3 server/instance/sidekick.db
```

Once you are in the CLI, you can run CLI and SQL commands. For example:

`.tables` will list all the tables in the database.

`.schema users` will show the schema for the users table.

To list the user info:

```sql
select * from users;
```

`.help` for help.

`.quit` will exit the CLI.
