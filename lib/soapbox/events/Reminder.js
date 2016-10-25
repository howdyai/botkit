function Reminder(soapbox)
{
    var soapbox = soapbox;

    /**
     * Listen for reminder events
     *
     * @access public
     * @param  object controller
     * @return void
     */
    this.listen = function(controller)
    {
        soapbox.getWebserver().post('/reminder', function (request, response) {
            var data    = request.body;
            var team    = getTeam(data);
            var user    = getUser(data);
            var message = getMessage(data);

            if (team !== false && user !== false) {
                controller.storage.teams.get(team, function(err, team) {
                    if (err) {
                        console.log(err);
                        serverRespond(response, 418, 'Not OK');
                        return;
                    }

                    var bot = controller.spawn(team);

                    bot.startPrivateConversation({user: user}, function(err, convo) {
                        convo.say(message);
                    });

                    serverRespond(response, 200, 'OK');
                });
            }
        });
    }

    /**
     * Get team id from request
     *
     * @private private
     * @param  object data
     * @return string the slack id for the team (Slack team not team team)
     */
    var getTeam = function(data)
    {
        return data.payload.team ? data.payload.team : false;
    }

    /**
     * Get user id from request
     *
     * @access private
     * @param  object data
     * @return string the slack id for the user to be messaged
     */
    var getUser = function(data)
    {
        return data.payload.user ? data.payload.user : false;
    }

    /**
     * Get the message to be sent to the user from the request
     *
     * @access private
     * @param  object data
     * @return string
     */
    var getMessage = function(data)
    {
        return data.payload.message ? data.payload.message : '';
    }

    /**
     * Respond to the request
     *
     * @access private
     * @param  object response
     * @param  int code]
     * @param  string message
     * @return void
     */
    var serverRespond = function(response, code, message)
    {
        response.status(code).send({code: code, message: message});
    }
}

module.exports = Reminder;
