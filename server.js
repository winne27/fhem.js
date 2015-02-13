var http    = require('http');
var url     = require('url');
var fs      = require('fs');
var io      = require('socket.io');
var net     = require('net');
var params  = require('./params');
var funcs   = require('./functions');
var buffer  = require('./buffer');
var events  = require('./events');
var mylog   = funcs.mylog;
var initFinished = events.initFinished;

// deliver http requests
var server = http.createServer(function(request, response)
{
   var path = url.parse(request.url).pathname;
   var uri = url.parse(request.url);

         response.writeHead(200, {'Content-Type': 'text/plain'});
         response.end();
});

var ios = io(server);

// handle for the websocket connection from client
ios.sockets.on('connection', function(socket)
{
      socket.on('getValueOnce', function(data)
      {
         var jsonValue = buffer.checkValue(data);
         if (jsonValue)
         {
            socket.emit('value',jsonValue);
         }
      });

      socket.on('getValuePerm', function(data)
      {
         var jsonValue = buffer.checkValue(data);
         if (jsonValue)
         {
            socket.emit('value',jsonValue);
         }
         socket.join(data);
      });

      socket.on('command', function(data)
      {
         //mylog('command received: ' + data);
         var fhemcmd = net.connect({port: params.fhemPort}, function()
         {
            fhemcmd.write(data + '\r\n');
         });

         fhemcmd.on('data', function(data)
         {
            socket.emit('cmd',data);
            fhemcmd.end();
         });
      });

      socket.on('commandNoResp', function(data)
      {
         var fhemcmd = net.connect({port: params.fhemPort}, function()
         {
            fhemcmd.write(data + '\r\n');
         });

         fhemcmd.on('data', function(data)
         {
            fhemcmd.end();
         });
      });

});

initFinished.on('true',function()
{
   server.listen(params.nodePort);

   var trigger = net.connect({port: params.fhemPort}, function()
   {
      funcs.mylog('connected to fhem server for trigger enable');
      trigger.write('inform on\r\n');
   });

   trigger.on('data', function(data)
   {
      getValues('update');
   });

   trigger.on('end', function()
   {
     funcs.mylog('error: telnet connection closed');
   });

})

function getValues(type)
{
   var fhemreq = net.connect({port: params.fhemPort}, function()
   {
      fhemreq.write('list\r\n');
   });

   fhemreq.on('data', function(data)
   {
      buffer.readValues(ios,type,data);
      fhemreq.end();
   });
}

getValues('init');

funcs.mylog('Server startet');