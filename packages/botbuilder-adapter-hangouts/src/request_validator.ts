import fetch from 'cross-fetch';
import { decode, verify } from 'jsonwebtoken';

const issuer = 'chat@system.gserviceaccount.com';

export class RequestValidator {
    private url: string;
    private expiresAt: Date;

    private certificates: {[key: string]: string};

    public constructor() {
        this.url = `https://www.googleapis.com/service_accounts/v1/metadata/x509/${ issuer }`;
        this.expiresAt = new Date();
    }

    /**
     * Verifies that the token from the request infact was issued by Google.
     * If we are unable to verify a token for any reason (malformed, expired, invalid) we
     * return false.
     * TODO: Replace this with an official implementation from googleapis if it becomes available.
     * @param request A request object from Restify or Express
     * @param audience The intended audience of the jwt token. i.e. project number
     */
    public async isValid(request: any, audience: string): Promise<boolean> {
        if (!('authorization' in request.headers)) return false;

        try {
            const token = request.get('authorization').match(/bearer (.*)/i)[1];
            const decodedToken: any = decode(token, { complete: true });
            const certificate = await this.getCertificate(decodedToken?.header?.kid);
            const verifiedToken: any = verify(token, certificate);
            return verifiedToken?.aud === audience && verifiedToken?.iss === issuer;
        } catch (e) {
            return false;
        }
    }

    /**
     * Gets the certificate associated with the provided kid from the google certificates
     * endpoint.
     *
     * @param kid The kid associated with the certificate we with to retrieve.
     */
    private async getCertificate(kid: string): Promise<string> {
        if (this.hasExpired()) {
            await this.refresh();
        }

        return this.certificates[kid];
    }

    /**
     * Refresh the local certificates cache with fresh certificates from google.
     */
    private async refresh(): Promise<void> {
        const response = await fetch(this.url);
        this.certificates = JSON.parse(await response.text());

        if (response.headers.has('expires')) {
            this.expiresAt = new Date(response.headers.get('expires'));
        }
    }

    /**
     * Determines if the certificates we've cached are about to expire forcing
     * us to refresh them.
     */
    private hasExpired(): boolean {
        return this.expiresAt.getDate() < (new Date()).getDate() + 1;
    }
}
