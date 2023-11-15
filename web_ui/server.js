const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.get('/health', function (req, res) {
  // Check the home page to see if the server is up
  axios.get(`http://127.0.0.1:8080`).then(response => {
    res.status(200).send('OK');
  }).catch(error => {
    console.error(error);
    res.status(500).send('Error');
  });
});

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080);

