
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

function newPasswordEntry(hostname, username, password, key){
    var htmlString = handlebars('passwordEntry.html', {hostname: hostname, username: username, password: password, key: key})
    var base = document.createElement("div")
    base.innerHTML = htmlString
    
    return base
}

window.onload = async function(e){
    var passwordData = await getPasswordList()
    
    var passwordList = document.getElementById("passwordList")
    for (key in passwordData.passwords){
        var entry = passwordData.passwords[key]
        
        var newEntry = newPasswordEntry(entry.hostname, entry.username, entry.password, key)
        passwordList.appendChild(newEntry)
        
    }
    
    document.getElementById("savePasswords").addEventListener("click", savePasswords)
}