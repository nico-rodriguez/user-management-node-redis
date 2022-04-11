const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const methodOverride = require('method-override');
const redis = require('redis');
const { redirect } = require('express/lib/response');

// Create Redis client
const redisClient = redis.createClient();
redisClient.connect();
redisClient.on('connect', () => {
  console.log('Connected to Redis!');
});

// Set backend port
const port = 3000;

// Init app
const app = express();

// View engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Method override: override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

// Search page
app.get('/', (req, res) => {
  res.render('searchUsers');
});

// Process search
app.post('/users/search', async (req, res, next) => {
  const { id } = req.body;

  try {
    const user = await redisClient.hGetAll(id);

    if (!user || Object.keys(user).length === 0) {
      res.render('searchUsers', {
        error: 'user does not exists',
      });
    } else {
      user.id = id;
      res.render('details', { user });
    }
  } catch (error) {}
});

// Add user page
app.get('/users/add', (req, res) => {
  res.render('addUser');
});

// Process add user
app.post('/users/add', async (req, res, next) => {
  const { id, first_name, last_name, email, phone } = req.body;

  try {
    const user = await redisClient.sendCommand([
      'HMSET',
      id,
      'first_name',
      first_name,
      'last_name',
      last_name,
      'email',
      email,
      'phone',
      phone,
    ]);

    console.log(user);
    res.redirect('/');
  } catch (error) {
    console.error(error);
  }
});

// Delete user
app.delete('/users/delete/:id', (req, res, next) => {
  const { id } = req.params;

  try {
    redisClient.del(id);
    res.redirect('/');
  } catch (error) {
    console.error(error);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
