'use strict';
const path = require('path');
const express = require('express');
const { body, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const { purify, errorTranslator } = require('../../modules/validators');
const cached = require('../../middleware/cached');
const newsletterService = require('../../services/newsletter-service');

const router = express.Router();

const translateError = errorTranslator('toplevel.ebulletin.errors');
const formValidators = [
    body('firstName')
        .exists()
        .not()
        .isEmpty()
        .withMessage(translateError('firstName')),
    body('lastName')
        .exists()
        .not()
        .isEmpty()
        .withMessage(translateError('lastName')),
    body('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage(translateError('emailMissing'))
        .isEmail()
        .withMessage(translateError('emailInvalid')),
    body('location')
        .exists()
        .withMessage(translateError('location'))
];

function subscribe(formData) {
    const subscriptionData = {
        email: formData.email,
        emailType: 'Html',
        dataFields: [
            { key: 'FIRSTNAME', value: formData.firstName },
            { key: 'LASTNAME', value: formData.lastName },
            { key: formData.location, value: 'yes' }
        ]
    };

    if (formData.organisation) {
        subscriptionData.dataFields.push({ key: 'ORGANISATION', value: formData.organisation });
    }

    return newsletterService.subscribe({
        addressBookId: '589755',
        subscriptionData: subscriptionData
    });
}

function renderForm(req, res) {
    res.render(path.resolve(__dirname, './views/ebulletin'));
}

router
    .route('/')
    .all(cached.noCache)
    .get(renderForm)
    .post(formValidators, purify, async (req, res) => {
        const formData = matchedData(req);
        const formErrors = validationResult(req);

        res.locals.data = formData;

        if (formErrors.isEmpty()) {
            try {
                await subscribe(formData);
                res.locals.status = 'SUCCESS';
                renderForm(req, res);
            } catch (error) {
                res.locals.status = 'ERROR';
                renderForm(req, res);
            }
        } else {
            res.locals.errors = formErrors.array();
            renderForm(req, res);
        }
    });

module.exports = router;
