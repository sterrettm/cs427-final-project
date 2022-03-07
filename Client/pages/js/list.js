function getPasswordList(){
    return new Promise(function (resolve, reject){
        ipcRenderer.on('password_list_success', (event, arg) => {
            resolve(arg)
        })
        
        ipcRenderer.on('password_list_fail', (event, arg) => {
            // TODO fail properly here
            resolve({})
        })
        
        ipcRenderer.send('password_list', {remote: getRemote()})
    })
}

function savePasswords(){
    ipcRenderer.send('save_data', {remote: getRemote()})
}

/*function newPasswordEntry(hostname, username, password){
    var base = document.createElement("li")
    var hostnameE = document.createElement("b")
    var usernameE = document.createElement("p")
    var passwordE = document.createElement("p")
    
    hostnameE.innerText = "Website: " + hostname
    usernameE.innerText = "Username: " + username
    passwordE.innerText = "Password: " + password
    
    base.appendChild(hostnameE)
    base.appendChild(usernameE)
    base.appendChild(passwordE)
    
    return base
}*/

function newPasswordEntry(hostname, username, password){
    var htmlString = handlebars('passwordEntry.html', {hostname: hostname, username: username, password: password})
    var base = document.createElement("div")
    base.innerHTML = htmlString
    
    return base
}

window.onload = async function(e){
    var passwordData = await getPasswordList()
    
    var passwordList = document.getElementById("passwordList")
    for (index in passwordData.passwords){
        var entry = passwordData.passwords[index]
        console.log("Entry: " + JSON.stringify(entry))
        
        var newEntry = newPasswordEntry(entry.hostname, entry.username, entry.password)
        passwordList.appendChild(newEntry)
        
    }
    
    document.getElementById("savePasswords").addEventListener("click", savePasswords)
}