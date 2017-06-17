#!/bin/bash

FSROOT=/home/ladders/api
export APPLICATION_ROOT=/api
source ${FSROOT}/env/bin/activate
cd ${FSROOT}
cp -n ladders.db ../backups/`date +%Y%m%d`
exec uwsgi -s /tmp/ladders.sock --module api --callable app -p 3 -C666 --master --master-fifo /tmp/ladders.master
