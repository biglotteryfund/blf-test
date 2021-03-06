'use strict';
const getOr = require('lodash/fp/getOr');
const { stripIndents } = require('common-tags');

module.exports = function ({ data = {} }) {
    const projectCountries = getOr([], 'projectCountries')(data);

    function getNextSteps() {
        if (projectCountries.includes('england')) {
            return `<p>Thanks for sending us your project proposal form.</p>
                <p>We appreciate you taking the time to tell us more about your project and organisation.</p>
                <h3>What happens next?</h3>
                <p>Your answers have been passed on to a funding officer, who will use this information 
                to continue assessing your funding proposal.</p>
                <p>We’ll let you know if your proposal is something we’re interested in progressing in around 12 weeks.</p>`;
        } else {
            return `<p>
            We've emailed you a copy of what you wrote along
            with information about what happens next.
            Hold on to it in case you want to look at your answers again.
            It can be helpful to refer back to if we call.
        </p>
        <h3>What happens next?</h3>
        <p>Your proposal has been passed on to one of our funding officers.</p>
        <p>
                We’re now prioritising proposals for COVID-19 related projects,
                so they can start sooner. And it might take us longer to get
                back to you about proposals that aren’t COVID-19 related. 
            </p>
            <p>
                If it's something we can fund, you'll be asked if
                you want to make a full application.
            </p>`;
        }
    }

    return {
        title: `Thanks for telling us your proposal`,
        body: stripIndents`${getNextSteps()}
        <p>Any questions in the meantime? <a href="/contact">Contact us</a></p>`,
    };
};
