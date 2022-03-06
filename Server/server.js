var express = require('express')
var https = require('https')
var fs = require('fs')
var utils = require('./utils')
var auth = require('./auth')
var process = require('process')

const cookieParser = require('cookie-parser')

dataFname = "data.json"

const port = 32433

accountData = utils.loadAccountData(dataFname)
tokens = {}

setInterval(function(){
    utils.saveAccountData(dataFname, accountData)
    console.log("INFO: Saving account data as scheduled...")
}, 5*60*1000)

process.on('SIGINT', () => {
    utils.saveAccountData(dataFname, accountData, () => process.exit())
    console.log("INFO: Saving account data due to SIGINT...")
})

var app = express();

app.use(cookieParser())
app.use(express.json())

app.get('/', function(req, res){
    console.log("Got GET")
})

app.post('/login', function (req, res){
	auth.loginUser(accountData, req, res)
})

app.post('/signup', function (req, res){
	auth.signupUser(accountData, req, res)
})

app.get('/download', function(req, res){
    var validUser = auth.validateUser(tokens, req, res)
    if (validUser != undefined){

        if ('ciphertext' in accountData[validUser]){
            var rawData = accountData[validUser]
            var sendData = {ciphertext: rawData.ciphertext, salt: rawData.kdfSalt}
            res.write(JSON.stringify(sendData))
            res.end()
        }else{
            var rawData = accountData[validUser]
            var sendData = {salt: rawData.kdfSalt}
            res.write(JSON.stringify(sendData))
            res.end()
        }
    }else{
        // TODO error better
        res.writeHead(403)
        res.end();
    }
})

app.post('/upload', function(req, res){
    var validUser = auth.validateUser(tokens, req, res)
    console.log("uploading user data...")
    if (validUser != undefined){
        
        var ctxt = req.body.ciphertext
        
        // TODO I don't like just wiping out all previous data,
        // but I am not quite sure how I would do this better
        accountData[validUser].ciphertext = ctxt
        
        res.writeHead(200)
        res.end()
    }else{
        // TODO error better
        res.writeHead(403)
        res.end();
    }
})

var httpsServer = https.createServer({
	key: fs.readFileSync('certs/key.pem'),
	cert: fs.readFileSync('certs/cert.pem'),
}, app)

httpsServer.listen(port)