const uuid = require('uuid/v4');
const faker = require('faker');
const sample = require('lodash/sample');
const times = require('lodash/times');

describe('server smoke tests', function() {
    it('should have common headers', () => {
        cy.request('/').then(response => {
            expect(response.headers['cache-control']).to.eq(
                'max-age=30,s-maxage=300'
            );

            expect(response.headers['content-security-policy']).to.contain(
                "default-src 'self'"
            );
        });

        cy.request('/apply/your-idea/1').then(response => {
            expect(response.headers['cache-control']).to.eq(
                'no-store,no-cache,max-age=0'
            );
        });
    });

    it('should 404 unknown routes', () => {
        cy.request({
            url: '/not-a-page',
            failOnStatusCode: false
        }).then(response => {
            expect(response.status).to.eq(404);
            expect(response.body).to.include('Error 404');
        });

        cy.request({
            url: '/not/a/page',
            failOnStatusCode: false
        }).then(response => {
            expect(response.status).to.eq(404);
            expect(response.body).to.include('Error 404');
        });
    });

    it('should redirect search queries to a google site search', () => {
        cy.checkRedirect({
            from: '/search?q=This is my search query',
            to:
                'https://www.google.co.uk/search?q=site%3Awww.tnlcommunityfund.org.uk+This%20is%20my%20search%20query',
            isRelative: false,
            status: 302
        });
    });

    it('should redirect archived pages to the national archives', () => {
        const urlPath =
            '/funding/funding-guidance/applying-for-funding/aims-and-outcomes';
        cy.request(urlPath).then(response => {
            expect(response.body).to.include(
                `http://webarchive.nationalarchives.gov.uk/20171011152352/https://www.biglotteryfund.org.uk${urlPath}`
            );
        });
    });

    it('should redirect legacy funding programmes', () => {
        const sampleRedirect = sample([
            {
                originalPath:
                    '/global-content/programmes/england/acitve-england',
                redirectedPath: '/funding/programmes/acitve-england'
            },
            {
                originalPath:
                    '/global-content/programmes/uk-wide/green-spaces-and-sustainable-communities',
                redirectedPath:
                    '/funding/programmes/green-spaces-and-sustainable-communities'
            },
            {
                originalPath:
                    '/global-content/programmes/northern-ireland/young-peoples-fund-change-ur-future',
                redirectedPath:
                    '/funding/programmes/young-peoples-fund-change-ur-future'
            },
            {
                originalPath:
                    '/welsh/global-content/programmes/wales/young-peoples-fund-bridging-the-gap',
                redirectedPath:
                    '/welsh/funding/programmes/young-peoples-fund-bridging-the-gap'
            }
        ]);

        cy.checkRedirect({
            from: sampleRedirect.originalPath,
            to: sampleRedirect.redirectedPath
        });
    });

    it('should protect access to staff-only tools', () => {
        cy.checkRedirect({
            from:
                '/funding/programmes/national-lottery-awards-for-all-england?draft=42',
            to:
                '/user/staff/login?redirectUrl=/funding/programmes/national-lottery-awards-for-all-england?draft=42',
            status: 302
        });

        cy.checkRedirect({
            from: '/tools/survey-results',
            to: '/user/staff/login?redirectUrl=/tools/survey-results',
            status: 302
        });
    });
});

