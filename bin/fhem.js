#!/bin/bash
PREFIX=%PREFIX%
BINPATH=$PREFIX/bin
PACKPATH=$PREFIX/lib/node_modules/fhem.js

NAME=fhem.js
PIDFILE=/var/run/fhem/fhem.js.pid
LOGFILE=/var/log/fhem.js.log
ERRORLOG=/var/log/fhem.js.error
FOREVER=$BINPATH/forever

while getopts "p:l:e:n:f:" opt; do
  case $opt in
    l)
      LOGFILE=$OPTARG
      ;;
    p)
      PIDFILE=$OPTARG
      ;;
    e)
      ERRORLOG=$OPTARG
      ;;
    n)
      NAME=$OPTARG
      ;;
    f)
      FOREVER=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done

$FOREVER start --uid "$NAME" --pidFile $PIDFILE -e $ERRORLOG -l $LOGFILE -a --workingDir $PACKPATH $PACKPATH/server.js
