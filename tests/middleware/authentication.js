var should = require('should');
var express = require('express');
var request = require('supertest');
var middleware = require('../../lib/middleware/authentication');

describe('Slack request token authentication', function () {
    var app = express(),
        authenticationTokens = ['SOME_VALID_TOKEN', 'ANOTHER_VALID_TOKEN'];

    app.use(require('body-parser').json());
    app.use(middleware(authenticationTokens));
    app.post('/', function(req, res, next) {
        res.status(200).send({ "message": "success" });
        next();
    });

    it('should authorize the request if a valid token is passed in the body', function(done) {
        request(app)
        .post('/')
	    .send({"token": "SOME_VALID_TOKEN"})
        .expect(200)
	    .end(done);
    });

    it('should authorize the request if any valid token is passed in the body', function(done) {
        request(app)
        .post('/')
        .send({"token": "ANOTHER_VALID_TOKEN"})
        .expect(200)
        .end(done);
    });

    it('should send a HTTP 401 if the request token is missing', function(done) {
        request(app)
        .get('/')
        .expect(401, done);
    });

    it('should send a HTTP 401 if the request token is not in the list of authorized tokens', function(done) {
        request(app)
        .post('/')
	    .send({"token": "INVALID_TOKEN_VALUE"})
        .expect(401)
	    .expect(function(res) {
            res.body.code.should.equal(401);
            res.body.message.should.equal('Unauthorized');
        })
	    .end(done);

    });

    it('Should send a HTTP 401 if the request token is of the wrong type', function(done) {
        request(app)
        .post('/')
	    .send({"token": {"complex": "INVALID_TOKEN_VALUE"}})
        .expect(401)
	    .expect(function(res) {
            res.body.code.should.equal(401);
            res.body.message.should.equal('Unauthorized');
        })
	    .end(done);
    });
});
