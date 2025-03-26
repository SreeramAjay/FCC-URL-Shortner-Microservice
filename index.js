require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let urlDatabase = []; // Stores original_url and short_url mappings in memory

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Generate a unique short URL
const generateShortUrl = () => {
  return Math.floor(Math.random() * 10000) + 1;
};

// POST: Create a short URL
app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  // Validate URL using the URL constructor
  let validUrl;
  try {
    validUrl = new URL(url);
    if (!validUrl.protocol.startsWith('http')) throw new Error();
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // Check if the URL is already stored
  const existingEntry = urlDatabase.find(entry => entry.original_url === url);
  if (existingEntry) {
    return res.json(existingEntry);
  }

  // Generate and store the new short URL
  const shortUrl = generateShortUrl();
  const newEntry = { original_url: url, short_url: shortUrl };
  urlDatabase.push(newEntry);

  res.json(newEntry);
});

// GET: Redirect to original URL
app.get('/api/shorturl/:shorturl', (req, res) => {
  const shortUrl = Number(req.params.shorturl);
  const entry = urlDatabase.find(entry => entry.short_url === shortUrl);

  if (!entry) {
    return res.json({ error: 'No matching data' });
  }

  res.redirect(entry.original_url);
});

// API Test Route
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// Start server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
