const { RequestValidator } = require('../');

const assert = require('assert');
const httpMocks = require('node-mocks-http');
const { sign } = require('jsonwebtoken');
const nock = require('nock');

const certificate = `-----BEGIN CERTIFICATE-----
MIIGJzCCBA+gAwIBAgIBATANBgkqhkiG9w0BAQUFADCBsjELMAkGA1UEBhMCRlIx
DzANBgNVBAgMBkFsc2FjZTETMBEGA1UEBwwKU3RyYXNib3VyZzEYMBYGA1UECgwP
d3d3LmZyZWVsYW4ub3JnMRAwDgYDVQQLDAdmcmVlbGFuMS0wKwYDVQQDDCRGcmVl
bGFuIFNhbXBsZSBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkxIjAgBgkqhkiG9w0BCQEW
E2NvbnRhY3RAZnJlZWxhbi5vcmcwHhcNMTIwNDI3MTAzMTE4WhcNMjIwNDI1MTAz
MTE4WjB+MQswCQYDVQQGEwJGUjEPMA0GA1UECAwGQWxzYWNlMRgwFgYDVQQKDA93
d3cuZnJlZWxhbi5vcmcxEDAOBgNVBAsMB2ZyZWVsYW4xDjAMBgNVBAMMBWFsaWNl
MSIwIAYJKoZIhvcNAQkBFhNjb250YWN0QGZyZWVsYW4ub3JnMIICIjANBgkqhkiG
9w0BAQEFAAOCAg8AMIICCgKCAgEA3W29+ID6194bH6ejLrIC4hb2Ugo8v6ZC+Mrc
k2dNYMNPjcOKABvxxEtBamnSaeU/IY7FC/giN622LEtV/3oDcrua0+yWuVafyxmZ
yTKUb4/GUgafRQPf/eiX9urWurtIK7XgNGFNUjYPq4dSJQPPhwCHE/LKAykWnZBX
RrX0Dq4XyApNku0IpjIjEXH+8ixE12wH8wt7DEvdO7T3N3CfUbaITl1qBX+Nm2Z6
q4Ag/u5rl8NJfXg71ZmXA3XOj7zFvpyapRIZcPmkvZYn7SMCp8dXyXHPdpSiIWL2
uB3KiO4JrUYvt2GzLBUThp+lNSZaZ/Q3yOaAAUkOx+1h08285Pi+P8lO+H2Xic4S
vMq1xtLg2bNoPC5KnbRfuFPuUD2/3dSiiragJ6uYDLOyWJDivKGt/72OVTEPAL9o
6T2pGZrwbQuiFGrGTMZOvWMSpQtNl+tCCXlT4mWqJDRwuMGrI4DnnGzt3IKqNwS4
Qyo9KqjMIPwnXZAmWPm3FOKe4sFwc5fpawKO01JZewDsYTDxVj+cwXwFxbE2yBiF
z2FAHwfopwaH35p3C6lkcgP2k/zgAlnBluzACUI+MKJ/G0gv/uAhj1OHJQ3L6kn1
SpvQ41/ueBjlunExqQSYD7GtZ1Kg8uOcq2r+WISE3Qc9MpQFFkUVllmgWGwYDuN3
Zsez95kCAwEAAaN7MHkwCQYDVR0TBAIwADAsBglghkgBhvhCAQ0EHxYdT3BlblNT
TCBHZW5lcmF0ZWQgQ2VydGlmaWNhdGUwHQYDVR0OBBYEFFlfyRO6G8y5qEFKikl5
ajb2fT7XMB8GA1UdIwQYMBaAFCNsLT0+KV14uGw+quK7Lh5sh/JTMA0GCSqGSIb3
DQEBBQUAA4ICAQAT5wJFPqervbja5+90iKxi1d0QVtVGB+z6aoAMuWK+qgi0vgvr
mu9ot2lvTSCSnRhjeiP0SIdqFMORmBtOCFk/kYDp9M/91b+vS+S9eAlxrNCB5VOf
PqxEPp/wv1rBcE4GBO/c6HcFon3F+oBYCsUQbZDKSSZxhDm3mj7pb67FNbZbJIzJ
70HDsRe2O04oiTx+h6g6pW3cOQMgIAvFgKN5Ex727K4230B0NIdGkzuj4KSML0NM
slSAcXZ41OoSKNjy44BVEZv0ZdxTDrRM4EwJtNyggFzmtTuV02nkUj1bYYYC5f0L
ADr6s0XMyaNk8twlWYlYDZ5uKDpVRVBfiGcq0uJIzIvemhuTrofh8pBQQNkPRDFT
Rq1iTo1Ihhl3/Fl1kXk1WR3jTjNb4jHX7lIoXwpwp767HAPKGhjQ9cFbnHMEtkro
RlJYdtRq5mccDtwT0GFyoJLLBZdHHMHJz0F9H7FNk2tTQQMhK5MVYwg+LIaee586
CQVqfbscp7evlgjLW98H+5zylRHAgoH2G79aHljNKMp9BOuq6SnEglEsiWGVtu2l
hnx8SB3sVJZHeer8f/UQQwqbAO+Kdy70NmbSaqaVtp8jOxLiidWkwSyRTsuU6D8i
DiH5uEqBXExjrj0FslxcVKdVj5glVcSmkLwZKbEU1OKwleT/iXFhvooWhQ==
-----END CERTIFICATE-----`;

