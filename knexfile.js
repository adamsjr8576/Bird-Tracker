// Update with your config settings.

module.exports = {

  development: {
    client: 'pg',
    connection: 'postgres://localhost/birdtrackerdb',
    migrations: {
      directory: './db/migrations'
    },
    useNullAsDefault: true
  }
};
