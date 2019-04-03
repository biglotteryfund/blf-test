'use strict';
const path = require('path');
const express = require('express');

const { injectHeroImage } = require('../../middleware/inject-content');
const { sMaxAge } = require('../../middleware/cached');
const contentApi = require('../../services/content-api');

const router = express.Router();

router.get('/', sMaxAge('30m'), injectHeroImage('funding-letterbox-new'), async (req, res) => {
    let latestProgrammes = [];
    try {
        const fundingProgrammes = await contentApi.getFundingProgrammes({
            locale: req.i18n.getLocale(),
            pageLimit: 3,
            newestFirst: true
        });
        latestProgrammes = fundingProgrammes.result ? fundingProgrammes.result : null;
    } catch (error) {} // eslint-disable-line no-empty

    res.render(path.resolve(__dirname, './views/funding-landing'), { latestProgrammes });
});

module.exports = router;
