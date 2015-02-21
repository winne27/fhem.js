# fhem.js

This is a node.js server which works as a websocket gateway to a fhem server.

# Install
Install first node.js on the server on which fhem is installed. 
Install node.js plugin socket.io with

    npm install -g socket.io

Copy this package to a directory of your choice (e.g. /var/www/fhem.js).
Have a look to param.js of this package. Adjust telnet port of fhem if neccessary.
Change to installation directory and start the server with

    node.js start server.js

# Client

On client side you need socket.io (tested with diverent browsers and with Android Java using java class [com.github.nkzawa.socketio.client](https://github.com/nkzawa/socket.io-client.java) for realizing a websocket connection.).

On client you can fire the following requests:

  * 'getValueOnce' : requests a value from fhem once
  * 'getValuePerm' : requests a value from fhem and subscribes delivery of updated values by websockets connection
  * 'command'      : send a fhem command like "list xyz". Response is send back as ack response
  * 'commandNoResp': send a fhem command like "set xyz off". No response of this command is send back.

On client side the following receiving data event should be handled:

    socket.on('value',....) 

Java example:

    mySocket.socket.on("value", new Emitter.Listener()
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
    })


