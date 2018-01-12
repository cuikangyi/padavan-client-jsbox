#!/bin/sh

deviced_dir=/tmp/deviced

timestamp=$(date "+%s")

if [ ! -d $deviced_dir ]; then
    mkdir -p $deviced_dir
fi
# daily
today_dir=$deviced_dir/$(date "+%Y%m%d" )
if [ ! -d $today_dir ]; then
    echo $today_dir
    mkdir -p $today_dir
fi

while read line
do
    ip=`echo $line | awk -F ',' '{print $1}'`
    mac=`echo $line | awk -F ',' '{print $2}' | sed s/://g`
    name=`echo $line | awk -F ',' '{print $3}'`
    status=`echo $line | awk -F ',' '{print $6}'`
    devicefile=$today_dir/$mac
    if [ ! -f $devicefile ]; then
        touch $devicefile
    fi
    last_status=`tail -1 $devicefile`
    if [ x"$last_status" = x ]; then
        if [ $status != 1 ]; then
            echo "$status,$timestamp" > $devicefile
        fi
    else
        old_status=`echo $last_status |awk -F ',' '{print $1}'`
        if [ $old_status != $status ];then
            echo "$status,$timestamp" >> $devicefile
        fi
    fi

done < /tmp/static_ip.inf