describe('user', () => {
    function logIn(username, password) {
        cy.getByLabelText('Email address')
            .clear()
            .type(username, { delay: 0 });
        cy.getByLabelText('Password')
            .clear()
            .type(password, { delay: 0 });
        cy.get('.form-actions').within(() => {
            cy.getByText('Log in').click();
        });
    }

    function createAccount(username, password) {
        cy.getByLabelText('Email address')
            .clear()
            .type(username, { delay: 0 });
        cy.getByLabelText('Password')
            .clear()
            .type(password, { delay: 0 });
        cy.getByLabelText('Password confirmation', { exact: false })
            .clear()
            .type(password, { delay: 0 });
        cy.get('.form-actions').within(() => {
            cy.getByText('Create an account').click();
        });
    }

    function assertError(partialMessage) {
        cy.getByTestId('form-errors').should('contain', partialMessage);
    }

    it('log in and log out', function() {
        cy.seedUser().then(newUser => {
            cy.visit('/user/login');
            logIn(newUser.username, newUser.password);

            // Log out
            cy.getByText('Log out').click();
            cy.getByText('You were successfully logged out', {
                exact: false
            }).should('be.visible');
        });
    });

    it('should prevent invalid log ins', () => {
        cy.visit('/user/login');

        const messageText = 'username and password combination is invalid';
        logIn('not_a_real_account@example.com', 'examplepassword');
        assertError(messageText);

        cy.checkA11y();

        cy.seedUser().then(newUser => {
            logIn(newUser.username, 'invalidpassword');
            assertError(messageText);
        });
    });

    it('should rate-limit users attempting to login too often', () => {
        const fakeEmail = `${Date.now()}@example.com`;
        const fakePassword = 'hunter2';
        const maxAttempts = 10;

        times(maxAttempts, function() {
            cy.loginUser({
                username: fakeEmail,
                password: fakePassword
            }).then(response => {
                expect(response.status).to.eq(200);
            });
        });

        cy.loginUser({
            username: fakeEmail,
            password: fakePassword,
            failOnStatusCode: false
        }).then(response => {
            expect(response.status).to.eq(429);
            expect(response.body).to.include('Too many requests');
        });
    });

    it('should prevent registrations with invalid passwords', () => {
        const username = `${Date.now()}@example.com`;

        cy.visit('/user/register');

        createAccount(username, '5555555555');
        cy.getByTestId('form-errors').should('contain', 'Password is too weak');

        // Non-UI tests for remaining validations for speed
        cy.registerUser({
            username: username,
            password: username
        }).then(res => {
            expect(res.body).to.contain(
                'Password must be different from your email address'
            );
        });

        cy.registerUser({
            username: username,
            password: 'tooshort'
        }).then(res => {
            expect(res.body).to.contain('Password must be at least');
        });
    });

    it('should register and see activation screen', function() {
        // Register
        cy.visit('/user/register');
        createAccount(`${Date.now()}@example.com`, uuid());
        cy.checkA11y();
        cy.get('body').should(
            'contain',
            'Check your emails to activate your account'
        );
    });

    it('should email valid users with a token', () => {
        const now = Date.now();
        const username = `${now}@example.com`;
        cy.registerUser({
            username: username,
            password: `password${now}`,
            returnToken: true
        }).then(res => {
            // via https://github.com/auth0/node-jsonwebtoken/issues/162
            expect(res.body.token).to.match(
                /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/
            );
            expect(res.body.mailParams.sendTo).to.equal(username);
            expect(res.body.mailParams.subject).to.equal(
                'Activate your The National Lottery Community Fund website account'
            );
        });
    });

    it('should be able to log in and update account details', () => {
        function changePassword(oldPassword, newPassword) {
            cy.getByText('Change your password').click();
            cy.getByLabelText('Your old password').type(oldPassword, {
                delay: 0
            });
            cy.getByLabelText('Your new password').type(newPassword, {
                delay: 0
            });
            cy.getByLabelText('Re-type your password').type(newPassword, {
                delay: 0
            });
            cy.get('.form-actions').within(() => {
                cy.getByText('Reset password').click();
            });
            cy.getByText('Your password was successfully updated!').should(
                'be.visible'
            );
        }

        function updateEmail(password) {
            const newEmail = `${Date.now()}@example.com`;
            cy.getByText('Change your email address').click();
            cy.getByLabelText('Email address').type(newEmail);
            cy.getByLabelText('Confirm your password').type('invalid password');

            cy.get('.form-actions').within(() => {
                cy.getByText('Update email address').click();
            });

            assertError('There was an error updating your details');

            cy.getByLabelText('Confirm your password')
                .clear()
                .type(password);

            cy.get('.form-actions').within(() => {
                cy.getByText('Update email address').click();
            });

            cy.get('body').should(
                'contain',
                'Check your emails to activate your account'
            );
        }

        cy.seedUser().then(user => {
            cy.visit('/user/login');
            logIn(user.username, user.password);
            const newPassword = uuid();
            changePassword(user.password, newPassword);
            updateEmail(newPassword);
        });
    });
});

