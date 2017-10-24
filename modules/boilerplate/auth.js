'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const models = require('../../models');

passport.use(
    new LocalStrategy((username, password, done) => {
        models.Users
            .findOne({ where: { username: username } })
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'User not found.' });
                }
                if (!user.isValidPassword(user.password, password)) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            })
            .catch(err => {
                return done(err);
            });
    })
);

passport.serializeUser((user, cb) => {
    cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
    models.Users
        .findById(id)
        .then(user => {
            cb(null, user);
        })
        .catch(err => {
            return cb(err);
        });
});
