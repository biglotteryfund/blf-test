/* eslint-env jest */
// @ts-nocheck
'use strict';
const { includes, flatMap, map } = require('lodash');
const faker = require('faker');

const validateModel = require('../lib/validate-model');
const validateForm = require('../lib/validate-form');

const { mockStartDate, mockFullForm } = require('./mocks');
const { ORGANISATION_TYPES } = require('./constants');
const formBuilder = require('./form');

function testValidate(data) {
    return validateForm(formBuilder({ locale: 'en', data }), data);
}

function assertMessagesByKey(data, messages) {
    const validation = testValidate(data);
    const messagesByKey = validation.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(map(messagesByKey, 'msg')).toEqual(messages);
}

function assertValid(data) {
    const validationResult = testValidate(data);
    expect(validationResult.isValid).toBeTruthy();
}

function assertValidByKey(data) {
    const validation = testValidate(data);
    const messagesByKey = validation.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(messagesByKey).toHaveLength(0);
}

function fieldNamesFor(sectionSlug, stepTitle) {
    return function(data) {
        const form = formBuilder({ locale: 'en', data: data });
        const section = form.sections.find(s => s.slug === sectionSlug);
        const step = section.steps.find(s => s.title === stepTitle);
        return map(flatMap(step.fieldsets, 'fields'), f => f.name);
    };
}

