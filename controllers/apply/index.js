'use strict';
const appData = require('../../modules/appData');

const { initFormRouter } = require('./form-router');

const reachingCommunitiesForm = require('./reaching-communities/form-model');
const digitalFundForm = require('./digital-fund/form-model');
const youthCapacityForm = require('./youth-capacity/form-model');

module.exports = ({ router }) => {
    router.get('/', (req, res) => {
        res.redirect('/');
    });

    router.use('/your-idea', initFormRouter(reachingCommunitiesForm));

    if (appData.isNotProduction) {
        router.use('/youth-capacity', initFormRouter(youthCapacityForm));
        router.use('/digital-fund-strand-1', initFormRouter(digitalFundForm.strand1));
        router.use('/digital-fund-strand-2', initFormRouter(digitalFundForm.strand2));
    }

    return router;
};
