module.exports = function(controller) {
    controller.hears('shutdown', 'message', async(bot, message) => {
        controller.shutdown();
    });

    controller.on('shutdown', async() => {
        console.log('SHUTTING DOWN APP!');
    });
}