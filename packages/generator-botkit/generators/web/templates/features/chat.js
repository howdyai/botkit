const express = require('express');
const path = require('path');

module.exports = function(controller) {

    // make public/chat.html available as localhost/chat.html
    // by making the /public folder a static/public asset
    this.webserver.use(express.static(path.join(__dirname,'..','public'));

}