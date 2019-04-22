$action_color: orange;
$background: #FFFFFF;
$bot_message_background: #F0F0F0;
$bot_message_text: #333;
$human_message_background: $botkit_purple;
$human_message_text: white;

#message_window {
    background: $background;
    border-left: 1px solid #CCC;
    border-right: 1px solid #CCC;

    /*height: 500px;
    width: 320px;*/
    height: 100%;
    width: 100%;
    /*margin: 2rem auto;*/
    display: flex;
    flex-direction: column;
    font-family: 'helvetica', sans-serif;

    .disconnected {
        background: #FFFFCC;
        padding: 0.25rem;
    }
    &.connected .disconnected {
        display: none;
    }
    .offline {
        display: none;
    }
    &.offline {

      .disconnected {
        display: none;
      }
      .offline {
        background: #FF0000;
        color: #FFF;
        padding: 0.25rem;
        display: block;
      }
    }

    .powered_by {
      flex-shrink: 0;
      text-align: center;

      border-bottom: 1px solid #CCC;
      font-size: 14px;
      padding: 0.25rem;
      color: #666;

      a {
        text-decoration: none;
        color: #666;
      }

      img {
        position: relative;
        top: 2px;
      }
    }

   section {
      flex-grow:  1;
      flex-direction: column-reverse;
      display: flex;
      overflow-y: auto;

     div div {
        margin: 0.25rem;
        clear: both;
    }
  }

  footer {
      border-top: 1px solid #CCC;
      padding: 0.25rem;
      input[type="text"] {
          flex-grow: 1;
          font-size: 1.25rem;
          outline: none;
          border: none;
      }
      button {
         width: 50px;
         background: none;
         border: 0;
         cursor: pointer;
         color: blue;
         font-weight: bold;
     }
  }

  form {
      display: flex;
      margin: 0;
      padding: 0.25rem;
  }

  #message_template {
      display: none;
  }

  .message {
      font-size: 14px;
      padding: 0.5rem;
      background: $bot_message_background;
      color: $bot_message_text;
      border-radius: 5px;
      width: auto;
      display: inline-block;
      max-width: 75%;

  }

  .file_attachment {

    background: $bot_message_background;
    color: $bot_message_text;
    border-radius: 5px;
    display: inline-block;
    max-width: 75%;

    img {
      max-width: 100%;
      display: block;
    }

  }

    .button_message {
      margin: 1rem 0;
      border-radius: 4px;
      border-color: $action_color;
      border-style: solid;
      color: $action_color;
      border-width: 1px;
      padding: 0.25rem 1rem;
      text-decoration: none;
      text-align: center;
      box-shadow: 1px 1px 2px rgba(0,0,0,0.25);
      display: block;
    }


  .message p {
      margin-top: 0;
      margin-bottom: 0.5rem;
  }

  .message p:last-child {
      margin-bottom: 0;
  }

  .message.outgoing {
      float: right;

      background: $human_message_background;
      color: $human_message_text;

  }

  #message_replies {
      text-align: center;
      overflow-x: auto;
      flex-shrink: 0;
      -webkit-overflow-scrolling: touch; /* Lets it scroll lazy */

      ul {
          list-style-type: none;
          margin: 0px auto;
          padding: 0;
          li {
              display: inline-block;
              margin: 0.5rem;
              margin-left: 0;
          }
      }

      a {
         text-decoration: none;
         display: block;
         border: 1px solid $botkit_purple;
         color: $botkit_purple;
         border-radius: 16px;
         padding: 0.25rem 1rem;
         font-size: 14px;
         cursor: pointer;

         &:hover {
           background: $botkit_purple;
           color: #FFF;
         }
     }
   }
}



/* typing indicator CSS based on code by Joseph Fusco -> https://codepen.io/fusco/pen/XbpaYv */
.typing-indicator {
  display: table;
  margin: 0 auto;
  position: relative;
  span {
    height: 5px;
    width: 5px;
    float: left;
    margin: 0 1px;
    background-color: $bot_message_text;
    display: block;
    border-radius: 50%;
    opacity: 0.4;
    @for $i from 1 through 3 {
      &:nth-of-type(#{$i}) {
        animation: 1s blink infinite ($i * .3333s);
      }
    }
  }
}

@keyframes blink {
  50% {
    opacity: 1;
  }
}
