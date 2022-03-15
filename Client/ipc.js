const https = require('https')
const process = require('process')
const enc = require('./enc')
const rendering = require('./rendering')
const { app, session } = require('electron')
const fs = require('fs')

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} 
else {
    const customCert = fs.readFileSync("../certs/cert.pem")

    args = process.argv.slice(2)
    rejectUnauthorized = args[0] !== "BREAKALLSECURITY"
    if (!rejectUnauthorized){
        console.log("MAJOR WARNING: Permitting self-signed certificates")
    }

    var remote = false

    function is_remote(event, args){
        event.returnValue = remote
    }

    async function load_data(event, args){
        var username = (await session.defaultSession.cookies.get({ name: "username" }))[0].value
        var password = args.password
        
        var success = await enc.loadPasswordFile(username, password, args.remote)
        
        if (success){
            event.sender.send('load_data_success',{})
        }else{
            event.sender.send('load_data_fail',{})
        }
    }

    async function save_data(event, args){
        var username = (await session.defaultSession.cookies.get({ name: "username" }))[0].value
        var success = await enc.savePasswordFile(username, args.remote)
        
        event.returnValue = true
    }

    async function password_list(event, args){
        var data = enc.passwordList()
        
        if (data != undefined){
            event.sender.send('password_list_success',data)
        }else{
            event.sender.send('password_list_fail',{})
        }
    }

    async function add_password(event, args){
        enc.addPassword(args.hostname, args.username, args.password)
        event.sender.send("add_password_success", {})
    }

    async function delete_password(event, args){
        if (enc.deletePassword(args.key)){
            event.sender.send("delete_password_success", {})
        }else{
            event.sender.send("delete_password_fail", {})
        }
    }

    async function edit_password(event, args){
        if (enc.editPassword(args.key, args.newHostname, args.newUsername, args.newPassword)){
            event.sender.send("edit_password_success", {})
        }else{
            event.sender.send("edit_password_fail", {})
        }
    }

    async function login_attempt_google(event, args){
        var authToken = args.password

        var options = {
            host: "localhost",
            path: "/loginGoogle",
            method: "POST",
            port: 32433,
            rejectUnauthorized: rejectUnauthorized,
            ca: [customCert]
        }
        
        var req = https.request(options, res => {
            if (res.statusCode === 200){
                // TODO maybe we should load the data file from the server here
                // not 100% sure where I should put that
                
                _setCookies(res.headers['set-cookie'])
                
                // We are now online, record this
                remote = true
                
                event.sender.send('login_success', res.statusCode)
            }else{
                event.sender.send('login_fail', res.statusCode)
            }
        })

        req.setHeader('Authorization', "Basic " + btoa(authToken))
        req.end()
    }

    async function login_attempt(event, args){
        
        var username = args.username
        var password = args.password
        
        var options = {
            host: "localhost",
            path: "/login",
            method: "POST",
            port: 32433,
            rejectUnauthorized: rejectUnauthorized,
            ca: [customCert]
        }
        
        var req = https.request(options, res => {
            if (res.statusCode === 200){
                // TODO maybe we should load the data file from the server here
                // not 100% sure where I should put that
                
                _setCookies(res.headers['set-cookie'])
                
                // We are now online, record this
                remote = true
                
                event.sender.send('login_success', res.statusCode)
            }else{
                event.sender.send('login_fail', res.statusCode)
            }
        })
        
        req.setHeader('Authorization', "Basic " + btoa(username + ":" + password))
        req.end()
        
    }

    function signup_attempt(event, args){
        var username = args.username
        var password = args.password
        
        var options = {
            host: "localhost",
            path: "/signup",
            method: "POST",
            port: 32433,
            rejectUnauthorized: rejectUnauthorized,
            ca: [customCert]
        }
        
        var req = https.request(options, res => {
            if (res.statusCode === 200){
                event.sender.send('signup_success', res.statusCode)
            }else{
                event.sender.send('signup_fail', res.statusCode)
            }
        })
        
        req.setHeader('Authorization', "Basic " + btoa(username + ":" + password))
        req.end()
        
    }

    function get_cookie(event, args){
        const cookies = session.defaultSession.cookies
        
        var name = args.name
        session.defaultSession.cookies.get({ name: name })
        .then((cookies) => {
            event.returnValue = cookies[0]
        }).catch((error) => {
            console.log(error)
            event.returnValue = undefined
        })
    }

    function set_cookie(event, args){
        const cookies = session.defaultSession.cookies
        
        var name = args.name
        var value = args.value
        
        cookies.set({url: "https://www.github.com", name: name, value: value})
        .then(() => {
            event.returnValue = undefined
        }).catch((error) => {
            console.log(error)
            event.returnValue = undefined
        })
    }

    function _setCookies(cookiesList){
        const cookies = session.defaultSession.cookies
        
        for (key in cookiesList){
            var cookieString = cookiesList[key].split(';')[0]
            var cookieName = cookieString.split('=')[0]
            var cookieValue = cookieString.split('=')[1]
            
            // We put a fake URL here because otherwise Electron will reject it
            // feels really weird to enforce this
            cookies.set({url: "https://www.github.com", name: cookieName, value: cookieValue})
        }
    }

    function use_template(event, args){
        var template = args.template
        var args = args.args
        
        var htmlString = rendering.useTemplate(template, args)
        
        event.returnValue = htmlString
    }

    async function logout(event, args){
        remote = false
        
        // Throw away all session cookies and such
        var x = await session.defaultSession.clearStorageData([], (data) => {})
        
        event.returnValue = true
    }

    function ipcGenerator(ipcMain){
        ipcMain.on("login_attempt", (event, arg) => {login_attempt(event, arg)})
        ipcMain.on("login_attempt_google", (event, arg) => {login_attempt_google(event, arg)})
        ipcMain.on("signup_attempt", (event, arg) => {signup_attempt(event, arg)})
        ipcMain.on("get_cookie", (event, arg) => {get_cookie(event, arg)})
        ipcMain.on("set_cookie", (event, arg) => {set_cookie(event, arg)})
        ipcMain.on("load_data", (event, arg) => {load_data(event, arg)})
        ipcMain.on("add_password", (event, arg) => {add_password(event, arg)})
        ipcMain.on("delete_password", (event, arg) => {delete_password(event, arg)})
        ipcMain.on("edit_password", (event, arg) => {edit_password(event, arg)})
        ipcMain.on("password_list", (event, arg) => {password_list(event, arg)})
        ipcMain.on("save_data", (event, arg) => {save_data(event, arg)})
        ipcMain.on("is_remote", (event, arg) => {is_remote(event, arg)})
        ipcMain.on("use_template", (event, arg) => {use_template(event, arg)})
        ipcMain.on("logout", (event, arg) => {logout(event, arg)})
    
    }

    /*ipcExport = {signup_attempt: signup_attempt, login_attempt: login_attempt}

    function ipcGenerator(ipcMain){
        for (var key in ipcExport){
            console.log(key)
            console.log(ipcExport[key])
            ipcMain.on(key, (event, arg) => {ipcExport[key](event, arg)})
        }
    }*/

    module.exports = ipcGenerator
}

