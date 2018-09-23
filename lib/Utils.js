var raw_utterances = require('./utterances.json');
module.exports.getUtterances = function() {
    var utterances = {};
    for (var k in raw_utterances) {
        if (raw_utterances.hasOwnProperty(k)) {
            utterances[k] = new RegExp(raw_utterances[k], 'i');
        }
    }
    return utterances;
};
