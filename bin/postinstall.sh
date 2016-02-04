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

if [ ! -d /etc/fhem.js ]
then
   mkdir /etc/fhem.js
   if [ "$?" -gt 0 ]
   then
      echo "Create directory /etc/fhem.js first"
      exit 2
   fi
fi

cp -r etc/fhem.js/* /etc/fhem.js/

if [ ! -L /etc/init.d/fhem.js ]
then
   ln -s  $dir/etc/init.d/fhem.js /etc/init.d/fhem.js
fi

if [ ! -f /etc/fhem.js/params.js ]
then
   cp -r $DIR/params.js.dist /etc/fhem.js/params.js
fi

if [ ! -L /etc/fhem.js/params.js.dist ]
then
   ln -s $DIR/params.js.dist /etc/fhem.js/params.js.dist
fi

ln -sf /etc/fhem.js/params.js $DIR/params.js
