# Purpose

This is a node.js server which works as a websocket gateway to a [fhem](http://fhem.de) (home automation) server.
Clients can use socket.io in Javascript and Java to establish a websocket connection to fhem.

It is possible to subscribe for updates of fhem resource stati like on/off or temperature.
The websocket connection will deliver this values just in time. Furthermore fhem commands could be send other this connection.

# Install

Install first node.js on the server on which fhem is installed. Ensure that the version of node.js is greater than 4.x. Check it with

    node -v

Ensure that telnet is enabled on the standard fhem server.

For installation of this package two posibilities exists:

A - If you trust fhem.js install the package with

    sudo npm install --unsafe-perm -g fhem.js

B - If you don't like options like unsafe-perm install the package without the option --unsafe-perm.

    sudo npm install -g fhem.js

For that you will get some permission error messages at the end of the installation. Now you can check the postinstall script
in the node.js directory (e.g. /usr/(local/)lib/node_modules/fhem.js/bin) for bad code and finish or update installation by

    sudo %nodelib%/fhem.js/bin/postinstall
    e.g. sudo /usr/lib/node_modules/fhem.js/bin/postinstall.sh

All needed npm packages like socket.io, socket-auth and forever will be installed automatically.
The post installation process prompts for a unix user with wich fhem.js should run. The default is fhem. This user must exist before starting installation.


Have a look to /etc/fhem.js/params.js. Adjust the hostname (default is `localhost`) and telnet port of fhem.pl if neccessary. Optionally set a connection password or set SSL for connections can be done there.

Now starting the server with

    /usr/bin/fhem.js

or when /usr/bin is in your path simply by

    fhem.js

# Autostart as service

If this package is installed on a system with /etc/init.d for starting init processes in this directory a file named fhem.js is found after installation.
Check this file for some parameters in case you don't like the defaults.

Activate autostart by

   sudo update-rc.d fhem.js enable

Not in every Linux distribution this folder exists, but the script can also be found
in path-to-nodejs-modules/fhem.js/etc/init.d (Default of path-to-nodejs-modules: /usr/lib/node_modules).

# Operation breakdown

The fhem.js server establishes a permanent telnet connection to the standard fhem server and requests information for all changed values (command: inform on). It also forwards commands and responses between clients and the fhem server.

Communication to clients with websockets were realized by the socket.io package.

# Customize

Adjust in params.js the hostname and telnet port of the fhem.pl server and the port on which this server (fhem.js) is reachable.

The telnet must be configured without local password.

To secure the connection to this node.js server with SSL set

    exports.useSSL = true;
    exports.sslcert =
    {
        key:    '/etc/ssl/private/bundle/ssl.key',
        cert:   '/etc/ssl/private/bundle/allcert.pem'
    }

# Client

On client side you need socket.io (tested with different browsers and with Android Java using java class [com.github.nkzawa.socketio.client](https://github.com/nkzawa/socket.io-client.java) for realizing a websocket connection.).

Establish connection to node.js server by:

     socket = IO.socket(url, options);        
     socket.connect();

**On client you can emit the following requests (without response):**

  * 'refreshValues'        : structuaral changes in fhem are polled by fhem.js every 10 minutes. The refresh can forced by this request.

**On client you can emit the following async requests (fast response with minimized data):**

  * 'getValueOnce'         : requests a value from fhem once
  * 'getValueOnChange'     : subscribes delivery of a single updated value by a websocket connection
  * 'getAllValuesOnChange' : subscribes delivery of all updated values by a websocket connection
  * 'getReadingOnce'       : requests a reading from fhem once
  * 'getReadingOnChange'   : subscribes delivery of a reading by a websocket connection

**On client you can emit the following async requests (slower response with much more data):**

  * 'getDeviceOnChange'     : subscribes delivery of a single updated device in JsonList2 format
  * 'getAllDevicesOnChange' : subscribes delivery of all updated devices in JsonList2 format

Syntax:

    socket.emit('getAllValuesOnChange'); 
    socket.emit('getValueOnce','fhem-device-name'); 
    socket.emit('getValueOnChange','fhem-device-name'); 
    
    socket.emit('getAllDevicesOnChange'); 
    socket.emit('getDeviceOnChange','fhem-device-name'); 

    socket.emit('getReadingOnce',{unit: 'unit-name', reading: 'reading-name'}); 
    socket.emit('getReadingOnChange',{unit: 'unit-name', reading: 'reading-name'}); 

For catching the response define a listener with label 'value' or 'reading' in the first case and label 'device' in the second case.

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
  * 'command','your_command':       send a fhem command like "list xyz". Response is send back as ack response
  * 'commandNoResp','your_command': send a fhem command like "set xyz off". No response of this command is send back
  * 'getAllSwitches':               returns JSON array with all devices which have state on, off or toggle
  * 'getAllValues':                 returns JSON array with all devices and their state
  * 'getAllUnitsOf':                returns JSON array with all devices of type, there type is a argument
  * 'JsonList2','fhem_unit':        returns response from JsonList2 as JSON object     

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

    socket.emit("commandNoResp", "set Bath_Room_Light off");
   
    socket.emit("getAllUnitsOf", "LightScene", function(data)
    {
        for (unit in data)
        {
           var value = data[unit];
        }
    });

    socket.emit("JsonList2", "Bathroom", function(data)
    {
    	// data contains a Fhem JsonList2 of device Bathroom
        console.log(data);
    });

**On client you can listen to "version" event (only if in params.js: doCheckVersion = true)**

Java example:

    mySocket.socket.on("version", args -> {
                JSONObject obj = (JSONObject) args[0];
                try {
                    String versionInstalled = obj.getString("installed");
                    String versionLatest = obj.getString("latest");
                    Boolean versionIsLatest = obj.getBoolean("isLatest");

                    Log.d("version", versionInstalled + " - " + versionLatest);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            });

# Example

The folder "test" contains a html/javascript example for a client program.

