'use strict';

// requireing the environment variables
require('dotenv').config();

// Require express to run server and routes
const express = require('express');
const cors = require('cors');
const app = express();
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

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
// books route handler
app.post('/books', bookRouteHandler);
// update deatails route handler
app.put('/updateBook/:id', updateBookHndler);
// details route handler
app.get('/books/:id', detailsRouteHandler);
//back router handler
app.get('/back', backRouteHandler);
// delete book route handler
app.delete('/bookDelete/:id', bookDeleteHandler);

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
      length: data.rowCount,
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
  this.image_url = booksData.volumeInfo.imageLinks
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
  this.isbn = booksData.volumeInfo.industryIdentifiers
    ? booksData.volumeInfo.industryIdentifiers.identifier
    : 'NaN';
}
function detailsRouteHandler(req, res) {
  let SQL = `SELECT * FROM books WHERE id=$1;`;

  let safeValues = [req.params.id];
  client.query(SQL, safeValues).then(item => {
    console.log('returned from db', item.rows[0]);
    res.render('pages/book/show', { dbData: item.rows[0] });
  });
}
function backRouteHandler(req, res) {
  res.redirect('/');
}
function bookRouteHandler(req, res) {
  let { author, title, isbn, image_url, description } = req.body;
  let SQL = `INSERT INTO books (author, title, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  let safeValues = [author, title, isbn, image_url, description];
  client.query(SQL, safeValues).then(item => {
    res.redirect(`/books/${item.rows[0].id}`);
  });
}
function updateBookHndler(req, res) {
  let { author, title, isbn, image_url, description } = req.body;
  let id = req.params.id;
  let SQL = `UPDATE books SET author=$1, title=$2, isbn=$3, image_url=$4, description=$5 WHERE id=$6`;
  let safeValues = [author, title, isbn, image_url, description, id];
  client.query(SQL, safeValues).then(() => {
    res.redirect(`/books/${id}`);
  });
}

function bookDeleteHandler(req, res) {
  let SQL = `DELETE FROM books where id=$1`;
  let safeValues = [req.params.id];
  client.query(SQL, safeValues).then(() => {
    res.redirect('/');
  });
}

function erroRouteHandler(req, res) {
  res.render('pages/error');
}

client.connect().then(() => {
  app.listen(PORT, listening);
});
