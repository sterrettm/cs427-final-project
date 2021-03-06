const fs = require('fs')
const https = require('https')
const process = require('process')
const { app, session } = require('electron')
const crypto = require('crypto')
const argon2 = require('argon2')

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} 
else {
    args = process.argv.slice(2)
    rejectUnauthorized = args[0] !== "BREAKALLSECURITY"
    if (!rejectUnauthorized){
        console.log("MAJOR WARNING: Permitting self-signed certificates")
    }
    
    const customCert = fs.readFileSync("../certs/cert.pem")
    
    var passwordData = {}
    var kdfSalt = undefined
    var aesKey = undefined
    
    async function getMasterKey(salt, password){
        var masterKey = await argon2.hash(password, {type: argon2.argon2id, salt: salt, raw: true})
        return masterKey
    }
    
    async function loadLocal(username, path){
        try {
            // TODO building up the path like this is bad, do something better
            var rawData = fs.readFileSync(path + username + ".json")
            var realData = JSON.parse(rawData)
            return realData
            
        } catch (err){
            return {}
        }
    }
    
    async function saveLocal(username, data, path){
        try {
            // TODO building up the path like this is bad, do something better
            var writeData = JSON.stringify(data)
            
            fs.mkdirSync(path, {recursive: true})
            // TODO This works, but await fs.writeFile doesn't work here. Figure out why that is
            fs.writeFileSync(path + username + ".json", writeData)
            
        } catch (err){
            // TODO real error
            return {}
        }
    }
    
    async function saveRemote(username, token, data, hostname = "localhost"){
        var options = {
            host: hostname,
            path: "/upload",
            method: "POST",
            port: 32433,
            rejectUnauthorized: rejectUnauthorized,
            headers:{
                'Cookie': ("username="+username+"; token=" + JSON.stringify(token)),
                'Content-Type': "application/json"
            },
            ca: [customCert]
        }
        
        var res = await new Promise(function (resolve, reject){
            var req = https.request(options, res => {
                resolve(res)
            })
            req.write(JSON.stringify(data))
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
            },
            ca: [customCert]
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
    
    function _numericArrayNotEqual(a1, a2){
        if (a1.length != a2.length){
            return true
        }else{
            for (key in a1){
                if (a1[key] != a2[key]){
                    return true
                }
            }
        }
        
        return false
    }
    
    function getSalt(remoteData, localData){
        if ("salt" in remoteData && "salt" in localData){
            var remoteSalt = remoteData.salt
            var localSalt = localData.salt
            if (_numericArrayNotEqual(remoteSalt.data, localSalt.data)){
                // Very bad
                // TODO figure out what on earth to do here
                console.log("Error: Server-client salt mismatch")
                console.log(JSON.stringify(remoteSalt) + "\n---\n" + JSON.stringify(localSalt))
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
             
            finalData = combineLists(localPlain, remotePlain)
        }else if ('ciphertext' in localData){
            var localPlain = decryptData(localData.ciphertext, masterKey)
            finalData = localPlain
            
        }else if ('ciphertext' in remoteData){
            var remotePlain = decryptData(remoteData.ciphertext, masterKey)
            finalData = remotePlain
            
        }else{
            // Initialize a basic empty password store
            console.log("Info: No password store found, empty one created")
            finalData = {passwords: {}}
        }
        
        passwordData = finalData
        
        // Return true when succesful
        return true
    }
    
    async function loadPasswordFile(username, masterPassword, remote){
        
        var remoteData = {}
        
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
        
        // If we are remote, delete tombstones before saving. This will delete serverside when the save happens
        // If not remote, we have to keep them so that it triggers the delete next time we save when connected to the server
        if (remote){
            for (key in passwordData.passwords){
                var entry = passwordData.passwords[key]
                if ("deleted" in entry && entry.deleted == true){
                    //console.log("Info: Deleting tombstoned entry " + key) 
                    delete passwordData.passwords[key]
                }
            }
        }
        
        var ctxt = encryptData(passwordData, aesKey)
        
        var result = {salt: kdfSalt, ciphertext: ctxt}
        
        if (remote){
            var token = (await session.defaultSession.cookies.get({ name: "token" }))[0].value
            saveRemote(username, token, result, "localhost")
        }
        saveLocal(username, result, "./data/")
    }
    
    function objUnion(obj1, obj2){
        var result = {}
        for (key in obj1){
            result[key] = obj1[key]
        }
        for (key in obj2){
            result[key] = obj2[key]
        }
        return result
    }
    
    function objIntersection(obj1, obj2){
        var result = []
        for (key in obj1){
            if (key in obj2){
                result.push(key)
            }
        }
        return result
    }
    
    function combineLists(localDict, remoteDict){
        var resultDict = {passwords: objUnion(localDict.passwords, remoteDict.passwords)}
        var intersection = objIntersection(localDict.passwords, remoteDict.passwords)
        
        
        for (interKey in intersection){
            var key = intersection[interKey]
            
            // This should be greater than or equal to
            // This ensures tombstones get loaded correctly
            if (localDict.passwords[key].lastModified >= remoteDict.passwords[key].lastModified){
                resultDict.passwords[key] = localDict.passwords[key]
            }else{
                resultDict.passwords[key] = remoteDict.passwords[key]
            }
        }
        
        return resultDict
    }
    
    function addPassword(hostname, username, password){
        var currentDate = Date.now()
        
        var newKey = username + "@" + hostname 
        var newEntry = {hostname: hostname, username: username, password: password, lastModified: currentDate}
        
        passwordData.passwords[newKey] = {}
        passwordData.passwords[newKey] = newEntry
    }
    
    function deletePassword(key){
        // We just tombstone it here
        // Actual deletion occurs in savePasswordFile
        var currentDate = Date.now()
        
        if (key in passwordData.passwords){
            passwordData.passwords[key].deleted = true
            passwordData.passwords[key].lastModified = currentDate
            return true
        }else{
            return false
        }
    }
    
    function editPassword(key, newHostname, newUsername, newPassword){
        
        var newKey = newUsername + "@" + newHostname
        
        if (newKey == key){
            // We are replacing the entry entirely
            var currentDate = Date.now()
            var newEntry = {hostname: newHostname, username: newUsername, password: newPassword, lastModified: currentDate}
            
            passwordData.passwords[key] = newEntry
            
            return true
            
        }else{
            // Key is different; delete old entry, add new one
            deletePassword(key)
            addPassword(newHostname, newUsername, newPassword)
            
            return true
        }
    }
    
    function passwordList(){
        // We need some logic here so we don't return tombstoned passwords
        
        var returnData = {passwords: {}}
        
        for (key in passwordData.passwords){
            var entry = passwordData.passwords[key]
            
            if (!("deleted" in entry && entry.deleted == true)){
                returnData.passwords[key] = entry
            }
            
        }
        
        return returnData
    }
    
    module.exports = {editPassword: editPassword, deletePassword: deletePassword, loadPasswordFile: loadPasswordFile, savePasswordFile: savePasswordFile, addPassword: addPassword, passwordList: passwordList}
}

