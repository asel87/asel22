const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { Pool } = require('pg');
const path = require('path');

const app = express();

const port = 3000;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'asel3127',
  port: 5433,
});


function checkUserRole(req, res, next) {
  const userRole = req.user.role;

  if (userRole === 'user') {
    res.redirect('/user.html');
  } else if (userRole === 'admin') {
    res.redirect('/admin.html');
  } else if (userRole === 'moderator') {
    res.redirect('/moderator.html');
  } else {
    res.status(403).send('Unauthorized');
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/api/auth/signin', async (req, res, next) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = $1';
  const values = [username];

  try {
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      req.user = user;
      checkUserRole(req, res, next); 
    } else {
      return res.status(401).send('Invalid password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error login user');
  }
});

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query =
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [username, email, hashedPassword, role];

    const result = await pool.query(query, values);

    req.user = result.rows[0];
    next();

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).send('Error registering user');
  }
});

app.get('/api/getGoogleMapsApiKey', (req, res) => {
  const googleMapsApiKey = 'AIzaSyARevZwHywd2XBgjYkJrx7m67kZq4hk1k8'; 
  res.json({ googleMapsApiKey });
});

app.get('/api/getCurrencyExchangeRate', async (req, res) => {
  const exchangeRateApiKey = '2b389d642078fc07da894345'; 

  try {
    const exchangeRateResponse = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);

    if (exchangeRateResponse.data.rates) {
      res.json({ exchangeRates: exchangeRateResponse.data.rates });
    } else {
      console.error('Error fetching exchange rates:', exchangeRateResponse.data.error);
      res.status(500).json({ error: 'Error fetching exchange rates', detailedError: exchangeRateResponse.data.error });
    }
  } catch (error) {
    console.error('Exchange Rate API error:', error.message);
    res.status(500).json({ error: 'Error fetching exchange rates', detailedError: error.message });
  }
});

app.get('/api/getNews', async (req, res) => {
  const newsApiKey = '1cb46d4658594c3d9dbc19f2cfd5a144'; 

  try {
    const newsResponse = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsApiKey}`);

    if (newsResponse.data.articles) {
      res.json({ news: newsResponse.data.articles });
    } else {
      console.error('Error fetching news:', newsResponse.data.message);
      res.status(500).json({ error: 'Error fetching news', detailedError: newsResponse.data.message });
    }
  } catch (error) {
    console.error('News API error:', error.message);
    res.status(500).json({ error: 'Error fetching news', detailedError: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  
  

    
    res.redirect('/login'); 
  });

app.post('/api/admin/adduser', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Received signup data:', { username, email, password, role });

    const query =
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [username, email, hashedPassword, role];

    const result = await pool.query(query, values);

    res.status(200).json({ message: 'User added successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

app.delete('/api/admin/deleteuser', async (req, res) => {
  try {
    const { userIdToDelete } = req.body;

    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const values = [userIdToDelete];

    const result = await pool.query(query, values);

    res.status(200).json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/user.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'user.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/moderator.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'moderator.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
