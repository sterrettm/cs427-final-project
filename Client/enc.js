const fs = require('fs')
const https = require('https')
const process = require('process')
const { session } = require('electron')
const crypto = require('crypto')
const argon2 = require('argon2')

args = process.argv.slice(2)
rejectUnauthorized = args[0] !== "BREAKALLSECURITY"
if (!rejectUnauthorized){
    console.log("MAJOR WARNING: Permitting self-signed certificates")
}

var passwordData = {}
var kdfSalt = undefined
var aesKey = undefined

async function getMasterKey(salt, password){
    var masterKey = await argon2.hash(password, {type: argon2.argon2id, salt: salt, raw: true})
    console.log("Master Key: " + masterKey.toString('base64'))
    return masterKey
}

// TODO maybe get rid of this and move its logic back into the one place it is called
function _syncRequest(options){
    return new Promise(function (resolve, reject){
        var req = https.request(options, res => {
            resolve(res)
        })
        req.end()
    })
}

async function loadLocal(username, path){
    try {
        // TODO building up the path like this is bad, do something better
        var rawData = await fs.readFile(path + username + ".json")
        var realData = JSON.parse(rawData)
        
        if (username in realData){
            return realData[username]
        }else{
            return {}
        }
    } catch (err){
        return {}
    }
}

async function saveLocal(username, data, path){
    
}

async function saveRemote(username, token, data, hostname = "localhost"){
    console.log("yes...")
    var options = {
        host: hostname,
        path: "/upload",
        method: "POST",
        port: 32433,
        rejectUnauthorized: rejectUnauthorized,
        headers:{
            'Cookie': ("username="+username+"; token=" + JSON.stringify(token)),
            'Content-Type': "application/json"
        }
    }
    
    var res = new Promise(function (resolve, reject){
        var req = https.request(options, res => {
            resolve(res)
        })
        req.write(JSON.stringify(data))
        console.log("yes...")
        req.end()
    })
    
    if (res.statusCode == 200){
        return true
    }else{
        console.log("Error: Server returned error status: " + res.statusCode)
        return false
    }
}

async function loadRemote(username, token, hostname = "localhost"){
    
    var options = {
        host: hostname,
        path: "/download",
        method: "GET",
        port: 32433,
        rejectUnauthorized: rejectUnauthorized,
        headers:{
            'Cookie': ("username="+username+"; token=" + JSON.stringify(token))
        }
    }
    
    var res = await (new Promise(function (resolve, reject){
        var req = https.request(options, res => {
            var data = ''
            
            res.on('data', function(chunk){
                data += chunk
            })
            
            res.on('end', function(){
                res.body = JSON.parse(data)
                resolve(res)
            })
        })
        req.end()
    }))
    if (res.statusCode == 200){
        return res.body
    }else if (res.statusCode == 404){
        // TODO this can now never be reached
        console.log("Info: No user file found on server.")
        return {}
    }else{
        // TODO reconsider error handling in general around here
        console.log("Error: Server returned error status: " + res.statusCode)
        return {}
    }
    
}

function getSalt(remoteData, localData){
    if ("salt" in remoteData && "salt" in localData){
        var remoteSalt = remoteData.salt
        var localSalt = localData.salt
        if (remoteSalt != localSalt){
            // Very bad
            // TODO figure out what on earth to do here
            console.log("Error: Server-client salt mismatch")
            return undefined
        }else{
            return remoteSalt
        }
        
    }else if ("salt" in remoteData){
        var remoteSalt = remoteData.salt
        return remoteSalt
        
    }else if ("salt" in localData){
        var localSalt = localData.salt
        return localSalt
        
    }else{
        // TODO we need to tell the user that we have to login in online the first time,
        // so we can get the salt from the server. Not sure how to cleanly do that
        // (maybe a special IPC response like (salt_missing???)
        console.log("Error: No local or remote salt found")
        return undefined
    }
}

