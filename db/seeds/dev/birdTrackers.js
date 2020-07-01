
exports.seed = async knex => {
  try {
    await knex('sightings').del();
    await knex('categories').del();
    await knex('users').del();

    const userId = await knex('users').insert({
      username: 'adamsjr8576',
      password: 'test',
      city: 'Golden',
      state: 'CO'
    }, 'id')

    const categoryId = await knex('categories').insert([
      {name: 'Falcons', user_id: userId[0]},
      {name: 'Song Birds', user_id: userId[0]}
    ], ('id'))

    return knex('sightings').insert([
      {
        bird_species: 'Sharp Shinned Hawk',
        date: '7/1/2020',
        city: 'Golden',
        state: 'CO',
        notes: 'Seen while walking the dog around the condo complex - it has just caught a rabbit and was eating it!',
        photo: 'hawk.jpg',
        wishlist: false,
        favorite: false,
        category_id: categoryId[0]
      },
      {
        bird_species: 'Western Tanniger',
        date: '7/1/2020',
        city: 'Golden',
        state: 'CO',
        notes: 'Seen feeding on birdfeeder off of our balcony',
        photo: 'tanniger.jpg',
        wishlist: false,
        favorite: false,
        category_id: categoryId[1]
      }
    ])
  } catch {
    console.log(`Error seeding data: ${error}`);
  }

};
