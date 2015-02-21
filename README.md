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

  * 'getValueOnce' : delivers a value from fhem once
  * 'getValuePerm' : delivers a value from fhem and send with websocket updated values
  * 'command'      : send a fhem command like "list xyz". Response is send back as ack response
  * 'commandNoResp': send a fhem command like "set xyz off". No response of this command is send back.

On client side the following receiving data event should be handled:

   'value' : (on.socket('value',....) 
