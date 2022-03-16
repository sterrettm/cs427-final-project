This is a networked password manager.

You encrypt and decrypt locally under a master password.
(aes-256-cbc is used)

Sync your changes with the server's data. Conflicts are merged based on timestamps.

Optionally use Google SSO so you don't have to remember another password.

Setup:
1. Create a folder called "certs" in the root directory.
2. Navigate to this "certs" folder and generate cert/key pair using the following command (works in Git Bash):
  openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
3. Run root/install_requirements.bat
4. Run root/start_server.bat
5. Run root/start_client.bat

Not Recommended:
To disable all checking of certificate validity,
run the client with the argument "BREAKALLSECURITY".