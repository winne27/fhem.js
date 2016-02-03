#!/bin/bash
 
NAME=fhem.js
PIDFILE=/var/run/fhem.js.pid
LOGFILE=/var/log/fhem.js.log
ERRORLOG=/var/log/fhem.js.error
FOREVER=/usr/bin/forever

while getopts "p:l:e:n:" opt; do
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

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
cd $DIR/..
DIR=`pwd`

$FOREVER start --uid "$NAME" --pidFile /var/run/fhem.js.pid -e /var/log/fhem.js.error -l /var/log/fhem.js.log -a --workingDir $DIR  $DIR
