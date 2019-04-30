# packages

    * PUBLISH TO NPM
    * move/remove/ignore testbot
    * eslint version in packages
    

# core


# docs

    * Root Readme (links to all projects, but also needs pitch)

# advanced topics
    * anatomy
    * upgrade guide

    * customize templates for plugins index and platform index
    
    * every adapter doc should link to main client API doc
    * link to provisioning guides

    * change /docs stuff to /v0
    * add banner to top of v0 docs to indicate legacy status
    * add dropdown widget to main v0

# github

    * update readme for 0. branch with any additional information we need to provide

# starter kits / yeoman

    * move over more useful skills

    * keep?  Go?  mark as deprecated?  point at yeoman? autogenerate with yeoman??
    * glitch??

# Teams 

    * direct_message qualifications
    * update/remove message in botworker?

    * -> https://github.com/howdyai/botkit/blob/master/lib/TeamsAPI.js
    * getchannels <-- can be achieved but is different/ and not compatible with getconversations
    * getuserbyid <-- predicated on getconvo members
    * getuserbyupn <-- see above
    * getconversationmembers <-- works but awkward
    * getteamroster <-- works but awkward
    * gettoken? <-- works but awkard>


# Tests!


# DONE STUFF

~* customize user agent for botframework~
~* review all package details (author, github, tags, license)~
~* separate botkit CMS stuff from core~

~* Write main readme in each repo~
~ build process copies main readme also~
~ignore useless methods and internal only interfaces~
~link to contributor/license/stuff in footer of each~
~every worker object should point back to main worker object~
~generate TOC for reference docs / others~
~Move forward content/docs from 0. branch~
~* change /new to /v4~
~* create official new 0. branch for future maintenance~
~* catch dialog results!~
~* hangouts creds get escaped~


# POST LAUNCH

    * update web adapter link to client
    * will have to update any existing pull requests to point at that branch
    * create automatic redirect from /docs to /docs/v0 --- ??? or maybe v4??
    * update cms "options" page to reflect use with botkit-plugin-cms
    * botbuilder card builders?
    * ears? check for intent, others?
    * how to determine what is active dialog / do contextual help