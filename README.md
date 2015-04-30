# Purpose

This is a node.js server which works as a websocket gateway to a [fhem](http://fhem.de) (home automation) server.
Clients can use socket.io in Javascript and Java to establish a websocket connection to fhem.

It is possible to subscribe for updates of fhem resource stati like on/off or temperature.
The websocket connection will deliver this values just in time. Furthermore fhem commands could be send other this connection.

# Install

Install first node.js on the server on which fhem is installed. 
Ensure that telnet is enabled on the standard fhem server.

Install node.js plugin socket.io with

    npm install -g socket.io

Copy this package to a directory of your choice (e.g. /var/www/fhem.js).
Have a look to param.js of this package. Adjust telnet port of fhem if neccessary.
Change to installation directory and start the server with

    node.js start server.js

# Operation breakdown

The fhem.js server establishes a permanent telnet connection to the standard fhem server and requests information for all changed values (command: inform on). It also forwards commands and responses between clients and the fhem server.

Communication to clients with websockets were realized by the socket.io package.

# Customize

Adjust in params.js telnet port of fhem.pl server and port on which this server (fhem.js) is reachable.

The fhem.pl server must be on the same server and the telnet must be configured without local password.

To secure the connection to this node.js server with SSL set

    exports.useSSL = true;
    exports.sslcert =
    {
        key:    '/etc/ssl/private/bundle/ssl.key',
        cert:   '/etc/ssl/private/bundle/allcert.pem'
    }

# Client

On client side you need socket.io (tested with diverent browsers and with Android Java using java class [com.github.nkzawa.socketio.client](https://github.com/nkzawa/socket.io-client.java) for realizing a websocket connection.).

Establish connection to node.js server by:

     socket = IO.socket(url, options);        
     socket.connect();

**On client you can emit the following async requests (fast response with minimized data):**

  * 'getValueOnce'         : requests a value from fhem once
  * 'getValueOnChange'     : subscribes delivery of a single updated value by a websocket connection
  * 'getAllValuesOnChange' : subscribes delivery of all updated values by a websocket connection

**On client you can emit the following async requests (slower response with much more data):**

  * 'getDeviceOnChange'     : subscribes delivery of a single updated device in JsonList2 format
  * 'getAllDevicesOnChange' : subscribes delivery of all updated devices in JsonList2 format

Example:

    socket.emit('getValueOnChange','fhem-device-name'); 

For catching the response define a listener with label 'value' in the first case and label 'device' in the second case.

Java example:

    socket.on("value", new Emitter.Listener()
    {
        @Override
        public void call(Object... args)
        {
            Log.i("get value", args[0].toString());
            JSONObject obj = (JSONObject) args[0];
            Iterator<String> iterator = obj.keys();
            String unit = null;
            while (iterator.hasNext())
            {
               unit = (String) iterator.next();
               value = obj.getString(unit);
            }
        }
    }
      
Javascript example:

    socket.on('value',function(data)
    {
        for (unit in data)
        {
           var value = data[unit];
        }
    });

**On client you can emit the following sync requests:**
  * 'command',cmd      : send a fhem command like "list xyz". Response is send back as ack response
  * 'commandNoResp',cmd: send a fhem command like "set xyz off". No response of this command is send back
  * 'getAllSwitches'   : returns JSON array with all devices which have state on, off or toggle
  * 'getAllValues'     : returns JSON array with all devices and their state
  * 'getAllUnitsOf'    : returns JSON array with all devices of type, there type is a argument
  * 'JsonList2',cmd    : returns response from JsonList2 as JSON object     

Java example for getAllSwitches:

    mySocket.socket.emit("getAllSwitches", new Ack()
    {
        @Override
        public void call(Object... args)
        {
            JSONArray JSONswitches = (JSONArray) args[0];
            for (int i = 0, size = JSONswitches.length(); i < size; i++)
            {
                String device = JSONswitches.getString(i);
            }
        }
    });

Java example for getAllUnitsOf (with "LightScene" as argument type):

    mySocket.socket.emit("getAllUnitsOf", "LightScene", new Ack()
    {
        @Override
        public void call(Object... args)
        {
            JSONArray JSONlightscenes = (JSONArray) args[0];
            try
            {
                for (int i = 0, size = JSONlightscenes.length(); i < size; i++)
                {
                    String unit = JSONlightscenes.getString(i);
                }
            }
        }
    });
   
   Javascript example:

    socket.emit("getAllUnitsOf", "LightScene", function(data)
    {
        for (unit in data)
        {
           var value = data[unit];
        }
    });

# Example

The folder "test" contains a html/javascript example for an client program.

# Start as service

For starting fhem.js server as service using forever is recommended. Install it with:

    npm install -g forever

In the folder /etc/init.d is an example for a start/stop script using forever.
