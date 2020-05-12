/* eslint-env jest */
'use strict';
const { getNoticesAll, getNoticesSingle } = require('./notices');

test('get notices for pending under £10,000 application in England', function () {
    const mockUnder10kEngland = {
        formId: 'awards-for-all',
        applicationData: { projectCountry: 'england' },
    };

    const mockUnder10kEmpty = {
        formId: 'awards-for-all',
        applicationData: null,
    };

    const mockOver10k = {
        formId: 'standard-enquiry',
        applicationData: { projectCountries: ['england'] },
    };

    const resultEn = getNoticesAll('en', [
        mockUnder10kEngland,
        mockUnder10kEmpty,
        mockOver10k,
    ]);

    expect(resultEn).toMatchSnapshot();

    const resultCy = getNoticesAll('cy', [
        mockUnder10kEngland,
        mockUnder10kEmpty,
        mockOver10k,
    ]);

    expect(resultCy).toMatchSnapshot();

    const noResult = getNoticesAll('en', [mockUnder10kEmpty, mockOver10k]);
    expect(noResult).toHaveLength(0);
});

test.each(['school', 'college-or-university', 'statutory-body'])(
    'get notices for under £10,000 application in England for %p',
    function (orgType) {
        const resultSingle = getNoticesSingle('en', {
            formId: 'awards-for-all',
            applicationData: {
                projectCountry: 'england',
                organisationType: orgType,
            },
        });
        expect(resultSingle).toMatchSnapshot();
        expect(resultSingle).toHaveLength(1);
    }
);
