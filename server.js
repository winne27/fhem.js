/*
            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004

 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT THE FUCK YOU WANT TO.

 */
var url = require('url');
var fs = require('fs');
var io = require('socket.io');
var net = require('net');
var crypto = require('crypto');
var events = require('events');
var params = require('./params');
var funcs = require('./functions');
var buffer = require('./buffer');
var eventsG = require('./events');
if (params.readDB) var readdb = require('./readdb');
var mylog = funcs.mylog;
var initFinished = eventsG.initFinished;
var exec = require('child_process').exec;
var version = new Object;
version.installed = require('./package').version;
version.latest = false;
var server;
var reconnectTimeout;
var checkVersionInterval = 12; // in hours
var fhemSocket;
var tagsFilterOut;

// -------------------------------------------------------------------
// setup http(s) server
// -------------------------------------------------------------------

if (params.useSSL) {
    var https = require('https');
    var options = {
        key: fs.readFileSync(params.sslcert.key),
        cert: fs.readFileSync(params.sslcert.cert),
        ciphers: params.cipher,
        honorCipherOrder: true
    };
    server = https.createServer(options);
} else {
    var http = require('http');
    server = http.createServer();
}

if (params.pathHTML) {
    mylog('listen for http requests', 0);

    server.on('request', function(request, response) {
        var path = url.parse(request.url).pathname;
        mylog('http request: ' + path, 1);
        if (path === '/' || path === '') {
            path = '/' + params.indexHTML;
        }
        var htppFile = params.pathHTML + path;

        try {
            var HTML = fs.readFileSync(htppFile);
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write(HTML);
            response.end();
        } catch (e) {
            response.writeHead(404);
            response.write("Requested URL does not exist - 404");
            response.end();
        }
    });

} else {
    mylog('listen for http requests disabled', 0);
    server.on('request', function(request, response) {
        var path = url.parse(request.url).pathname;
        mylog('illegal request for ' + path, 0);
        response.writeHead(404);
        response.write(params.message404);
        response.end();
    });
}

var ios = io(server);

// -------------------------------------------------------------------
// setup password protection
// -------------------------------------------------------------------

if (params.useClientPassword) {
    var auth = require('socketio-auth');
    auth(ios, {
        authenticate: function(socket, password, callback) {
            mylog("authentication by client", 1);
            var connectionPassword = fs.readFileSync(params.connectionPasswordFile).toString().substr(0, 64);
            if (crypto.createHash('sha256').update(password).digest('hex') === connectionPassword) {
                mylog("authentication success", 1);
                return callback(null, true);
            } else {
                mylog("authentication failed", 0);
                return callback(new Error("Invalid connection password"), false);
            }
        },
        timeout: 1000
    });
}

// -------------------------------------------------------------------
// setup websocket server
// -------------------------------------------------------------------

ios.sockets.on('connection', function(socket) {
    var q = socket.handshake.query;
    var logmess = "client connected: " + q.client + ", " + q.model + ", " + q.platform + " " + q.version + ", App " + q.appver;
    mylog(logmess, 0);
    //emit authenticated if no passwd is used

    if (!params.useClientPassword) {
        mylog("emit authenticated cause no auth needed", 1);
        socket.emit('authenticated');
    }
    defListeners(socket);
    if (params.doCheckVersion) {
        setTimeout(function() {
            emitVersion(socket);
        }, 20000);
    }
});

// -------------------------------------------------------------------
// define listeners for websocket requests by clients
// -------------------------------------------------------------------

