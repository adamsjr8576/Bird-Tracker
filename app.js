const express = require('express');
const app = express();

const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.locals.title = 'Bird Tracker';
app.use(express.json());


app.get('/', (request, response) => {
  response.send('Reached Bird Tracker');
});

app.get('/api/v1/users/:username/:password', async (request, response) => {
  const { username, password } = request.params;

  try {
    const user = await database('users').where('username', username).select();

    if (!user.length) {
      return response.status(404).json({ error: `username: ${username} does not exist. Please try a different username or create an account` })
    }

    if (user[0].password !== password) {
      return response.status(404).json({ error: `The password entered is incorrect. Please try again.`})
    }

    const userToSend = [{ id: user[0].id, username: user[0].username, city: user[0].city, state: user[0].state}]

    return response.status(200).json(userToSend);
  } catch {
    return response.status(500).json({ error });
  }
})


module.exports = app;
