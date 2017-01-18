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

USER=%USER%
NAME=fhem.js                  # Unique name for the application
LOGFILE=/var/log/$NAME.log
ERRORLOG=/var/log/$NAME.error
PIDFILE=/var/run/$USER/$NAME.pid
PREFIX=%PREFIX%
FOREVER=$PREFIX/bin/forever
FHEMJSSTART=$PREFIX/bin/fhem.js

start() {
    echo "Starting $NAME node instance: "

    sudo -u $USER $FHEMJSSTART -n $NAME -l $LOGFILE -e $ERRORLOG -p $PIDFILE -f $FOREVER
    RETVAL=$?
}

restart() {
    echo -n "Restarting $NAME node instance : "
    sudo -u $USER $FOREVER restart $NAME
    RETVAL=$?
}

stop() {
    sudo -u $USER $FOREVER stop $NAME
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
       sudo -u $USER $FOREVER list
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
