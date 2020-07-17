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
  })
});
