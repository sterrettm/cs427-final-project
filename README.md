Setting up the server:
  When in the Server folder, you should be able to do "npm start" to run the server
However, one thing you will need to do first is to create a folder called "certs"
in the Server directory, and add a key/certificate pair called key.pem and cert.pem
to that folder. At that point, you should be able to start the server with "npm start"

Setting up the client:
 When in the Client folder, you should be able to do "npm start" to start the client
One thing to note is that, by default, you will not be able to connect if you have
a self-signed certificate for the server. 

To run the code, you need to make the client accept the server's certificate:

Recommended:
Copy the certificate for the server into ./certs/cert.pem
Then the client should just work

Not Recommended:
To disable all checking of certificate validity,
run the client with the argument "BREAKALLSECURITY".