'use strict';
const path = require('path');
const express = require('express');

const {
    injectHeroImage,
    injectListingContent,
} = require('../../common/inject-content');
const { flexibleContentPage } = require('../common');

const router = express.Router();

/**
 * Landing page
 */
router.get('/', injectHeroImage('funding-letterbox-new'), async function (
    req,
    res
) {
    res.render(path.resolve(__dirname, './landing'), {
        title: req.i18n.__('toplevel.funding.title'),
    });
});

/**
 * Programmes router
 * - Programme listings
 * - Programme detail pages
 * - Archived programmes
 */
router.use('/programmes', require('./programmes'));

/**
 * Strategic investments router
 */
router.use('/strategic-investments', require('./strategic-investments'));

/**
 * Publications router
 */
router.use('/publications', require('./publications'));

/**
 * Past grants router
 */
router.use('/grants', require('./grants'));

/**
 * Custom override: Free materials
 * Allows us to customise the free materials page with an order form,
 * whilst keeping introductory content in the CMS
 */
router.use(
    '/managing-your-grant/promoting-your-project/order-free-materials',
    require('./materials')
);

/**
 * Custom override: Logos
 * Allows us to customise the logos page with a download UI,
 * whilst keeping introductory content in the CMS
 */
router.get(
    '/managing-your-grant/promoting-your-project/download-our-logo',
    injectListingContent,
    function (req, res) {
        res.render(path.resolve(__dirname, './logos'));
    }
);

router.get('/covid-19', (req, res, next) => {
    res.locals.showCOVID19AnnouncementBanner = false;
    next();
});

router.get('/wales', (req, res, next) => {
    res.locals.showBilingualLogo = true;
    next();
});

/**
 * Wildcard handler
 * Remaining pages powered by Funding structure in the CMS
 */
router.use('/*', flexibleContentPage());

module.exports = router;
