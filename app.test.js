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
    })
  })
})
