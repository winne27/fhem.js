var events = require('events');
var events = require('events').EventEmitter;
var initFinished = new events.EventEmitter;

exports.initFinished = initFinished;