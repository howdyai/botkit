var base64 = require('base-64');
var utf8 = require('utf8');

var ChatInjection = function (config, cb) {
  return function(req,res) {

    var encode = function(str) {
      var bytes = utf8.encode(str);
      return base64.encode(bytes);
    };

    var decode = function(token) {
      try {
        var bytes = base64.decode(token);
        return utf8.decode(bytes);
      } catch (e) {
        return e
      }
      
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

    var processDecodedToken = function(token) {
      if (!validToken(decodedToken)) {
        return res.sendStatus(403);
      }

      if (!validHost()){
        return res.sendStatus(403);
      }

      if (cb) {
        return cb(res);
      }
      
      return res.sendStatus(200);
    }

    var validate = function() {
      try {
        var decodedToken = decode(req.query.token);
        processDecodedToken(decodedToken);
      } catch (e) {
        return res.sendStatus(403);
      }
    }

    validate();
  }

};

module.exports = ChatInjection;
