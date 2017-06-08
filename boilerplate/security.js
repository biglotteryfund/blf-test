'use strict';
const app = require('../server');
const helmet = require('helmet');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", 'fonts.gstatic.com', 'ajax.googleapis.com', 'www.google-analytics.com', 'www.google.com', 'maxcdn.bootstrapcdn.com'],
            frameSrc: ["'self'", 'www.google.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'maxcdn.bootstrapcdn.com'],
            connectSrc: ["'self'", 'ws://127.0.0.1:35729/livereload'], // make dev-only?,
            imgSrc: ["'self'", 'www.google-analytics.com'],
            scriptSrc: ["'self'", "'unsafe-eval'", 'ajax.googleapis.com', 'www.google-analytics.com', 'maxcdn.bootstrapcdn.com']
        }
    },
    dnsPrefetchControl: {
        allow: true
    },
    frameguard: {
        action: 'sameorigin'
    },
}));

module.exports = {
    csrfProtection: csrfProtection
}