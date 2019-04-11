/**
 * @module botbuilder-adapter-facebook
 */
import * as request from 'request';
import * as crypto from 'crypto';

export class FacebookAPI {
    private token: string;
    private api_host: string;
    private api_version: string;

    public constructor(token: string, api_host: string = 'graph.facebook.com', api_version: string = 'v2.11') {
        if (!token) {
            throw new Error('Token is required!');
        }
        this.token = token;
        this.api_host = api_host;
        this.api_version = api_version;
    }

    public async callAPI(path: string, method: string = 'POST', payload): Promise<any> {
        return new Promise((resolve, reject) => {
            request({
                method: method,
                json: true,
                body: payload,
                uri: 'https://' + this.api_host + '/' + this.api_version + path + "?access_token=" + this.token
            }, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }

    private getAppSecretProof(access_token, app_secret) {
        var hmac = crypto.createHmac('sha256', app_secret || '');
        return hmac.update(access_token).digest('hex');
    }

}
