function getPasswordList(){
    return new Promise(function (resolve, reject){
        ipcRenderer.on('password_list_success', (event, arg) => {
            resolve(arg)
        })
        
        ipcRenderer.on('password_list_fail', (event, arg) => {
            // TODO fail properly here
            resolve({})
        })
        
        ipcRenderer.send('password_list', {remote: true})
    })
}

function savePasswords(){
    ipcRenderer.send('save_data', {remote: true})
}

window.onload = async function(e){
    var passwordData = await getPasswordList()
    
    for (index in passwordData.passwords){
        var entry = passwordData.passwords[index]
        console.log("Entry: " + JSON.stringify(entry))
    }
    
    document.getElementById("savePasswords").addEventListener("click", savePasswords)
}