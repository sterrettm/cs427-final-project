var pageKey = undefined

function confirmDelete(){
    ipcRenderer.on('delete_password_success', (event, arg) => {
        window.location.href = "./list.html"
    })
    
    ipcRenderer.on('delete_password_fail', (event, arg) => {
        // TODO fail properly here
        window.location.href = "./list.html"
    })
    
    ipcRenderer.send('delete_password', {key: pageKey})
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
        console.log("Error: Got invalid key in deletePassword onload(): " + key)
    }else{
        var entry = passwords[key]
        
        document.getElementById("hostnameText").innerText = entry.hostname
        document.getElementById("usernameText2").innerText = entry.username
    }
    
    document.getElementById("confirmDelete").addEventListener("click", confirmDelete)
    document.getElementById("cancel").addEventListener("click", cancel)
}
    