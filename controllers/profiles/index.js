'use strict';
const express = require('express');
const path = require('path');

const { injectProfiles } = require('../../middleware/inject-content');

module.exports = function({ profilesSection }) {
    const router = express.Router();

    router.get('/', injectProfiles(profilesSection), (req, res) => {
        const profiles = res.locals.profiles;
        if (profiles.length > 0) {
            res.render(path.resolve(__dirname, './views/profiles'), { profiles });
        } else {
            throw new Error('NoProfiles');
        }
    });

    return router;
};