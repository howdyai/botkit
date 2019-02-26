/**
 * @module botkit
 */
import { Botkit } from ".";
interface PluginMenu {
    title: string;
    icon?: string;
    url: string;
}
interface PluginWebEndpoint {
    url: string;
    method: string;
    handler: (req: any, res: any) => void;
}
export interface BotkitPlugin {
    name: string;
    web?: PluginWebEndpoint[];
    menu?: PluginMenu[];
    middlewares?: {};
    init?: (botkit: Botkit) => void;
}
export declare class BotkitPluginLoader {
    botkit: Botkit;
    private menu;
    private plugins;
    constructor(botkit: any);
    use(plugin_or_function: (botkit: Botkit) => BotkitPlugin | BotkitPlugin): void;
    register(name: any, endpoints: BotkitPlugin): void;
    publicFolder(alias: any, path: any): void;
    localView(path_to_view: any): string;
}
export {};
