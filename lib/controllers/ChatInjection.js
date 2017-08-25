var base64 = require('base-64');
var utf8 = require('utf8');

var ChatInjection = function (req, res) {

  var validation = {
    pmNerdsPhase2: {
      host: [
        'c0a9a78c.ngrok.io',
        'pmnerds.com'
      ],
      ip: [
        '189.211.78.72',
      ],
    },
  };

  var encode = function(str) {
    var bytes = utf8.encode(str);
    return base64.encode(bytes);
  };

  var decode = function(token) {
    var bytes = base64.decode(token);
    return utf8.decode(bytes);
  }

  var validToken = function(decodedToken) {

    if (decodedToken in validation) {
      return true;
    }

    return false;
  }

  var validHost = function(validHosts) {
    var host = req.get('host');
    var ip = req.get('x-forwarded-for');
    
    if (!!validHosts.host.indexOf(host)) {
      return true;
    }

    if (!!validHosts.ip.indexOf(ip)) {
      return true;
    }

    return false;
  }

  var validate = function() {

    var decodedToken = decode(req.query.token);

    if (!validToken(decodedToken)) {
      return res.sendStatus(403);
    }

    var validHosts = validation[decodedToken];

    if (!validHost(validHosts)){
      return res.sendStatus(403);
    }

    return res.sendStatus(200);
  }

  validate();

};

module.exports = ChatInjection;
