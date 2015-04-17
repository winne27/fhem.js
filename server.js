var url     = require('url');
var fs      = require('fs');
var io      = require('socket.io');
var net     = require('net');
var crypto  = require('crypto');
var params  = require('./params');
var funcs   = require('./functions');
var buffer  = require('./buffer');
var events  = require('./events');
var mylog   = funcs.mylog;
var initFinished = events.initFinished;
var server;
var reconnectInterval;

if (params.useSSL)
{
   var https    = require('https');
   var options =
   {
      key: fs.readFileSync(params.sslcert.key),
      cert: fs.readFileSync(params.sslcert.cert),
      ciphers: params.cipher,
      honorCipherOrder: true
   };
   /*
   if (params.useClientAuth)
   {
     options.ca = fs.readFileSync(params.sslcert.ca);
     options.requestCert = true;
     options.rejectUnauthorized = true;
   }
   */
   server = https.createServer(options);
}
else
{
   var http    = require('http');
   server  = http.createServer();
}

if (params.pathHTML)
{
   mylog('listen for http requests');

   server.on('request',function(request, response)
   {
      var path = url.parse(request.url).pathname;
      if (path === '/' || path === '')
      {
         path = '/' + params.indexHTML;
      }
      var htppFile = params.pathHTML + path;

      try
      {
         var HTML = fs.readFileSync(htppFile);
         response.writeHead(200, {'Content-Type': 'text/html'});
         response.write(HTML);
         response.end();
      }
      catch(e)
      {
         response.writeHead(404);
         response.write("Requested URL does not exist - 404");
      }
   });

}

var ios = io(server);

if (params.useClientPassword)
{
   require('socketio-auth')(ios,
   {
     authenticate: authenticate,
     timeout: 2000
   });

   function authenticate(password, callback)
   {
      if (crypto.createHash('sha256').update(password).digest('hex') === params.connectionPassword)
      {
         return callback(null, true);
      }
      else
      {
         return callback(new Error("Invalid connection password"),false);
      }
   }
}

// handle for the websocket connection from client
ios.sockets.on('connection', function(socket)
{
      if (!params.useClientPassword)
      {
         mylog("emit authenticated");
         socket.emit('authenticated');
      }

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

         fhemcmd.setTimeout(10000);
         fhemcmd.on('data', function(response)
         {
            var arrayResp = response.toString().split("\n");
            callback(arrayResp);
            fhemcmd.end();
            fhemcmd.destroy();
         });
         fhemcmd.on('error', function()
         {
            funcs.mylog('error: telnet connection failed');
         });
      });

      socket.on('getAllSwitches', function(callback)
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
         //console.log("commandNoResp " + data);
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
         fhemcmd.on('error', function()
         {
            funcs.mylog('error: telnet connection failed');
            socket.emit('fhemError');
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
   mylog('initFinished');
   server.listen(params.nodePort);
   connectFHEMserver();
});

function connectFHEMserver()
{
   funcs.mylog("start connection to fhem server");
   var trigger = net.connect({port: params.fhemPort}, function()
   {
      funcs.mylog('connected to fhem server for trigger enable');
      trigger.write('inform on\r\n');
      ios.sockets.emit('fhemConn');
   });

   trigger.on('data', function(data)
   {
      //console.log(data.toString());

      clearInterval(reconnectInterval);
      checkValues(data.toString().split("\n"));
   });

   trigger.on('error', function()
   {
      funcs.mylog('error: telnet connection failed - retry in 10 secs');
      reconnectInterval = setTimeout(function ()
      {
         connectFHEMserver();
      }, 10000);
   });

   trigger.on('end', function()
   {
      funcs.mylog('error: telnet connection closed - try restart in 10 secs');
      reconnectInterval = setTimeout(function ()
      {
         connectFHEMserver();
      },105000);
   });
}

function getValues(type)
{
   // establish telnet connection to fhem server
   var fhemreq = net.connect({port: params.fhemPort}, function()
   {
      fhemreq.write('list\r\n');
   });
   //fhemreq.setTimeout(10000);

   fhemreq.on('data', function(data)
   {
      buffer.readValues(ios,type,data);
      fhemreq.end();
      fhemreq.destroy();
   });

   fhemreq.on('error', function()
   {
      funcs.mylog('error: telnet connection for getting values failed - retry in 10 secs');
      setTimeout(function ()
      {
         getValues(type);
      }, 10000);
   });

}

function checkValues(allLines)
{
   var lastDevice = '';
   var doGetValues = false;
   var foundSingleEntity = true;

   allLines.forEach(function (line)
   {
      line = line.trim().split(' ');
      var device = line[1];
      if (lastDevice !== device)
      {
         lastDevice = device;
         if (!foundSingleEntity)
         {
            doGetValues = true;
         }
         foundSingleEntity = false;
      }
      if (line.length === 3 && line[2].substr(0,4) !== 'set_')
      {
         buffer.setActValue(device,line[2]);
         var jsonValue = buffer.checkValue(device);
         foundSingleEntity = true;
         //console.log(jsonValue);
         ios.sockets.in('all').emit('value',jsonValue);
         ios.sockets.in(device).emit('value',jsonValue);
         //console.log(line);
      }
   });

   if (doGetValues)
   {
      getValues('update');
   }
}

getValues('init');

var messSuff = (params.useSSL) ? 'with SSL' : 'without SSL';
funcs.mylog('Server started: ' + messSuff);