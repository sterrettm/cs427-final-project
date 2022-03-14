
function savePasswords(){
    ipcRenderer.sendSync('save_data', {remote: getRemote()})
}

function logoutButton(){
    ipcRenderer.sendSync('logout', {})
    window.location.href = "./index.html"
}

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
    document.getElementById("logoutButton").addEventListener("click", logoutButton)
}