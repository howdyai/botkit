var raw_utterences = require('./utterances.json');
module.exports.getUtterances = function() {
    var utterances = {};
    for (var k in raw_utterences) {
        if (raw_utterences.hasOwnProperty(k)) {
            utterances[k] = new RegExp(raw_utterences[k], 'i');
        }
    }
    return utterances;
};
