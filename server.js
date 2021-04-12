'use strict';

// requireing the environment variables
require('dotenv').config();

// Require express to run server and routes
const express = require('express');
const cors = require('cors');
const app = express();

// Cors for cross origin allowance
app.use(cors());

//Intilize the main project folder
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Server Setup
const PORT = process.env.PORT || 5000;

//Root Route
app.get('/', rootRouteHndler);
// proof of life route
app.get('/hello', proofOfLifeHandler);
// search route
app.get('/searches/new', searchRouteHndler);

function listening() {
  console.log('app is running');
  console.log(`app is listen at http://localhost:${PORT}`);
}
function rootRouteHndler(req, res) {
  res.render('pages/index');
}
function proofOfLifeHandler(req, res) {
  res.render('pages/proof');
}
function searchRouteHndler(req, res) {
  res.render('pages/new');
}

app.listen(PORT, listening);
