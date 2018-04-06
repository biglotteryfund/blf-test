'use strict';
const express = require('express');
const uuidv4 = require('uuid/v4');

const { renderError } = require('../http-errors');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const materials = require('../../config/content/materials.json');
const orderService = require('../../services/orders');
const routeHelpers = require('../route-helpers');
const surveysService = require('../../services/surveys');
const userService = require('../../services/user');

const router = express.Router();

router.use(toolsSecurityHeaders());

router.get('/status/pages', async (req, res) => {
    try {
        const canonicalRoutes = await routeHelpers.getCanonicalRoutes({ includeDraft: true });
        const redirectRoutes = await routeHelpers.getCombinedRedirects({ includeDraft: true });
        const vanityRoutes = await routeHelpers.getVanityRedirects();

        const countRoutes = routeList => routeList.filter(route => route.live === true).length;

        const totals = {
            canonical: countRoutes(canonicalRoutes),
            redirects: countRoutes(redirectRoutes),
            vanity: countRoutes(vanityRoutes)
        };

        res.render('pages/tools/pagelist', {
            totals,
            canonicalRoutes,
            redirectRoutes,
            vanityRoutes
        });
    } catch (err) {
        renderError(err);
    }
});

const requiredAuthed = auth.requireAuthedLevel(5);

router.route('/tools/survey-results').get(cached.noCache, requiredAuthed, toolsSecurityHeaders(), (req, res) => {
    surveysService
        .findAll()
        .then(surveys => {
            res.render('pages/tools/surveys', {
                surveys: surveys
            });
        })
        .catch(err => {
            res.send(err);
        });
});

router.route('/tools/order-stats').get(cached.noCache, requiredAuthed, toolsSecurityHeaders(), (req, res) => {
    orderService
        .getAllOrders()
        .then(orderData => {
            let items = materials.items;
            res.locals.findItemByCode = code => items.find(i => i.products.some(p => p.code === code));

            res.render('pages/tools/orders', {
                data: orderData,
                materials: materials
            });
        })
        .catch(err => {
            res.send(err);
        });
});

if (process.env.USE_LOCAL_DATABASE) {
    router.get('/tools/seed/user', (req, res) => {
        const uuid = uuidv4();
        const newUser = {
            username: `${uuid}@example.com`,
            password: uuid,
            level: 5
        };

        userService.createUser(newUser).then(() => {
            res.json(newUser);
        });
    });
}

module.exports = router;