describe('api endpoints', () => {
    it('should allow survey API responses', () => {
        const dataYes = {
            choice: 'yes',
            path: '/'
        };

        cy.request('POST', '/api/survey', dataYes).then(response => {
            expect(response.body.result).to.have.property('id');
            expect(response.body.status).to.equal('success');
            expect(response.body.result.choice).to.equal(dataYes.choice);
            expect(response.body.result.path).to.equal(dataYes.path);
        });

        const dataNo = {
            choice: 'no',
            path: '/',
            message: 'this is an example message'
        };

        cy.request('POST', '/api/survey', dataNo).then(response => {
            expect(response.body.result).to.have.property('id');
            expect(response.body.status).to.equal('success');
            expect(response.body.result.choice).to.equal(dataNo.choice);
            expect(response.body.result.path).to.equal(dataNo.path);
            expect(response.body.result.message).to.equal(dataNo.message);
        });
    });

    it('should allow feedback API responses', () => {
        const data = {
            description: 'example',
            message: 'this is an example message'
        };

        cy.request('POST', '/api/feedback', data).then(response => {
            expect(response.body.result).to.have.property('id');
            expect(response.body.status).to.equal('success');
            expect(response.body.result.description).to.equal(data.description);
            expect(response.body.result.message).to.equal(data.message);
        });
    });
});

describe('common pages', () => {
    it('should test homepage and common interactions', () => {
        cy.visit('/');

        // @TODO: Confirm contrast ratio issue on miniature heroes?
        cy.checkA11y({
            options: { rules: { 'color-contrast': { enabled: false } } }
        });

        cy.percySnapshot('homepage');

        function interactWithMobileNav() {
            cy.viewport(375, 667);

            cy.get('.js-toggle-nav').as('navToggle');
            cy.get('#global-nav').as('nav');
            cy.get('.js-toggle-search').as('searchToggle');
            cy.get('#global-search').as('search');

            cy.get('@nav').should('not.be.visible');
            cy.get('@search').should('not.be.visible');

            // Toggle search
            cy.get('@searchToggle').click();
            cy.get('@nav').should('not.be.visible');
            cy.get('@search').should('be.visible');
            // Check search input for focus
            cy.focused().should('have.attr', 'name', 'q');

            // Toggle mobile navigation
            cy.get('@navToggle').click();
            cy.get('@nav').should('be.visible');
            cy.get('@search').should('not.be.visible');
        }

        interactWithMobileNav();
    });

    it('should test welsh page', () => {
        cy.visit('/welsh');
        cy.checkA11y();
        cy.percySnapshot('homepage-welsh');
    });

    it('should test programmes page', () => {
        cy.visit('/funding/programmes');
        // @TODO: Review colour contrast on promo cards
        cy.checkA11y({
            options: { rules: { 'color-contrast': { enabled: false } } }
        });
    });

    it('should check patterns for visual regressions', function() {
        cy.visit('/patterns/components');
        cy.percySnapshot('patterns');
    });
});

