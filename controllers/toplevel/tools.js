'use strict';
const express = require('express');
const moment = require('moment');
const { concat, compact, filter, flatMap, map, pick, sortBy } = require('lodash');

const routes = require('../routes');
const appData = require('../../modules/appData');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const surveysService = require('../../services/surveys');
const contentApi = require('../../services/content-api');

const router = express.Router();

// status page used by load balancer
const LAUNCH_DATE = moment();
router.get('/status', cached.noCache, (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json');

    res.send({
        APP_ENV: appData.environment,
        DEPLOY_ID: appData.deployId,
        COMMIT_ID: appData.commitId,
        BUILD_NUMBER: appData.buildNumber,
        START_DATE: LAUNCH_DATE.format('dddd, MMMM Do YYYY, h:mm:ss a'),
        UPTIME: LAUNCH_DATE.toNow(true)
    });
});

router.get('/status/pages', toolsSecurityHeaders(), (req, res) => {
    /**
     * Build a flat list of all canonical application routes
     */
    const routerCanonicalUrls = flatMap(routes.sections, section => {
        const withoutWildcards = filter(section.pages, _ => _.path.indexOf('*') === -1);
        return map(withoutWildcards, (page, key) => {
            return {
                title: key,
                path: section.path + page.path,
                live: page.live
            };
        });
    });

    /**
     * Build a flat list of all all canonical redirects
     * Concatenate all legacy redirects + any page aliases
     */
    const customRedirects = routes.legacyRedirects.map(route => pick(route, ['path', 'destination', 'live']));
    const pageRedirects = compact(
        flatMap(routes.sections, section => {
            return flatMap(section.pages, page => {
                if (page.aliases && page.aliases.length > 0) {
                    return page.aliases.map(urlPath => {
                        return {
                            path: urlPath,
                            destination: section.path + page.path,
                            live: true
                        };
                    });
                }
            });
        })
    );

    const redirectRoutes = sortBy(concat(customRedirects, pageRedirects), 'destination');

    contentApi.getRoutes().then(cmsCanonicalUrls => {
        const allCanonicalRoutes = sortBy(concat(routerCanonicalUrls, cmsCanonicalUrls), 'path');

        const vanityRoutes = routes.vanityRedirects;

        const totals = {
            canonicalApp: routerCanonicalUrls.map(_ => _.live).length,
            canonicalCms: cmsCanonicalUrls.map(_ => _.live).length,
            vanity: vanityRoutes.map(_ => _.live).length,
            redirects: redirectRoutes.map(_ => _.live).length
        };

        const viewData = {
            totals,
            allCanonicalRoutes,
            vanityRoutes,
            redirectRoutes
        };

        res.render('pages/tools/pagelist', viewData);
    });
});

const requiredAuthed = auth.requireAuthedLevel(5);
router.route('/tools/survey-results/').get(cached.noCache, requiredAuthed, toolsSecurityHeaders(), (req, res) => {
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

module.exports = router;