const key = `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`;

const invalidCertificate = `-----BEGIN CERTIFICATE-----
MIIGJzCCBA+gAwIBAgIBAzANBgkqhkiG9w0BAQUFADCBsjELMAkGA1UEBhMCRlIx
DzANBgNVBAgMBkFsc2FjZTETMBEGA1UEBwwKU3RyYXNib3VyZzEYMBYGA1UECgwP
d3d3LmZyZWVsYW4ub3JnMRAwDgYDVQQLDAdmcmVlbGFuMS0wKwYDVQQDDCRGcmVl
bGFuIFNhbXBsZSBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkxIjAgBgkqhkiG9w0BCQEW
E2NvbnRhY3RAZnJlZWxhbi5vcmcwHhcNMTIwNDI3MTA1NDUzWhcNMjIwNDI1MTA1
NDUzWjB+MQswCQYDVQQGEwJGUjEPMA0GA1UECAwGQWxzYWNlMRgwFgYDVQQKDA93
d3cuZnJlZWxhbi5vcmcxEDAOBgNVBAsMB2ZyZWVsYW4xDjAMBgNVBAMMBWNhcm9s
MSIwIAYJKoZIhvcNAQkBFhNjb250YWN0QGZyZWVsYW4ub3JnMIICIjANBgkqhkiG
9w0BAQEFAAOCAg8AMIICCgKCAgEA18CnxulIxFNAs3bZLzcoPaPEQtB2zQibUOMc
UeUUcvoroLEGI/PBrZJ8ef4VVNHlZ2La7YGqfuKxUKn72CkJ2oRNPPRuE6sL1e6A
YzJ9V6+DPBwn7exn1v0cEy1Av9Hav3q2Z36wdTttYZ3MbBqX8Vben4DTFmC7im9G
m740dcNM0vHI8z6YKDDkyy0lYWJIvi7c7ZCTrnS3+klDZSCsjv5SbACOUT62msZP
RBx7hBe9XPY26UyRiW9OrawQQcXFZYogyPcno+qsW3QJmSeIYMdEaRgMMhp38kdT
RuMSxWmVRRWaFGB2IKe1jFG/WlcZWseovAvEMMoL5tD4xKiE2SSikvaE8hPqpJOX
/u132C91eiw5iDxEVgrvElfVno81jn+E5xrRGY0j27XOxX/hiG0E1gHe8HI+UZUd
TzC2MgoPhLUANOS/gHEQYhTBMlqppt7CWOhS62ZauF7CBnymajPyHopBB1O7a0GS
WYV5BKnfVkzgYh6Yh5UHsRBJNJyQTAuDJSefASf70MRuUMz1AkcsRZox5c59ho/b
/YPqpgBJcRREoY6duqSkz50VIC1ndkKBY6J2Tksitd492PjgQ3+jEPBz+27hajeZ
3IejBUwp9WMUm+ujOpsrtFH1BQPeQeXLGo5260eTU5BxxY+GX54LTTOcPIiKkJ+Q
pjWQgfECAwEAAaN7MHkwCQYDVR0TBAIwADAsBglghkgBhvhCAQ0EHxYdT3BlblNT
TCBHZW5lcmF0ZWQgQ2VydGlmaWNhdGUwHQYDVR0OBBYEFLVdDU9V9nUaI7P1jLxr
WraWbK7gMB8GA1UdIwQYMBaAFCNsLT0+KV14uGw+quK7Lh5sh/JTMA0GCSqGSIb3
DQEBBQUAA4ICAQC/P+cWorqxz9Z584TtpRA+YEIO1RrG6bE5hlou3a62txYzMxc+
g/eh97QbCXSPmw2OTMeh1mZsAjq18nKqyeSzxp1uwEjcOSEwGKBvywm+3g9jgwQy
c6e8QjS3odwhIQiGZbwuxXiu+/6r+4uFv2Hg4qpSXx4NGSITlHq0vVwwjUMitOkT
Yn4+9eJ6KjvaH1dKXbhsTPVuNLm9tB/ciNAoIKIMMeh/OiO4YEjITuECYq4A+9Cl
dsvq89d1DZ5WSMEuRMcMnwOzrJbFoqAGnivD67UEFTN5Sp4olB0oUJjj67V0aX9p
vGFy0YrM+4m+UTSBEXv6is/nv4GRNBoRY5JB62J9eipaK6OFNls5CEBrDby37TZC
YEXuDCfxQTie25mPD/8b6gKYnxkhM8qiR4nLHalMlLY9suK/HfcSjQH/d9ZyZXDK
gI6iLXgMsp2EOlD56I6FA1jrCtNb01XQvX3eyFuA6g5T1jWGYBDtvQb0WRVkdUy9
L/uK+sHQwtloCSuakcQAsWV9bajCQtHX8XGu25Yz56kpJ/OJjcishxT6pc/sthum
A5PX739JsNUi/p5aG+H/6eNx+ukJP7QaM646YCfS5i8S9DJUvim+/BSlKi2ZiOCd
0MYH4Xb7lmAOTNmTvSYpKo9J2fZ9erw0MYSBTyjh6F7PRbHBiivgUnJfGQ==
-----END CERTIFICATE-----`;

