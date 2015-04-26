#!/bin/bash
#
### BEGIN INIT INFO
# Provides: fhem.js
# description:  fhem.js init.d example using forever (install with: npm install -g forever)
# Required-Start: $local_fs $remote_fs $network $syslog mysql fhem
# Required-Stop:
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
#
### END INIT INFO


# Source function library.

NAME=fhem                     # Unique name for the application
SOURCE_DIR=/var/www/fhem.js   # Location of the application source
SOURCE_NAME=server.js         # Name of the applcation entry point script
LOG_DIR=/var/log/fhem
RUN_DIR=/var/run
export NODE_PATH=/usr/lib/nodejs:/usr/lib/node_modules:/usr/share/javascript

pidfile=/var/run/$NAME.pid

start() {
    echo "Starting $NAME node instance: "

    forever start --pidFile=$pidfile -e $LOG_DIR/error.log -l $LOG_DIR/$NAME.log -a --workingDir $SOURCE_DIR --uid "$NAME"  $SOURCE_DIR/$SOURCE_NAME
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
