'use strict';
const path = require('path');
const express = require('express');
const compact = require('lodash/compact');

const {
    injectListingContent,
    setCommonLocals,
} = require('../../../common/inject-content');
const { ContentApiClient } = require('../../../common/content-api');

const { renderFlexibleContentChild } = require('../../common');

const router = express.Router();
const ContentApi = new ContentApiClient();

router.use(function (req, res, next) {
    res.locals.breadcrumbs = res.locals.breadcrumbs.concat({
        label: req.i18n.__('funding.strategics.title'),
        url: req.baseUrl,
    });
    next();
});

router.get('/', injectListingContent, async function (req, res, next) {
    try {
        res.render(path.resolve(__dirname, './views/strategic-investments'), {
            strategicProgrammes: await ContentApi.init({
                flags: res.locals.cmsFlags,
            }).getStrategicProgrammes({
                locale: req.i18n.getLocale(),
                requestParams: req.query,
            }),
        });
    } catch (error) {
        if (error.response.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
});

router.get('/:slug/:child_slug?', async function (req, res, next) {
    try {
        const entry = await ContentApi.init({
            flags: res.locals.cmsFlags,
        }).getStrategicProgrammes({
            slug: compact([req.params.slug, req.params.child_slug]).join('/'),
            locale: req.i18n.getLocale(),
            requestParams: req.query,
        });

        setCommonLocals(req, res, entry);

        /**
         * Render a plain content page if specified,
         * otherwise render a standard Strategic page
         */
        if (entry && entry.entryType === 'contentPage') {
            renderFlexibleContentChild(req, res, entry);
        } else if (entry) {
            res.render(path.resolve(__dirname, './views/strategic-programme'), {
                strategicProgramme: entry,
                breadcrumbs: res.locals.breadcrumbs.concat({
                    label: res.locals.title,
                }),
            });
        } else {
            next();
        }
    } catch (error) {
        if (error.response.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
});

module.exports = router;
