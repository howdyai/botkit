controller object

  * controller.spawn

  * controller.on
  * controller.hears

  controller.log
  controller.debug

Conversation Object:

  * convo.say
  * convo.ask
  * convo.sayFirst
  * convo.next
  * convo.repeat
  * convo.stop

  * convo.on

  * convo.silentRepeat
  * convo.extractResponses
  * convo.extractResponse


Storage Object:


slack bot object:

  * bot.reply
  * bot.startConversation
  * bot.startPrivateConversation
  * bot.say

  * bot.replyPublic
  * bot.replyPublicDelayed
  * bot.replyPrivate
  * bot.replyPrivateDelayed

  * bot.identifyTeam
  * bot.identifyBot

  * bot.startRTM
  * bot.closeRTM

  * bot.sendWebhook
  * bot.configureIncomingWebhook

  * bot.api

slack app controller:

  controller.configureSlackApp

  * controller.setupWebserver
  controller.createHomepageEndpoint
  * controller.createWebhookEndpoints
  * controller.createOauthEndpoints
  controller.getAuthorizeURL

  controller.saveTeam
  controller.findTeamById
