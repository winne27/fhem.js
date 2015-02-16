# fhem.js

This is a node.js server which works as a websocket gateway to a fhem server.

Install node.js on the server on which fhem is installed

Have a look to param.js of this package. Adjust telnet port of fhem if neccessary.

Run server.js of this package as a node.js service.

On client side you need socket.io (tested with diverent browsers and with Android Java using java class [com.github.nkzawa.socketio.client](https://github.com/nkzawa/socket.io-client.java) for realizing a websocket connection.).

On client you can fire the following requests:

  * 'getValueOnce' : delivers a value from fhem once
  * 'getValuePerm' : delivers a value from fhem and send with websocket updated values
  * 'command'      : send a fhem command like "list xyz". Response is send back as ack response
  * 'commandNoResp': send a fhem command like "set xyz off". No response of this command is send back.

On client side the following receiving data event should be handled:

   'value' : (on.socket('value',....) 




More detailed docu will follow soon
