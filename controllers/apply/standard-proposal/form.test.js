/* eslint-env jest */
'use strict';
const omit = require('lodash/omit');

const { mockResponse } = require('./mocks');
const formBuilder = require('./form');

function mapMessages(validationResult) {
    return validationResult.messages.map((detail) => detail.msg);
}

test('empty form', () => {
    const result = formBuilder().validation;
    expect(mapMessages(result)).toMatchSnapshot();
});

test('valid form', () => {
    const data = mockResponse();
    const result = formBuilder({ data }).validation;
    expect(result.error).toBeUndefined();
});

test('invalid form', () => {
    const form = formBuilder();

    const result = form.validate({
        projectCountries: 'invalid-country',
        projectLocation: null,
        projectCosts: 10000,
        projectDurationYears: 10,
        organisationLegalName: 'Same organisation name',
        organisationTradingName: 'Same organisation name',
    });

    expect(mapMessages(result)).toMatchSnapshot();
});

test('require region when england is selected', function () {
    const data = omit('england', 'projectRegions');
    const form = formBuilder({ data });

    expect(mapMessages(form.validation)).toEqual(
        expect.arrayContaining(['Select one or more regions'])
    );
});

test('strip region outside of england', function () {
    const data = mockResponse({
        projectCountries: ['northern-ireland'],
        projectRegions: ['midlands', 'north-west'],
    });

    const form = formBuilder({ data });

    expect(form.validation.value).not.toHaveProperty('projectRegions');
});

test('strip other region selections when all-england is selected', function () {
    const form = formBuilder({
        data: mockResponse({
            projectCountries: ['england'],
            projectRegions: ['all-england', 'midlands', 'north-west'],
        }),
    });

    expect(form.validation.value.projectRegions).toEqual(['all-england']);
});

test('strip projectLocation when applying for more than one country', () => {
    const form = formBuilder({
        data: mockResponse({
            projectCountries: ['england', 'scotland'],
            projectLocation: 'this-should-be-stripped',
        }),
    });

    expect(form.validation.value).not.toHaveProperty('projectLocation');
});

test('strip projectDurationYears when applying for more than one country', () => {
    const form = formBuilder({
        data: mockResponse({
            projectCountries: ['england', 'scotland'],
            projectDurationYears: 5,
        }),
    });

    expect(form.validation.value).not.toHaveProperty('projectDurationYears');
});

test('projectDurationYears should match input when applying for England', () => {
    const form = formBuilder({
        data: mockResponse({
            projectCountries: ['england'],
            projectDurationYears: 5,
        }),
    });
    const salesforceResult = form.forSalesforce();
    expect(salesforceResult.projectDurationYears).toBe(5);
});

test('organisation sub-type required for statutory-body', function () {
    const requiredData = mockResponse({ organisationType: 'statutory-body' });
    const requiredResult = formBuilder({ data: requiredData }).validation;

    expect(mapMessages(requiredResult)).toEqual(
        expect.arrayContaining(['Tell us what type of statutory body you are'])
    );

    const validData = mockResponse({
        organisationType: 'statutory-body',
        organisationSubType: 'fire-service',
    });
    const result = formBuilder({ data: validData }).validation;
    expect(result.error).toBeUndefined();
});

test.each([
    'organisationTradingName',
    'contactPhone',
    'contactCommunicationNeeds',
])('optional %p field', function (fieldName) {
    const data = mockResponse();
    const form = formBuilder({ data });

    const expected = omit(data, fieldName);
    const result = form.validate(expected);
    expect(result.error).toBeUndefined();
});
