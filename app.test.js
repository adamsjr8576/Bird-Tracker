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

  describe('GET /api/v1/categories/:id', async () => {
    it('Should return 200 with the category objects based on a user ID', async () => {
      const expectedUser = await database('users').first();
      const { id } = expectedUser;
      const expectedCategories = await database('categories').where('user_id', id);

      const response = await request(app).get(`/api/v1/categories/${id}`);
      const category = response.body[0];

      expect(response.status).toBe(200);
      expect(category.id).toEqual(expectedCategories[0].id)
    });

    it('Should return a 404 if no categories are found', async () => {
      const invalidUserId = 10;

      const response = await request(app).get(`/api/v1/categories/${invalidUserId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toEqual('You do not currently have any categories. Create some!');
    })
  });
})
