

const { Router } = require('express');


const router = Router();

const messageWebhook = require('./webhook');

// handle verification webhooks
// router.get('/', verifyWebhook);

// handle messages webhooks
router.post('/', messageWebhook);

module.exports = router;