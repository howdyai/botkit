/**
 * @module botbuilder-adapter-facebook
 */
import * as request from 'request';

export class FacebookAPI {
    private token: string;
    private api_host: string;
    private api_version: string;

    constructor(token: string, api_host: string = 'graph.facebook.com', api_version: string = 'v2.11') {
        this.token = token;
        this.api_host = api_host;
        this.api_version = api_version;
    }

    public async callAPI(uri: string, method: string = 'POST', payload): Promise<any> {
        return new Promise((resolve, reject) => {
            request({
                method: method,
                json: true,
                body: payload,
                uri: 'https://' + this.api_host + '/' + this.api_version + uri
            }, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }
}
