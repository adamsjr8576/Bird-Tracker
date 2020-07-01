
exports.up = knex => {
  return knex.schema
    .createTable('users', table => {
      table.increments('id').primary();
      table.string('username');
      table.string('password');
      table.string('city');
      table.string('state');

      table.timestamps(true, true);
    })
    .createTable('categories', table => {
      table.increments('id').primary();
      table.string('name');
      table.integer('user_id').unsigned();
        .references('users.id');

      table.timestamps(true, true);
    })
    .createTable('sightings', table => {
      table.increments('id').primary();
      table.string('bird_species');
      table.string('date');
      table.string('city');
      table.string('state');
      table.string('notes');
      table.string('photo');
      table.boolean('wishlist');
      table.boolean('favorite');
      table.integer('category_id').unsigned();
      table.foreign('category_id')
        .references('categories.id');

      table.timestamps(true, true);
    })
};

exports.down = knex => {
  return knex.schema
      .dropTable('footnotes')
      .dropTable('papers')
};
