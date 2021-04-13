'use strict';

// requireing the environment variables
require('dotenv').config();

// Require express to run server and routes
const express = require('express');
const cors = require('cors');
const app = express();

// require postegrues
const pg = require('pg');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

//Require Superagent with HTTP requests
const superagent = require('superagent');

// Cors for cross origin allowance
app.use(cors());

//Intilize the main project folder
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Server Setup
const PORT = process.env.PORT || 5000;
app.use(express.urlencoded({ extended: true }));

//Root Route
app.get('/', rootRouteHndler);
// proof of life route
app.get('/hello', proofOfLifeHandler);
// search new book route
app.get('/searches/new', searchRouteHndler);
// search functionality route
app.post('/searches', formRouteHandler);
// error route handler
app.get('*', erroRouteHandler);

function listening() {
  console.log('app is running');
  console.log(`app is listen at http://localhost:${PORT}`);
}
function rootRouteHndler(req, res) {
  let SQL = 'SELECT * FROM books';
  client.query(SQL).then(data => {
    console.log(data.rows);
    res.render('pages/index', {
      booksData: data.rows,
      length: data.rows.slice(-1)[0].id,
    });
  });
}
function proofOfLifeHandler(req, res) {
  res.render('pages/proof');
}
function searchRouteHndler(req, res) {
  res.render('pages/new');
}
function formRouteHandler(req, res) {
  let query = req.body.query;
  let type = req.body.type;
  console.log(type, query);

  let URL = `https://www.googleapis.com/books/v1/volumes?q=+${type}:${query}&maxResults=10`;
  superagent
    .get(URL)
    .then(booksData => {
      let books = booksData.body.items.map(item => new Book(item));
      res.render('pages/searches/show', { bookArray: books });
    })
    .catch(err => console.log(err));
}

function Book(booksData) {
  this.img = booksData.volumeInfo.imageLinks
    ? booksData.volumeInfo.imageLinks.thumbnail
    : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = booksData.volumeInfo.title
    ? booksData.volumeInfo.title
    : 'Dummy Title';
  this.author = booksData.volumeInfo.authors
    ? booksData.volumeInfo.authors[0]
    : 'Dummy Author';
  this.desc = booksData.volumeInfo.description
    ? booksData.volumeInfo.description
    : 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Similique laboriosam optio sunt eius. Expedita commodi iure, quasi enim labore vitae corrupti dolore vel voluptas, deleniti in, ipsum sint illum voluptate.';
}
function erroRouteHandler(req, res) {
  res.render('pages/error');
}

client.connect().then(() => {
  app.listen(PORT, listening);
});
