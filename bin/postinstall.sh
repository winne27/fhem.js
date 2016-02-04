#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done

DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

cd $DIR/..
DIR=`pwd`

cp -r etc/fhem.js/* /etc/fhem.js/

if [ -d /etc/init.d ]
then
   cp -r etc/init.d/* /etc/init.d/
fi

if [ ! -f /etc/fhem.js/params.js ]
then
   cp -r $DIR/params.js.dist /etc/fhem.js/params.js
fi

if [ ! -L /etc/fhem.js/params.js.dist ]
then
   ln -s $DIR/params.js.dist /etc/fhem.js/params.js.dist
fi

if [ ! -L $DIR/params.js ]
then
   ln -s /etc/fhem.js/params.js $DIR/params.js
fi

ln -sf $DIR/bin/fhem.js /usr/bin/fhem.js