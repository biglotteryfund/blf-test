'use strict';
const get = require('lodash/fp/get');
const sumBy = require('lodash/sumBy');
const toInteger = require('lodash/toInteger');

const awardsForAllFormBuilder = require('../awards-for-all/form');
const standardProposalFormBuilder = require('../standard-proposal/form');

const { findLocationName } = require('./location-options');
const { formatCurrency, formatDateRange } = require('./formatters');

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? standardProposalFormBuilder
        : awardsForAllFormBuilder;
}

function formatBudgetTotal(value) {
    const total = value ? sumBy(value, item => toInteger(item.cost) || 0) : 0;
    return `£${total.toLocaleString()}`;
}

function formatYears(value, locale) {
    const localise = get(locale);

    return `${value} ${localise({
        en: 'years',
        cy: 'blynedd'
    })}`;
}

function simpleOverview(data, locale) {
    const localise = get(locale);

    return [
        {
            label: localise({
                en: 'Project dates',
                cy: 'Dyddiadau’r prosiect'
            }),
            value: data.projectDateRange
                ? formatDateRange(locale)(data.projectDateRange)
                : null
        },
        {
            label: localise({ en: 'Location', cy: 'Lleoliad' }),
            value: findLocationName(data.projectLocation)
        },
        {
            label: localise({ en: 'Organisation', cy: 'Mudiad' }),
            value: data.organisationTradingName || data.organisationLegalName
        }
    ];
}

function standardOverview(data, locale) {
    const localise = get(locale);

    return [
        {
            label: localise({ en: 'Project length', cy: 'Hyd y prosiect' }),
            value: data.projectDurationYears
                ? formatYears(data.projectDurationYears, locale)
                : null
        },
        {
            label: localise({ en: 'Location', cy: 'Lleoliad' }),
            value: findLocationName(data.projectLocation)
        },
        {
            label: localise({ en: 'Organisation', cy: 'Mudiad' }),
            value: data.organisationTradingName || data.organisationLegalName
        }
    ];
}

function enrichPending(application, locale) {
    const data = application.applicationData || {};
    const formBuilder = formBuilderFor(application.formId);
    const form = formBuilder({ locale, data });
    const localise = get(locale);

    function createPending(props) {
        return Object.assign(
            {
                type: 'pending',
                id: application.id,
                formId: application.formId,
                expiresAt: application.expiresAt,
                updatedAt: application.updatedAt,
                progress: form.progress
            },
            props
        );
    }

    if (application.formId === 'standard-enquiry') {
        return createPending({
            projectName:
                data.projectName ||
                localise({ en: 'Untitled proposal', cy: 'Cynnig heb deitl' }),
            amountRequested: formatCurrency(data.projectCosts || 0),
            overview: standardOverview(data, locale),
            editUrl: `/apply/your-funding-proposal/edit/${application.id}`,
            deleteUrl: `/apply/your-funding-proposal/delete/${application.id}`
        });
    } else {
        return createPending({
            projectName:
                data.projectName ||
                localise({ en: 'Untitled application', cy: 'Cais heb deitl' }),
            amountRequested: formatBudgetTotal(data.projectBudget),
            overview: simpleOverview(data, locale),
            editUrl: `/apply/awards-for-all/edit/${application.id}`,
            deleteUrl: `/apply/awards-for-all/delete/${application.id}`
        });
    }
}

function enrichSubmitted(application, locale) {
    const data = application.salesforceSubmission.application;
    const localise = get(locale);

    function createSubmitted(props) {
        return Object.assign(
            {
                type: 'submitted',
                id: application.id,
                formId: application.formId,
                submittedAt: application.createdAt
            },
            props
        );
    }

    if (application.formId === 'standard-enquiry') {
        return createSubmitted({
            projectName:
                data.projectName ||
                localise({ en: 'Untitled proposal', cy: 'Cynnig heb deitl' }),
            amountRequested: `£${data.projectCosts.toLocaleString()}`,
            overview: standardOverview(data, locale)
        });
    } else {
        return createSubmitted({
            projectName:
                data.projectName ||
                localise({ en: 'Untitled application', cy: 'Cais heb deitl' }),
            amountRequested: formatBudgetTotal(data.projectBudget),
            overview: simpleOverview(data, locale)
        });
    }
}

module.exports = {
    enrichPending,
    enrichSubmitted
};