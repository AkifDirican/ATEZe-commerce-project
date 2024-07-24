var express = require('express');
const verifyAuth = require('./auth');
var router = express.Router();
const {db} = require('../db/knex.db');

//Add new product
router.post('/add', verifyAuth, async function (req, res, next) {
    const { name, description, price } = req.body;

    if (!name || !description || !price) {
        return res.status(400).send({
        message: 'Name, description, and price are required'
        });
    }

    const user = await db('users').select('*').where('email', req.user.email).first();

    if (user.userType !== 'company') {
        return res.status(403).send({
          message: 'Only company users can add products'
        });
    }
    
    try {
        const newProduct = {
          name,
          description,
          price
        };
    
        await db('products').insert(newProduct);
    
        return res.status(201).send({
          message: 'Product added successfully',
          product: newProduct
        });
      } catch (error) {
        return res.status(500).send({
          message: 'An error occurred while adding the product',
          error: error.message
        });
      }
    });

//Update the name, desc, or price of a product
router.patch('/update/:id', verifyAuth, async function (req, res, next) {
    const { name, description, price } = req.body;
    const email = req.user.email;
    const productId = req.params.id;

    // Validate input data
    if (!name && !description && !price) {
        return res.status(400).send({
        message: 'At least one of name, description, or price must be provided'
        });
    }

    const user = await db('users').select('*').where('email', email).first();
    if (!user) {
        return res.status(400).send('There is no such a user');
    }

    if (user.userType !== 'company') {
        return res.status(400).send({
            message: 'Users cannot update product',
            user
        });
    }

    try {
        // Fetch the product to ensure it exists
        const product = await db('products').select('*').where('id', productId).first();
        if (!product) {
          return res.status(404).send({
            message: 'Product not found'
          });
        }
    
        // Create an object with the fields to update
        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (price) updateData.price = price;
    
        // Update the product in the database
        await db('products').where('id', productId).update(updateData);
    
        return res.status(200).send({
          message: 'Product updated successfully',
          updatedProduct: { id: productId, ...updateData }
        });
      } catch (error) {
        return res.status(500).send({
          message: 'An error occurred while updating the product',
          error: error.message
        });
      }
    });

//delete a product
router.delete('/delete/:id', verifyAuth, async (req, res, next) => {
    const productId = req.params.id;
    const email = req.user.email;

    const user = await db('users').select('*').where('email', email).first();
    if (!user) {
        return res.status(400).send('There is no such a user');
    }

    if (user.userType !== 'company') {
        return res.status(403).send({
            message: 'Only company users can delete products'
        });
    }


    try {
        const product = await db('products').select('*').where('id', productId).first();
        if (!product) {
            return res.status(404).send({
                message: 'There is no product with the given id'
            });
        }

        await db('products').where('id', productId).del();

        return res.status(200).send({
            message: 'Product has been deleted successfully'
        });

    } catch (error) {
        return res.status(500).send({
            message: 'An error occurred while deleting the product'
        });
    }
});

// GET all products
router.get('/list', verifyAuth, async function(req, res, next) {
    const allProducts = await db('products').select('*');
    res.json(allProducts);
  });
  
  
// GET the product with the specific id
router.get('/list/:id', verifyAuth, async function(req, res, next) {
    const productId = req.params.id;
  
    try {
      // Fetch the product by ID from the database
      const product = await db('products').select('*').where('id', productId).first();
  
      // Check if the product exists
      if (!product) {
        return res.status(404).send({
          message: 'Product not found'
        });
      }
  
      // If everything is fine, send the user data
      res.status(200).json(product);
  
    } catch (error) {
      return res.status(500).send({
        message: 'An error occurred while retrieving the product',
        error: error.message
      });
    }
  });

// search for the similar products
router.get('/search/:id', verifyAuth, async function(req, res, next) {
    const searchParam = req.params.id;

    if (!searchParam) {
        return res.status(400).send({
            message: 'Search parameter is required'
        });
    }
  
    try {
      // Fetch the product with 'like'
      const products = await db('products').select('*').where('name', 'like', `%${searchParam}%`).orWhere('description', 'like', `%${searchParam}%`);
  
      if (products.length === 0) {
        return res.status(404).send({
            message: 'No products found matching the given name'
        });
    }

        return res.status(200).json(products);
  
    } catch (error) {
      return res.status(500).send({
        message: 'An error occurred while searching for products',
        error: error.message
      });
    }
  });



module.exports = router;