require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const fs = require('fs');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

/*-----------------------------------------------------------------------------------------*/
/*--------------------------------------- MY CODE -----------------------------------------*/
/*-----------------------------------------------------------------------------------------*/

// Function to manage local file storage (data.json)
function dataManagement(action, input) {
  let filePath = './public/data.json';

  // Ensure file exists and initialize if empty
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath).length === 0) {
    fs.writeFileSync(filePath, '[]'); // Empty JSON array
  }

  let file = fs.readFileSync(filePath, 'utf-8');
  let data = file.length ? JSON.parse(file) : [];

  if (action === 'save data' && input) {
    if (!data.some(d => d.original_url === input.original_url)) {
      data.push(input);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
  } else if (action === 'load data') {
    return data;
  }
}

// Function to generate a unique short_url
function gen_shorturl() {
  let all_Data = dataManagement('load data') || [];
  let short;
  do {
    short = Math.ceil(Math.random() * 1000);
  } while (all_Data.some(d => d.short_url === short));
  return short;
}

// Middleware to handle user URL input
app.post('/api/shorturl', (req, res) => {
  let input = req.body.url;
  if (!input) return res.json({ error: 'invalid url' });

  try {
    new URL(input); // If invalid, it will throw an error
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  let domain = input.replace(/^https?:\/\//, '').split('/')[0];

  dns.lookup(domain, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    } else {
      let short = gen_shorturl();
      let dict = { original_url: input, short_url: short };
      dataManagement('save data', dict);
      return res.json(dict);
    }
  });
});

// Middleware to handle existing short URLs
app.get('/api/shorturl/:shorturl', (req, res) => {
  let input = Number(req.params.shorturl);
  let all_Data = dataManagement('load data');

  let data_found = all_Data.find(d => d.short_url === input);
  if (data_found) {
    res.redirect(data_found.original_url);
  } else {
    res.json({ error: 'No matching data' });
  }
});

/*=========================================================================================*/

// Test API Endpoint
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// Start Server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
 