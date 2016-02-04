#!/bin/bash

if [ ! -d /etc/fhem.js ]
then
   sudo mkdir /etc/fhem.js
   if [ "$?" -gt 0 ]
   then
      echo "Create directory /etc/fhem.js first"
      exit 2
   fi
fi