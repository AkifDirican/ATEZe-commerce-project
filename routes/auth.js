const jwt = require('jsonwebtoken');

function verifyAuth(req, res, next) {
    const token = req.header('Authorization').replace('Bearer ', '');

    if (!token) {
        res.status(401).send({
            message: 'Access denied, No token provided'
        })
    };

    try {
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        // { username: 'ahmetuzgor' , email: 'ahmetuzgor@gmail.com' }
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(400).send('Invalid token')
    }
}

module.exports = verifyAuth;