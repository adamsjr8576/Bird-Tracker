const express = require('express');
const app = express();
const cors = require('cors');

  const environment = process.env.NODE_ENV || 'development';
  const configuration = require('./knexfile')[environment];
  console.log(configuration)
  const database = require('knex')(configuration);

app.locals.title = 'Bird Tracker';
app.use(express.json());
app.use(cors());

app.get('/', (request, response) => {
  response.send('Reached Bird Tracker');
});

app.get('/api/v1/users/:username/:password', async (request, response) => {
  console.log('hey')
  const { username, password } = request.params;

  try {
    const user = await database('users').where('username', username).select();
    if (!user.length) {
      return response.status(404).json({ error: `username: ${username} does not exist. Please try a different username or create an account` })
    }
    if (user[0].password !== password) {
      return response.status(403).json({ error: `The password entered is incorrect. Please try again.`})
    }
    const userToSend = [{ id: user[0].id, username: user[0].username, city: user[0].city, state: user[0].state}]
    return response.status(200).json(userToSend);
  } catch(error) {
    return response.status(500).json({ error });
  }
});

app.get('/api/v1/categories/users/:id', async (request, response) => {
  const { id } = request.params;

  try {
    const categories = await database('categories').where('user_id', id).select();
    if (!categories.length) {
      return response.status(404).json({ error: `You do not currently have any categories. Create some!` })
    }
    return response.status(200).json(categories);
  } catch(error) {
    return response.status(500).json({ error });
  }
});

app.get('/api/v1/sightings/users/:id', async (request, response) => {
  const { id } = request.params;

  try {
    const sightings = await database('sightings').where('user_id', id).select();

    if (!sightings.length) {
      return response.status(404).json({error: `You do not currently have any sightings. Go Birding!`})
    }
    return response.status(200).json(sightings);
  } catch(error) {
    return response.status(500).json({ error });
  }
});

app.get('/api/v1/sightings/categories/:id', async (request, response) => {
  const { id } = request.params;

  try {
    const sightings = await database('sightings').where('category_id', id).select();
    if (!sightings.length) {
      return response.status(404).json({ error: `There are currently no sightings for this category. Add some!` })
    }
    return response.status(200).json(sightings);
  } catch(error) {
    return response.status(500).json({ error });
  }
})

app.post('/api/v1/users', async (request, response) => {
  const user = request.body;

  for (let requiredParam of ['username', 'password', 'city', 'state']) {
    if (!user[requiredParam]) {
      return response.status(422).json({ error: `invalid format - required format: { username: <string>, password: <string>, city: <string>, state: <string> }. You are missing a ${requiredParam}` })
    }
  }

  try {
    const userCheck = await database('users').where('username', user.username).select();
    if (userCheck.length) {
      return response.status(422).json({ error: `An account with the username ${user.username} already exists - please choose another` })
    }
    const id = await database('users').insert(user, 'id');
    return response.status(201).json({ id: id[0] });
  } catch(error) {
    return response.status(500).json({ error });
  }
});

app.post('/api/v1/categories', async (request, response) => {
  const category = request.body;

  for (let requiredParam of ['name', 'user_id']) {
    if (!category[requiredParam]) {
      return response.status(422).json({ error: `invalid format - required format: { name: <string>, user_id: <integer>}. You are missing a ${requiredParam}` });
    }
  }

  try {
    const id = await database('categories').insert(category, 'id');
    return response.status(201).json({ id: id[0] });
  } catch(error) {
    return response.status(500).json({ error });
  }
});

app.post('/api/v1/sightings', async (request, response) => {
  const sighting = request.body;

  for (let requiredParam of ['bird_species', 'favorite', 'wishlist', 'user_id']){
    if (sighting[requiredParam] === undefined) {
      return response.status(422).json({ error: `invalid format - requires species, favorite, wishlist, user_id. You are missing ${requiredParam}`});
    }
  }

  try {
    const id = await database('sightings').insert(sighting, 'id');
    return response.status(201).json({ id: id[0] });
  } catch(error) {
    return response.status(500).json({ error });
  }
});

app.patch('/api/v1/sightings/:sightingId', async (request, response) => {
  const { sightingId } = request.params;
  const patch = request.body;
  if(!parseInt(sightingId)) {
    return response.status(422).json({ error: `Incorrect ID: ${sightingId}, Required data type: <Number>`});
  }

  try {
    const sighting = await database('sightings').where('id', sightingId).select();
    if (sighting.length === 0) {
      return response.status(404).json({ error: `Could not locate sighting: ${sightingId}` });
    }
    const category = await database('categories').where('id', patch.category_id).select();
    if (category.length === 0) {
      return response.status(404).json({ error: `Could not locate category: ${patch.category_id}` });
    }
    const updateSighting = await database('sightings').where('id', sightingId).update(patch, '*');
    return response.status(200).json(updateSighting)
  } catch(error) {
    return response.status(500).json({ error });
  }
});

app.patch('/api/v1/users/:userId', async (request, response) => {
  const { userId } = request.params;
  const patch = request.body;
  if(!parseInt(userId)) {
    return response.status(422).json({ error: `Incorrect ID: ${userId}, Required data type: <Number>`});
  }

  try {
    const user = await database('users').where('id', userId).select();
    if (user.length === 0) {
      return response.status(404).json({ error: `Could not locate user: ${userId}` });
    }
    const updatedUser = await database('users').where('id', userId).update(patch, '*');
    return response.status(200).json(updatedUser)
  } catch(error) {
    return response.status(500).json({ error });
  }
});

app.delete('/api/v1/sightings/:sightingId', async (request, response) => {
  const { sightingId } = request.params;

  if(!parseInt(sightingId)) {
    return response.status(422).json({ error: `Incorrect ID: ${sightingId}, Required data type: <Number>`});
  }

  try {
    const sighting = await database('sightings').where('id', sightingId).select();
    if (sighting.length === 0) {
      return response.status(404).json({ error: `Could not locate sighting: ${sightingId}` })
    }
    const deletedSighting = await database('sightings').where('id', sightingId).del();
    return response.status(200).json({ message: 'Success: sighting has been deleted' });
  } catch(error) {
    return response.status(500).json({ error });
  }
});

app.delete('/api/v1/users/:userId', async (request, response) => {
  const { userId } = request.params;

  if (!parseInt(userId)) {
    return response.status(422).json({ error: `Incorrect ID: ${userId}, required data type: <Number>` })
  }

  try {
    const user = await database('users').where('id', userId).select();
    if (user.length === 0) {
      return response.status(404).json({ error: `Could not locate user: ${userId}` })
    }

    const deletedUser = await database('users').where('id', userId).del();
    return response.status(200).json({ message: 'Success: user has been deleted' });
  } catch(error) {
    return response.status(500).json({ error });
  }
});


module.exports = app;
