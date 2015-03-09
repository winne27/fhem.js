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
      mylog("client connected");
      socket.on('getValueOnce', function(data)
      {
         var jsonValue = buffer.checkValue(data);
         if (jsonValue)
         {
            //console.log(jsonValue);
            socket.emit('value',jsonValue);
         }
      });

      socket.on('getValueOnChange', function(data)
      {
         //mylog("getValueOnChange " + data);
         if(socket.rooms.indexOf(data) < 0)
         {
            socket.join(data);
         }
      });

      socket.on('getAllValues', function(callback)
      {
         var response = buffer.checkValue('all');
         callback(response);
      });

      socket.on('command', function(cmd,callback)
      {
         // establish telnet connection to fhem server
         var fhemcmd = net.connect({port: params.fhemPort}, function()
         {
            fhemcmd.write(cmd + '\r\n');
         });

         fhemcmd.setTimeout(20000);
         fhemcmd.on('data', function(response)
         {
            var arrayResp = response.toString().split("\n");
            callback(arrayResp);
            fhemcmd.end();
            fhemcmd.destroy();
         });
      });

      socket.on('allSwitches', function(callback)
      {
         //mylog("allSwitches fired by client");
         var response = buffer.getAllSwitches();
         callback(response);
      });

      socket.on('getAllUnitsOf', function(type,callback)
      {
         var units = buffer.getAllUnitsOf(type);
         callback(units);
      });

      socket.on('commandNoResp', function(data)
      {
         console.log("commandNoResp " + data);
         // establish telnet connection to fhem server
         var fhemcmd = net.connect({port: params.fhemPort}, function()
         {
            fhemcmd.write(data + '\r\n');
         });
         fhemcmd.setTimeout(10000);
         fhemcmd.on('data', function(data)
         {
            fhemcmd.end();
            fhemcmd.destroy();

         });
      });
      socket.on('disconnect', function(data)
      {
          mylog('disconnected: ' + data);
          for (room in socket.rooms)
          {
             //mylog("leave " + room);
             socket.leave(room);
          }
      });

});

initFinished.on('true',function()
{
   server.listen(params.nodePort);

   var trigger = net.connect({port: params.fhemPort}, function()
   {
      //funcs.mylog('connected to fhem server for trigger enable');
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
   // establish telnet connection to fhem server
   var fhemreq = net.connect({port: params.fhemPort}, function()
   {
      fhemreq.write('list\r\n');
   });
   fhemreq.setTimeout(10000);
   fhemreq.on('data', function(data)
   {
      buffer.readValues(ios,type,data);
      fhemreq.end();
      fhemreq.destroy();
   });
}

getValues('init');

funcs.mylog('Server startet');