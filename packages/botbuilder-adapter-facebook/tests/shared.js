
module.exports.FakeAPI = class FakeAPI {
    constructor(cb) {
        this.cb = cb;
    }
    callAPI(endpoint, method, params) {
        this.cb(endpoint, method, params);
    }
}
module.exports.Req = class Req {
    constructor(body) {
        this.body = body;
    }
}

module.exports.Res = class Res {
    send(val) { 
        this._sent = val;
        // console.log('SEND', val);
        return this;
    }
    status(status) {
        this._status = status;
        // console.log('STATUS', status);
        return this;
    }
    json(json) {
        this._json = json;
        // console.log('JSON', json);
        return this;
    }
    end(val) {
        // console.log('END', val);
        return this;
    }
}

module.exports.fakeVerifySignature = fakeVerifySignature = async (req, res) => {
    return true;
}