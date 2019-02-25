/**
 * @module botkit
 */
import { Botkit } from ".";
export interface BotkitPlugin {
    name: string;
    web?: {
        url: string;
        method: string;
        handler: (req: any, res: any) => void;
    }[];
    menu?: {
        title: string;
        icon?: string;
        url: string;
    }[];
    middlewares?: {};
    init?: (botkit: Botkit) => void;
}
export declare class BotkitPluginLoader {
    botkit: Botkit;
    private menu;
    private plugins;
    constructor(botkit: any);
    use(plugin_or_function: (botkit: Botkit) => BotkitPlugin | BotkitPlugin): void;
    register(name: any, endpoints: any): void;
    publicFolder(alias: any, path: any): void;
    localView(path_to_view: any): string;
}
