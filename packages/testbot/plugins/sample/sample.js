module.exports = function(botkit) {
    return {
        name: 'sample plugin',
        menu: [{
            title: 'Sample Plugin',
            url: '/admin/sample',
            icon: '❤️'
        }],
        middleware: [],
        web: [{
           url: '/admin/sample',
           method: 'get',
           handler: function(req, res) {
               res.render(
                   botkit.plugins.localView(__dirname + '/views/sample.hbs'),
                   {}
               );
           }
        }],
        init: function(botkit) {
            console.log('INITIALIZING ', this.name);
            botkit.plugins.publicFolder('/plugins',__dirname + '/public');
        }
    }
}