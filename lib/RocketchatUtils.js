const { driver } = require('@rocket.chat/sdk')

// Utils functions
async function getRoomType (meta, message, channelList, botUserName) {
  // message_received type are not at the events list, if added the bot
  // will answer all messages
  var messageType = 'message_received'
  var mentionRoom = await isMentionRoom(message.rid, channelList)

  if (meta.roomType === 'd') {
    messageType = 'direct_message'
  } else if (meta.roomType === 'l') {
    messageType = 'live_chat'
  } else if ((meta.roomType === 'c' || meta.roomType === 'p') && !mentionRoom) {
    messageType = 'channel'
  } else if ((meta.roomType === 'c' || meta.roomType === 'p') && isMention(message, botUserName) && mentionRoom) {
    messageType = 'mention'
  }
  return messageType
}

function handleMention (message, botUserName) {
  var text = ''
  if (isMention(message, botUserName)) {
    // regex to remove words that begins with '@'
    text = message.msg.replace(/(^|\W)@(\w+)/g, '').replace(' ', '')
  } else {
    text = message.msg
  }
  return text
}

function isMention (message, botUserName) {
  var botMention = false
  if (message !== undefined && botUserName !== undefined) {
    for (var mention in message.mentions) {
      if (message.mentions[mention].username === botUserName) {
        botMention = true
      }
    }
  }
  return botMention
}

async function isMentionRoom (channelId, channelList) {
  var mentionRoom = false
  var channel

  if (channelList !== undefined && channelId !== undefined) {
    var channelName = await driver.getRoomName(channelId)
    if(channelName !== undefined) {
      channelName = channelName.toLowerCase()
    }
    channelList = channelList.replace(/[^\w\,._]/gi, '').toLowerCase()
    if (channelList.match(',')) {
      channelList = (channelList.split(','))
      for (channel in channelList) {
        console.log(channelList[channel])
        console.log(channelName)
        if (channelList[channel] === channelName) {
          mentionRoom = true
        }
      }
    } else {
      if (channelList === channelName) {
        mentionRoom = true
      }
    }
  }
  return mentionRoom
}

async function addToRooms (channelList) {
  var rooms = (channelList.split(','))
  for (var i in rooms) {
    rooms[i] = rooms[i].replace(/^\s+|\s+$/g, '')
  }
  try{
    await driver.joinRooms(rooms)
  } catch(error) {
    console.log(error)
  }
}

module.exports = { getRoomType, handleMention, isMention, isMentionRoom, addToRooms }
