var Botkit = {

    setCookie: function(cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
      var expires = "expires=" + d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    },
    getCookie: function(cname) {
      var name = cname + "=";
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    },
    active: false,
    activate: function() {
      this.active = true;
      if (this.container) {
        this.container.className = 'active';
      }
      this.setCookie('botkit_messenger_active', this.active);
    },
    deactivate: function() {
      this.active = false;
      if (this.container) {
        this.container.className = '';
      }
      this.setCookie('botkit_messenger_active', this.active);
    },
    toggle: function() {
      if (this.active) {
        this.deactivate();
      } else {
        this.activate();
      }
    },
    trigger: function(event) {
      this.chatClient.postMessage(event, '*');
    },
    receiveMessage: function(message) {
      // message contains the following fields:
      // message.data, message.origin, message.source
  
      switch (message.data.name) {
        case 'booted':
          Botkit.trigger({
            name: 'connect',
            user: Botkit.current_user ? Botkit.current_user : null,
          });
  
          if (Botkit.getCookie('botkit_messenger_active') == 'true') {
            Botkit.activate();
          }
          console.log('Embedded Botkit: Ready!');
          break;
        case 'connected':
          // console.log('100% CONNECTED AND READY TO GO');
          break;
      }
    },
    triggerScript: function(script, thread) {
  
      this.trigger({
        type: 'event',
        name: 'trigger',
        script: script,
        thread: thread,
      });
    },
    identifyUser: function(user) {
  
      // user should contain any of the following:
      // id, email, name, first_name, last_name, full_name, gender, timezone, timezone_offset
  
      this.current_user = user;
  
      this.trigger({
        type: 'event',
        name: 'identify',
        user: user,
      });
  
  
    },
    boot: function(user) {
      var that = this;
  
      that.container = document.getElementById('embedded_messenger');
      that.header = document.getElementById('messenger_header');
      that.chatClient = document.getElementById('botkit_client').contentWindow;
  
      if (user) {
        that.current_user = user;
      }
  
      if (!that.chatClient) {
        console.error('Cannot find Botkit chat client iframe. Make sure your iframe has the id #botkit_client');
      }
  
      window.addEventListener('message', that.receiveMessage, false);
  
      return this;
    }
  }
  