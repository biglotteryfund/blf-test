'use strict';
const express = require('express');
const router = express.Router();

const routeStatic = require('../utils/routeStatic');
const addSection = require('../../middleware/addSection');
const { redirectArchived } = require('../../modules/legacy');
const { noCache } = require('../../middleware/cached');
const ebulletinRoute = require('./ebulletin');

module.exports = (pages, sectionPath, sectionId) => {
    router.use(addSection(sectionId));

    /**
     * 10 BLF Facts (Archived)
     */
    router.get(pages.tenFacts.path, noCache, redirectArchived);

    ebulletinRoute.init({
        router: router,
        routeConfig: pages.ebulletin,
        sectionPath: sectionPath
    });

    /**
     * Populate static pages
     * Must come last to allow custom routes to take precedence over wildcards
     */
    routeStatic.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });

    return router;
};
