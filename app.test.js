const request = require('supertest');
const app = require('./app');

const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

describe('API', () => {
  beforeEach(async () => {
    await database.seed.run()
  });

  describe('initial GET', async () => {
    it('Should return a 200 status at original url', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/users/:username/:password', async () => {
    it('Should return 200 with the user information if username and password are correct', async () => {
      const expectedUser = await database('users').where('username', 'adamsjr8576').select();

      const response = await request(app).get('/api/v1/users/adamsjr8576/test');
      const user = response.body;

      expect(response.status).toBe(200);
      expect(user[0].id).toEqual(expectedUser[0].id);
    });

    it('Should return 404 and an error object stating the username does not exist', async () => {
      const invalidUsername = 'adamsjr';

      const response = await request(app).get(`/api/v1/users/${invalidUsername}/test`);

      expect(response.status).toBe(404);
      expect(response.body.error).toEqual(`username: adamsjr does not exist. Please try a different username or create an account`)
    });

    it('Should return 403 and an error object stating the password is incorrect', async () => {
      const invalidPassword = 'wrong';

      const response = await request(app).get(`/api/v1/users/adamsjr8576/${invalidPassword}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toEqual(`The password entered is incorrect. Please try again.`);
    });
  });

  describe('GET /api/v1/users/:id/categories', async () => {
    it('Should return 200 with the category objects based on a user ID', async () => {
      const expectedUser = await database('users').first();
      const { id } = expectedUser;
      const expectedCategories = await database('categories').where('user_id', id);

      const response = await request(app).get(`/api/v1/categories/users/${id}`);
      const category = response.body[0];

      expect(response.status).toBe(200);
      expect(category.id).toEqual(expectedCategories[0].id)
    });

    it('Should return a 404 if no categories are found', async () => {
      const invalidUserId = 10;

      const response = await request(app).get(`/api/v1/categories/users/${invalidUserId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toEqual('You do not currently have any categories. Create some!');
    });
  });

  describe('GET /api/v1/sightings/users/:id', async () => {
    it('Should return 200 with the sighting objects based on a UserID', async () => {
      const expectedUser = await database('users').first();
      const { id } = expectedUser;
      const expectedSightings = await database('sightings').where('user_id', id).select();

      const response = await request(app).get(`/api/v1/sightings/users/${id}`);
      const sighting = response.body[0];

      expect(response.status).toBe(200);
      expect(sighting.id).toEqual(expectedSightings[0].id)
    });

    it('Should return 404 and an error object if no Sightings are found', async () => {
      const invalidUserId = 10;

      const response = await request(app).get(`/api/v1/sightings/users/${invalidUserId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toEqual(`You do not currently have any sightings. Go Birding!`);
    });
  });

  describe('POST /api/v1/users', async () => {
    it('Should return a 201 with newly created User ID', async() => {
      const newUser = {
        username: 'President',
        password: 'testing',
        city: 'Silver Plume',
        state: 'CO'
      }

      const response = await request(app).post('/api/v1/users').send(newUser);
      const users = await database('users').where('id', response.body.id).select();
      const user = users[0]

      expect(response.status).toBe(201);
      expect(user.username).toEqual(newUser.username)
    });

    it('Should return a 422 and an error object if the request body is missing a required key', async () => {
      const newUser = {
        username: 'President',
        password: 'testing',
        city: 'Silver Plume',
      }

      const response = await request(app).post('/api/v1/users').send(newUser);

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual(`invalid format - required format: { username: <string>, password: <string>, city: <string>, state: <string> }. You are missing a state`)
    });

    it('Should return a 422 and an error object if the request body contains a username that is already taken', async () => {
      const newUser = {
        username: 'adamsjr8576',
        password: 'testing',
        city: 'Silver Plume',
        state: 'CO'
      }

      const response = await request(app).post('/api/v1/users').send(newUser);

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual(`An account with the username adamsjr8576 already exists - please choose another`)
    });
  });

  describe('POST /api/v1/categories', async () => {
    it('Should return a 422 and an error object if the request body is missing a required key', async () => {
      const newCategory = {
        name: 'Birds of Prey'
      }

      const response = await request(app).post('/api/v1/categories').send(newCategory);

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual(`invalid format - required format: { name: <string>, user_id: <integer>}. You are missing a user_id`)
    });

    it('Should return a 201 with a newly created category ID', async () => {
      const user = await request(app).get('/api/v1/users/adamsjr8576/test');
      const userID = user.body[0].id;

      const newCategory = {
        name: 'Birds of Prey',
        user_id: userID
      }

      const response = await request(app).post('/api/v1/categories').send(newCategory);
      const categories = await request(app).get(`/api/v1/categories/users/${userID}`)
      const category = categories.body.filter(category => category.name === newCategory.name)[0];

      expect(response.status).toBe(201);
      expect(category.name).toEqual(newCategory.name);
    });
  });

  describe('POST /api/v1/sightings', async () => {
    it('Should return a 201 with the newly created sighting ID', async () => {
      const user = await request(app).get('/api/v1/users/adamsjr8576/test');
      const userID = user.body[0].id;

      const newSighting = {
        bird_species: 'Nothern Flicker',
        date: '6/15/2020',
        city: 'Golden',
        state: 'Colorado',
        notes: 'Seen from apartment baloncy feeding on suet',
        photo: 'birdphoto.jpg',
        wishlist: false,
        favorite: false,
        user_id: userID,
      }

      const response = await request(app).post('/api/v1/sightings').send(newSighting);
      const sightings = await request(app).get(`/api/v1/sightings/users/${userID}`);
      const sighting = sightings.body.filter(sighting => sighting.bird_species === newSighting.bird_species)[0];

      expect(response.status).toBe(201);
      expect(sighting.bird_species).toEqual(newSighting.bird_species);
    });

    it('Should return a 422 with an error message stating which required key is missing', async () => {
      const newSighting = {
        bird_species: 'Nothern Flicker',
        date: '6/15/2020',
        city: 'Golden',
        state: 'Colorado',
        notes: 'Seen from apartment baloncy feeding on suet',
        photo: 'birdphoto.jpg',
        wishlist: false,
        favorite: false
      }

      const response = await request(app).post('/api/v1/sightings').send(newSighting);

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual('invalid format - requires species, favorite, wishlist, user_id. You are missing user_id')
    });
  });

  describe('PATCH /api/v1/sightings/:sighting_id', async () => {
    it('Should return a status of 200 and the updated sighting if updated correctly', async () => {
      const user = await request(app).get('/api/v1/users/adamsjr8576/test');
      const userID = user.body[0].id;
      const sightings = await request(app).get(`/api/v1/sightings/users/${userID}`);
      const sightingToUpdate = sightings.body[0];

      const patch = {
        id: sightingToUpdate.id,
        bird_species: 'Peregrine Falcon',
        date: '7/1/2020',
        city: 'Golden',
        state: 'CO',
        notes: 'Seen while walking the dog around the condo complex - it had just caught a rabbit and was eating it!',
        photo: 'hawk.jpg',
        wishlist: false,
        favorite: false,
        category_id: sightingToUpdate.category_id
      }

      const updatedSighting = await request(app).patch(`/api/v1/sightings/${patch.id}`).send(patch);
      const checkUpdatedSighting = await request(app).get(`/api/v1/sightings/users/${userID}`);

      expect(patch.bird_species).toEqual(updatedSighting.body[0].bird_species)
      expect(patch.bird_species).toEqual(checkUpdatedSighting.body[1].bird_species)
    });

    it('Should return a status of 422 if the sent ID is not a number', async () => {
      const user = await request(app).get('/api/v1/users/adamsjr8576/test');
      const userID = user.body[0].id;
      const sightings = await request(app).get(`/api/v1/sightings/users/${userID}`);
      const sightingToUpdate = sightings.body[0];

      const patch = {
        id: 'wrong',
        bird_species: 'Peregrine Falcon',
        date: '7/1/2020',
        city: 'Golden',
        state: 'CO',
        notes: 'Seen while walking the dog around the condo complex - it had just caught a rabbit and was eating it!',
        photo: 'hawk.jpg',
        wishlist: false,
        favorite: false,
        category_id: sightingToUpdate.category_id
      }

      const updatedSighting = await request(app).patch(`/api/v1/sightings/${patch.id}`).send(patch);
      expect(updatedSighting.status).toBe(422);
      expect(updatedSighting.body.error).toEqual(`Incorrect ID: wrong, Required data type: <Number>`)
    });

    it('Should return a status of 404 if the sighting to updated does not exist', async () => {
      const patch = {
        id: 123,
        bird_species: 'Peregrine Falcon',
        date: '7/1/2020',
        city: 'Golden',
        state: 'CO',
        notes: 'Seen while walking the dog around the condo complex - it had just caught a rabbit and was eating it!',
        photo: 'hawk.jpg',
        wishlist: false,
        favorite: false,
        category_id: 324
      }

      const updatedSighting = await request(app).patch(`/api/v1/sightings/${patch.id}`).send(patch);
      expect(updatedSighting.status).toBe(404);
      expect(updatedSighting.body.error).toEqual('Could not locate sighting: 123')
    });

    it('Should return a status of 404 if the category to update does not exist', async () => {
      const user = await request(app).get('/api/v1/users/adamsjr8576/test');
      const userID = user.body[0].id;
      const sightings = await request(app).get(`/api/v1/sightings/users/${userID}`);
      const sightingToUpdate = sightings.body[0];

      const patch = {
        id: sightingToUpdate.id,
        bird_species: 'Peregrine Falcon',
        date: '7/1/2020',
        city: 'Golden',
        state: 'CO',
        notes: 'Seen while walking the dog around the condo complex - it had just caught a rabbit and was eating it!',
        photo: 'hawk.jpg',
        wishlist: false,
        favorite: false,
        category_id: 324
      }

      const updatedSighting = await request(app).patch(`/api/v1/sightings/${patch.id}`).send(patch);
      expect(updatedSighting.status).toBe(404);
      expect(updatedSighting.body.error).toEqual('Could not locate category: 324')
    });
  });

  describe('PATCH /api/v1/users/:userId', async () => {
    it('Should return a status of 200 and the updated user if successful patch', async () => {
      const response = await request(app).get('/api/v1/users/adamsjr8576/test');
      const user = response.body[0];

      const patch = {
        username: 'jadams813',
        city: 'Silver Plume',
        state: 'CO'
      }

      const updatedUser = await request(app).patch(`/api/v1/users/${user.id}`).send(patch);
      const newUser = await request(app).get('/api/v1/users/jadams813/test');

      expect(updatedUser.body[0].username).toEqual(patch.username);
      expect(newUser.body[0].username).toEqual(patch.username);
      expect(newUser.body[0].city).toEqual(patch.city);
    });

    it('Should return a status of 422 if the user id is not a number', async () => {
      const patch = {
        username: 'jadams813',
        city: 'Silver Plume',
        state: 'CO'
      }

      const updatedUser = await request(app).patch(`/api/v1/users/nan`).send(patch);

      expect(updatedUser.status).toBe(422);
      expect(updatedUser.body.error).toEqual('Incorrect ID: nan, Required data type: <Number>');
    });

    it('Should return a status of 404 if the user Id provided is not found', async () => {
      const patch = {
        username: 'jadams813',
        city: 'Silver Plume',
        state: 'CO'
      }

      const updatedUser = await request(app).patch(`/api/v1/users/123`).send(patch);

      expect(updatedUser.status).toBe(404);
      expect(updatedUser.body.error).toEqual('Could not locate user: 123');
    });
  });

  describe('DELETE /api/v1/sightings/:sightingId', async () => {
    it('Should return a status of 200 with a successfully delete message when deleted correctly', async () => {
      const response = await request(app).get('/api/v1/users/adamsjr8576/test');
      const user = response.body[0];
      const sightings = await request(app).get(`/api/v1/sightings/users/${user.id}`);
      const sightingToUpdate = sightings.body[0];
      const message = await request(app).delete(`/api/v1/sightings/${sightingToUpdate.id}`);

      expect(message.status).toBe(200);
      expect(message.body.message).toEqual('Success: sighting has been deleted');
    });

    it('Should return a status of 422 if the id in the param is not a number', async () => {
      const message = await request(app).delete(`/api/v1/sightings/nan`);

      expect(message.status).toBe(422);
      expect(message.body.error).toEqual('Incorrect ID: nan, Required data type: <Number>')
    });

    it('SHould return a status of 404 if the sighting Id is not found', async () => {
      const message = await request(app).delete(`/api/v1/sightings/123`);

      expect(message.status).toBe(404);
      expect(message.body.error).toEqual('Could not locate sighting: 123')
    });
  });

  describe('DELETE /api/v1/users/:userId', async () => {
    it('Should return a status of 200 with a successfully delete message when deleted correctly', async () => {
      const response =  await request(app).get('/api/v1/users/adamsjr8576/test');
      const user = response.body[0];
      console.log(user);
      const message = await request(app).delete(`/api/v1/users/${user.id}`);

      expect(message.status).toBe(200);
      expect(message.message).toEqual(`Success: user has been deleted`);
    })
  })

});