const algorithm = 'RS256';

describe('RequestValidator', () => {
    let validator;

    beforeEach(() => {
        validator = new RequestValidator();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('isValid', () => {
        it('should not be valid when the request does not have an authorization header', async () => {
            const request = httpMocks.createRequest();
            assert.strictEqual(await validator.isValid(request, ''), false);
        });

        it('should not be valid when there are no certificates', async () => {
            const request = httpMocks.createRequest({
                headers: {
                    authorization: `Bearer ${ sign({}, key, { algorithm }) }`
                }
            });
            assert.strictEqual(await validator.isValid(request, ''), false);
        });

        it('should not be valid when there is no public certificate corresponding to the kid', async () => {
            nock('https://www.googleapis.com/service_accounts/v1/metadata/x509')
                .get('/chat@system.gserviceaccount.com')
                .reply(200, JSON.stringify({
                    not_kid: certificate
                }));

            const request = httpMocks.createRequest({
                headers: {
                    authorization: `Bearer ${ sign({}, key, { algorithm, header: { kid: 'kid' } }) }`
                }
            });
            assert.strictEqual(await validator.isValid(request, ''), false);
        });

        it('should not be valid when the certificate cannot verify the token', async () => {
            nock('https://www.googleapis.com/service_accounts/v1/metadata/x509')
                .get('/chat@system.gserviceaccount.com')
                .reply(200, JSON.stringify({
                    kid: invalidCertificate
                }));

            const request = httpMocks.createRequest({
                headers: {
                    authorization: `Bearer ${ sign({}, key, { algorithm, audience: 'audience', issuer: 'chat@system.gserviceaccount.com', header: { kid: 'kid' } }) }`
                }
            });
            assert.strictEqual(await validator.isValid(request, 'audience'), false);
        });

        it('should not be valid when the token has expired', async () => {
            nock('https://www.googleapis.com/service_accounts/v1/metadata/x509')
                .get('/chat@system.gserviceaccount.com')
                .reply(200, JSON.stringify({
                    kid: certificate
                }));

            const request = httpMocks.createRequest({
                headers: {
                    authorization: `Bearer ${ sign({}, key, { algorithm, audience: 'audience', issuer: 'chat@system.gserviceaccount.com', expiresIn: '0', header: { kid: 'kid' } }) }`
                }
            });
            assert.strictEqual(await validator.isValid(request, 'audience'), false);
        });

        it('should not be valid when the audience does not match', async () => {
            nock('https://www.googleapis.com/service_accounts/v1/metadata/x509')
                .get('/chat@system.gserviceaccount.com')
                .reply(200, JSON.stringify({
                    kid: certificate
                }));

            const request = httpMocks.createRequest({
                headers: {
                    authorization: `Bearer ${ sign({}, key, { algorithm, audience: 'wrong_audience', issuer: 'chat@system.gserviceaccount.com', expiresIn: '0', header: { kid: 'kid' } }) }`
                }
            });
            assert.strictEqual(await validator.isValid(request, 'audience'), false);
        });

        it('should not be valid when the issuer does not match', async () => {
            nock('https://www.googleapis.com/service_accounts/v1/metadata/x509')
                .get('/chat@system.gserviceaccount.com')
                .reply(200, JSON.stringify({
                    kid: certificate
                }));

            const request = httpMocks.createRequest({
                headers: {
                    authorization: `Bearer ${ sign({}, key, { algorithm, audience: 'audience', issuer: 'wrong_issuer', expiresIn: '0', header: { kid: 'kid' } }) }`
                }
            });
            assert.strictEqual(await validator.isValid(request, 'audience'), false);
        });

        it('should be valid when the request is valid', async () => {
            nock('https://www.googleapis.com/service_accounts/v1/metadata/x509')
                .get('/chat@system.gserviceaccount.com')
                .reply(200, JSON.stringify({
                    kid: certificate
                }));

            const request = httpMocks.createRequest({
                headers: {
                    authorization: `Bearer ${ sign({}, key, { algorithm, audience: 'audience', issuer: 'chat@system.gserviceaccount.com', header: { kid: 'kid' } }) }`
                }
            });
            assert.strictEqual(await validator.isValid(request, 'audience'), true);
        });

        it('should refresh the certificates if they have expired', async () => {
            nock('https://www.googleapis.com/service_accounts/v1/metadata/x509')
                .get('/chat@system.gserviceaccount.com')
                .reply(200, JSON.stringify({
                    kid: certificate
                }))
                .get('/chat@system.gserviceaccount.com')
                .reply(200, JSON.stringify({
                    kid: invalidCertificate
                }));

            const request = httpMocks.createRequest({
                headers: {
                    authorization: `Bearer ${ sign({}, key, { algorithm, audience: 'audience', issuer: 'chat@system.gserviceaccount.com', header: { kid: 'kid' } }) }`
                }
            });

            assert.strictEqual(await validator.isValid(request, 'audience'), true);

            // Fails with the second request where the certificate is no longer available
            assert.strictEqual(await validator.isValid(request, 'audience'), false);
        });

        it('should not refresh the certificates if they have not expired', async () => {
            nock('https://www.googleapis.com/service_accounts/v1/metadata/x509')
                .get('/chat@system.gserviceaccount.com')
                .reply(200, JSON.stringify({
                    kid: certificate
                }),
                { expires: new Date((new Date()).getDate() + 1000) })
                .get('/chat@system.gserviceaccount.com') // We never make this request
                .reply(200, JSON.stringify({
                    kid: invalidCertificate
                }));

            const request = httpMocks.createRequest({
                headers: {
                    authorization: `Bearer ${ sign({}, key, { algorithm, audience: 'audience', issuer: 'chat@system.gserviceaccount.com', header: { kid: 'kid' } }) }`
                }
            });

            assert.strictEqual(await validator.isValid(request, 'audience'), true);

            // Succeeds since the initial certificate has not yet expired
            assert.strictEqual(await validator.isValid(request, 'audience'), true);
        });
    });
});
