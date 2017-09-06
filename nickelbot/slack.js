var Botkit = require('../lib/Botkit.js');

class SlackBot {
    constructor(token, debug) {
        this.peerReviewChannel = 'C4EAZ302Y';
        var Botkit = require('../lib/Botkit.js');
        this.controller = Botkit.slackbot({
            debug: Boolean(debug)
        });
        this.bot = this.controller.spawn({
            token: token
        }).startRTM();
        this.registerHandlers();
    }

    stubFunction(callback) {
        callback([{
                "merge_request": {
                    "id":12,
                    "url": "http://example.com/diaspora/merge_requests/1",
                    "target_branch": "master",
                    "source_branch": "ms-viewport",
                    "created_at": "2013-12-03T17:23:34Z",
                    "updated_at": "2013-12-03T17:23:34Z",
                    "title": "MS-Viewport",
                    "description": "",
                    "status":"open",
                    "work_in_progress": false
                },
                "last_commit": {
                    "id": "da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
                    "message": "fixed readme",
                    "timestamp": "2012-01-03T23:36:29+02:00",
                    "url": "http://example.com/awesome_space/awesome_project/commits/da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
                    "author": {
                        "name": "GitLab dev user",
                        "email": "gitlabdev@dv6700.(none)"
                    }
                },
                "project": {
                    "name":"Awesome Project",
                    "namespace":"Awesome Space"
                },
                "author": {
                    "name": "Administrator",
                    "username": "root"
                },
                "asignee": {
                    "claimed_on_slack":false,
                    "name": "User1",
                    "username": "user1"
                }
            }]
        );
    }

    /**
     * function parseRequestBody
     * param mergeRequest: the json object provided by the gitlab webhook
     */
    parseRequestBody(mergeRequest) {
        let formattedResponse = {};
        let attr = mergeRequest.object_attributes;
        formattedResponse.merge_request = {
            "id": attr.id,
            "url": attr.source.url,
            "target_branch": attr.target_branch,
            "source_branch": attr.source_branch,
            "created_at": attr.created_at,
            "updated_at": attr.updated_at,
            "title": attr.title,
            "description": attr.description,
            "status": attr.merge_status,
            "work_in_progress": attr.work_in_progress
        };
        let commit = attr.last_commit;
        formattedResponse.last_commit = {
            "id": commit.id,
            "message": commit.message,
            "timestamp": commit.timestamp,
            "url": commit.url,
            "author": commit.author
        };
        formattedResponse.project = {
            "name": attr.target.name,
            "namespace": attr.target.namespace
        };
        formattedResponse.author = {
            "name": mergeRequest.user.name,
            "username": mergeRequest.user.username
        }
        formattedResponse.assignee = {
            "claimed_on_slack": false,
            "name": attr.assignee.name,
            "username": attr.assignee.username
        }
        return formattedResponse;
    }

    /**
     * function listOpenRequest
     * param bot: bot to use to send the requests (optional)
     * param message: message that requested the list (optional)
     */
    listOpenRequests(bot, message) {
        bot = bot || this.bot;
        var channel = (message && message.channel) || this.peerReviewChannel;
        //TODO: replace with actual function
        this.stubFunction(function(openRequests) {
            var response = 'Open Requests:';
            var i = 0;
            openRequests.forEach(function(request) {
                i++;
                response += '\n' + i + '.  ';
                response += '<' + request.merge_request.url + '|' + request.merge_request.title + ' in ' + request.project.namespace +
                    '/' + request.project.name + ' by ' + request.author.name + '>';
            });
            bot.api.chat.postMessage({
                channel: channel,
                text: response,
                as_user: true
            });
        });

    }
    /**
     * function displayNewRequest
     * param request: merge request to list
     */
    displayNewRequest(request) {
        var response = 'New request:\n<' + request.merge_request.url + '|' + request.merge_request.title + ' in ' +
            request.project.namespace + '/' + request.project.name + ' by ' + request.author.name + '>';
            this.bot.api.chat.postMessage({
                channel: this.peerReviewChannel,
                text: response,
                as_user: true
            });
    }

    registerHandlers() {
        this.controller.hears(['open requests', 'open request', 'list open'],
            'direct_message,direct_mention,mention,message_received',
            this.listOpenRequests.bind(this));
    }
}

module.exports = SlackBot;
