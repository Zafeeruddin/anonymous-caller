#!/bin/bash

RTSP_URL="rtsp://admin:ADMIN@123@192.168.0.214:554/Streaming/Channels/101"
UDP_PORT=5000

ffmpeg -i $RTSP_URL -c:v libx264 -preset ultrafast -tune zerolatency -f mpegts udp://localhost:$UDP_PORT
