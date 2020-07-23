
exports.up = function(knex) {
  return knex.schema.table('categories', table => {
    table.dropColumn('user_id')
  });
};

exports.down = function(knex) {
  return knex.schema.table('categories', table => {
    table.integer('user_id').unsigned();
    table.foreign('user_id')
      .references('users.id');
  })
};
