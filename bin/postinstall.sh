#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

    echo
    echo "************************************"
    echo "finish installation by running as root:"
    echo
    echo  sudo $DIR/postinstall
    echo
    echo "This puts configuration into folder /etc/fhem.js"
    echo  "************************************"
    echo