describe('reaching communities', function() {
    it('should allow applications for reaching communities', () => {
        function fillIdea() {
            cy.getByLabelText(
                'Briefly explain your idea and why it’ll make a difference',
                { exact: false }
            )
                .invoke('val', faker.lorem.paragraphs(3))
                .trigger('change');
        }

        function fillLocation() {
            cy.checkA11y();
            cy.getByLabelText('North East & Cumbria', { exact: false }).check();
            cy.getByLabelText('Yorkshire and the Humber', {
                exact: false
            }).check();
            cy.getByLabelText('Project location', { exact: false }).type(
                'Example',
                { delay: 0 }
            );
        }

        function fillOrganisation() {
            cy.getByLabelText('Legal name', { exact: false }).type(
                'Test Organisation',
                { delay: 0 }
            );
        }

        function fillYourDetails() {
            cy.getByLabelText('First name', { exact: false }).type(
                faker.name.firstName(),
                { delay: 0 }
            );
            cy.getByLabelText('Last name', { exact: false }).type(
                faker.name.lastName(),
                { delay: 0 }
            );
            cy.getByLabelText('Email address', { exact: false }).type(
                faker.internet.exampleEmail(),
                { delay: 0 }
            );
            cy.getByLabelText('Phone number', { exact: false }).type(
                '0123456789',
                { delay: 0 }
            );
        }

        function interactWithAnswerToggle() {
            cy.get('.js-toggle-answer button').click();
            cy.get('.js-toggle-answer').should('have.class', 'is-active');
            cy.get('.js-toggle-answer button').should('contain', 'Show less');
            cy.get('.js-toggle-answer button').click();
        }

        function interactWithInlineFeedback() {
            cy.get('#js-feedback textarea').type('Test feedback');
            cy.get('#js-feedback form').submit();
            cy.get('#js-feedback').should('contain', 'Thank you for sharing');
        }

        cy.visit('/apply/your-idea');
        cy.getByText('Start').click();

        fillIdea();
        cy.getByText('Next').click();

        fillLocation();
        cy.getByText('Next').click();

        fillOrganisation();
        cy.getByText('Next').click();

        fillYourDetails();
        cy.getByText('Next').click();

        interactWithAnswerToggle();

        cy.getByText('Submit').click();

        cy.get('h1').should('contain', 'Thank you for submitting your idea');
        cy.checkA11y();

        interactWithInlineFeedback();
    });
});

describe('free materials', function() {
    it('should submit materials order', () => {
        cy.visit(
            '/funding/funding-guidance/managing-your-funding/ordering-free-materials'
        );
        cy.get('a[href="#monolingual"]').click();

        // Select items
        cy.get('#qa-material-monolingual-2').as('materialA');
        cy.get('#qa-material-monolingual-3').as('materialB');

        cy.get('@materialA')
            .find('button[value="increase"]')
            .click();

        cy.get('@materialA')
            .find('.step-control__quantity')
            .should('contain', 1);

        cy.get('@materialA')
            .find('button[value="increase"]')
            .click();

        cy.get('@materialA')
            .find('.step-control__quantity')
            .should('contain', 2);

        cy.get('@materialB')
            .find('button[value="increase"]')
            .click();

        cy.get('@materialB')
            .find('.step-control__quantity')
            .should('contain', 1);

        // Fill in form
        cy.get('#ff-yourName').type('Example', { delay: 0 });
        cy.get('#ff-yourEmail').type('example@example.com', { delay: 0 });
        cy.get('#ff-yourAddress1').type('1 Example Street', { delay: 0 });
        cy.get('#ff-yourTown').type('Fake town', { delay: 0 });
        cy.get('#ff-yourCountry').type('England', { delay: 0 });
        cy.get('#ff-yourPostcode').type('EC4A 1DE', { delay: 0 });
        cy.get('#ff-radio-yourReason-projectOpening').check();
        cy.get('#js-submit-material-order').click();

        // Confirm submission
        cy.get('h2').should('contain', 'Thank you for your order');
    });
});

describe('past grants', function() {
    it('should be able to browse grants search results', () => {
        cy.visit('/funding/grants');
        cy.get('.cookie-consent button').click();
        cy.get('.qa-grant-result').should('have.length', 50);
        cy.percySnapshot('grants-search');

        // Search query
        const testQuery = 'cake';
        const textQueryCount = 78;

        cy.get('#js-past-grants')
            .find('#search-query')
            .type(testQuery)
            .type('{enter}');
        cy.get('.active-filter').should('contain', testQuery);
        cy.get('.qa-grant-result').should('have.length', 50);

        // Use filters
        cy.get('#field-dynamic-amount-1').click();
        cy.get('.qa-grant-result').should('have.length', 6);

        // Clear filters
        cy.get('.search-filters__clear-all').click();
        cy.get('.qa-grant-result').should('have.length', 50);

        // Test pagination
        cy.get('.split-nav__next').click();
        cy.get('.qa-grant-result').should('have.length', textQueryCount - 50);
    });
});