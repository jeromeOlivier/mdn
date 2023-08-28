const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => res.send('respond with a resource'));
router.get('/my-page', (req, res, next) => res.render('my-page', {title: 'My Page'}))

module.exports = router;
