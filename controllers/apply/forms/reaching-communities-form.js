const { get, isArray } = require('lodash');
const { check } = require('express-validator/check');

const { createFormModel } = require('./create-form-model');
const { HUB_EMAILS } = require('../../../modules/secrets');
const app = require('../../../server');
const appData = require('../../../modules/appData');
const mail = require('../../../modules/mail');

const formModel = createFormModel({
    id: 'reaching-communities-idea',
    title: 'Reaching Communities & Partnerships',
    shortCode: 'RC'
});

formModel.registerStep({
    name: 'Your idea',
    fieldsets: [
        {
            legend: 'Find out how we can help you',
            fields: [
                {
                    type: 'textarea',
                    name: 'your-idea',
                    label: 'Briefly explain your idea and why it’ll make a difference',
                    isRequired: true,
                    rows: 12,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Please tell us your idea');
                    },
                    helpText: {
                        body: `
<p>We support ideas that meet our three funding priorities.</p>
<p>Show us how you plan to:</p>
<ul>
<li>bring people together and build strong relationships in and across communities
<li>improve the places and spaces that matter to communities</li>
<li>enable more people to fulfil their potential by working to address issues at the earliest possible stage.</li>
</ul>

<p>Through all of our funding in England we support ideas that:</p>
<ul>
<li>bring people together and build strong relationships in and across communities</li>
<li>improve the places and spaces that matter to communities</li>
<li>enable more people to fulfil their potential by working to address issues at the earliest possible stage</li>
</ul>
`,
                        introduction: `
<p>Use the box below to tell us about your organisation, or your idea, and we will be in touch within fifteen working days to let you know if we can help. You don’t need to spend too much time on this – if it is something we can fund, this is just the start of the conversation.</p>
<p>If you have already read our guidance, and feel you have all the information to tell us your idea, you are welcome to insert this below and it will go to one of our funding officers.</p>
`
                    }
                }
            ]
        }
    ]
});

const DEFAULT_EMAIL = HUB_EMAILS.england;

const PROJECT_LOCATIONS = [
    {
        label: 'North East & Cumbria',
        value: 'North East & Cumbria',
        explanation: 'covering Newcastle, Cumbria and the north-east of England',
        email: HUB_EMAILS.northEastCumbria
    },
    {
        label: 'North West',
        value: 'North West',
        explanation: 'covering Greater Manchester, Lancashire, Cheshire and Merseyside',
        email: HUB_EMAILS.northWest
    },
    {
        label: 'Yorkshire and the Humber',
        value: 'Yorkshire and the Humber',
        explanation: 'covering Yorkshire, north and north-east Lincolnshire',
        email: HUB_EMAILS.yorksHumber
    },
    {
        label: 'South West',
        value: 'South West',
        explanation: 'covering Exeter, Bristol and the south-west of England',
        email: HUB_EMAILS.southWest
    },
    {
        label: 'London, South-East and East of England',
        value: 'London and South East',
        email: HUB_EMAILS.londonSouthEast
    },
    {
        label: 'East and West Midlands',
        value: 'Midlands',
        email: HUB_EMAILS.midlands
    }
];

formModel.registerStep({
    name: 'Project location',
    internalOrder: 3,
    fieldsets: [
        {
            legend: 'Where will your project take place?',
            fields: [
                {
                    label: 'Select all regions that apply',
                    type: 'checkbox',
                    options: PROJECT_LOCATIONS,
                    isRequired: true,
                    name: 'location',
                    validator: function(field) {
                        return check(field.name)
                            .not()
                            .isEmpty()
                            .withMessage('Project region must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'project-location',
                    label: "In your own words, describe the location(s) that you'll be running your project(s) in",
                    placeholder: 'eg. "Newcastle community centre" or "Alfreton, Derby and Ripley"',
                    isRequired: true,
                    size: 60,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Project location must be provided');
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Your organisation',
    internalOrder: 2,
    fieldsets: [
        {
            legend: 'Your organisation',
            fields: [
                {
                    type: 'text',
                    name: 'organisation-name',
                    label: 'Legal name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Organisation must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'additional-organisations',
                    label: 'Add another organisation',
                    explanation:
                        'If you’re working with other organisations to deliver your idea, list them below. If you don’t know yet we can discuss this later on.',
                    isRequired: false,
                    size: 60,
                    validator: function(field) {
                        return check(field.name).trim();
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Your details',
    internalOrder: 1,
    fieldsets: [
        {
            legend: 'Your details',
            fields: [
                {
                    type: 'text',
                    name: 'first-name',
                    label: 'First name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('First name must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'last-name',
                    label: 'Last name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Last name must be provided');
                    }
                },
                {
                    type: 'email',
                    name: 'email',
                    label: 'Email address',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Please provide your email address')
                            .isEmail()
                            .withMessage('Please provide a valid email address');
                    }
                }
            ]
        }
    ]
});

formModel.registerReviewStep({
    title: 'Check this is right',
    proceedLabel: 'Submit'
});

formModel.registerSuccessStep({
    title: 'We have received your idea',
    message: `
<h2 class="t2 t--underline accent--pink">What happens next?</h2>
<p>Thank you for submitting your idea. A local funding officer will contact you within fifteen working days.</p>
`,
    processor: function(formData) {
        const flatData = formModel.getStepValuesFlattened(formData);

        let internalInboxToSendTo;

        if (isArray(flatData.location)) {
            // send multi-region ideas to the global england-wide inbox
            internalInboxToSendTo = DEFAULT_EMAIL;
        } else {
            // find the applicable email for their region
            const matchedLocation = PROJECT_LOCATIONS.find(l => l.value === flatData.location);
            internalInboxToSendTo = get(matchedLocation, 'email', DEFAULT_EMAIL);
        }

        return new Promise((resolve, reject) => {
            const summary = formModel.getStepsWithValues(formData);

            // construct an email address for the customer
            const customerEmail = `${flatData['first-name']} ${flatData['last-name']} <${flatData['email']}>`;

            // add the relevant hub email address
            const customerPlusHubEmail = [customerEmail].concat(internalInboxToSendTo);

            // only email hubs on production environments
            const sendTo = appData.isNotProduction ? customerEmail : customerPlusHubEmail;
            const sendMode = appData.isNotProduction ? 'to' : 'bcc';

            /**
             * Render a Nunjucks template to a string and
             * convert the string to inline HTML
             */
            app.render(
                'emails/applicationSummary',
                {
                    summary: summary,
                    form: formModel,
                    data: flatData
                },
                (errorRenderingTemplate, html) => {
                    if (errorRenderingTemplate) {
                        return reject(errorRenderingTemplate);
                    }

                    mail
                        .renderHtmlEmail(html)
                        .then(inlinedHtml => {
                            mail
                                .send({
                                    sendTo: sendTo,
                                    sendMode: sendMode,
                                    sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
                                    subject: `Thank you for getting in touch with the Big Lottery Fund!`,
                                    html: inlinedHtml
                                })
                                .catch(mailSendError => reject(mailSendError))
                                .then(() => resolve(formData));
                        })
                        .catch(err => {
                            return reject(err);
                        });
                }
            );
        });
    }
});

formModel.registerErrorStep({
    title: 'There was an problem submitting your idea',
    message: `
<p>There was a problem submitting your idea, we have been notified of the problem.</p>
<p>Please return to the review step and try again. If you still see an error please call <a href="tel:03454102030">0345 4 10 20 30</a> (Monday–Friday 9am–5pm).</p>
`
});

module.exports = formModel;
