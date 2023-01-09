#!/bin/bash

server=yourfiy4@server.yourfirstyearteaching.com
www_dir=public_html/websocket-python

scp -r ../css/* $server:$www_dir/css
scp -r ../js/*.js $server:$www_dir/js
scp ../index.html $server:$www_dir

