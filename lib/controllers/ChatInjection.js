var base64 = require('base-64');
var utf8 = require('utf8');

var ChatInjection = function (config) {
  return function(req,res) {

    var encode = function(str) {
      var bytes = utf8.encode(str);
      return base64.encode(bytes);
    };

    var decode = function(token) {
      var bytes = base64.decode(token);
      return utf8.decode(bytes);
    }

    var validToken = function(decodedToken) {

      if (decodedToken === config.id) {
        return true;
      }

      return false;
    }

    var validHost = function() {
      var host = req.get('host');
      var ip = req.get('x-forwarded-for');
      
      if (!!config.host.indexOf(host)) {
        return true;
      }

      if (!!config.ip.indexOf(ip)) {
        return true;
      }

      return false;
    }

    var validate = function() {

      var decodedToken = decode(req.query.token);

      if (!validToken(decodedToken)) {
        return res.sendStatus(403);
      }

      if (!validHost()){
        return res.sendStatus(403);
      }

      return res.sendStatus(200);
    }

    validate();
  }

};

module.exports = ChatInjection;
