var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var smsModel = new Schema({
  to: {type: String},
  from: {type: String},
  body: {type: String}
})

module.exports = mongoose.model('Sms', smsModel);
