const https = require('https')
const process = require('process')
const enc = require('./enc')
const { session } = require('electron')

args = process.argv.slice(2)
rejectUnauthorized = args[0] !== "BREAKALLSECURITY"
if (!rejectUnauthorized){
    console.log("MAJOR WARNING: Permitting self-signed certificates")
}

async function load_data(event, args){
    console.log("load_data")
    var username = (await session.defaultSession.cookies.get({ name: "username" }))[0].value
    
    var success = await enc.loadPasswordFile(username)
    
    if (success){
        event.sender.send('load_data_success',{})
    }else{
        event.sender.send('load_data_fail',{})
    }
}

async function login_attempt(event, args){
    var username = args.username
    var password = args.password
    
    var options = {
        host: "localhost",
        path: "/login",
        method: "POST",
        port: 32433,
        rejectUnauthorized: rejectUnauthorized
    }
    
    var req = https.request(options, res => {
        if (res.statusCode === 200){
            // TODO maybe we should load the data file from the server here
            // not 100% sure where I should put that
            
            _setCookies(res.headers['set-cookie'])
            
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
        rejectUnauthorized: rejectUnauthorized
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

function ipcGenerator(ipcMain){
    ipcMain.on("login_attempt", (event, arg) => {login_attempt(event, arg)})
    ipcMain.on("signup_attempt", (event, arg) => {signup_attempt(event, arg)})
    ipcMain.on("get_cookie", (event, arg) => {get_cookie(event, arg)})
    ipcMain.on("set_cookie", (event, arg) => {set_cookie(event, arg)})
    ipcMain.on("load_data", (event, arg) => {load_data(event, arg)})
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