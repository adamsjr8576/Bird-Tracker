
exports.up = knex => {
  return knex.schema.table('sightings', table => {
    table.integer('user_id').unsigned();
    table.foreign('user_id')
      .references('users.id')
  })
};

exports.down = knex => {
  return knex.schema.table('sightings', table => {
      table.dropColumn('user_id');
    })
};
