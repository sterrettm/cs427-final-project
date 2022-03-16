This is a networked password manager.

Created 03/2022 by Matthew Sterrett, Karl Adriano, and Aaron Frost
for CS 427 - Cryptography as a final project.

Video walkthrough: https://youtu.be/pUOzHO4JKkA

You encrypt and decrypt locally under a master password, which is passed into Argon2 key 
derivation function for use with aes-256-cbc.

Sync your changes with the server's data. Conflicts are merged based on timestamps.

Optionally use Google SSO so you don't have to remember another password.

Make sure you aren't blocking browser cookies with a tool like Privacy Badger!

Setup:
1. Create a folder called "certs" in the root directory.
2. Navigate to this "certs" folder and generate cert/key pair using the following command (works in Git Bash):
  openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
  Make sure to set the "Common Name" field to localhost
3. Run root/install_requirements.bat to install dependencies
4. Run root/start_server.bat
5. Run root/start_client.bat

Not Recommended:
To disable all checking of certificate validity,
run the client (npm start) with the argument "BREAKALLSECURITY".