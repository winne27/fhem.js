#!/bin/bash

if [ -L /etc/init.d/fhem.js ]
then
   rm -f /etc/init.d/fhem.js
fi

rm -f /etc/fhem.js/*dist

if [ -d /etc/fhem.js ]
then
   while true; do
      read -p "Do you wish to remove configuration files in /etc/fhem.js? (yN)" yn
      case $yn in
         [Yy]* )
            rm -rf /etc/fhem.js; echo done ;
            break;;
         [Nn]* ) exit;;
         "" ) exit;;
         * ) echo "Please answer yes or no.";;
      esac
   done
fi

