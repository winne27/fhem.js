#!/bin/bash

echo $npm_config_argv | grep -e \-\-unsafe-perm  > /dev/null
if [ $? -eq "0" ] || [ -z "$npm_config_argv" ]
then
    ps -ef | grep fhem.js | grep -v grep >/dev/null 2>&1
    if [ $? -eq "0" ]
    then
        service fhem.js stop > /dev/null 2>&1
    fi

    echo
    read -p "User for running fhem.js (fhem)? " USER

    [ -z "$USER" ] && USER="fhem"

    if id "$USER" >/dev/null 2>&1; then
            echo
            echo "ok, user is valid"
            echo
    else
            echo
            echo ------------------------------------------------
            echo "User does not exist. Check and try again with command:"
            echo sudo $DIR/postinstall.sh
            echo ------------------------------------------------
            echo
            exit;
    fi

    ###SOURCE="${BASH_SOURCE[0]}"
    ###SOURCEDIR=`cd -P \`dirname "$SOURCE"\` && pwd`

    SOURCEDIR=$( cd ${0%/*} && pwd -P )

    PACKAGEDIR=${SOURCEDIR%/*}
    PREFIX=${PACKAGEDIR%/*/*/*}

    PIDDIR=/var/run/$USER

    ## define directory for pid
    if [ ! -d $PIDDIR ]
    then
       mkdir -p $PIDDIR
    fi
    chown $USER $PIDDIR

    if [ ! -d /etc/fhem.js ]
    then
       mkdir /etc/fhem.js
    fi

    if [ -L /etc/fhem.js/params.js ]
    then
       rm /etc/fhem.js/params.js
    fi

    if [ -L /etc/fhem.js/params.js.dist ]
    then
       rm /etc/fhem.js/params.js.dist
    fi

    cp -r $PACKAGEDIR/etc/fhem.js/* /etc/fhem.js/
    cat /etc/fhem.js/params.new.*.dist >> /etc/fhem.js/params.js.dist

    STARTSCRIPT=/etc/init.d/fhem.js
    if [ -f $STARTSCRIPT ]
    then
        cp $PACKAGEDIR/etc/init.d/fhem.js $STARTSCRIPT.old
    fi

    cp $PACKAGEDIR/etc/init.d/fhem.js $STARTSCRIPT.dist

    cp $PACKAGEDIR/etc/init.d/fhem.js $STARTSCRIPT
    chmod +x $STARTSCRIPT
    sed -i "s/%USER%/$USER/" $STARTSCRIPT

    sed -i s#%PREFIX%#$PREFIX#g /etc/init.d/fhem.js
    sed -i s#%PREFIX%#$PREFIX#g $PREFIX/bin/fhem.js

    params=/etc/fhem.js/params.js
    if [ ! -f $params ]
    then
        cp /etc/fhem.js/params.js.dist $params
    fi

    sed -i 's/\r//g' $params
    if !( grep -q 'new for 2.4.7' $params )
    then
        cat /etc/fhem.js/params.new.2.4.7.dist >> /etc/fhem.js/params.js
    fi

    if !( grep -q 'new for 2.4.11' $params )
    then
        cat /etc/fhem.js/params.new.2.4.11.dist >> /etc/fhem.js/params.js
        cat /etc/fhem.js/params.new.2.4.11.dist
        echo
    fi

    rm $PACKAGEDIR/params.js >/dev/null 2>&1
    ln -sf /etc/fhem.js/params.js $PACKAGEDIR/params.js

    touch /var/log/fhem.js.log
    touch /var/log/fhem.js.error
    chown $USER /var/log/fhem.js.*
    chown -R $USER /etc/fhem.js
else
    SOURCE="${BASH_SOURCE[0]}"
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

    echo
    echo "************************************"
    echo "finish installation by running:"
    echo
    echo  sudo $DIR/postinstall.sh
    echo
    echo "This puts configuration into folder /etc/fhem.js"
    echo  "************************************"
    echo
fi