/**
 * @module botkit
 */
import { Botkit } from '.';
var debug = require('debug')('botkit:plugins');

export interface BotkitPlugin {
    name: string;
    middlewares?: {};
    init?: (botkit: Botkit) => void;
}

export class BotkitPluginLoader {
    public botkit: Botkit;
    private plugins: string[]; 

    constructor(botkit) {
        this.botkit = botkit;
        this.plugins = [];
    }

    public use(plugin_or_function: (botkit: Botkit) => BotkitPlugin | BotkitPlugin) {
        let plugin: BotkitPlugin;
        if (typeof(plugin_or_function)=='function') {
            plugin = plugin_or_function(this.botkit);
        } else {
            plugin = plugin_or_function;
        }
        try {
            this.register(plugin.name, plugin);
        } catch(err) {
            console.error('ERROR IN PLUGIN REGISTER', err);
        }
    }
    
    public register(name, endpoints: BotkitPlugin) {

        console.log('Enabling plugin: ', name);
        if (this.plugins.indexOf(name) >= 0) {
            debug('Plugin already enabled:', name);
            return;
        }
        this.plugins.push(name);

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
            } catch(err) {
                if (err) {
                    throw new Error(err);
                }
            }
        }

        debug('Plugin Enabled: ', name);

    }
}
