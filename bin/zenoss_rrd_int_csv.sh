#!/bin/bash
source ../zenrrd.config
# $zenoss_user is pulled from config

debug=0
if [[ "$1" == 'debug' ]]; then
    debug=1
fi

date=`date +%s`
f=$(dirname $(readlink -f $0))
zenoss_script="$f/get_interface_csv.py"
tmpfile=/tmp/interfaces.csv.$date
realfile="$f/interfaces.csv";
if (( $debug >0 )) ; then
 echo "running: sudo -i -u $zenoss_user $zenoss_script ";
 sudo -i -u $zenoss_user $zenoss_script 
else
 ## must be ran as zenoss with env (-i)
 sudo -i -u $zenoss_user $zenoss_script  > $tmpfile
 FILESIZE=$(stat -c%s "$tmpfile")
 if (( FILESIZE > 100 )) ;then
     mv $tmpfile $realfile
 fi
fi
