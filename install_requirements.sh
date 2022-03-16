#! /bin/bash

chmod +x start_server.sh start_client.sh

cd "Server"
npm install google-auth-library --save
npm install express

cd "../Client"
npm install electron --save-dev