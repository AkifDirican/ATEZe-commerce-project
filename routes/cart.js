var express = require('express');
const verifyAuth = require('./auth');
var router = express.Router();
const {db} = require('../db/knex.db');


// Add a product to the cart
router.post('/add', verifyAuth, async function (req, res, next) {
    const { cartId, productId, quantity } = req.body;
    const email = req.user.email;

    const user_id = await db('users').select('id').where('email', email).first();
    const int_userId = user_id.id;


    if (!cartId || !productId || !quantity) {
        return res.status(400).send({
            message: 'Cart ID, Product ID and quantity are required'
        });
    }

    try {
        // Check if the product already exists in the cart
        const existingItem = await db('cart').where({ cart_id: cartId, product_id: productId }).first();

        if (existingItem) {
            // Update the quantity if the product already exists in the cart
            await db('cart').where({ cart_id: cartId, product_id: productId }).update({
                quantity: existingItem.quantity + quantity
            });
        }

        else {
            // Add the product to the cart if it doesn't exist
            await db('cart').insert({
                cart_id: cartId,
                user_id: int_userId,
                product_id: productId,
                quantity
            });
        }

        return res.status(201).send({
            message: 'Product added to cart successfully'
        });

    } catch (error) {
        return res.status(500).send({
            message: 'An error occurred while adding the product to the cart',
            error: error.message
        });
    }
});

// Delete product from the cart
router.delete('/delete', verifyAuth, async function (req, res, next) {
    const { cartId, productId, quantity } = req.body;
    const email = req.user.email;

    const user_id = await db('users').select('id').where('email', email).first();
    const int_userId = user_id.id;


    if (!cartId || !productId || quantity === undefined) {
        return res.status(400).send({
            message: 'Cart ID, Product ID and quantity are required'
        });
    }

    try {
        // Fetch the current quantity of the product in the cart
        const cartItem = await db('cart').where({ user_id: int_userId, product_id: productId }).first();

        if (!cartItem) {
            return res.status(404).send({
                message: 'Product not found in the cart'
            });
        }

        if (cartItem.quantity <= quantity) {
            // Remove the product from the cart if the quantity to remove is greater than or equal to the current quantity
            await db('cart').where({ user_id: int_userId, product_id: productId }).del();
            return res.status(200).send({
                message: 'Product deleted from cart successfully'
            });
        } else {
            // Decrease the quantity of the product in the cart
            await db('cart').where({ user_id: int_userId, product_id: productId }).update({
                quantity: cartItem.quantity - quantity
            });
            return res.status(200).send({
                message: 'Product quantity decreased successfully'
            });
        }
    } catch (error) {
        return res.status(500).send({
            message: 'An error occurred while deleting the product from the cart',
            error: error.message
        });
    }
});

// List all products in a specific cart
router.get('/list/:cartId', verifyAuth, async function (req, res, next) {
    const cartId = req.params.cartId;

    try {
        const cartItems = await db('cart')
            .join('products', 'cart.product_id', '=', 'products.id')
            .select('products.id', 'products.name', 'products.description', 'products.price', 'cart.quantity')
            .where('cart.cart_id', cartId);

        if (cartItems.length === 0) {
            return res.status(404).send({
                message: 'No products found in the cart'
            });
        }

        return res.status(200).json(cartItems);
    } catch (error) {
        return res.status(500).send({
            message: 'An error occurred while retrieving the cart items',
            error: error.message
        });
    }
});

// List all products in all carts for a specific user
router.get('/list/user/:userId', verifyAuth, async function (req, res, next) {
    const userId = req.params.userId;

    try {
        const cartItems = await db('cart')
            .join('products', 'cart.product_id', '=', 'products.id')
            .select('cart.cart_id', 'products.id', 'products.name', 'products.description', 'products.price', 'cart.quantity')
            .where('cart.user_id', userId);

        if (cartItems.length === 0) {
            return res.status(404).send({
                message: 'No products found for the user in any cart'
            });
        }

        return res.status(200).json(cartItems);
    } catch (error) {
        return res.status(500).send({
            message: 'An error occurred while retrieving the cart items for the user',
            error: error.message
        });
    }
});

module.exports = router;