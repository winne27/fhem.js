#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

mkdir /etc/fhem.js

cp -r $DIR/../etc/fhem.js/* /etc/fhem.js/

if [ -f /etc/init.d/ ]
then
   cp -r $DIR/../etc/init.d/* /etc/init.d/
fi

if [ ! -f $DIR/../params.js ]
then
   cp -r $DIR/../params.js.dist $DIR/../params.js
fi

ln -s $DIR/../params.js /etc/fhem.js/params.js
ln -s $DIR/../params.js.dist /etc/fhem.js/params.js.dist