var defListeners = function(socket) {
    socket.on('getValueOnce', function(data) {
        var jsonValue = buffer.checkValue(data);
        if (jsonValue) {
            mylog('get value for ' + data, 2);
            mylog(jsonValue, 2);
            socket.emit('value', jsonValue);
        }
    });

    socket.on('getValueOnChange', function(data) {
        mylog("request for getValueOnChange " + data, 1);
        //var dataMasked = data.replace(/_/g, 'UNDERLINE');
        var dataMasked = data;
        if (typeof(socket.rooms) == 'undefined' || typeof(socket.rooms[dataMasked]) == 'undefined') {
            socket.join(dataMasked);
        }
    });

    socket.on('getDeviceOnChange', function(data) {
        mylog("request for getDeviceOnChange " + data, 1);
        //var dataMasked = 'device' + data.replace(/_/g, 'UNDERLINE');
        var dataMasked = data;
        if (typeof(socket.rooms) == 'undefined' || typeof(socket.rooms[dataMasked]) == 'undefined') {
            socket.join(dataMasked);
        }
    });

    socket.on('getAllValuesOnChange', function(data) {
        mylog("request for getAllValuesOnChange", 1);
        if (typeof(socket.rooms) == 'undefined' || typeof(socket.rooms[data]) == 'undefined') {
            socket.join('all');
        }
    });

    socket.on('getAllDevicesOnChange', function(data) {
        mylog("request for getAllDevicesOnChange", 1);
        if (typeof(socket.rooms) == 'undefined' || typeof(socket.rooms[data]) == 'undefined') {
            socket.join('device_all');
        }
    });

    socket.on('refreshValues', function(data) {
        mylog("request for refreshValues", 1);
        getAllValues('refresh');
    });

    socket.on('getAllValues', function(callback) {
        mylog("request for getAllValues", 1);
        if (!params.useClientPassword || socket.auth) {
            var response = buffer.checkValue('all');
            callback(response);
        } else {
            callback({ error: 'not authenticated' });
        }
    });

    socket.on('command', function(cmd, callback) {
        // establish telnet connection to fhem server
        mylog("request for sync command", 1);
        var fhemcmd = net.connect({ port: params.fhemPort, host: params.fhemHost }, function() {
            fhemcmd.write(cmd + ';exit\r\n');
        });

        var answerStr = '';
        fhemcmd.on('data', function(response) {
            answerStr += response.toString();
        });

        fhemcmd.on('end', function() {
            var arrayResp = answerStr.split("\n");
            callback(arrayResp);
        });
        fhemcmd.on('error', function() {
            fhemcmd.destroy();
            funcs.mylog('error: telnet connection failed', 0);
        });
    });

    socket.on('getAllSwitches', function(callback) {
        mylog("allSwitches fired by client", 1);
        var response = buffer.getAllSwitches();
        callback(response);
    });

    socket.on('getAllUnitsOf', function(type, callback) {
        var units = buffer.getAllUnitsOf(type);
        callback(units);
    });

    if (params.extendedMode) {
        socket.on('JsonList2', function(args, callback) {
            // establish telnet connection to fhem server
            mylog("request for JsonList2", 1);
            var fhemcmd = net.connect({ port: params.fhemPort, host: params.fhemHost }, function() {
                fhemcmd.write('JsonList2 ' + args + ';exit\r\n');
            });

            var answerStr = '';
            fhemcmd.on('data', function(response) {
                answerStr += response.toString().replace("\n", "");
            });

            fhemcmd.on('end', function() {
                var startPos = answerStr.indexOf('{');
                var lastPos = answerStr.lastIndexOf('}');
                answerStr = answerStr.substr(startPos, lastPos - startPos + 1);
                var answer = JSON.parse(answerStr);
                mylog(answer, 2);
                callback(answer);
            });
            fhemcmd.on('error', function() {
                fhemcmd.destroy();
                funcs.mylog('error: telnet connection failed', 0);
            });
        });
    }

    socket.on('commandNoResp', function(data) {
        mylog("commandNoResp " + data, 1);
        if (typeof(fhemSocket) != 'undefined' && !fhemSocket.destroyed && fhemSocket.writable) {
            fhemSocket.write(data + '\r\n');
        }
    });

    socket.on('disconnect', function(data) {
        mylog('disconnected: ' + data, 1);
        for (room in socket.rooms) {
            mylog("leave " + room, 1);
            socket.leave(room);
        }
    });
};

// -------------------------------------------------------------------
// setup permanent connection to fhem
// -------------------------------------------------------------------

fhemSocket = new net.Socket();
process.on('uncaughtException', function(err) {
    mylog('process error: ' + err + ' - retry in 10 secs', 0);
});

fhemSocket.on('connect', function(data) {
    funcs.mylog('connected to fhem server for listen on changed values', 0);
    fhemSocket.write('inform on\r\n');
    ios.sockets.emit('fhemConn');
});

fhemSocket.on('error', function() {
    ios.sockets.emit('fhemError');
    mylog('error: telnet connection failed - retry in 10 secs', 0);
    fhemSocket.destroy();
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(function() {
        connectFHEMserver();
    }, 10000);
});

fhemSocket.on('end', function() {
    ios.sockets.emit('fhemError');
    funcs.mylog('error: telnet connection closed - try restart in 10 secs', 0);
    //fhemSocket.end();
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(function() {
        connectFHEMserver();
    }, 10000);
});

fhemSocket.on('data', function(data) {
    mylog("changed data:", 2);
    mylog(data.toString(), 2);
    handleChangedValues(data.toString().split("\n"));
});

function connectFHEMserver() {
    funcs.mylog("start connection to fhem server", 0);
    clearTimeout(reconnectTimeout);
    fhemSocket.connect({ port: params.fhemPort, host: params.fhemHost });
}

// -------------------------------------------------------------------
// handle client get requests
// -------------------------------------------------------------------

function getAllValues(type) {
    // establish telnet connection to fhem server
    var fhemreq = net.connect({ port: params.fhemPort, host: params.fhemHost }, function() {
        fhemreq.write('list;exit\r\n');
    });

    var answerStr = '';
    fhemreq.on('data', function(response) {
        answerStr += response.toString();
    });

    fhemreq.on('end', function() {
        buffer.readValues(answerStr);
        if (type === 'init') {
            initFinished.emit('true');
        }
    });

    fhemreq.on('error', function() {
        mylog('error: telnet connection for getting values failed - retry in 10 secs', 0);
        fhemreq.destroy();
        setTimeout(function() {
            getAllValues();
        }, 10000);
    });

}

