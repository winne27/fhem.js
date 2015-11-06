#!/bin/bash
#
### BEGIN INIT INFO
# Provides: fhem.js
# description:  fhem.js init.d example 
# Required-Start: $local_fs $remote_fs $network $syslog 
# Required-Stop:
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
#
### END INIT INFO

NAME=fhem.js                  # Unique name for the application
LOGFILE=/var/log/$NAME.log
ERRORLOG=/var/log/$NAME.error
//export NODE_PATH=/usr/lib/nodejs:/usr/lib/node_modules:/usr/share/javascript
PIDFILE=/var/run/$NAME.pid

start() {
    echo "Starting $NAME node instance: "

    fhem.js -n $NAME -l $LOGFILE -e $ERRORFILE -p $PIDFILE
    RETVAL=$?
}

restart() {
    echo -n "Restarting $NAME node instance : "
    forever restart $NAME
    RETVAL=$?
}

stop() {
    forever stop $NAME
    RETVAL=$?
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
       forever list 
       RETVAL=$?
        ;;
    restart)
        restart
        ;;
    *)
        echo "Usage:  {start|stop|status|restart}"
        exit 1
        ;;
esac
exit $RETVAL
