
* Do we need a custom conversation state manager so that it can generate more sophisticated keys
 (slack conversations need to be keyed off of a combo of team-channel-user-thread, for example)

 * Slack @mention dereferencing requires capturing the bot user id and bot id at oauth or at launch
-> Multi-team slack loses its team API on send/can't find reference

 * Can we refactor controller to be a big master plan that runs itself? then you can do controller.hears OR controller.addPlan(new plan())!