describe('form model', () => {
    test('validate model shape', () => {
        validateModel(formBuilder({ locale: 'en' }));
    });

    test('project name is required', () => {
        function value(val) {
            return { projectName: val };
        }

        assertMessagesByKey(value(null), ['Enter a project name']);
        assertValidByKey(value(faker.lorem.words()));
    });

    test('project start date must be at least 12 weeks in the future', () => {
        function value(val) {
            return { projectStartDate: val };
        }

        assertValidByKey(value(mockStartDate(12)));
        assertMessagesByKey(value(null), ['Enter a date']);
        assertMessagesByKey(value({ day: 31, month: 2, year: 2030 }), [
            'Enter a real date'
        ]);
        assertMessagesByKey(value(mockStartDate(6)), [
            expect.stringMatching(/Date you start the project must be after/)
        ]);
    });

    test('welsh language question required for applicants in Wales', () => {
        function value(country, val) {
            return {
                projectCountry: country,
                beneficiariesWelshLanguage: val
            };
        }

        assertValidByKey(value('england'));
        assertValidByKey(value('scotland'));
        assertValidByKey(value('wales', 'all'));
        assertMessagesByKey(value('wales'), ['Choose an option']);
        assertMessagesByKey(value('wales', 'not-a-valid-choice'), [
            'Choose an option'
        ]);

        const fieldNamesFn = fieldNamesFor(
            'beneficiaries',
            'People who speak Welsh'
        );

        expect(fieldNamesFn({ projectCountry: 'england' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'scotland' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'northern-ireland' })).toEqual(
            []
        );
        expect(fieldNamesFn({ projectCountry: 'wales' })).toEqual([
            'beneficiariesWelshLanguage'
        ]);
    });

    test('additional community question in Northern Ireland', () => {
        function value(country, val) {
            return {
                projectCountry: country,
                beneficiariesNorthernIrelandCommunity: val
            };
        }

        assertValidByKey(value('england'));
        assertValidByKey(value('scotland'));
        assertValidByKey(value('wales'));
        assertValidByKey(value('northern-ireland', 'mainly-catholic'));
        assertValidByKey(value('northern-ireland', 'mainly-protestant'));
        assertMessagesByKey(value('northern-ireland'), ['Choose an option']);
        assertMessagesByKey(value('northern-ireland', 'not-a-valid-choice'), [
            'Choose an option'
        ]);

        const fieldNamesFn = fieldNamesFor('beneficiaries', 'Community');

        expect(fieldNamesFn({ projectCountry: 'england' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'scotland' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'wales' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'northern-ireland' })).toEqual([
            'beneficiariesNorthernIrelandCommunity'
        ]);
    });

    test('company number required if not for profit company', () => {
        function value(type, val) {
            return {
                organisationType: type,
                companyNumber: val
            };
        }

        assertValidByKey(value(ORGANISATION_TYPES.CIO));
        assertValidByKey(
            value(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY, 'CE002712')
        );
        assertMessagesByKey(value(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY), [
            'Enter your organisation’s Companies House number'
        ]);
    });

    test('charity number required if CIO or registered charity', () => {
        function value(type, val) {
            return {
                organisationType: type,
                charityNumber: val
            };
        }

        assertMessagesByKey(value(ORGANISATION_TYPES.CIO), [
            'Enter your organisation’s charity number'
        ]);

        assertMessagesByKey(
            value(ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY),
            ['Enter your organisation’s charity number']
        );

        assertValidByKey(value(ORGANISATION_TYPES.CIO, '1160580'));
        assertValidByKey(
            value(
                ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                '1160580'
            )
        );
        assertValidByKey(value(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY));
    });

    test('education number required if school', () => {
        function value(type, val) {
            return {
                organisationType: type,
                educationNumber: val
            };
        }

        assertMessagesByKey(value(ORGANISATION_TYPES.SCHOOL), [
            'Enter your organisation’s Department for Education number'
        ]);
        assertValidByKey(value(ORGANISATION_TYPES.SCHOOL, '1160580'));
        assertValidByKey(value(ORGANISATION_TYPES.CIO));
    });

    test('no registration numbers required if unregistered VCO', () => {
        const mock = mockFullForm({
            country: 'england',
            organisationType: ORGANISATION_TYPES.UNREGISTERED_VCO
        });
        assertValid(mock);
    });

    test('registration numbers shown based on organisation type', () => {
        const fieldNamesFn = fieldNamesFor(
            'organisation',
            'Registration numbers'
        );

        expect(fieldNamesFn({})).toEqual([]);

        const mappings = {
            [ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY]: [
                'charityNumber'
            ],
            [ORGANISATION_TYPES.CIO]: ['charityNumber'],
            [ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY]: [
                'companyNumber',
                'charityNumber'
            ],
            [ORGANISATION_TYPES.SCHOOL]: ['educationNumber']
        };

        map(mappings, (expected, type) => {
            const result = fieldNamesFn({ organisationType: type });
            expect(result).toEqual(expected);
        });
    });

    test('exclude address and date of birth for schools or statutory bodies', () => {
        const mainContactFn = fieldNamesFor('main-contact', 'Main contact');

        const mainContactDefaultFields = [
            'mainContactFirstName',
            'mainContactLastName',
            'mainContactDateOfBirth',
            'mainContactAddress',
            'mainContactAddressHistory',
            'mainContactEmail',
            'mainContactPhone',
            'mainContactCommunicationNeeds'
        ];

        const mainContactReducedFields = [
            'mainContactFirstName',
            'mainContactLastName',
            'mainContactEmail',
            'mainContactPhone',
            'mainContactCommunicationNeeds'
        ];

        expect(mainContactFn({})).toEqual(mainContactDefaultFields);
        expect(
            mainContactFn({ organisationType: ORGANISATION_TYPES.SCHOOL })
        ).toEqual(mainContactReducedFields);
        expect(
            mainContactFn({
                organisationType: ORGANISATION_TYPES.STATUTORY_BODY
            })
        ).toEqual(mainContactReducedFields);

        const seniorContactFn = fieldNamesFor(
            'senior-contact',
            'Senior contact'
        );

        const seniorContactDefaultFields = [
            'seniorContactFirstName',
            'seniorContactLastName',
            'seniorContactRole',
            'seniorContactDateOfBirth',
            'seniorContactAddress',
            'seniorContactAddressHistory',
            'seniorContactEmail',
            'seniorContactPhone',
            'seniorContactCommunicationNeeds'
        ];

        const seniorContactReducedFields = [
            'seniorContactFirstName',
            'seniorContactLastName',
            'seniorContactRole',
            'seniorContactEmail',
            'seniorContactPhone',
            'seniorContactCommunicationNeeds'
        ];

        expect(seniorContactFn({})).toEqual(seniorContactDefaultFields);
        expect(
            seniorContactFn({ organisationType: ORGANISATION_TYPES.SCHOOL })
        ).toEqual(seniorContactReducedFields);
        expect(
            seniorContactFn({
                organisationType: ORGANISATION_TYPES.STATUTORY_BODY
            })
        ).toEqual(seniorContactReducedFields);
    });
});