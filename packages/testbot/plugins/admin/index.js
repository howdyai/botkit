module.exports = function(botkit) {
    return {
        name: 'Botkit Admin',
        menu: [
            {
                title: 'Home',
                icon: '🤖',
                url: '/admin/',
            }
        ],
        web: [
            {
                method: 'get',
                url: '/admin',
                handler: (req, res) => {
                    res.render(
                        botkit.plugins.localView(__dirname + '/views/admin.hbs')
                    );
                }
            }
        ]
    }
}