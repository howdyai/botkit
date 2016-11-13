declare module botkit {
    interface Utterances {
        yes: RegExp;
        no: RegExp;
        quit: RegExp;
    }
    class Controller {
        events: { [event: string]: Function };
        config: Configuration;
        tasks: Task[];
        taskCount: number;
        convoCount: number;
        memory_store: {
            users: { [id: string]: User };
            channels: { [id: string]: Channel };
            teams: { [id: string]: Team };
        };
        utterances: Utterances;
        middleware: {
            send: any;
            receive: any;
            spawn: any;
        };
        storage: SlackStorage;
        worker: (botkit: Controller, config: Configuration) => void;
        // logger
        logger: { log: (logLevel: string, ...data: any[]) => void };
        log: {
            (...params: any[]): void;
            emerg(...params: any[]): void;
            alert(...params: any[]): void;
            crit(...params: any[]): void;
            error(...params: any[]): void;
            warning(...params: any[]): void;
            notice(...params: any[]): void;
            info(...params: any[]): void;
            debug(...params: any[]): void;
        }
        webserver: Express.Application;

        constructor(configuration: Configuration);
        hears_regexp(tests: string[] | RegExp[], message: Message): boolean;
        changeEars(new_test): never;
        spawn(team);
        hears(pattern: string | string[], modes: string | string[], callback: (bot: Bot, message: Message) => void);
        hears(pattern: string | string[], modes: string | string[], middleware: () => void, callback: (bot: Bot, message: Message) => void);
        on(event: string, callback: (bot: Bot, message: Message) => void);
        trigger(event: string, data): void;
        startConversation(bot: Bot, message: Message, cb: (err: Error, convo: Conversation) => void): never;
        createConversation(bot: Bot, message: Message, cb: (err: Error, convo: Conversation) => void): never;
        defineBot(unit: Function): never;
        spawn(config: Conversation, cb: Function): Function;
        startTicking(): never;
        shutdown(): never;
        startTask(bot: Bot, message: Message, cb: (task: Task, convo: Conversation) => void): Task;
        receiveMessage(bot: Bot, message: Message): never;
        tick(): never;

        configureSlackApp(slack_app_config: { clientId: string, clientSecret: string, scopes: string[] }, cb: () => void): Controller;
        createHomepageEndpoint(webserver: Express.Application): Controller;
        secureWebhookEndpoints();
        createWebhookEndpoints(webserver: Express.Application, authenticationTokens?: string[]): Controller;
        saveTeam(team: Team, cb?: (err: Error, data: any) => void): never;
        findTeamById(id: string, cb: (err: Error, data: Team) => void): never;
        setupWebserver(port: number, cb: (err: Error, webserver: Express.Application) => void): Controller;
        getAuthorizeURL(team_id: string): string;
        createOauthEndpoints(webserver: Express.Application, callback: (err: Error, req: any, res: any) => void): Controller;
        handleSlackEvents(): never;
    }
    interface Attachment {
        fallback: string;
        color: string;
        pretext?: string;
        author_name?: string;
        author_link?: string;
        author_icon?: string;
        title?: string;
        title_link?: string;
        text?: string;
        fields?: {
            title: string;
            value: string;
            short: boolean;
        }[];
        image_url?: string;
        thumb_url?: string;
        footer?: string;
        footer_icon?: string;
        ts: number;
    }
    type MessageType = 'message' |
        'bot_message' |
        'channel_archive' |
        'channel_join' |
        'channel_leave' |
        'channel_name' |
        'channel_purpose' |
        'channel_topic' |
        'channel_unarchive' |
        'file_comment' |
        'file_mention' |
        'file_share' |
        'group_archive' |
        'group_join' |
        'group_leave' |
        'group_name' |
        'group_purpose' |
        'group_topic' |
        'group_unarchive' |
        'me_message' |
        'message_changed' |
        'message_deleted' |
        'pinned_item' |
        'unpinned_item';
    interface Message {
        type: MessageType;
        subtype?: string;
        channel: string;
        text: string;
        user: string;
        ts: string;
    }
    interface User {
        id: string;
        team_id: string;
        user: string;
    }
    interface Channel {
        id: string;
    }
    interface Team {
        id: string;
        createdBy: string;
        url: string;
        name: string;
    }
    type LogLevel = 'debug' | 'info' | 'error';
    interface Storage {
        get(data: any, callback: (err: Error, data: any) => void): void;
        save(id: any, callback: (err: Error, data: any[]) => void): void;
        all(callback: (err: Error, data: any[]) => void): void;
    }
    interface SlackStorage {
        teams: Storage;
        users: Storage;
        channels: Storage;
    }
    interface Configuration {
        logLevel?: LogLevel;
        debug?: boolean;
        log?: boolean;
        logger?: { log: (logLevel: string, ...data: any[]) => void };
        storage?: SlackStorage;
        json_file_store?: string;
        retry?: number;
        incoming_webhook?: {
            url: string;
        };
        token?: string;
        clientId?: string;
        clientSecret?: string;
        redirectUri?: string;
        scopes?: string[];
    }
    type ApiMethod = (data: any, cb: (err: string | Error, response: any) => void) => never;
    interface WebAPI {
        api_url: string;
        auth: {
            test: ApiMethod;
        },
        oauth: {
            access: ApiMethod;
        }
        channels: {
            archive: ApiMethod;
            create: ApiMethod;
            history: ApiMethod;
            info: ApiMethod;
            invite: ApiMethod;
            join: ApiMethod;
            kick: ApiMethod;
            leave: ApiMethod;
            list: ApiMethod;
            mark: ApiMethod;
            rename: ApiMethod;
            setPurpose: ApiMethod;
            setTopic: ApiMethod;
            unarchive: ApiMethod;
        };
        chat: {
            delete: ApiMethod;
            postMessage: ApiMethod;
            update: ApiMethod;
        };
        dnd: {
            endDnd: ApiMethod;
            endSnooze: ApiMethod;
            info: ApiMethod;
            setSnooze: ApiMethod;
            teamInfo: ApiMethod;
        };
        emoji: {
            list: ApiMethod;
        };
        files: {
            delete: ApiMethod;
            info: ApiMethod;
            list: ApiMethod;
            upload: ApiMethod;
        };
        groups: {
            archive: ApiMethod;
            close: ApiMethod;
            create: ApiMethod;
            createChild: ApiMethod;
            history: ApiMethod;
            info: ApiMethod;
            invite: ApiMethod;
            kick: ApiMethod;
            leave: ApiMethod;
            list: ApiMethod;
            mark: ApiMethod;
            open: ApiMethod;
            rename: ApiMethod;
            setPurpose: ApiMethod;
            setTopic: ApiMethod;
            unarchive: ApiMethod;
        };
        im: {
            close: ApiMethod;
            history: ApiMethod;
            list: ApiMethod;
            mark: ApiMethod;
            open: ApiMethod;
        };
        mpim: {
            close: ApiMethod;
            history: ApiMethod;
            list: ApiMethod;
            mark: ApiMethod;
            open: ApiMethod;
        };
        pins: {
            add: ApiMethod;
            list: ApiMethod;
            remove: ApiMethod;
        };
        reactions: {
            add: ApiMethod;
            get: ApiMethod;
            list: ApiMethod;
            remove: ApiMethod;
        };
        rtm: {
            start: ApiMethod;
        };
        search: {
            all: ApiMethod;
            files: ApiMethod;
            messages: ApiMethod;
        };
        stars: {
            add: ApiMethod;
            list: ApiMethod;
            remove: ApiMethod;
        };
        team: {
            accessLogs: ApiMethod;
            info: ApiMethod;
        };
        users: {
            getPresence: ApiMethod;
            info: ApiMethod;
            list: ApiMethod;
            setActive: ApiMethod;
        };
        callAPI(command: string, data: any, cb: (err: string | Error, response: any) => void): never;
        callAPIWithoutToken(command: string, data: any, cb: (err: string | Error, response: any) => void): never;
    }
    class Bot {
        type: string;
        botkit: Controller;
        config: Configuration;
        utterances: Utterances;
        api: WebAPI;
        identity: {
            id: string;
            name: string;
        };

        constructor(controller: Controller, config: Configuration);
        configureIncomingWebhook(options: { url: string }): Bot;
        sendWebhook(options, cb): any;
        configureRTM(config): Bot;
        closeRTM(err: Error): never;
        reconnect(err: Error): any;
        destroy(): never;
        startRTM(cb: (err: string | Error, bot: Bot, res) => void): Bot;
        identifyBot(cb: (err: string | Error, data) => void): any;
        identifyTeam(cb: (err: string | Error, id: string) => void): string;
        startPrivateConversation(message: Message, cb: (err: Error, convo: Conversation) => void): never;
        startConversation(message: Message, cb: (err: Error, convo: Conversation) => void): never;
        createConversation(message: Message, cb: (err: Error, convo: Conversation) => void): never;
        private _startDM(task: Task, user_id: string, cb: Function): any;
        send(message: Message, cb: (err?: string | Error) => void): never;
        replyAcknowledge(cb: (err?: string | Error) => void): never;
        replyPublic(src: any, resp: string, cb: (err?: string | Error) => void): never;
        replyPublicDelayed(src: any, resp: string, cb: (err?: string | Error) => void): never;
        replyPrivate(src: any, resp: string, cb: (err?: string | Error) => void): never;
        replyPrivateDelayed(src: any, resp: string, cb: (err?: string | Error) => void): never;
        replyInteractive(src: any, resp: string, cb: (err?: string | Error) => void): never;
        reply(src: Message, resp: string);
        reply(src: Message, resp: string, cb?: (err?: string | Error) => void): never;
        say(message: Message, cb?: (err?: string | Error) => void): never;
        startTyping(src: any): never;
        replyWithTyping(src: any, resp: string, cb: (err?: string | Error) => void): never;
        replyAndUpdate(src: any, resp: string, cb: (err?: string | Error) => void): never;
        findConversation(message: Message, cb?: () => void): never;
    }
    type Status = 'new' | 'completed' | 'active' | 'inactive' | 'ending' | 'stopped';
    class Conversation {
        messages: Message[];
        sent: Message[];
        transcript: any[];
        context: {
            user: User;
            channel: Channel;
            bot: Bot;
        };
        events: { [event: string]: Function }
        vars: any;
        status: Status;
        task: Task;
        source_message: Message;
        handler: any;
        responses: any;
        capture_options: any;
        startTime: Date;
        lastActive: Date;

        constructor(task: Task, message: Message);
        collectResponse(key, value): never;
        capture(response): never;
        handle(message: Message): void;
        setVar(field, value): never;
        activate(): never;
        /**
         * active includes both ACTIVE and ENDING
         * in order to allow the timeout end scripts to play out
         **/
        isActive(): boolean;
        deactivate(): never;
        say(message: string | Message): never;
        sayFirst(message: string | Message): never;
        on(event: string, cb: Function): never;
        trigger(event: string, data): void;
        /**
         * proceed to the next message after waiting for an answer
         */
        next(): never;
        repeat(): never;
        silentRepeat(): never;
        addQuestion(message: Message, cb: Function, capture_options, thread): never;
        ask(message: Message, cb: Function, capture_options): never;
        addMessage(message: Message, thread): never;
        /**
         * how long should the bot wait while a user answers? 
         */
        setTimeout(timeout: number): never;
        /**
         * For backwards compatibility, wrap gotoThread in its previous name
         */
        changeTopic(topic): never;
        hasThread(thread): boolean;
        gotoThread(thread): never;
        combineMessages(messages: Message[]): string;
        getResponses(): any;
        getResponsesAsArray(): any[];
        extractResponses(): { [key: string]: string };
        extractResponse(key: string): string;
        replaceAttachmentTokens(attachments: any[]): any[];
        replaceTokens(text: string): any;
        stop(status): never;
        /**
         * was this conversation successful?
         * return true if it was completed
         * otherwise, return false
         * false could indicate a variety of failed states:
         * manually stopped, timed out, etc
         */
        successful(): boolean;
        cloneMessage(message: Message): Message;
        tick(): never;
    }
    class Task {
        id: number;
        convos: Conversation[];
        botkit: Controller;
        bot: Bot;
        events: { [event: string]: Function };
        source_message: Message;
        status: Status;
        startTime: Date;

        constructor(bot: Bot, message: Message, botkit: Controller);
        isActive(): boolean;
        createConversation(message: Message): Conversation;
        startConversation(message: Message): Conversation;
        conversationEnded(convo: Conversation): never;
        endImmediately(reason): never;
        taskEnded(): never;
        on(event: string, cb: Function): Task;
        trigger(event: string, data): void;
        getResponsesByUser(): any;
        getResponsesBySubject(): any;
        tick(): never;
    }
}