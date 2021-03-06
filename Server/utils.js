const fs = require('fs')

function loadAccountData(file){
    try {
        rawData = fs.readFileSync(file, 'utf8')
    } catch (err) {
        console.log("Info: No account data file was found, a new one will be created\n")
        return {}
    }
    
    data = JSON.parse(rawData)
    return data
    
}

function saveAccountData(file, data, callback = undefined){
    fs.writeFile(file, JSON.stringify(data), err => {
        if (err){
            console.log("WARNING: Failed to write account data")
        }
        
        if (callback != undefined){
            callback()
        }
    })
}

module.exports = {loadAccountData: loadAccountData, saveAccountData: saveAccountData}