function encryptData(passwordData, key){
    // Convert to Buffer
    var dataBuffer = Buffer.from(JSON.stringify(passwordData))
    
    // Generate a new iv
    var iv = crypto.randomBytes(16)
    
    const algorithm = 'aes-256-cbc'
    
    var cipher = crypto.createCipheriv(algorithm, key, iv)
    
    var encrypted = cipher.update(dataBuffer, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    
    return {iv: iv.toString('base64'), ctxt: encrypted}
}

function decryptData(data, key){
    // Extract the iv and ciphertext
    var iv = Buffer.from(data.iv, 'base64')
    var ctxt = Buffer.from(data.ctxt, 'base64')
    
    const algorithm = 'aes-256-cbc'
    
    var decipher = crypto.createDecipheriv(algorithm, key, iv)
    
    var decrypted = decipher.update(ctxt, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    
    var decryptedJSON = JSON.parse(decrypted)
    return decryptedJSON
}

async function decrypt(remoteData, localData, masterPassword){
    var saltString = getSalt(remoteData, localData)
    if (saltString == undefined){
        return false
    }else{
        kdfSalt = Buffer.from(saltString)
    }

    var masterKey = await getMasterKey(kdfSalt, masterPassword)
    if (masterKey != undefined){
        aesKey = masterKey
    }
    
    var finalData = undefined
    if ('ciphertext' in localData && 'ciphertext' in remoteData){
        var localPlain = decryptData(localData.ciphertext, masterKey)
        var remotePlain = decryptData(remoteData.ciphertext, masterKey)
        
        // TODO handle conflicts between these 
        finalData = remotePlain
    }else if ('ciphertext' in localData){
        var localPlain = decryptData(localData.ciphertext, masterKey)
        finalData = localPlain
        
    }else if ('ciphertext' in remoteData){
        var remotePlain = decryptData(remoteData.ciphertext, masterKey)
        finalData = remotePlain
        
    }else{
        // Initialize a basic empty password store
        console.log("Info: No password store found, empty one created")
        finalData = {passwords: []}
    }
    
    console.log(finalData)
    
    passwordData = finalData
    
    // Return true when succesful
    return true
}

async function loadPasswordFile(username, masterPassword, remote){
    
    var remoteData = undefined
    
    if (remote){
        var token = (await session.defaultSession.cookies.get({ name: "token" }))[0].value
        remoteData = await loadRemote(username, token, "localhost")
    }
    
    var localData = await loadLocal(username, "./data/")
    
    var success = await decrypt(remoteData, localData, masterPassword)
    
    if (!success){
        return false
    }
    
    
    // Return true when succesful
    return true
}

async function savePasswordFile(username, remote){
    // A lot of stuff used here is setup in loadPasswordFile and stored in globals
    // TODO reconsider that
    var token = (await session.defaultSession.cookies.get({ name: "token" }))[0].value
    
    var ctxt = encryptData(passwordData, aesKey)
    
    var result = {salt: kdfSalt, ciphertext: ctxt}
    
    if (remote){
        saveRemote(username, token, result, "localhost")
    }
    saveLocal(username, result, "./data/")
}

function addPassword(hostname, username, password){
    var currentDate = Date.now()
    
    var entry = {hostname: hostname, username: username, password: password, lastModified: currentDate}
    
    passwordData.passwords.push(entry)
}

function passwordList(){
    return passwordData
}

function tester(){
    var key = crypto.randomBytes(32)
    var testStuff = {test: "Hello!", more: {a: "Apples", o: "Oranges"}}
    
    ctxt = encryptData(testStuff, key)
    console.log(ctxt)
    ptxt = decryptData(ctxt, key)
    
    console.log(ptxt)
}

module.exports = {loadPasswordFile: loadPasswordFile, savePasswordFile: savePasswordFile, addPassword: addPassword, passwordList: passwordList, tester: tester}