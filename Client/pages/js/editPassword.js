var pageKey = undefined

function confirmEdit(){
    var newHostname = document.getElementById('hostnameInput').value
    var newUsername = document.getElementById('usernameInput').value
    var newPassword = document.getElementById('passwordInput').value
    
    ipcRenderer.on('edit_password_success', (event, arg) => {
        window.location.href = "./list.html"
    })
    
    ipcRenderer.on('edit_password_fail', (event, arg) => {
        // TODO fail properly here
        window.location.href = "./list.html"
    })
    
    ipcRenderer.send('edit_password', {key: pageKey, newHostname: newHostname, newUsername: newUsername, newPassword: newPassword})
}

function cancel(){
    window.location.href = "./list.html"
}

window.onload = async function(e){
    var passwordData = await getPasswordList()
    var passwords = passwordData.passwords
    
    var key = paramDict()["key"]
    
    pageKey = key
    
    if (key == undefined || !(key in passwords)){
        console.log("Error: Got invalid key in editPassword onload(): " + key)
    }else{
        var entry = passwords[key]
        
        document.getElementById("hostnameInput").value = entry.hostname
        document.getElementById("usernameInput").value = entry.username
        document.getElementById("passwordInput").value = entry.password
    }
    
    document.getElementById("confirmEdit").addEventListener("click", confirmEdit)
    document.getElementById("cancel").addEventListener("click", cancel)
}
    