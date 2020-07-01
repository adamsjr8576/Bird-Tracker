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


module.exports = app;
