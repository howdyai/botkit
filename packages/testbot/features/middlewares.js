module.exports = function(controller) {

    controller.middleware.receive.use((bot, message, next) => {
        console.log('IN > ', message.text, message.type);
        next();
    });

    controller.middleware.send.use((bot, message, next) => {
        console.log('OUT > ', message.text, message.channelData && message.channelData.quick_replies ? message.channelData.quick_replies : null, message.channelData && message.channelData.attachments ? message.channelData.attachments : null);
        next();
    });

    controller.middleware.ingest.use(async (bot, message, next) => {
        message.touchedbyMiddleware = true;
        next();
    });

}