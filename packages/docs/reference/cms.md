# Botkit CMS Plugin Class Reference

[&larr; Botkit Documentation](..) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botkit-plugin-cms](https://github.com/howdyai/botkit/tree/next/packages/botkit-plugin-cms) package.

## Classes


* <a href="#BotkitCMSHelper" aria-current="page">BotkitCMSHelper</a>

## Interfaces

* <a href="#CMSOptions" aria-current="page">CMSOptions</a>

---

<a name="BotkitCMSHelper"></a>
## BotkitCMSHelper
A plugin for Botkit that provides access to an instance of [Botkit CMS](https://github.com/howdyai/botkit-cms), including the ability to load script content into a DialogSet
and bind before, after and onChange handlers to those dynamically imported dialogs by name.

```javascript
controller.use(new BotkitCMSHelper({
     uri: process.env.CMS_URI,
     token: process.env.CMS_TOKEN
}));

// use the cms to test remote triggers
controller.on('message', async(bot, message) => {
  await controller.plugins.cms.testTrigger(bot, message);
});
```


To use this class in your application, first install the package:
```bash
npm install --save botkit-plugin-cms
```

Then import this and other classes into your code:
```javascript
const { BotkitCMSHelper } = require('botkit-plugin-cms');
```

This class includes the following methods:
* [after()](#after)
* [before()](#before)
* [init()](#init)
* [loadAllScripts()](#loadAllScripts)
* [onChange()](#onChange)
* [testTrigger()](#testTrigger)



### Create a new BotkitCMSHelper()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| config | [CMSOptions](#CMSOptions) | 




## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| name | string | Botkit Plugin name

## BotkitCMSHelper Class Methods
<a name="after"></a>
### after()
Bind a handler function that will fire after a given dialog ends.
Provides a way to use BotkitConversation.after() on dialogs loaded dynamically via the CMS api instead of being created in code.


```javascript
controller.plugins.cms.after('my_script', async(results, bot) => {

console.log('my_script just ended! here are the results', results);

});
```


<a name="before"></a>
### before()
Bind a handler function that will fire before a given script and thread begin.
Provides a way to use BotkitConversation.before() on dialogs loaded dynamically via the CMS api instead of being created in code.


```javascript
controller.cms.before('my_script','my_thread', async(convo, bot) => {

 // do stuff
 console.log('starting my_thread as part of my_script');
 // other stuff including convo.setVar convo.gotoThread

});
```


<a name="init"></a>
### init()
Botkit plugin init function
Autoloads all scripts into the controller's main dialogSet.


<a name="loadAllScripts"></a>
### loadAllScripts()
Load all script content from the configured CMS instance into a DialogSet and prepare them to be used.


<a name="onChange"></a>
### onChange()
Bind a handler function that will fire when a given variable is set within a a given script.
Provides a way to use BotkitConversation.onChange() on dialogs loaded dynamically via the CMS api instead of being created in code.


```javascript
controller.plugins.cms.onChange('my_script','my_variable', async(new_value, convo, bot) => {

console.log('A new value got set for my_variable inside my_script: ', new_value);

});
```


<a name="testTrigger"></a>
### testTrigger()
Uses the Botkit CMS trigger API to test an incoming message against a list of predefined triggers.
If a trigger is matched, the appropriate dialog will begin immediately.

**Returns**

Returns false if a dialog is NOT triggered, otherwise returns void.






<a name="CMSOptions"></a>
## Interface CMSOptions


**Fields**

| Name | Type | Description
|--- |--- |---
| controller | Botkit | 
| token | string | 
| uri | string | 
