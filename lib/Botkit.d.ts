declare namespace botkit {
  function botframeworkbot(configuration: BotFrameworkConfiguration): BotFrameworkController;
  function consolebot(configuration: ConsoleConfiguration): ConsoleController;
  function facebookbot(configuration: FacebookConfiguration): FacebookController;
  function slackbot(configuration: SlackConfiguration): SlackController;
  function sparkbot(configuration: CiscoSparkConfiguration): CiscoSparkController;
  function twilioipmbot(configuration: TwilioIPMConfiguration): TwilioIPMController;
  function twiliosmsbot(configuration: TwilioSMSConfiguration): TwilioSMSController;
  interface Bot<S, M extends Message> {
    readonly botkit: Controller<S, M, this>;
    readonly identity: Identity;
    readonly utterances: {
      yes: RegExp;
      no: RegExp;
      quit: RegExp;
    };
    createConversation(message: M, cb: (err: Error, convo: Conversation<M>) => void): void;
    reply(src: M, resp: string | M, cb?: (err: Error, res: any) => void): void;
    startConversation(message: M, cb: (err: Error, convo: Conversation<M>) => void): void;
  }
  interface BotFrameworkBot extends Bot<BotFrameworkSpawnConfiguration, BotFrameworkMessage> {
  }
  interface BotFrameworkConfiguration extends Configuration {
  }
  interface BotFrameworkController extends Controller<BotFrameworkSpawnConfiguration, BotFrameworkMessage, BotFrameworkBot> {
    createWebhookEndpoints(webserver: any, bot: TwilioSMSBot, cb?: () => void): this;
  }
  interface BotFrameworkMessage extends Message {
  }
  interface BotFrameworkSpawnConfiguration {
    appId: string;
    appPassword: string;
  }
  interface Channel {
    id: string;
  }
  interface CiscoSparkBot extends Bot<CiscoSparkSpawnConfiguration, CiscoSparkMessage> {
    retrieveFile(url: string, cb: (err: Error, body: any) => void): void;
    retrieveFileInfo(url: string, cb: (err: Error, obj: any) => void): void;
    startPrivateConversation(message: CiscoSparkMessage, cb: (err: Error, convo: Conversation<CiscoSparkMessage>) => void): void;
    startPrivateConversationWithActor(message: CiscoSparkMessage, cb: (err: Error, convo: Conversation<CiscoSparkMessage>) => void): void;
    startPrivateConversationWithPersonId(personId: string, cb: (err: Error, convo: Conversation<CiscoSparkMessage>) => void): void;
  }
  interface CiscoSparkConfiguration extends Configuration {
    ciscospark_access_token: string;
    limit_to_domain?: string | string[];
    limit_to_org?: string;
    public_address: string;
    secret?: string;
    webhook_name?: string;
  }
  interface CiscoSparkController extends Controller<CiscoSparkSpawnConfiguration, CiscoSparkMessage, CiscoSparkBot> {
    createWebhookEndpoints(webserver: any, bot: CiscoSparkBot, cb?: () => void): this;
  }
  interface CiscoSparkMessage extends Message {
    actorId?: string;
    data?: {
      personDisplayName: string;
    };
    files?: any[];
    markdown?: string;
    original_message?: CiscoSparkMessage;
  }
  interface CiscoSparkSpawnConfiguration {
  }
  interface Configuration {
    debug?: boolean;
    hostname?: string;
    json_file_store?: string;
    log?: boolean;
    logger?: { log: Function; };
    storage?: {
      users: Storage<User>;
      channels: Storage<Channel>;
      teams: Storage<Team>;
    };
    studio_token?: string;
  }
  interface ConsoleBot extends Bot<ConsoleSpawnConfiguration, ConsoleMessage> {
  }
  interface ConsoleConfiguration extends Configuration {
  }
  interface ConsoleController extends Controller<ConsoleSpawnConfiguration, ConsoleMessage, ConsoleBot> {
  }
  interface ConsoleMessage extends Message {
  }
  interface ConsoleSpawnConfiguration {
  }
  interface Controller<S, M extends Message, B extends Bot<S, M>> {
    readonly changeEars: HearsFunction<M>;
    readonly log: {
      (...params: any[]): void;
    }
    readonly middleware: {
      capture: {
        use(cb: (bot: B, message: M, convo: Conversation<M>, next: () => void) => void): void;
      };
      heard: {
        use(cb: (bot: B, message: M, next: () => void) => void): void;
      };
      receive: {
        use(cb: (bot: B, message: M, next: () => void) => void): void;
      };
      send: {
        use(cb: (bot: B, message: M, next: () => void) => void): void;
      };
    }
    readonly storage: {
      users: Storage<User>;
      channels: Storage<Channel>;
      teams: Storage<Team>;
    };
    readonly studio: Studio<S, M, B>;
    hears(keywords: string | string[] | RegExp | RegExp[], events: string | string[], cb: HearsCallback<S, M, B>): this;
    hears(keywords: string | string[] | RegExp | RegExp[], events: string | string[], middleware_or_cb: HearsFunction<M>, cb: HearsCallback<S, M, B>): this;
    on(event: string, cb: HearsCallback<S, M, B>): this;
    setupWebserver(port: number | string, cb: (err: Error, webserver: any) => void): this;
    spawn(config?: S, cb?: (worker: B) => void): B;
    startTicking(): void;
  }
  interface Conversation<M extends Message> {
    readonly status: ConversationStatusType;
    activate(): void;
    addMessage(message: string | M, thread: string): void;
    addQuestion(message: string | M, cb: ConversationCallback<M>, capture_options: ConversationCaptureOptions, thread: string): void;
    ask(message: string | M, cb: ConversationCallback<M>, capture_options?: ConversationCaptureOptions): void;
    beforeThread(thread: string, callback: (convo: this, next: (err: string | Error) => void) => void): void;
    extractResponse(key: string): string;
    extractResponses(): { [key: string]: string };
    gotoThread(thread: string): void;
    next(): void;
    on(event: string, cb: (convo: this) => void): void;
    onTimeout(handler: (convo: this) => void): void;
    repeat(): void;
    say(message: string | M): void;
    sayFirst(message: string | M): void;
    setTimeout(timeout: number): void;
    setVar(field: string, value: any): void;
    silentRepeat(): void;
    stop(status?: ConversationStatusType): void;
    transitionTo(thread: string, message: string | M): void;
  }
  interface ConversationCaptureOptions {
    key?: string;
    multiple?: boolean;
  }
  interface FacebookAttachment {
    type: 'audio' | 'file' | 'image' | 'video';
    payload: any;
  }
  interface FacebookBot extends Bot<FacebookSpawnConfiguration, FacebookMessage> {
    replyWithTyping(src: FacebookMessage, resp: string | FacebookMessage, cb?: (err: Error) => void): void;
    startTyping(src: FacebookMessage, cb?: (err: Error) => void): void;
    stopTyping(src: FacebookMessage, cb?: (err: Error) => void): void;
  }
  interface FacebookConfiguration extends Configuration {
    access_token: string;
    app_secret?: string;
    receive_via_postback?: boolean;
    require_delivery?: boolean;
    validate_requests?: boolean;
    verify_token: string;
  }
  interface FacebookController extends Controller<FacebookSpawnConfiguration, FacebookMessage, FacebookBot> {
    readonly api: {
      attachment_upload: {
        upload(attachment: FacebookAttachment, cb: (err: Error, attachment_id: string) => void): void;
      };
      messenger_profile: any;
      thread_settings: any;
      tags: any;
      nlp: any;

    };
    createWebhookEndpoints(webserver: any, bot: FacebookBot, cb?: () => void): this;
  }
  interface FacebookMessage extends Message {
    attachment?: FacebookAttachment;
    notification_type: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH';
    payload?: string;
    sender_action?: 'typing_on' | 'typing_off';
  }
  interface FacebookMessengerProfileAPI {
    account_linking(payload: string): void;
    delete_account_linking(): void;
    delete_domain_whitelist(): void;
    delete_get_started(): void;
    delete_greeting(): void;
    delete_home_url(): void;
    delete_menu(): void;
    delete_target_audience(): void;
    domain_whitelist(payload: string | string[]): void;
    get_account_linking(cb: (err: Error, body: any) => void): void;
    get_domain_whitelist(cb: (err: Error, body: any) => void): void;
    get_get_started(cb: (err: Error, body: any) => void): void;
    get_greeting(cb: (err: Error, body: any) => void): void;
    get_home_url(cb: (err: Error, body: any) => void): void;
    get_started(payload: string): void;
    get_menu(cb: (err: Error, body: any) => void): void;
    get_messenger_code(image_size: number, cb: (err: Error, uri: string) => void, ref?: string): void;
    get_target_audience(cb: (err: Error, body: any) => void): void;
    greeting(payload: string | { locale: string; text: string; }[]): void;
    home_url(payload: { url: string; webview_height_ratio: 'tall'; webview_share_button?: 'show' | 'hide'; in_test?: boolean; }): void;
    menu(payload: any): void;
    target_audience(payload: { audience_type: 'all' | 'custom' | 'none'; countries?: { blacklist?: string[]; whitelist?: string[]; }; }): void;
  }
  interface FacebookSpawnConfiguration {
  }
  interface Identity {
    name: string;
    emails: string[];
  }
  interface Message {
    action?: string;
    channel?: string;
    match?: RegExpMatchArray;
    text?: string;
    user?: string;
  }
  interface SlackAttachment {
    author_icon?: string;
    author_link?: string;
    author_name?: string;
    color?: string;
    fallback?: string;
    fields?: {
      title: string;
      value: string;
      short: boolean;
    }[];
    footer?: string;
    footer_icon?: string;
    image_url?: string;
    pretext?: string;
    text?: string;
    thumb_url?: string;
    title?: string;
    title_link?: string;
    ts?: string;
  }
  interface SlackBot extends Bot<SlackSpawnConfiguration, SlackMessage> {
    readonly api: SlackWebAPI;
    configureIncomingWebhook(config: { url: string; }): this;
    createConversationInThread(src: SlackMessage, cb: (err: Error, res: string) => void): void;
    createPrivateConversation(message: SlackMessage & { user: string; }, cb: (err: Error, convo: Conversation<SlackMessage>) => void): void;
    closeRTM(): void;
    destroy(): void;
    identifyTeam(): string;
    identifyBot(): { id: string; name: string; team_id: string; };
    replyAcknowledge(cb?: (err: Error) => void): void;
    replyAndUpdate(src: SlackMessage, resp: string | SlackMessage, cb: (err: Error, res: string) => void): void;
    replyInThread(src: SlackMessage, resp: string | SlackMessage, cb: (err: Error, res: string) => void): void;
    replyPrivate(src: SlackMessage, resp: string | SlackMessage, cb?: (err: Error) => void): void;
    replyPrivateDelayed(src: SlackMessage, resp: string | SlackMessage, cb?: (err: Error) => void): void;
    replyPublic(src: SlackMessage, resp: string | SlackMessage, cb?: (err: Error) => void): void;
    replyPublicDelayed(src: SlackMessage, resp: string | SlackMessage, cb?: (err: Error) => void): void;
    replyInteractive(src: SlackMessage, resp: string | SlackMessage, cb?: (err: Error) => void): void;
    sendWebhook(options: SlackMessage, cb: (err: string, body: any) => void): void;
    startPrivateConversation(message: SlackMessage & { user: string; }, cb: (err: Error, convo: Conversation<SlackMessage>) => void): void;
    startConversationInThread(src: SlackMessage, cb: (err: Error, res: string) => void): void;
    startRTM(cb?: (err: string, bot: SlackBot, payload: any) => void): SlackBot;
  }
  interface SlackConfiguration extends Configuration {
    api_root?: string;
    clientId?: string;
    clientSecret?: string;
    disable_startup_messages?: boolean;
    incoming_webhook?: { url: string; };
    interactive_replies?: boolean;
    rtm_receive_messages?: boolean;
    require_delivery?: boolean;
    retry?: number;
    scopes?: string[];
    send_via_rtm?: boolean;
    stale_connection_timeout?: number;
  }
  interface SlackController extends Controller<SlackSpawnConfiguration, SlackMessage, SlackBot> {
    configureSlackApp(config: { clientId: string; clientSecret: string; redirectUri: string; scopes: string[]; }): this;
    createHomepageEndpoint(webserver: any): this;
    createOauthEndpoints(webserver: any, callback: (err: Error, req: any, res: any) => void): this;
    createWebhookEndpoints(webserver: any, authenticationTokens?: string[]): this;
    setupWebserver();
    getAuthorizeURL(team_id: string, redirect_params: any): string;
  }
  interface SlackMessage extends Message {
    attachments?: SlackAttachment[];
    icon_emoji?: string;
    icon_url?: string;
    link_names?: boolean;
    parse?: string;
    reply_broadcast?: boolean;
    type?: string;
    thread_ts?: string;
    ts?: string;
    unfurl_links?: boolean;
    unfurl_media?: boolean;
    username?: string;
  }
  interface SlackSpawnConfiguration {
    token: string;
  }
  interface SlackWebAPI {
    auth: {
        test: SlackWebAPIMethod;
    },
    oauth: {
        access: SlackWebAPIMethod;
    }
    channels: {
        archive: SlackWebAPIMethod;
        create: SlackWebAPIMethod;
        history: SlackWebAPIMethod;
        info: SlackWebAPIMethod;
        invite: SlackWebAPIMethod;
        join: SlackWebAPIMethod;
        kick: SlackWebAPIMethod;
        leave: SlackWebAPIMethod;
        list: SlackWebAPIMethod;
        mark: SlackWebAPIMethod;
        rename: SlackWebAPIMethod;
        replies: SlackWebAPIMethod;
        setPurpose: SlackWebAPIMethod;
        setTopic: SlackWebAPIMethod;
        unarchive: SlackWebAPIMethod;
    };
    chat: {
        delete: SlackWebAPIMethod;
        postMessage: SlackWebAPIMethod;
        update: SlackWebAPIMethod;
        unfurl: SlackWebAPIMethod;
    };
    dnd: {
        endDnd: SlackWebAPIMethod;
        endSnooze: SlackWebAPIMethod;
        info: SlackWebAPIMethod;
        setSnooze: SlackWebAPIMethod;
        teamInfo: SlackWebAPIMethod;
    };
    emoji: {
        list: SlackWebAPIMethod;
    };
    files: {
        delete: SlackWebAPIMethod;
        info: SlackWebAPIMethod;
        list: SlackWebAPIMethod;
        upload: SlackWebAPIMethod;
    };
    groups: {
        archive: SlackWebAPIMethod;
        close: SlackWebAPIMethod;
        create: SlackWebAPIMethod;
        createChild: SlackWebAPIMethod;
        history: SlackWebAPIMethod;
        info: SlackWebAPIMethod;
        invite: SlackWebAPIMethod;
        kick: SlackWebAPIMethod;
        leave: SlackWebAPIMethod;
        list: SlackWebAPIMethod;
        mark: SlackWebAPIMethod;
        open: SlackWebAPIMethod;
        rename: SlackWebAPIMethod;
        replies: SlackWebAPIMethod;
        setPurpose: SlackWebAPIMethod;
        setTopic: SlackWebAPIMethod;
        unarchive: SlackWebAPIMethod;
    };
    im: {
        close: SlackWebAPIMethod;
        history: SlackWebAPIMethod;
        list: SlackWebAPIMethod;
        mark: SlackWebAPIMethod;
        open: SlackWebAPIMethod;
        replies: SlackWebAPIMethod;
    };
    mpim: {
        close: SlackWebAPIMethod;
        history: SlackWebAPIMethod;
        list: SlackWebAPIMethod;
        mark: SlackWebAPIMethod;
        open: SlackWebAPIMethod;
        replies: SlackWebAPIMethod;
    };
    pins: {
        add: SlackWebAPIMethod;
        list: SlackWebAPIMethod;
        remove: SlackWebAPIMethod;
    };
    reactions: {
        add: SlackWebAPIMethod;
        get: SlackWebAPIMethod;
        list: SlackWebAPIMethod;
        remove: SlackWebAPIMethod;
    };
    reminders: {
      add: SlackWebAPIMethod;
      complete: SlackWebAPIMethod;
      delete: SlackWebAPIMethod;
      info: SlackWebAPIMethod;
      list: SlackWebAPIMethod;
    };
    rtm: {
        start: SlackWebAPIMethod;
        connect: SlackWebAPIMethod;
    };
    search: {
        all: SlackWebAPIMethod;
        files: SlackWebAPIMethod;
        messages: SlackWebAPIMethod;
    };
    stars: {
        add: SlackWebAPIMethod;
        list: SlackWebAPIMethod;
        remove: SlackWebAPIMethod;
    };
    team: {
        accessLogs: SlackWebAPIMethod;
        info: SlackWebAPIMethod;
        billableInfo: SlackWebAPIMethod;
        integrationLogs: SlackWebAPIMethod;
        profile: {
          get: SlackWebAPIMethod;
        };
    };
    users: {
        getPresence: SlackWebAPIMethod;
        info: SlackWebAPIMethod;
        list: SlackWebAPIMethod;
        setActive: SlackWebAPIMethod;
        setPresence: SlackWebAPIMethod;
        deletePhoto: SlackWebAPIMethod;
        identity: SlackWebAPIMethod;
        setPhoto: SlackWebAPIMethod;
        profile: {
          get: SlackWebAPIMethod;
          set: SlackWebAPIMethod;
        };
    };
  }
  interface Storage<O> {
    save: (data: O, cb?: (err: Error, id: string) => void) => void;
    get: (id: string, cb: (err: Error, data: O) => void) => void;
    delete?: (id: string, cb?: (err: Error) => void) => void;
    all?: (cb: (err: Error, data: O[]) => void) => void;
  }
  interface Studio<S, M extends Message, B extends Bot<S, M>> {
    after(command_name: string, func: (convo: Conversation<M>, next: () => void) => void): this;
    before(command_name: string, func: (convo: Conversation<M>, next: () => void) => void): this;
    beforeThread(command_name: string, thread_name: string, func: (convo: Conversation<M>, next: () => void) => void): this;
    get(bot: B, input_text: string, user: string, channel: string): Promise<Conversation<M>>;
    run(bot: B, input_text: string, user: string, channel: string): Promise<Conversation<M>>;
    runTrigger(bot: B, input_text: string, user: string, channel: string): Promise<Conversation<M>>;
    validate(command_name: string, key: string, func: (convo: Conversation<M>, next: () => void) => void): this;
  }
  interface Team {
    id: string;
  }
  interface TwilioIPMBot extends Bot<TwilioIPMSpawnConfiguration, TwilioIPMMessage> {
    readonly api: any;
  }
  interface TwilioIPMConfiguration extends Configuration {
  }
  interface TwilioIPMController extends Controller<TwilioIPMSpawnConfiguration, TwilioIPMMessage, TwilioIPMBot> {
    createWebhookEndpoints(webserver: any, bot: TwilioIPMBot): this;
  }
  interface TwilioIPMMessage extends Message {
  }
  interface TwilioIPMSpawnConfiguration {
    autojoin?: boolean;
    identity?: string;
    TWILIO_IPM_SERVICE_SID: string;
    TWILIO_ACCOUNT_SID: string;
    TWILIO_API_KEY: string;
    TWILIO_API_SECRET: string;
  }
  interface TwilioSMSBot extends Bot<TwilioSMSSpawnConfiguration, TwilioSMSMessage> {
  }
  interface TwilioSMSConfiguration extends Configuration {
    account_sid: string;
    auth_token: string;
    twilio_number: string;
  }
  interface TwilioSMSController extends Controller<TwilioSMSSpawnConfiguration, TwilioSMSMessage, TwilioSMSBot> {
    createWebhookEndpoints(webserver: any, bot: TwilioSMSBot, cb?: () => void): this;
  }
  interface TwilioSMSMessage extends Message {
  }
  interface TwilioSMSSpawnConfiguration {
  }
  interface User {
    id: string;
    name?: string;
  }
  type ConversationCallback<M extends Message> = ((message: M, convo: Conversation<M>) => void) | ({ pattern?: string | RegExp; default?: boolean; callback: (message: M, convo: Conversation<M>) => void; }[]);
  type ConversationStatusType = 'completed' | 'active' | 'stopped' | 'timeout' | 'ending' | 'inactive';
  type HearsCallback<S, M extends Message, B extends Bot<S, M>> = (bot: B, message: M) => void;
  type HearsFunction<M extends Message> = (tests: string | string[] | RegExp | RegExp[], message: M) => boolean;
  type SlackWebAPIMethod = (data: any, cb: (err: Error, response: any) => void) => void;
}

export = botkit;
