const crypto = require('crypto')
const argon2 = require('argon2')

function isExpired(token){
    if (token.creationTime > Date.now()){
        // Begone time travelers
        return true
    }else if (token.expiryTime <= Date.now()){
        // Expired
        return true
    }else if (token.creationTime > token.expiryTime){
        // Not that this should ever happen, but its definitely a problem
        return true
    }else{
        return false
    }
}

function isValid(serverToken, clientToken){
    if (serverToken == undefined || clientToken == undefined){
        console.log("Token is missing its partner")
        return false
    }else if (Buffer.compare(clientToken.token, serverToken.token) !== 0){
        console.log("Tokens do not match\n"+clientToken.token + "\n"+serverToken.token)
        return false
    }else if (clientToken.creationTime != serverToken.creationTime){
        console.log("Creation times do not match")
        return false
    }else if (clientToken.expiryTime != serverToken.expiryTime){
        console.log("Expiry times do not match")
        return false
    }else if (isExpired(serverToken) || isExpired(clientToken)){
        // TODO remove the expired token if it's on the server
        console.log("Token is expired")
        return false
    }else{
        return true
    }
}

function validateUser(tokens, req, res){
    var username = req.cookies.username
    var serverToken = tokens[username]
    var clientToken = JSON.parse(req.cookies.token)
    clientToken.token = Buffer.from(clientToken.token)
    
    // TODO maybe reconsider how this handles the failure case
    // The reason I return the username instead of just true or false
    // is to ensure that the username that was validated is the same one
    // being allowed to access their data
    if (isValid(serverToken, clientToken)){
        return username
    }else{
        return undefined
    }
}

async function loginUser(userData, req, res){
    
	var uncoded = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString('ascii')
	var username = uncoded.split(':')[0]
	var password = uncoded.split(':')[1]
    
    if (username in userData){
        if (await argon2.verify(userData[username].passwordHash, password)){
            // TODO login user by generating token and adding this to the cookies
            var rawToken = crypto.randomBytes(16)
            var creationTime = Date.now()
            
            // TODO I think this is fine, but might be better to use some builtin function to do this
            var expiryTime = creationTime + (5 * 60 * 60 * 1000)
            
            var token = {token: rawToken, creationTime: creationTime, expiryTime: expiryTime}
            
            res.cookie('username', username)
            res.cookie('token', JSON.stringify(token), {httpOnly: true})
            res.sendStatus(200);
            
            tokens[username] = token
        }else{
            // TODO error better
            res.writeHead(403)
            res.end();
        }
    }else{
        // TODO error better
        res.writeHead(403)
        res.end();
    }
}

async function signupUser(userData, req, res){
	var uncoded = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString('ascii')
	var username = uncoded.split(':')[0]
	var password = uncoded.split(':')[1]
    
    if (username in userData){
        // TODO error better
        res.writeHead(403)
        res.end();
    }else{
        userData[username] = {}
        
        // TODO make sure parameters for this argon2id call is fine
        const hash = await argon2.hash(password, {type: argon2.argon2id})
        
        userData[username].passwordHash = hash
        
        // TODO I am pretty sure this is a fine way to generate a salt,
        // but a bit more research into this might be good
        userData[username].kdfSalt = crypto.randomBytes(16)
        
        res.writeHead(200)
        res.end()
        
    }
}

module.exports = {
	validateUser: validateUser,
	loginUser: loginUser,
	//logoutUser: logoutUser,
	signupUser: signupUser
}