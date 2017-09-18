'use strict';
/* global describe, it, beforeEach, afterEach */
const chai = require('chai');
const config = require('config');
chai.use(require('chai-http'));
const should = chai.should();

const helper = require('../helper');

describe('Express application', () => {

    let server;
    beforeEach(() => {
        server = helper.before();
    });

    afterEach(() => {
        helper.after();
    });

    it('responds to /', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('serves the new homepage', (done) => {
        chai.request(server)
            .get('/home')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('serves the legacy homepage', (done) => {
        chai.request(server)
            .get('/legacy')
            .end((err, res) => {
                // verify the page is coming from a microsoft stack
                // @TODO these headers may be removed from the legacy site
                // so we might need a more reliable test here
                res.should.have.header('X-Powered-By', /^ASP\.NET/);
                res.should.have.header('X-AspNet-Version');
                res.should.have.status(200);
                done();
            });
    });

    it('serves static files', (done) => {
        const assets = require('../../modules/assets');
        const CSS_PATH = assets.getCachebustedPath('stylesheets/style.css');
        chai.request(server)
            .get(CSS_PATH)
            .end((err, res) => {
                res.should.have.status(200);
                res.should.have.header('content-type', /^text\/css/);
                done();
            });
    });

    it('returns grant data for postcodes', (done) => {
        let validPostcode = 'B14 7EW';
        chai.request(server)
            .get('/lookup')
            .query({
                postcode: validPostcode
            })
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    }).timeout(3000);

    it('redirects to homepage for invalid postcodes', (done) => {
        let invalidPostcode = 'ABC 123';
        chai.request(server)
            .get('/lookup')
            .query({
                postcode: invalidPostcode
            })
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo('/');
                res.should.have.status(302);
                done();
            });
    }).timeout(3000);

    it('serves Welsh content', (done) => {
        chai.request(server)
            .get('/welsh/contact')
            .end((err, res) => {
                res.should.have.header('Content-Language', 'cy');
                res.should.have.status(200);
                done();
            });
    });

    it('can set contrast preferences', (done) => {
        let redirectUrl = 'http://www.google.com';
        chai.request(server)
            .get('/contrast/high')
            .query({
                url: redirectUrl
            })
            .redirects(0)
            .end((err, res) => {
                res.should.have.cookie(config.get('cookies.contrast'));
                res.should.redirectTo(redirectUrl);
                res.should.have.status(302);
                done();
            });
    });

    it('404s everything else', (done) => {
        chai.request(server)
            .get('/foo/bar')
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

});