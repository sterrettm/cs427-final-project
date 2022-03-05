const fs = require('fs')
const https = require('https')
const process = require('process')
const { session } = require('electron')

args = process.argv.slice(2)
rejectUnauthorized = args[0] !== "BREAKALLSECURITY"
if (!rejectUnauthorized){
    console.log("MAJOR WARNING: Permitting self-signed certificates")
}

var passwordData = {}

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
    
    var res = await _syncRequest(options)
    if (res.statusCode == 200){
        console.log(res.body)
        return res.body
    }else if (res.statusCode == 404){
        console.log("Info: No user file found on server.")
        return {}
    }else{
        console.log("Error: Server returned error status: " + res.statusCode)
        return undefined
    }
    
}

function getSalt(remoteData, localData){
    if (remoteData != undefined && localData != undefined){
        var remoteSalt = remoteData.salt
        var localSalt = localData.salt
        if (remoteSalt != localSalt){
            // Very bad
            // TODO figure out what on earth to do here
            return undefined
        }else{
            return localSalt
        }
        
    }else if (remoteData != undefined){
        var remoteSalt = remoteData.salt
        return remoteSalt
        
    }else if (localData != undefined){
        var localSalt = localData.salt
        return localSalt
        
    }else{
        // TODO we need to tell the user that we have to login in online the first time,
        // so we can get the salt from the server. Not sure how to cleanly do that
        // (maybe a special IPC response like (salt_missing???)
        return undefined
    }
}

async function decrypt(remoteData, localData, masterPassword){
    var salt = getSalt(remoteData, localData)
    if (salt == undefined){
        return false
    }
    
    var masterKey = getMasterKey(salt, masterPassword)
    
    var localPlain = decryptData(localData, masterKey)
    var remotePlain = decryptData(remoteData, masterKey)
    
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
    
    var success = decrypt(remoteData, localData, masterPassword)
    
    // Return true when succesful
    return true
}

module.exports = {loadPasswordFile: loadPasswordFile}