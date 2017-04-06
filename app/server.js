'use strict';
const express = require('express');
const path = require('path');
const config = require('config');
// const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const helmet = require('helmet');
const csrf = require('csurf');
const i18n = require('i18n-2');

// local deps
const assets = require('./assets');
const index = require('./routes/index');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middleware
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// const csrfProtection = csrf({ cookie: true }); // use this to protect POST data with csrfToken: req.csrfToken()
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// internationalisation
i18n.expressBind(app, {
    locales: ['en', 'cy'],
    cookieName: 'locale',
    extension: '.json'
});

// set locale from cookie
app.use(function(req, res, next) {
    req.i18n.setLocaleFromCookie();
    next();
});


// configure security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", 'fonts.gstatic.com', 'code.ionicframework.com'],
            styleSrc: ["'self'", 'code.ionicframework.com', 'fonts.googleapis.com']
        }
    },
    dnsPrefetchControl: {
        allow: true
    },
    frameguard: {
        action: 'sameorigin'
    },
}));

// configure static files
app.locals.getCachebustedPath = assets.getCachebustedPath;
app.use('/' + assets.assetVirtualDir, express.static(path.join(__dirname, 'public'), {
    maxAge: config.get('staticExpiration')
}));

// extract deploy ID from AWS (where provided)
let deploymentData;
try {
    deploymentData = JSON.parse(fs.readFileSync(__dirname + '/config/deploy.json', 'utf8'));
} catch (e) {
    console.info('deploy.json not found -- are you in DEV mode?');
}
app.locals.deployId = (deploymentData && deploymentData.deploymentId) ? deploymentData.deploymentId : 'DEV';


// route binder
app.use('/', index);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
