var SDK = require('botkit-studio-sdk');

module.exports = function(controller) {
    var before_hooks = {};
    var after_hooks = {};
    var answer_hooks = {};
    var thread_hooks = {};

    // define a place for the studio specific features to live.
    controller.studio = {};

    /*
     * ----------------------------------------------------------------
     * Botkit Studio Script Services
     * The features in this section grant access to Botkit Studio's
     * script and trigger services
     * ----------------------------------------------------------------
     */


    function genConfig(bot) {
        var config = {};

        if (bot.config && bot.config.studio_token) {
            config.studio_token = bot.config.studio_token;
        }

        if (bot.config && bot.config.studio_command_uri) {
            config.studio_command_uri = bot.config.studio_command_uri;
        }

        if (controller.config && controller.config.studio_token) {
            config.studio_token = controller.config.studio_token;
        }

        if (controller.config && controller.config.studio_command_uri) {
            config.studio_command_uri = controller.config.studio_command_uri;
        }

        return config;
    }

    controller.studio.evaluateTrigger = function(bot, text) {

        var sdk = new SDK(genConfig(bot));
        return sdk.evaluateTrigger(text);

    };

    // get Botkit Studio identity
    controller.studio.identify = function(bot) {
        var sdk = new SDK(genConfig(bot || {}));
        return sdk.identify();
    };

    // get command list
    controller.studio.getScripts = function(bot, tag) {
        var sdk = new SDK(genConfig(bot || {}));
        return sdk.getScripts(tag);
    };

    /*
     * create a simple script
     * with a single trigger and single reply
     */
    controller.studio.createScript = function(bot, trigger, text) {
        var sdk = new SDK(genConfig(bot || {}));
        return sdk.createScript(trigger, text);
    };

    // load a script from the pro service
    controller.studio.getScriptById = function(bot, id) {
        var sdk = new SDK(genConfig(bot));
        return sdk.getScriptById(id);
    };

    // load a script from the pro service
    controller.studio.getScript = function(bot, text) {
        var sdk = new SDK(genConfig(bot));
        return sdk.getScript(text);
    };


    // these are middleware functions
    controller.studio.validate = function(command_name, key, func) {

        if (!answer_hooks[command_name]) {
            answer_hooks[command_name] = [];
        }
        if (key && !answer_hooks[command_name][key]) {
            answer_hooks[command_name][key] = [];
        }

        answer_hooks[command_name][key].push(func);

        return controller.studio;
    };


    controller.studio.beforeThread = function(command_name, thread_name, func) {

        if (!thread_hooks[command_name]) {
            thread_hooks[command_name] = [];
        }
        if (thread_name && !thread_hooks[command_name][thread_name]) {
            thread_hooks[command_name][thread_name] = [];
        }

        thread_hooks[command_name][thread_name].push(func);

        return controller.studio;
    };



    controller.studio.before = function(command_name, func) {

        if (!before_hooks[command_name]) {
            before_hooks[command_name] = [];
        }

        before_hooks[command_name].push(func);

        return controller.studio;
    };

    controller.studio.after = function(command_name, func) {

        if (!after_hooks[command_name]) {
            after_hooks[command_name] = [];
        }

        after_hooks[command_name].push(func);

        return controller.studio;

    };

    function runHooks(hooks, convo, cb) {

        if (!hooks || !hooks.length) {
            return cb(convo);
        }

        var func = hooks.shift();

        func(convo, function() {
            if (hooks.length) {
                runHooks(hooks, convo, cb);
            } else {
                return cb(convo);
            }
        });
    }


    /*
     * Fetch a script from Botkit Studio by name, then execute it.
     * returns a promise that resolves when the conversation is loaded and active
     */
    controller.studio.run = function(bot, input_text, user, channel, original_message) {

        return new Promise(function(resolve, reject) {
            controller.studio.get(bot, input_text, user, channel, original_message).then(function(convo) {
                convo.activate();
                resolve(convo);
            }).catch(function(err) {
                reject(err);
            });
        });

    };

    /*
     * Fetch a script from Botkit Studio by name, but do not execute it.
     * returns a promise that resolves when the conversation is loaded
     * but developer still needs to call convo.activate() to put it in motion
     */
    controller.studio.get = function(bot, input_text, user, channel, original_message) {
        var context = {
            text: input_text,
            user: user,
            channel: channel,
            raw_message: original_message ? original_message.raw_message : null,
            original_message: original_message || null
        };
        return new Promise(function(resolve, reject) {
            controller.studio.getScript(bot, input_text).then(function(command) {
                if (command !== {} && command.id) {
                    controller.trigger('command_triggered', [bot, context, command]);

                    // make the script source information from Botkit Studio available to Botkit's convo object
                    context.script_name = command.command;
                    context.script_id = command._id;

                    controller.studio.compileScript(
                        bot,
                        context,
                        command
                    ).then(function(convo) {
                        convo.on('end', function(convo) {
                            runHooks(
                                after_hooks[command.command] ? after_hooks[command.command].slice() : [],
                                convo,
                                function(convo) {
                                    controller.trigger('remote_command_end', [bot, context, command, convo]);
                                }
                            );
                        });
                        runHooks(
                            before_hooks[command.command] ? before_hooks[command.command].slice() : [],
                            convo,
                            function(convo) {
                                resolve(convo);
                            }
                        );
                    }).catch(function(err) {
                        reject(err);
                    });
                } else {
                    reject('Script not found');
                }
            }).catch(function(err) {
                reject(err);
            });
        });
    };

    /*
     * Fetch a script from Botkit Studio by id, but do not execute it.
     * returns a promise that resolves when the conversation is loaded
     * but developer still needs to call convo.activate() to put it in motion
     */
    controller.studio.getById = function(bot, id, user, channel, original_message) {
        var context = {
            id: id,
            user: user,
            channel: channel,
            raw_message: original_message ? original_message.raw_message : null,
            original_message: original_message || null
        };
        return new Promise(function(resolve, reject) {
            controller.studio.getScriptById(bot, id).then(function(command) {
                if (command !== {} && command.id) {
                    controller.trigger('command_triggered', [bot, context, command]);

                    // make the script source information from Botkit Studio available to Botkit's convo object
                    context.script_name = command.command;
                    context.script_id = command._id;

                    controller.studio.compileScript(
                        bot,
                        context,
                        command
                    ).then(function(convo) {
                        convo.on('end', function(convo) {
                            runHooks(
                                after_hooks[command.command] ? after_hooks[command.command].slice() : [],
                                convo,
                                function(convo) {
                                    controller.trigger('remote_command_end', [bot, context, command, convo]);
                                }
                            );
                        });
                        runHooks(
                            before_hooks[command.command] ? before_hooks[command.command].slice() : [],
                            convo,
                            function(convo) {
                                resolve(convo);
                            }
                        );
                    }).catch(function(err) {
                        reject(err);
                    });
                } else {
                    reject('Script not found');
                }
            }).catch(function(err) {
                reject(err);
            });

        });
    };

    controller.studio.runTrigger = function(bot, input_text, user, channel, original_message) {
        var context = {
            text: input_text,
            user: user,
            channel: channel,
            raw_message: original_message ? original_message.raw_message : null,
            original_message: original_message || null
        };
        return new Promise(function(resolve, reject) {
            controller.studio.evaluateTrigger(bot, input_text).then(function(command) {
                if (command !== {} && command.id) {
                    controller.trigger('command_triggered', [bot, context, command]);

                    // make the script source information from Botkit Studio available to Botkit's convo object
                    context.script_name = command.command;
                    context.script_id = command._id;

                    controller.studio.compileScript(
                        bot,
                        context,
                        command
                    ).then(function(convo) {

                        convo.on('end', function(convo) {
                            runHooks(
                                after_hooks[command.command] ? after_hooks[command.command].slice() : [],
                                convo,
                                function(convo) {
                                    controller.trigger('remote_command_end', [bot, context, command, convo]);
                                }
                            );
                        });

                        runHooks(
                            before_hooks[command.command] ? before_hooks[command.command].slice() : [],
                            convo,
                            function(convo) {
                                convo.activate();
                                resolve(convo);
                            }
                        );
                    }).catch(function(err) {
                        reject(err);
                    });
                } else {
                    /*
                     * return with no conversation
                     * allow developer to run a default script
                     */
                    resolve(null);
                }
            }).catch(function(err) {
                reject(err);
            });
        });

    };


    controller.studio.testTrigger = function(bot, input_text) {
        return new Promise(function(resolve, reject) {
            controller.studio.evaluateTrigger(bot, input_text).then(function(command) {
                if (command !== {} && command.id) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch(function(err) {
                reject(err);
            });
        });

    };


    controller.studio.compileScript = function(bot, message, command) {
        function makeHandler(options, field) {
            var pattern = '';

            if (options.type == 'utterance') {
                pattern = controller.utterances[options.pattern];
            } else if (options.type == 'string') {
                var p = options.pattern;
                p = p.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                pattern = '^' + p + '$';
            } else if (options.type == 'regex') {
                pattern = options.pattern;
            }

            return {
                pattern: pattern,
                default: options.default,
                callback: function(response, convo) {
                    var hooks = [];
                    if (field.key && answer_hooks[command.command] && answer_hooks[command.command][field.key]) {
                        hooks = answer_hooks[command.command][field.key].slice();
                    }
                    if (options.action != 'wait' && field.multiple) {
                        convo.responses[field.key].pop();
                    }

                    runHooks(hooks, convo, function(convo) {
                        convo.handleAction(options);
                    });
                }
            };

        }

        return new Promise(function(resolve, reject) {
            bot.createConversation(message, function(err, convo) {

                if (err) {
                    return reject(err);
                }

                // 15 minute default timeout
                convo.setTimeout(controller.config.default_timeout || (15 * 60 * 1000));

                // process any variables values and entities that came pre-defined as part of the script
                if (command.variables && command.variables.length) {
                    for (var v = 0; v < command.variables.length; v++) {
                        if (command.variables[v].value) {

                            /*
                             * set the key/value as a mustache variable
                             * accessible as {{vars.name}} in the templates
                             */
                            convo.setVar(command.variables[v].name, command.variables[v].value);

                            /*
                             * also add this as an "answer" to a question
                             * thus making it available at {{responses.name}} and
                             * convo.extractResponse(name);
                             */
                            convo.responses[command.variables[v].name] = {
                                question: command.variables[v].name,
                                text: command.variables[v].value,
                            };
                        }
                    }
                }

                for (var t = 0; t < command.script.length; t++) {
                    var topic = command.script[t].topic;
                    for (var m = 0; m < command.script[t].script.length; m++) {

                        if (command.script[t].script[m].conditional) {

                            convo.addConditional({
                                conditional: command.script[t].script[m].conditional
                            }, topic);
                        } else {

                            var message = {};

                            if (command.script[t].script[m].text) {
                                message.text = command.script[t].script[m].text;
                            }

                            // handle platform specific fields
                            if (bot.type == 'ciscospark' || bot.type == 'webex') {
                                if (command.script[t].script[m].platforms && command.script[t].script[m].platforms.ciscospark) {
                                    // attach files.
                                    if (command.script[t].script[m].platforms.ciscospark.files) {
                                        message.files = [];
                                        for (var f = 0; f < command.script[t].script[m].platforms.ciscospark.files.length; f++) {
                                            message.files.push(command.script[t].script[m].platforms.ciscospark.files[f].url);
                                        }
                                    }
                                }
                            }

                            if (bot.type == 'web' || bot.type == 'socket') {
                                if (command.script[t].script[m].platforms && command.script[t].script[m].platforms.web) {
                                    // attach files.
                                    if (command.script[t].script[m].platforms.web.files) {
                                        message.files = [];
                                        for (var f = 0; f < command.script[t].script[m].platforms.web.files.length; f++) {

                                            // determine if this is an image or any other type of file.
                                            command.script[t].script[m].platforms.web.files[f].image =
                                              (command.script[t].script[m].platforms.web.files[f].url.match(/\.(jpeg|jpg|gif|png)$/i) != null);

                                            message.files.push(command.script[t].script[m].platforms.web.files[f]);
                                        }
                                    }
                                }
                            }


                            if (bot.type == 'teams') {
                                if (command.script[t].script[m].platforms && command.script[t].script[m].platforms.teams) {
                                    // create attachments in the Botkit message

                                    if (command.script[t].script[m].platforms && command.script[t].script[m].platforms.teams.attachmentLayout) {
                                        message.attachmentLayout = command.script[t].script[m].platforms && command.script[t].script[m].platforms.teams.attachmentLayout;
                                    }

                                    if (command.script[t].script[m].platforms.teams.attachments) {
                                        message.attachments = [];
                                        for (var a = 0; a < command.script[t].script[m].platforms.teams.attachments.length; a++) {
                                            var data = command.script[t].script[m].platforms.teams.attachments[a];
                                            var attachment = {};
                                            if (data.type == 'o365') {
                                                attachment.contentType = 'application/vnd.microsoft.card.O365Connector'; // + data.type,
                                                data['@type'] = 'MessageCard';
                                                data['@context'] = 'http://schema.org/extensions';
                                                delete(data.type);
                                                attachment.content = data;
                                            } else if (data.type != 'file') {
                                                attachment = bot.createAttachment(data.type, data);
                                            } else {
                                                attachment.contentType = data.contentType;
                                                attachment.contentUrl = data.contentUrl;
                                                attachment.name = data.name;

                                            }
                                            message.attachments.push(attachment);
                                        }
                                    }
                                }
                            }





                            // handle Slack attachments
                            if (command.script[t].script[m].attachments) {
                                message.attachments = command.script[t].script[m].attachments;


                                // enable mrkdwn formatting in all fields of the attachment
                                for (var a = 0; a < message.attachments.length; a++) {
                                    message.attachments[a].mrkdwn_in = ['text', 'pretext', 'fields'];
                                    message.attachments[a].mrkdwn = true;
                                }
                            }

                            // handle Facebook attachments
                            if (command.script[t].script[m].fb_attachment) {
                                var attachment = command.script[t].script[m].fb_attachment;
                                if (attachment.template_type) {
                                    if (attachment.template_type == 'button') {
                                        attachment.text = message.text;
                                    }
                                    message.attachment = {
                                        type: 'template',
                                        payload: attachment
                                    };
                                } else if (attachment.type) {
                                    message.attachment = attachment;
                                }

                                // blank text, not allowed with attachment
                                message.text = null;

                                // remove blank button array if specified
                                if (message.attachment.payload.elements) {
                                    for (var e = 0; e < message.attachment.payload.elements.length; e++) {
                                        if (!message.attachment.payload.elements[e].buttons || !message.attachment.payload.elements[e].buttons.length) {
                                            delete(message.attachment.payload.elements[e].buttons);
                                        }
                                    }
                                }

                            }

                            // handle Facebook quick replies
                            if (command.script[t].script[m].quick_replies) {
                                var options = command.script[t].script[m].quick_replies;
                                if (!message.quick_replies) {
                                    message.quick_replies = [];
                                }
                                for (var o = 0; o < options.length; o++) {
                                    message.quick_replies.push(options[o]);
                                }
                            }

                            // handle Facebook quick replies that are embedded in question options
                            if (command.script[t].script[m].collect) {

                                var options = command.script[t].script[m].collect.options || [];
                                if (options.length > 0) {
                                    for (var o = 0; o < options.length; o++) {
                                        if (options[o].fb_quick_reply) {
                                            if (!message.quick_replies) {
                                                message.quick_replies = [];
                                            }
                                            message.quick_replies.push({
                                                title: options[o].pattern,
                                                payload: options[o].fb_quick_reply_payload,
                                                image_url: options[o].fb_quick_reply_image_url,
                                                content_type: options[o].fb_quick_reply_content_type,
                                            });
                                        }
                                    }
                                }
                            }

                            if (command.script[t].script[m].action) {
                                message.action = command.script[t].script[m].action;
                                if (command.script[t].script[m].execute) {
                                    message.execute = command.script[t].script[m].execute;
                                }
                            }

                            // handle meta data
                            if (command.script[t].script[m].meta) {
                                for (var a = 0; a < command.script[t].script[m].meta.length; a++) {
                                    message[command.script[t].script[m].meta[a].key] = command.script[t].script[m].meta[a].value;
                                }
                            }

                            if (command.script[t].script[m].collect) {
                                // this is a question message
                                var capture_options = {};
                                var handlers = [];
                                var options = command.script[t].script[m].collect.options || [];
                                if (command.script[t].script[m].collect.key) {
                                    capture_options.key = command.script[t].script[m].collect.key;
                                }

                                if (command.script[t].script[m].collect.multiple) {
                                    capture_options.multiple = true;
                                }

                                var default_found = false;
                                for (var o = 0; o < options.length; o++) {
                                    var handler = makeHandler(options[o], capture_options);
                                    handlers.push(handler);
                                    if (options[o].default) {
                                        default_found = true;
                                    }
                                }

                                // make sure there is a default
                                if (!default_found) {
                                    handlers.push({
                                        default: true,
                                        callback: function(r, c) {

                                            runHooks(
                                                answer_hooks[command.command] ? answer_hooks[command.command].slice() : [],
                                                convo,
                                                function() {
                                                    c.next();
                                                }
                                            );
                                        }
                                    });
                                }

                                convo.addQuestion(message, handlers, capture_options, topic);

                            } else {

                                // this is a simple message
                                convo.addMessage(message, topic);
                            }
                        } // if !conditional
                    }

                    // add thread hooks if they have been defined.
                    if (thread_hooks[command.command] && thread_hooks[command.command][topic]) {
                        for (var h = 0; h < thread_hooks[command.command][topic].length; h++) {
                            convo.beforeThread(topic, thread_hooks[command.command][topic][h]);
                        }
                    }

                }

                resolve(convo);
            });
        });
    };

};