function handleChangedValues(allLines) {
    var devices = [];
    var device_old = '';
    allLines.forEach(function(line) {
        // ignore lines with html tag
        if (line.search("/<html>/") > -1) return;

        var lineparts = line.trim().split(' ');
        if (lineparts.length > 1) {
            var device = lineparts[1];
            if (device === 'global' && lineparts.length > 3) {
                device = lineparts[3];
            }
            if (lineparts.length > 2) {

                // ignore values containing tags out of params.filterOutTags
                if (params.filterOutTags && params.filterOutTags.indexOf(lineparts[2]) > -1) {
                    return;
                }

                lineparts.shift();
                lineparts.shift();
                var value = lineparts.join(' ');
                if (buffer.setActValue(device, value)) {
                    var jsonValue = buffer.checkValue(device);
                    var device2 = device.replace(/_/g, 'UNDERLINE');
                    var device2 = device;
                    //console.log(ios.sockets.adapter.rooms);
                    ios.sockets.in(device2).emit("value", jsonValue);
                    ios.sockets.in("all").emit("value", jsonValue);
                }
            }
            if (device_old !== device) {
                devices.push(device);
                device_old = device;
            }
        }
    });
    if (params.extendedMode) {
        for (var index in devices) {
            getDevice(devices[index]);
        }
    }
}

function getDevice(device) {
    // establish telnet connection to fhem server
    mylog('get Jsonlist2 for device ' + device, 1);
    var fhemreq = net.connect({ port: params.fhemPort, host: params.fhemHost }, function() {
        fhemreq.write('JsonList2 ' + device + ';exit\r\n');
    });

    var answerStr = '';
    fhemreq.on('data', function(response) {
        answerStr += response.toString();
    });

    fhemreq.on('end', function() {
        mylog(answerStr, 2);
        var startPos = answerStr.indexOf('{');
        var lastPos = answerStr.lastIndexOf('}');
        answerStr = answerStr.substr(startPos, lastPos - startPos + 1);
        var deviceJSON = JSON.parse(answerStr);
        ios.sockets.in('device_all').emit('device', deviceJSON);
        var deviceJSONname = 'device' + deviceJSON.Arg.replace(/_/g, 'UNDERLINE');
        var deviceJSONname = 'device' + deviceJSON.Arg;
        ios.sockets.in(deviceJSONname).emit('device', deviceJSON);
    });

    fhemreq.on('error', function() {
        fhemreq.destroy();
        mylog('error: telnet connection for getting JsonList2 failed', 0);
    });
}

// -------------------------------------------------------------------
// make DB requests
// -------------------------------------------------------------------

function pollDBvalue(dbObj) {
    setInterval(function() {
        if (typeof(fhemSocket) != 'undefined' && !fhemSocket.destroyed && fhemSocket.writable) {
            readdb.getDBvalue(dbObj, fhemSocket);
        }
    }, dbObj.refresh * 1000);
}

// -------------------------------------------------------------------
// check version of fhem.js
// -------------------------------------------------------------------

function checkVersion() {
    mylog("checkVersion started", 1);
    exec('npm view fhem.js version', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        version.latest = stdout.trim();
        version.type = 'fhemjs';
        if (version.latest == version.installed) {
            version.isLatest = true;
            mylog('Installed version ' + version.installed + ' is latest available version');
        } else {
            version.isLatest = false;
            mylog('Installed version: ' + version.installed + ', available version: ' + version.latest);
        }
        emitVersion(ios.sockets);
    });
}

function emitVersion(sockets) {
    if (version.isLatest) return;
    sockets.emit('version', version);
}

// -------------------------------------------------------------------
// init somwe things
// -------------------------------------------------------------------
function init() {

    setInterval(function() {
        getAllValues('refresh');
    }, params.pollForAllDevices * 1000);

    if (params.readDB) {
        var readdb = require('./readdb');
        for (var i in params.readDBvalues) {
            var dbObj = params.readDBvalues[i];
            pollDBvalue(dbObj);
        }
    }

    // check for new version every params.checkVersionInterval hours

    if (params.doCheckVersion) {
        var checkVersionIntervalMs = params.checkVersionInterval * 60 * 60 * 1000;
        mylog("versionCheck after " + checkVersionIntervalMs, 1);
        setInterval(function() {
            checkVersion();
        }, checkVersionIntervalMs);

        // check for new version 60 seconds after start
        setTimeout(function() {
            checkVersion();
        }, 60000);
    }
}

// -------------------------------------------------------------------
// main
// -------------------------------------------------------------------

getAllValues('init');

initFinished.on('true', function() {
    mylog('initFinished', 1);
    server.listen(params.nodePort);
    var messSuff = (params.useSSL) ? ' with SSL' : ' without SSL';
    mylog('listen for websocket requests on port ' + params.nodePort + messSuff);
    connectFHEMserver();
    init();
});