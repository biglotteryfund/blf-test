'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const concat = require('lodash/concat');
const groupBy = require('lodash/groupBy');
const maxBy = require('lodash/maxBy');
const get = require('lodash/get');
const mean = require('lodash/mean');
const uniqBy = require('lodash/uniqBy');
const minBy = require('lodash/minBy');
const times = require('lodash/times');

const { PendingApplication, SubmittedApplication } = require('../../db/models');
const { getDateRange } = require('./helpers');

const router = express.Router();

const DATE_FORMAT = 'YYYY-MM-DD';

function applicationsByDay(responses) {
    if (responses.length === 0) {
        return [];
    }

    const grouped = groupBy(responses, function(response) {
        return moment(response.createdAt).format(DATE_FORMAT);
    });

    const newestResponse = maxBy(responses, response => response.createdAt);
    const oldestResponse = minBy(responses, response => response.createdAt);
    const oldestResponseDate = moment(oldestResponse.createdAt);

    const daysInRange = moment(newestResponse.createdAt)
        .startOf('day')
        .diff(oldestResponseDate.startOf('day'), 'days');

    const dayData = times(daysInRange, function(n) {
        const key = oldestResponseDate
            .clone()
            .add(n, 'days')
            .format(DATE_FORMAT);

        const responsesForDay = grouped[key] || [];

        return {
            x: key,
            y: responsesForDay.length
        };
    });

    return dayData;
}

function minMaxAvg(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    return {
        lowest: sorted[0] || 0,
        highest: sorted[sorted.length - 1] || 0,
        average: mean(sorted) || 0
    };
}

function measureTimeTaken(data) {
    const appDurations = data.map(row => {
        const created = moment(row.startedAt);
        const submitted = moment(row.createdAt);
        return submitted.diff(created, 'days');
    });
    return minMaxAvg(appDurations);
}

function measureWordCounts(data) {
    const wordCounts = data.map(
        d =>
            d.applicationSummary
                .map(_ => _.value)
                .join(' ')
                .split(' ').length
    );
    return minMaxAvg(wordCounts);
}

function filterByCountry(country, appType) {
    return function(item) {
        if (!country) {
            return item;
        } else if (!item.applicationSummary && !item.applicationData) {
            return false;
        } else {
            let appCountry;

            if (appType === 'pending') {
                appCountry = get(item, 'applicationData.projectCountry');
            } else {
                const rowCountry = item.applicationSummary.find(
                    _ =>
                        _.label ===
                        'What country will your project be based in?'
                );
                appCountry = get(rowCountry, 'value');
            }

            if (appCountry) {
                const c = appCountry.toLowerCase().replace(' ', '-');
                return c === country;
            } else {
                return false;
            }
        }
    };
}

function titleCase(str) {
    if (!str) {
        return;
    }
    return str.replace(/-/g, ' ').replace(/(^|\s)\S/g, function(t) {
        return t.toUpperCase();
    });
}

function getColourForCountry(countryName) {
    let colour = '';
    switch (countryName) {
        case 'England':
            colour = '#f95d6a';
            break;
        case 'Northern Ireland':
            colour = '#2f4b7c';
            break;
        case 'Scotland':
            colour = '#a05195';
            break;
        case 'Wales':
            colour = '#ffa600';
            break;
        default:
            colour = '#e5007d';
            break;
    }
    return colour;
}

function addCountry(row) {
    // Convert Sequelize instance into a plain object so we can modify it
    const data = row.get({
        plain: true
    });
    data.country = data.applicationCountry
        ? data.applicationCountry
        : get(data, 'applicationData.projectCountry');
    return data;
}

router.get('/:applicationId', async (req, res, next) => {
    try {
        const dateRange = getDateRange(req.query.start, req.query.end);
        const country = req.query.country;
        const countryTitle = country ? titleCase(country) : false;
        const applicationTitle = titleCase(req.params.applicationId);

        const getApplications = async appType => {
            const applications =
                appType === 'pending'
                    ? await PendingApplication.findAllByForm(
                          req.params.applicationId,
                          dateRange
                      )
                    : await SubmittedApplication.findAllByForm(
                          req.params.applicationId,
                          dateRange
                      );
            return applications
                .map(addCountry)
                .filter(filterByCountry(country, appType));
        };

        const appTypes = [
            {
                id: 'pending',
                title: 'In-progress applications created',
                verb: 'started',
                applications: await getApplications('pending')
            },
            {
                id: 'submitted',
                title: 'Submitted applications',
                verb: 'submitted',
                applications: await getApplications('submitted')
            }
        ];

        const getAppsToday = dataset => {
            const appsToday = dataset.filter(
                _ => _.x === moment().format(DATE_FORMAT)
            );
            return appsToday.length ? appsToday.y : 0;
        };

        const applicationData = appTypes.map(appType => {
            appType.data = {
                appsPerDay: applicationsByDay(appType.applications),
                get totals() {
                    return {
                        applicationsToday: getAppsToday(this.appsPerDay),
                        applicationsAll: appType.applications.length,
                        uniqueUsers: uniqBy(appType.applications, 'userId')
                            .length
                    };
                }
            };

            let appsByCountryByDay = [];

            if (!country) {
                const appsByCountry = groupBy(appType.applications, 'country');
                for (const [appCountry, apps] of Object.entries(
                    appsByCountry
                )) {
                    if (appCountry && appCountry !== 'undefined') {
                        const countryName = titleCase(appCountry);
                        appsByCountryByDay.push({
                            title: countryName,
                            data: applicationsByDay(apps),
                            colour: getColourForCountry(countryName)
                        });
                    }
                }
            }
            appType.appsByCountryByDay = appsByCountryByDay;

            return appType;
        });

        const submittedApplications = appTypes.find(_ => _.id === 'submitted')
            .applications;

        const statistics = {
            appDurations: measureTimeTaken(submittedApplications),
            wordCount: measureWordCounts(submittedApplications)
        };

        const title = 'Applications';

        let extraBreadcrumbs = [
            {
                label: title,
                url: '/tools/applications'
            },
            {
                label: applicationTitle,
                url: req.baseUrl + req.path
            }
        ];

        if (countryTitle) {
            if (!req.query.start) {
                extraBreadcrumbs = concat(extraBreadcrumbs, [
                    {
                        label: countryTitle
                    }
                ]);
            } else {
                let label = moment(dateRange.start).format(DATE_FORMAT);
                if (req.query.end) {
                    label += ' — ' + moment(dateRange.end).format(DATE_FORMAT);
                }
                extraBreadcrumbs = concat(extraBreadcrumbs, [
                    {
                        label: countryTitle,
                        url: req.baseUrl + req.path + '?country=' + country
                    },
                    {
                        label: label
                    }
                ]);
            }
        }

        let breadcrumbs = concat(res.locals.breadcrumbs, extraBreadcrumbs);

        res.render(path.resolve(__dirname, './views/applications'), {
            title: `${applicationTitle} | ${title}`,
            breadcrumbs: breadcrumbs,
            applicationTitle: applicationTitle,
            applicationData: applicationData,
            statistics: statistics,
            dateRange: dateRange,
            country: country,
            countryTitle: countryTitle
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;