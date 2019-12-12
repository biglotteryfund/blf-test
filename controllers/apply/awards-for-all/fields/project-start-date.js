'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const DateField = require('../../lib/field-types/date');

const { MIN_START_DATE } = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);

    const minDate = moment().add(MIN_START_DATE.amount, MIN_START_DATE.unit);

    const minDateExample = minDate
        .clone()
        .locale(locale)
        .format('DD MM YYYY');

    return new DateField({
        name: 'projectStartDate',

        label: localise({
            en: `When would you like to start your project?`,
            cy: `Pryd hoffech ddechrau eich prosiect?`
        }),
        explanation: localise({
            en: oneLine`Don't worry, this can be an estimate.
                But your project must start after
                <strong>${minDateExample}.</strong>`,
            cy: oneLine`Peidiwch a poeni, gall hwn fod yn amcangyfrif.
                Ond mae angen i’ch prosiect ddechrau ar ôl
                <strong>${minDateExample}.</strong>`
        }),
        settings: {
            minYear: minDate.format('YYYY')
        },
        schema: Joi.dateParts()
            .minDate(minDate.format('YYYY-MM-DD'))
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: `Enter a project start date`,
                    cy: `Cofnodwch ddyddiad dechrau i’ch prosiect`
                })
            },
            {
                type: 'dateParts.minDate',
                message: localise({
                    en: oneLine`Date you start the project must be on or after
                        ${minDateExample}`,
                    cy: oneLine`Mae’n rhaid i ddyddiad dechrau eich prosiect
                        fod ar neu ar ôl ${minDateExample}`
                })
            }
        ]
    });
};