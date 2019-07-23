/**
* this module if installed into a botkit v4+ app will enable "Bot Inspector" mode in Bot Framework Emulator
* This allows you to connect to the bot app running locally with emulator to inspect messages 
* as they come and go to the messaging platform.
* Read more here:
* https://github.com/Microsoft/botframework/blob/master/README.md#bot-inspector-new---preview
*/
// import botbuilder 4.4 library
const { InspectionMiddleware, InspectionState, BotFrameworkAdapter } = require('botbuilder');

module.exports = function(controller) {

    // Bot Framework inspection middleware allows you to debug from the emulator
    let inspectionState = new InspectionState(controller.storage);
    let inspector = new InspectionMiddleware(inspectionState, undefined, controller.conversationState);
    controller.adapter.use(inspector);

    controller.ready(function() {
        // create an alternate adapter
        const sidecar = new BotFrameworkAdapter();
        // use the same middleware instance!
        sidecar.use(inspector)
        
        // set up an alternate route for the emulator to connect to
        console.log(`Use the Bot Framework Emulator in Inspect mode: http://localhost:${ process.env.PORT || 3000 }/api/sidecar`);
        controller.webserver.post('/api/sidecar', (req, res) => {
            sidecar.processActivity(req, res, async(turnContext) => {
                // noop
            });
        });
    });

}