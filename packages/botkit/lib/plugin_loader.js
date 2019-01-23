"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug = require('debug')('botkit:plugins');
const path = require("path");
const express = require("express");
class BotkitPluginLoader {
    constructor(botkit) {
        this.botkit = botkit;
        this.menu = [];
        this.plugins = [];
        if (botkit.webserver) {
            botkit.webserver.use((req, res, next) => {
                // Expose the modified menu and plugin list to the Express view renderer
                res.locals.menu = this.menu;
                res.locals.plugins = this.plugins;
                next();
            });
        }
    }
    use(plugin_or_function) {
        let plugin;
        if (typeof (plugin_or_function) == 'function') {
            plugin = plugin_or_function(this.botkit);
        }
        else {
            plugin = plugin_or_function;
        }
        try {
            this.register(plugin.name, plugin);
        }
        catch (err) {
            console.error('ERROR IN PLUGIN REGISTER', err);
        }
    }
    register(name, endpoints) {
        debug('Enabling plugin: ', name);
        if (this.plugins.indexOf(name) >= 0) {
            debug('Plugin already enabled:', name);
            return;
        }
        this.plugins.push(name);
        // register all the web endpoints
        if (endpoints.web && this.botkit.getConfig('authFunction')) {
            for (var e = 0; e < endpoints.web.length; e++) {
                var endpoint = endpoints.web[e];
                switch (endpoint.method.toLowerCase()) {
                    case 'get':
                        this.botkit.webserver.get(endpoint.url, endpoint.handler);
                        break;
                    case 'post':
                        this.botkit.webserver.post(endpoint.url, endpoint.handler);
                        break;
                    // TODO: other http methods
                }
            }
        }
        // register menu extensions
        if (endpoints.menu) {
            for (var e = 0; e < endpoints.menu.length; e++) {
                var endpoint = endpoints.menu[e];
                this.menu.push({
                    title: endpoint.title,
                    icon: endpoint.icon,
                    url: endpoint.url
                });
            }
        }
        if (endpoints.middlewares) {
            for (var mw in endpoints.middlewares) {
                for (var e = 0; e < endpoints.middlewares[mw].length; e++) {
                    this.botkit.middleware[mw].use(endpoints.middlewares[mw][e]);
                }
            }
        }
        if (endpoints.init) {
            try {
                endpoints.init(this.botkit);
            }
            catch (err) {
                if (err) {
                    throw new Error(err);
                }
            }
        }
        debug('Plugin Enabled: ', name);
    }
    publicFolder(alias, path) {
        this.botkit.webserver.use(alias, express.static(path));
    }
    localView(path_to_view) {
        return path.relative(this.botkit.PATH + '/../views', path_to_view);
    }
}
exports.BotkitPluginLoader = BotkitPluginLoader;
//# sourceMappingURL=plugin_loader.js.map