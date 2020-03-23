'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment-timezone');

const { Feedback } = require('../../db/models');
const { sanitise } = require('../../common/sanitise');
const { parse } = require('json2csv');

const router = express.Router();

async function render(req, res) {
    const title = 'Feedback results';
    const feedback = await Feedback.findAllGroupedByDescription();

    res.render(path.resolve(__dirname, './views/feedback'), {
        title: title,
        breadcrumbs: res.locals.breadcrumbs.concat({ label: title }),
        feedback,
    });
}

async function renderDownload(req, res, next) {
    const feedback = await Feedback.findAllForDescription(
        sanitise(req.query.download)
    );

    if (feedback.length > 0) {
        const preparedResults = feedback.map((item) => {
            return {
                'Date': item.createdAt.toISOString(),
                'Date description': moment(item.createdAt)
                    .tz('Europe/London')
                    .format('D MMMM, YYYY h:ma'),
                'Message': item.message,
            };
        });

        res.attachment(`${req.query.download}.csv`).send(
            parse(preparedResults)
        );
    } else {
        next();
    }
}

router.get('/', async function (req, res, next) {
    if (req.query.download) {
        try {
            await renderDownload(req, res, next);
        } catch (error) {
            next(error);
        }
    } else {
        try {
            await render(req, res, next);
        } catch (error) {
            next(error);
        }
    }
});

module.exports = router;
