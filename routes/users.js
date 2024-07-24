var express = require('express');
const {db} = require('../db/knex.db');
const bcrypt = require('bcryptjs');
const verifyAuth = require('./auth');
const jwt = require('jsonwebtoken');
var router = express.Router();

/* GET all users listing */
router.get('/list', verifyAuth, async function(req, res, next) {
  const usersData = await db('users').select('*');
  res.json(usersData);
});


/* GET the user with the specific id */
router.get('/list/:id', verifyAuth, async function(req, res, next) {
  const userId = req.params.id;

  try {
    // Fetch the user by ID from the database
    const user = await db('users').select('*').where('id', userId).first();

    // Check if the user exists
    if (!user) {
      return res.status(404).send({
        message: 'User not found'
      });
    }

    // Verify if the email in the token matches the email in the database
    if (user.email !== req.user.email) {
      return res.status(401).send({
        message: 'Unauthorized: Token does not match the email in the database'
      });
    }

    // If everything is fine, send the user data
    res.status(200).json(user);

  } catch (error) {
    return res.status(500).send({
      message: 'An error occurred while retrieving the user',
      error: error.message
    });
  }
});


//The user (with the specific id) can delete its own self from the dataset
router.delete('/delete/:id', verifyAuth, async (req, res, next) => {
  const userId = req.params.id;

  try {
    const user = await db('users').select('*').where('id', userId).first();
    if (!user) {
      return res.status(400).send({
        message: 'There is no user with the given id'
      });
    }

    if (user.email !== req.user.email) {
      return res.status(400).send({
        message: 'You are not authorized to delete this account'
      });
    }

    await db('users').where('id', userId).del();

    return res.status(200).send({
      message: 'Your account has been deleted successfully'
    });
  } catch (error) {
    return res.status(500).send({
      message: 'An error occurred while deleting the account'
    });
  }
});

// Sign up
router.post('/signup', async function(req, res) {
  const { username, password, name, surname, email, userType } = req.body;

  // userType = user | company

  if (!email && !password) {
    return res.status(400).send({
      message: 'email or password missing',
    });
  };

  const user = await db('users').select('*').where('email', email).first();

  if (user) {
    return res.status(400).send({
      message: 'you are already have an account'
    })
  };

  const cryptedPassword = await bcrypt.hash(password, 8);

  await db('users').insert(
    { username, password: cryptedPassword, name, surname, email, userType }
  )

  return res.status(201).send({
    message: 'user has successfully created',
  })
});


// Log in
router.post('/login', async function(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      message: 'email or password is missing'
    })
  };

  const user = await db('users').select('*').where('email', email).first();

  if (!user) {
    return res.status(400).send({
      message: 'There is no account with given email'
    })
  };

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status.send('email or password is wrong')
  }

  const token = jwt.sign({ email: email }, process.env.SECRET_KEY);

  return res.status(200).send({
    message: 'successfully logged in',
    token
  });
})


module.exports = router;