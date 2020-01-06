## Botkit's Customizable web-based chat client

Botkit includes an easy to customize chat client that can be used as a full-screen web app, built into the structure
of an existing page, or embedded in an entire site with an iframe.

The built-in client uses websocket or webhook connections to establish a real time connection
to your Botkit app in order to instantly send and receive messages. It supports bot-friendly
features like quick replies and image attachments. It gracefully handles failed connections
and reconnects.

The chat client is built with HTML, CSS and vanilla Javascript.
Developers can customize the look and feel of the client by modifying the included markup and CSS.
New chat features such as custom cards or actions can be added with just a little bit of code.

* [How to use typing indicators](#typing-indicators)
* [How to embed a bot in your website](#embed-botkit-in-a-website-with-iframes)
* [How to customize the look and feel of your web chat](#customize-the-look-and-feel-of-the-chat-interface)
* [How to share user account/profile info with Botkit](#share-user-accounts--profile-data-with-botkit)


There are three ways to use the web client:

1. [Embed the widget using an iFrame](#embed-botkit-in-a-website-with-iframes)
2. Link directly to full-screen chat interface
3. Embed the chat interface markup, css and Javascript into an existing web page

### Files

The web chat client is composed of these files:

* HTML user interface [index.html](index.html)
* Javascript application [client.js](client.js)
* Compiled CSS theme [css/styles.css](css/styles.css)
* Source SASS file [sass/_chat.scss](sass/_chat.scss)

Additional functionality used by the iframe embed:

* Embedded chat app [embed.js](embed.js)
* Compiled CSS for embedded window [css/embed.css](css/embed.css)
* Source SASS file [sass/embed.scss](sass/embed.scss)

## Client API

#### Botkit.boot(user)

Initialize the embedded chat widget.  This will cause the widget to connect to the chat service and start up.

If your website has user accounts, and you want to identify the existing user to the chat widget,
you can include user profile information in the call to Botkit.boot(). 
The user object can contain the following fields:

| Field | Description
|--- |---
| id | REQUIRED a unique identifier of this user
| name | the username / display name of the user
| first_name | first name
| last_name | last name
| full_name | full name
| gender | 'male' or 'female'
| timezone | Timezone description "America/Chicago"

#### Botkit.identifyUser(user)

Identify an existing user to the chat widget. This can be used to identify the user AFTER the chat begins, instead of passing in the information to Botkit.boot().

## Share User Accounts / Profile data with Botkit

In order to seamlessly integrate your new bot with your existing app or website, Botkit supports sharing user account information between the main app and the bot.

To do this, either call [Botkit.boot(user)](#botkitbootuser) with the optional user profile parameter, or call [Botkit.identifyUser(user)](#botkitidentifyuseruser) after the connection has been established.

It is important to note that Botkit does not provide any mechanism for validating or verifying the identity of the user passed in via these mechanisms. Used without validation, users can potentially access content associated with other users. For this reason, we recommend that Botkit Anywhere not be used to handle sensitive or private information unless substantial security mechanisms are put in place.

## Typing Indicators

Botkit can send typing indicators to the client to indicate that work is happening behind the scenes.

To achieve this, send a message in the form: `{"type": "typing"}`

The typing indicator will appear until the next message arrives. Typing indicators can be added to dialogs to indicate activity during long running operations. If you wish to have a typing indicator appear before every message, use a middleware to send the indicator and then delay the actual message.

For some examples of this in use, [see the sample code here &raquo;](https://github.com/howdyai/botkit/blob/master/packages/testbot/features/websocket_features.js)

## Embed Botkit in a Website with iFrames

Botkit's web chat can be added to a website using an iframe to embed the chat functionality.
The starter kit application includes a page with the necessary embed code that can be copy-pasted into the source of your website.

An example embed code is below.  It includes the markup for an iframe, as well as Javascript and CSS links for
styling the embedded chat widget. Note, replace `{{base_url}}` with the url of your Botkit application.

```html
<div id="embedded_messenger">
    <header id="message_header" onclick="Botkit.toggle()">Chat</header>
    <iframe  id="botkit_client" src="//{{base_url}}/chat.html"></iframe>
</div>
<script src="//{{base_url}}/embed.js"></script>
<script>
var options = {};
Botkit.boot(options);
</script>
<link rel="stylesheet" href="//{{base_url}}/embed.css" />

```

Once embedded, the chat widget has a few additional methods that allow you to control it from the main web page.

#### Botkit.activate()

Activate the chat widget. If using the built-in stylesheet, this will cause the widget to slide up from the bottom of the screen.

#### Botkit.deactivate()

Deactivate the chat widget. If using the built-in stylesheet, this will cause the widget to disappear, leaving only a small "Chat" widget docked to the bottom of the page.

#### Botkit.toggle()

Toggle the active state of the chat widget.


## Customize the look and feel of the chat interface

The web chat interface is built with HTML and CSS. The look and feel can be extensively customized by modifying the underlying source code. The chat interface is rendered using the [Handlebars template language](http://handlebarsjs.com/).

The uncompiled SASS used to style the web chat is included in the starter kit as `sass/_chat.scss` Changes made to this file must be compiled into the final stylesheet. To do this, run the following command from the root of the starter kit:

```
sass --update sass/:/css/
```

The annotated boilerplate HTML for Botkit's web client is below.

Note: The functionality of the web chat interface uses the `id` attributes of elements in the template to identify and use them. If you want to use the built in client app, it is important to leave these attributes intact in the template file!

```html
<!-- the client uses the Handlebars template library and the Showdown markdown renderer -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.10/handlebars.min.js"></script>
<script src="https://cdn.rawgit.com/showdownjs/showdown/1.7.4/dist/showdown.min.js"></script>

<!-- Include the styleshet -->
<link rel="stylesheet" href="css/styles.css" />

<!-- this is the template for Botkit's web client -->
<div id="message_window">
    <!-- this bar will appear if the websocket connection is not established -->
    <div class="disconnected">
        Disconnected... reconnecting!
    </div>

    <!-- this bar will appear if the websocket connection has failed to reconnect after a disconnect -->
    <div class="offline">
        Offline! Reload to reconnect.
    </div>

    <!-- this section contains the scrolling list of messages -->
    <section>
        <div id="message_list">

            <!--
              this div is used to format both incoming and outgoing messages.
              they are styled differently based a css class tied to the message.type field
            -->
            <div id="message_template">
                <div class="message {{message.type}}">
                    {{#if message.isTyping}}
                        <div class="typing-indicator">
                            ...
                        </div>
                    {{/if}}

                    {{{message.html}}}

                    <!-- If the open_link field is present in the message, insert a button -->
                    {{#if message.open_link}}
                      <a href="{{{message.open_link}}}" target="_blank" class="button_message">{{#if message.link_title}}{{message.link_title}}{{else}}{{message.open_link}}{{/if}}</a>
                    {{/if}}

                    <!-- if the files field is present in the message, render links to attached files -->
                    {{#message.files}}
                      {{#if image}}
                        <img src="{{{url}}}" alt="{{{url}}}" />
                      {{else}}
                        <a href="{{{url}}}">{{{url}}}</a>
                      {{/if}}
                    {{/message.files}}
                </div>
            </div>
        </div>
    </section>

    <!-- this element contains any quick replies -->
    <div id="message_replies">
    </div>

    <!-- the footer is contains the message composer, and is docked to the footer of the chat -->
    <footer>
        <form onsubmit="Botkit.send(Botkit.input.value, event)">
            <input type="text" autocomplete="off" id="messenger_input" placeholder="Type here..." />
            <button type="submit">Send</button>
        </form>
    </footer>
</div>
```

## Using Botkit CMS custom fields to add custom features

Botkit CMS's dialog authoring tool supports the ability to add custom fields to any message.
These fields are passed unmodified through the client to your chat widget, and can be used in the template.

You can include any fields you want in your message objects using this feature, and render them however you desire.  The Handlebars template system supports conditionals, iterators and other helper functions which can be used to create interactive elements and more complex attachments.

For example, the code above looks for a `message.open_link` field. This is not a standard Botkit
message field, but can be added to a message using custom fields. If present, a special link button will be added to the rendered message.
